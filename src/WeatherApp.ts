import { AppServer, AppSession } from '@mentraos/sdk';
import { WeatherService } from './WeatherService';
import { WeatherData, ParsedVoiceCommand, SessionState } from './types';

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
      'Say:\n• "Weather in [city]"\n• "New York weather"\n• "What\'s the weather in London?"\n\nJust tell me any city name!'
    );
    
    // Play welcome message
    await session.audio.playTTS('Welcome to Weather Today! Ask me about the weather in any city by saying "weather in" followed by the city name.');
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
        await this.showError(session, 'Sorry, I need a city name. Try saying "weather in [city name]" like "weather in New York".');
      }
    });

    // Handle button presses
    session.events.onButtonPress(async (data) => {
      if (data.action === 'press') {
        switch (data.button) {
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
    
    // Location-specific patterns - now required
    const locationPatterns = [
      /weather in (.+)/i,
      /(.+) weather/i,
      /what'?s the weather in (.+)/i,
      /how'?s the weather in (.+)/i,
      /weather for (.+)/i,
      /tell me the weather in (.+)/i
    ];
    
    // Check for location-specific commands
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
    
    throw new Error('Please specify a city name');
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
      if (!command.isLocationSpecific || !command.location) {
        throw new Error('Please specify a city name');
      }
      
      // Get weather for specific city
      session.logger.info('Fetching weather for city', { city: command.location, sessionId });
      const weatherData = await this.weatherService.getWeatherByCity(command.location);
      
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