import mongoose from 'mongoose';
import config from '../config';

export async function connectDatabase(): Promise<void> {
  try {
    await mongoose.connect(config.mongodb.url, {
      ...config.mongodb.options,
      autoIndex: process.env.NODE_ENV !== 'production', // Build indexes in development only
      serverSelectionTimeoutMS: 5000,
      family: 4 // Use IPv4, skip trying IPv6
    });

    // Connection event handlers
    mongoose.connection.on('connected', () => {
      console.log('MongoDB connected successfully');
    });

    mongoose.connection.on('error', (err) => {
      console.error('MongoDB connection error:', err);
    });

    mongoose.connection.on('disconnected', () => {
      console.log('MongoDB disconnected');
    });

    // Graceful shutdown
    process.on('SIGINT', async () => {
      try {
        await mongoose.connection.close();
        console.log('MongoDB connection closed through app termination');
        process.exit(0);
      } catch (err) {
        console.error('Error during MongoDB connection closure:', err);
        process.exit(1);
      }
    });

  } catch (error) {
    console.error('Error connecting to MongoDB:', error);
    process.exit(1);
  }
}

// Monitor connection pool events
mongoose.connection.on('connected', () => {
  console.log('MongoDB connection pool initialized');
});