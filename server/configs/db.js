import mongoose from 'mongoose';

const connectDB = async (DB_URI) => {
  try {
    console.log('Connection url: ', DB_URI);
    await mongoose.connect(DB_URI);
    console.log('MongoDB connected successfully');
  } catch (error) {
    console.error('Error connecting MongoDB!', error);
  }
};

export default connectDB;
