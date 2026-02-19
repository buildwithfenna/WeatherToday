import dotenv from 'dotenv';
import { WeatherApp } from './WeatherApp';

// Load environment variables
dotenv.config();

/**
 * WeatherToday! - Voice-controlled weather app for MentraOS smart glasses
 * 
 * Features:
 * - Voice-controlled weather queries
 * - Automatic location detection
 * - Multi-city weather support
 * - Clean display optimized for smart glasses
 * - Audio feedback for hands-free operation
 */

async function main(): Promise<void> {
  // Validate required environment variables
  const requiredEnvVars = [
    'MENTRAOS_API_KEY',
    'MENTRAOS_PACKAGE_NAME',
    'OPENWEATHER_API_KEY'
  ];

  const missingEnvVars = requiredEnvVars.filter(varName => !process.env[varName]);
  
  if (missingEnvVars.length > 0) {
    console.error('❌ Missing required environment variables:');
    missingEnvVars.forEach(varName => {
      console.error(`   - ${varName}`);
    });
    console.error('\nPlease check your .env file and ensure all required variables are set.');
    process.exit(1);
  }

  // Initialize the weather app
  const app = new WeatherApp({
    packageName: process.env.MENTRAOS_PACKAGE_NAME!,
    apiKey: process.env.MENTRAOS_API_KEY!,
    weatherApiKey: process.env.OPENWEATHER_API_KEY!,
    port: parseInt(process.env.PORT || '3000', 10)
  });

  try {
    console.log('🌤️ Starting WeatherToday! app...');
    console.log(`📦 Package: ${process.env.MENTRAOS_PACKAGE_NAME}`);
    console.log(`🌐 Port: ${process.env.PORT || 3000}`);
    
    await app.start();
    
    console.log('✅ WeatherToday! is running successfully!');
    console.log('🎤 Users can now ask: "What\'s the weather?" or "Weather in [city]"');
    
  } catch (error) {
    console.error('❌ Failed to start WeatherToday! app:', error);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n👋 Shutting down WeatherToday! gracefully...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n👋 Shutting down WeatherToday! gracefully...');
  process.exit(0);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Start the application
if (require.main === module) {
  main().catch((error) => {
    console.error('Fatal error starting application:', error);
    process.exit(1);
  });
}

export { WeatherApp };