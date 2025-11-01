import express from 'express';
import authController from '../controllers/authController.js';

const router = express.Router();

router.post('/register', authController.signUpController);
router.post('/login', authController.signInController);

export default router;
