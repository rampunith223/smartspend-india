import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/smartspend';

let isConnected = false;

export async function connectDB() {
  if (isConnected) return mongoose.connection;
  try {
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    isConnected = true;
    console.log('MongoDB connected:', MONGODB_URI);
    return mongoose.connection;
  } catch (error) {
    console.error('MongoDB connection error:', error.message);
    throw error;
  }
}

export function disconnectDB() {
  if (isConnected) {
    isConnected = false;
    return mongoose.disconnect();
  }
  return Promise.resolve();
}

export default mongoose;
