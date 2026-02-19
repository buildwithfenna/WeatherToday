# WeatherToday! 🌤️

Voice-controlled weather app for MentraOS smart glasses with location-based forecasts.

## Features

- **Voice Commands**: Ask "What's the weather?" or "Weather in [city name]"
- **Auto-Location**: Automatically detects your current location for local weather
- **Current Conditions**: Temperature, weather description, humidity, and wind
- **Multiple Cities**: Get weather for any city by voice command
- **Smart Display**: Clean, readable weather cards optimized for smart glasses
- **Audio Feedback**: Spoken weather summaries for hands-free use

## Setup and Deployment

### Prerequisites

- Node.js 18+ installed
- MentraOS developer account at [console.mentraglass.com](https://console.mentraglass.com)
- OpenWeatherMap API key from [openweathermap.org](https://openweathermap.org/api)
- ngrok for local development

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/buildwithfenna/WeatherToday.git
   cd WeatherToday
   ```

2. **Install dependencies:**
   ```bash
   npm install
   # or
   bun install
   ```

3. **Set up environment variables:**
   ```bash
   cp .env.example .env
   ```

### Required API Keys and Environment Variables

Edit your `.env` file with the following required variables:

```env
# MentraOS Configuration (Required)
MENTRAOS_API_KEY=your_mentraos_api_key_here
MENTRAOS_PACKAGE_NAME=com.yourcompany.weathertoday

# Weather API Configuration (Required)
OPENWEATHER_API_KEY=your_openweather_api_key_here

# Server Configuration (Optional)
PORT=3000
NGROK_URL=your_ngrok_url_here
NODE_ENV=development
```

**Where to get API keys:**
- **MENTRAOS_API_KEY**: Get from [console.mentraglass.com](https://console.mentraglass.com) after registering your app
- **OPENWEATHER_API_KEY**: Free API key from [OpenWeatherMap](https://openweathermap.org/api)

### MentraOS Developer Console Setup

1. **Register your app** at [console.mentraglass.com](https://console.mentraglass.com)
2. **Set package name**: `com.yourcompany.weathertoday` (or your preferred package name)
3. **Set webhook URL**: Your ngrok URL + `/webhook` (e.g., `https://your-ngrok-url.ngrok.io/webhook`)
4. **Required permissions**:
   - `MICROPHONE` - For voice commands
   - `LOCATION` - For current location weather

### How to Run the App Locally

1. **Start the development server:**
   ```bash
   npm run dev
   # or
   bun run dev
   ```

2. **Expose with ngrok** (in a separate terminal):
   ```bash
   ngrok http --url=your-ngrok-url 3000
   ```

3. **Test on your MentraOS device:**
   - Install the Mentra app on your phone
   - Launch your WeatherToday! app
   - Try voice commands like:
     - "What's the weather?"
     - "Weather in New York"
     - "Current conditions"

## Voice Commands

- **"What's the weather?"** - Gets weather for your current location
- **"Weather in [city]"** - Gets weather for any city (e.g., "Weather in Tokyo")
- **"Current conditions"** - Shows current weather conditions
- **"How's the weather?"** - Alternative way to ask for current weather

## Button Controls

- **Select Button**: Get current location weather
- **Back Button**: Return to welcome screen

## Build for Production

```bash
npm run build
npm start
```

## Development

```bash
# Run in development mode with hot reload
npm run dev

# Build TypeScript
npm run build

# Lint code
npm run lint

# Format code
npm run format
```

## Troubleshooting

**"Permission denied" errors:**
- Ensure MICROPHONE and LOCATION permissions are enabled in the MentraOS Developer Console
- Check that users have approved permissions when installing the app

**"Failed to fetch weather data" errors:**
- Verify your OpenWeatherMap API key is valid and has sufficient quota
- Check internet connectivity

**Location timeout errors:**
- Location requests timeout after 10 seconds
- Try specifying a city name instead: "Weather in [your city]"

**App not responding to voice commands:**
- Check that MICROPHONE permission is granted
- Ensure your ngrok tunnel is active and webhook URL is correct in the developer console

## License

MIT License - see LICENSE file for details.

## Support

For MentraOS SDK questions, visit the [MentraOS documentation](https://docs.mentraglass.com) or join the developer community.