import { AppServer, AppSession } from '@mentraos/sdk';
import { WeatherService } from './WeatherService';
import { WeatherData, LocationCoordinates, ParsedVoiceCommand, SessionState } from './types';

/**
 * WeatherToday! - Voice-controlled weather app for MentraOS smart glasses
 */
export class WeatherApp extends AppServer {
  private weatherService: WeatherService;
  private sessionStates = new Map<string, SessionState>();

  constructor(config: { packageName: string; apiKey: string; port: number; weatherApiKey: string }) {
    super({
      packageName: config.packageName,
      apiKey: config.apiKey,
      port: config.port
    });
    
    this.weatherService = new WeatherService(config.weatherApiKey);
  }

  /**
   * Handle new user session
   */
  protected async onSession(session: AppSession, sessionId: string, userId: string): Promise<void> {
    session.logger.info('WeatherToday! session started', { userId, sessionId });
    
    // Initialize session state
    const sessionState: SessionState = {
      preferredUnits: 'imperial'
    };
    this.sessionStates.set(sessionId, sessionState);
    
    // Show welcome message
    await this.showWelcomeScreen(session);
    
    // Set up event handlers
    this.setupEventHandlers(session, sessionId);
    
    // Show dashboard info
    session.dashboard.content.writeToMain('🌤️ WeatherToday!');
  }

  /**
   * Handle session end
   */
  protected async onStop(sessionId: string, userId: string, reason: string): Promise<void> {
    console.log(`WeatherToday! session ended: ${reason}`);
    this.sessionStates.delete(sessionId);
  }

  /**
   * Show welcome screen
   */
  private async showWelcomeScreen(session: AppSession): Promise<void> {
    session.layouts.showReferenceCard(
      'WeatherToday! 🌤️',
      'Say:\n• "What\'s the weather?"\n• "Weather in [city]"\n• "Current conditions"\n\nI\'ll get your local weather automatically!'
    );
    
    // Play welcome message
    await session.audio.playTTS('Welcome to Weather Today! Ask me about the weather in any city, or say "what\'s the weather" for your current location.');
  }

  /**
   * Set up event handlers for the session
   */
  private setupEventHandlers(session: AppSession, sessionId: string): void {
    // Handle voice commands
    session.events.onTranscription(async (data) => {
      if (!data.isFinal) return;
      
      session.logger.info('Voice command received', { text: data.text, sessionId });
      
      try {
        const command = this.parseVoiceCommand(data.text);
        await this.handleWeatherCommand(session, sessionId, command);
      } catch (error) {
        session.logger.error('Error processing voice command', { error: error instanceof Error ? error.message : 'Unknown error', sessionId });
        await this.showError(session, 'Sorry, I didn\'t understand that. Try saying "what\'s the weather" or "weather in [city name]".');
      }
    });

    // Handle button presses
    session.events.onButtonPress(async (data) => {
      if (data.action === 'press') {
        switch (data.button) {
          case 'select':
            await this.getCurrentWeather(session, sessionId);
            break;
          case 'back':
            await this.showWelcomeScreen(session);
            break;
        }
      }
    });
  }

  /**
   * Parse voice command to extract intent and location
   */
  private parseVoiceCommand(text: string): ParsedVoiceCommand {
    const lowerText = text.toLowerCase().trim();
    
    // Weather command patterns
    const weatherPatterns = [
      /what'?s the weather/i,
      /current weather/i,
      /weather conditions/i,
      /how'?s the weather/i,
      /weather today/i,
      /today'?s weather/i
    ];
    
    // Location-specific patterns
    const locationPatterns = [
      /weather in (.+)/i,
      /(.+) weather/i,
      /what'?s the weather in (.+)/i,
      /how'?s the weather in (.+)/i
    ];
    
    // Check for location-specific commands first
    for (const pattern of locationPatterns) {
      const match = lowerText.match(pattern);
      if (match && match[1]) {
        const location = match[1].trim();
        // Skip if the location is too generic
        if (!this.isGenericLocation(location)) {
          return {
            command: 'weather',
            location: location,
            isLocationSpecific: true
          };
        }
      }
    }
    
    // Check for general weather commands
    if (weatherPatterns.some(pattern => pattern.test(lowerText))) {
      return {
        command: 'current',
        isLocationSpecific: false
      };
    }
    
    throw new Error('Unrecognized weather command');
  }

