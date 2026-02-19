import axios from 'axios';
import { WeatherData, LocationCoordinates, WeatherApiResponse, GeocodingResponse } from './types';

/**
 * Service for fetching weather data from OpenWeatherMap API
 */
export class WeatherService {
  private readonly apiKey: string;
  private readonly baseUrl = 'https://api.openweathermap.org/data/2.5';
  private readonly geoUrl = 'https://api.openweathermap.org/geo/1.0';

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  /**
   * Get weather data by coordinates
   */
  async getWeatherByCoordinates(coordinates: LocationCoordinates): Promise<WeatherData> {
    try {
      const response = await axios.get<WeatherApiResponse>(
        `${this.baseUrl}/weather`,
        {
          params: {
            lat: coordinates.latitude,
            lon: coordinates.longitude,
            appid: this.apiKey,
            units: 'imperial' // Fahrenheit for US users
          }
        }
      );

      return this.transformWeatherData(response.data);
    } catch (error) {
      console.error('Error fetching weather by coordinates:', error);
      throw new Error('Failed to fetch weather data');
    }
  }

  /**
   * Get weather data by city name
   */
  async getWeatherByCity(cityName: string): Promise<WeatherData> {
    try {
      // First, get coordinates for the city
      const geoResponse = await axios.get<GeocodingResponse[]>(
        `${this.geoUrl}/direct`,
        {
          params: {
            q: cityName,
            limit: 1,
            appid: this.apiKey
          }
        }
      );

      if (geoResponse.data.length === 0) {
        throw new Error(`City "${cityName}" not found`);
      }

      const { lat, lon } = geoResponse.data[0];
      
      // Then get weather for those coordinates
      const weatherResponse = await axios.get<WeatherApiResponse>(
        `${this.baseUrl}/weather`,
        {
          params: {
            lat,
            lon,
            appid: this.apiKey,
            units: 'imperial'
          }
        }
      );

      return this.transformWeatherData(weatherResponse.data);
    } catch (error) {
      console.error('Error fetching weather by city:', error);
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Failed to fetch weather data');
    }
  }

  /**
   * Transform API response to our internal format
   */
  private transformWeatherData(data: WeatherApiResponse): WeatherData {
    return {
      location: `${data.name}, ${data.sys.country}`,
      temperature: Math.round(data.main.temp),
      description: this.capitalizeDescription(data.weather[0].description),
      humidity: data.main.humidity,
      windSpeed: Math.round(data.wind.speed),
      windDirection: data.wind.deg,
      pressure: data.main.pressure,
      visibility: data.visibility ? Math.round(data.visibility / 1000) : undefined, // Convert to km
      feelsLike: Math.round(data.main.feels_like)
    };
  }

  /**
   * Capitalize weather description
   */
  private capitalizeDescription(description: string): string {
    return description
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  /**
   * Get a human-readable weather summary
   */
  static formatWeatherSummary(weather: WeatherData): string {
    const { location, temperature, description, humidity, windSpeed } = weather;
    
    return `Current weather in ${location}: ${temperature}°F, ${description}. ` +
           `Humidity ${humidity}%, wind ${windSpeed} mph.`;
  }

  /**
   * Format weather for display on glasses
   */
  static formatWeatherDisplay(weather: WeatherData): { title: string; content: string } {
    const { location, temperature, description, humidity, windSpeed, feelsLike } = weather;
    
    const title = `${location}`;
    const content = `${temperature}°F • ${description}\n` +
                   `Feels like ${feelsLike}°F\n` +
                   `Humidity: ${humidity}%\n` +
                   `Wind: ${windSpeed} mph`;
    
    return { title, content };
  }
}