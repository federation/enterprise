import { User, AuthenticationError, TokenVerificationError } from '../models/user';

import Router from 'koa-router';

import {
  registerUser,
  createAccessToken,
  createRefreshToken,
  authenticationResponse,
  authenticateUser,
  verifyAccessToken,
  verifyRefreshToken
} from '../middleware/auth';

const router = new Router();

router.post('/auth/register', ...[
  registerUser,
  createRefreshToken,
  createAccessToken,
  authenticationResponse
]);

router.post('/auth/login', ...[
  authenticateUser,
  createRefreshToken,
  createAccessToken,
  authenticationResponse
]);

router.post('/auth/refresh', ...[
  verifyRefreshToken,
  createAccessToken,
  authenticationResponse
]);

router.get('/auth/guarded', verifyAccessToken, (ctx) => {
  ctx.body = 'success';
});

router.delete('/auth/logout', (ctx) => {});

export default router;
