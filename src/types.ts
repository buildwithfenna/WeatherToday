/**
 * Type definitions for WeatherToday! app
 */

export interface WeatherData {
  location: string;
  temperature: number;
  description: string;
  humidity: number;
  windSpeed: number;
  windDirection?: number;
  pressure?: number;
  visibility?: number;
  uvIndex?: number;
  feelsLike?: number;
}

export interface WeatherApiResponse {
  main: {
    temp: number;
    feels_like: number;
    humidity: number;
    pressure: number;
  };
  weather: Array<{
    main: string;
    description: string;
  }>;
  wind: {
    speed: number;
    deg?: number;
  };
  visibility?: number;
  name: string;
  sys: {
    country: string;
  };
}

export interface GeocodingResponse {
  name: string;
  lat: number;
  lon: number;
  country: string;
  state?: string;
}

export type WeatherCommand = 
  | 'current'
  | 'today'
  | 'weather'
  | 'forecast'
  | 'temperature'
  | 'conditions';

export interface ParsedVoiceCommand {
  command: WeatherCommand;
  location?: string;
  isLocationSpecific: boolean;
}

export interface SessionState {
  lastWeatherData?: WeatherData;
  lastUpdateTime?: number;
  preferredUnits: 'metric' | 'imperial';
}