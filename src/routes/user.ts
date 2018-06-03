import { User, AuthenticationError, TokenVerificationError } from '../models/user';

import Router from 'koa-router';

import {
  registerUser,
  createAuthenticationToken,
  createRefreshToken,
  authenticationResponse,
  authenticateUser,
  verifyAuthenticationToken,
  verifyRefreshToken
} from '../middleware/auth';

const router = new Router();

router.post('/auth/register', ...[
  registerUser,
  createRefreshToken,
  createAuthenticationToken,
  authenticationResponse
]);

router.post('/auth/login', ...[
  authenticateUser,
  createRefreshToken,
  createAuthenticationToken,
  authenticationResponse
]);

router.post('/auth/refresh', ...[
  verifyRefreshToken,
  createAuthenticationToken,
  authenticationResponse
]);

router.get('/auth/guarded', verifyAuthenticationToken, (ctx) => {
  ctx.body = 'success';
});

router.delete('/auth/logout', (ctx) => {});

export default router;
