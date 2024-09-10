import { Router } from 'express';

import { handleResponse } from '@src/utils/index';

import { AuthController } from './controller';
import { AuthService } from './services';
import { validateSignInCodeParams, validateSignInPayload } from './validations';
import { PointsService } from '../points/service';

const router = Router();
const authService = new AuthService();
const pointsService = new PointsService();
const { signIn, updateWorkspace, generateSignCode } = new AuthController(
  authService,
  pointsService,
);

export const signOutPath = '/sign-out';

router.post('/sign-in', validateSignInPayload, handleResponse(signIn));

router.post(
  '/code/:address',
  validateSignInCodeParams,
  handleResponse(generateSignCode),
);

//todo: verify why do cant use authMiddleware here
router.put('/workspace', handleResponse(updateWorkspace));

//router.delete(signOutPath, authMiddleware, handleResponse(authController.signOut));

export default router;
