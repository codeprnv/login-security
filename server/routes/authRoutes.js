import express from 'express';
import authController from '../controllers/authController.js';
import authenticateToken from '../middlewares/auth.js';

const router = express.Router();

router.post('/register', authController.signUpController);
router.post('/login', authController.signInController);
router.post('/mfa/setup', authenticateToken, authController.mfaSetupController);
router.post(
  '/mfa/verify',
  authenticateToken,
  authController.mfaVerifyController
);
router.post('/token/refresh', authController.refreshTokenController);

export default router;
