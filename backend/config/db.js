import mongoose from 'mongoose';

const connectDB = async () => {
  try {
    const uri =
      process.env.MONGODB_URI ||
      'mongodb://localhost:27017/ai-audit-engine';

    await mongoose.connect(uri);

    console.log(`✅ MongoDB connected: ${mongoose.connection.host}`);

    // Log disconnection events
    mongoose.connection.on('disconnected', () => {
      console.log('⚠️  MongoDB disconnected');
    });

    mongoose.connection.on('error', (err) => {
      console.error('❌ MongoDB error:', err.message);
    });
  } catch (error) {
    console.error(`❌ MongoDB connection failed: ${error.message}`);
    console.error('   Make sure MongoDB is running on your machine.');
    console.error('   Install: https://www.mongodb.com/try/download/community');
    process.exit(1);
  }
};

export default connectDB;