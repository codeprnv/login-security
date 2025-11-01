import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import path from 'path';
import connectDB from './configs/db.js';
import authRoutes from './routes/authRoutes.js';

const server = async () => {
  try {
    dotenv.config({
      path: path.resolve('.env'),
    });

    const app = express();
    const PORT = process.env.PORT || 5000;
    const DB_URI =
      process.env.MONGO_URI || 'mongodb://localhost:27017/login-security';

    app.use(express.json());
    app.use(
      cors({
        origin: ['http://localhost:5173', 'https://login-security-iota.vercel.app'],
      })
    );
    await connectDB(DB_URI);

    // Health check route
    app.get('/health', (req, res) => {
      return res.status(200).send('App running successfully!');
    });

    // Base route for auth
    app.use('/api/auth', authRoutes);

    // Error handling middleware
    app.use((err, req, res, next) => {
      console.error(err.stack);
      return res
        .status(500)
        .json({ message: 'An unexpected error occured on the server!' });
    });

    // Start the application
    app.listen(PORT, () => console.log('Server listening on PORT: ', PORT));
  } catch (error) {
    console.error('Error starting the server: ', error);
  }
};

server();
