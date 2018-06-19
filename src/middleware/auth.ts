import Koa from 'koa';
import HttpStatus from 'http-status';

import { User } from '../models/user';
import { AuthenticationError, TokenVerificationError } from '../errors';
import { logger } from '../logger';

export async function unauthenticatedHandler(ctx: Koa.Context, next: Function) {
  try {
    await next();
  } catch (err) {
    if (err.status === HttpStatus.UNAUTHORIZED) {
      ctx.status = err.status;
      ctx.body = 'Protected resource';
    } else {
      throw err;
    }
  }
}

export function createAccessToken(ctx: Koa.Context, next: Function) {
  ctx.state.accessToken = ctx.state.user.accessToken();

  return next();
}

export async function createRefreshToken(ctx: Koa.Context, next: Function) {
  ctx.state.refreshToken = await ctx.state.user.createRefreshToken();

  return next();
}

export async function authenticateUser(ctx: Koa.Context, next: Function) {
  const params = ctx.request.body;

  if (!params.name || !params.password) {
    ctx.status = HttpStatus.UNAUTHORIZED;
    ctx.body = {
      error: 'Send both email and password',
    };

    return;
  }

  try {
    const user = new User({ name: params.name });
    const isAuthenticated = user.authenticate(params.password);

    if (isAuthenticated) {
      ctx.state.user = user;
    } else {
      throw new AuthenticationError("Couldn't authenticate user");
    }

    return next();
  } catch (e) {
    if (e instanceof AuthenticationError) {
      ctx.response.status = HttpStatus.UNAUTHORIZED;
      ctx.response.redirect('/login');
    } else {
      throw e;
    }
  }
}

export function authenticationResponse(ctx: Koa.Context, next: Function) {
  ctx.status = 201;
  ctx.body = {
    success: true,
  };

  if (ctx.state.accessToken) {
    ctx.body.accessToken = ctx.state.accessToken;
  }

  if (ctx.state.refreshToken) {
    ctx.body.refreshToken = ctx.state.refreshToken;
  }

  return next();
}

export async function registerUser(ctx: Koa.Context, next: Function) {
  const params = ctx.request.body;

  if (!params.email || !params.password) {
    ctx.body = {
      error: 'Send both email and password',
    };

    return next();
  }

  try {
    const user = new User({ name: params.name, email: params.email });

    await user.create(params.password);

    ctx.state.user = user;
  } catch (e) {
    logger.error('problem registering user', e);
  }
}

export function verifyAccessToken(ctx: Koa.Context, next: Function) {
  const tokenHeader = ctx.request.headers.authorization;

  if (!tokenHeader) {
    throw new Error('Not authenticated');
  }

  const token = tokenHeader.replace('Bearer ', '');

  // TODO: Ensure this terminates and prevents further middleware from executing.
  try {
    ctx.state.user = User.verifyAccessToken(token);

    return next();
  } catch (e) {
    if (e instanceof TokenVerificationError) {
      ctx.response.status = HttpStatus.UNAUTHORIZED;
      ctx.response.redirect('/login');
    } else {
      throw e;
    }
  }
}

export async function verifyRefreshToken(ctx: Koa.Context, next: Function) {
  if (ctx.body.refreshToken !== '' && ctx.body.id) {
    try {
      const user = await User.getByRefreshToken(ctx.body.id, ctx.body.refreshToken);

      ctx.state.user = user;

      return next();
    } catch (e) {
      ctx.status = HttpStatus.UNAUTHORIZED;
      ctx.body = 'Not authenticated';
    }
  }
}