  /**
   * Check if location is too generic to be useful
   */
  private isGenericLocation(location: string): boolean {
    const genericTerms = ['here', 'there', 'this place', 'my location', 'current location'];
    return genericTerms.includes(location.toLowerCase());
  }

  /**
   * Handle parsed weather command
   */
  private async handleWeatherCommand(session: AppSession, sessionId: string, command: ParsedVoiceCommand): Promise<void> {
    session.dashboard.content.writeToMain('🔄 Getting weather...');
    
    try {
      let weatherData: WeatherData;
      
      if (command.isLocationSpecific && command.location) {
        // Get weather for specific city
        session.logger.info('Fetching weather for city', { city: command.location, sessionId });
        weatherData = await this.weatherService.getWeatherByCity(command.location);
      } else {
        // Get weather for current location
        session.logger.info('Fetching weather for current location', { sessionId });
        weatherData = await this.getCurrentLocationWeather(session, sessionId);
      }
      
      await this.displayWeatherData(session, weatherData);
      
      // Update session state
      const sessionState = this.sessionStates.get(sessionId);
      if (sessionState) {
        sessionState.lastWeatherData = weatherData;
        sessionState.lastUpdateTime = Date.now();
      }
      
    } catch (error) {
      session.logger.error('Error fetching weather', { error: error instanceof Error ? error.message : 'Unknown error', sessionId });
      await this.showError(session, error instanceof Error ? error.message : 'Failed to get weather data');
    }
  }

  /**
   * Get weather for current location
   */
  private async getCurrentLocationWeather(session: AppSession, sessionId: string): Promise<WeatherData> {
    return new Promise((resolve, reject) => {
      session.location.subscribeToStream(
        { accuracy: 'high' },
        async (locationData) => {
          try {
            const coordinates: LocationCoordinates = {
              latitude: locationData.lat,
              longitude: locationData.lng,
              accuracy: locationData.accuracy
            };
            
            session.logger.info('Location received', { coordinates, sessionId });
            
            const weatherData = await this.weatherService.getWeatherByCoordinates(coordinates);
            
            // Update session state
            const sessionState = this.sessionStates.get(sessionId);
            if (sessionState) {
              sessionState.lastLocation = coordinates;
            }
            
            resolve(weatherData);
          } catch (error) {
            reject(error);
          }
        }
      );
      
      // Set timeout for location request
      setTimeout(() => {
        reject(new Error('Location request timed out. Please try again or specify a city name.'));
      }, 10000);
    });
  }

  /**
   * Get current weather using last known location or request new location
   */
  private async getCurrentWeather(session: AppSession, sessionId: string): Promise<void> {
    const sessionState = this.sessionStates.get(sessionId);
    
    if (sessionState?.lastLocation) {
      // Use last known location if recent
      const now = Date.now();
      const lastUpdate = sessionState.lastUpdateTime || 0;
      const fiveMinutes = 5 * 60 * 1000;
      
      if (now - lastUpdate < fiveMinutes && sessionState.lastWeatherData) {
        await this.displayWeatherData(session, sessionState.lastWeatherData);
        return;
      }
    }
    
    // Get fresh weather data
    await this.handleWeatherCommand(session, sessionId, { command: 'current', isLocationSpecific: false });
  }

  /**
   * Display weather data on glasses
   */
  private async displayWeatherData(session: AppSession, weather: WeatherData): Promise<void> {
    const display = WeatherService.formatWeatherDisplay(weather);
    const summary = WeatherService.formatWeatherSummary(weather);
    
    // Show on glasses display
    session.layouts.showReferenceCard(display.title, display.content);
    
    // Speak the weather summary
    await session.audio.playTTS(summary);
    
    // Update dashboard
    session.dashboard.content.writeToMain(`🌤️ ${weather.temperature}°F ${weather.description}`);
    
    session.logger.info('Weather displayed', { location: weather.location, temperature: weather.temperature });
  }

  /**
   * Show error message
   */
  private async showError(session: AppSession, message: string): Promise<void> {
    session.layouts.showTextWall(`❌ ${message}`);
    await session.audio.playTTS(message);
    session.dashboard.content.writeToMain('❌ Error');
    
    // Auto-return to welcome screen after 3 seconds
    setTimeout(async () => {
      await this.showWelcomeScreen(session);
    }, 3000);
  }
}