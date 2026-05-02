import mongoose from 'mongoose';

export async function connectMongo() {
  const mongoUri = process.env.MONGODB_URI;

  if (!mongoUri) {
    return null;
  }

  if (mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }

  await mongoose.connect(mongoUri, {
    serverSelectionTimeoutMS: 5000
  });

  return mongoose.connection;
}
