import { User, AuthenticationError, TokenVerificationError } from '../models/user';

import Koa from 'koa';
import Router from 'koa-router';

export function createAccessToken(ctx: Koa.Context) {
  ctx.state.accessToken = ctx.state.user.accessToken();
}

export async function createRefreshToken(ctx: Koa.Context) {
  ctx.state.refreshToken = await ctx.state.user.createRefreshToken();
}

export async function authenticateUser(ctx: Koa.Context) {
  const params = ctx.request.body;

  if (!params.email || !params.password) {
    ctx.status = 402;
    ctx.body = {
      error: 'Send both email and password',
    };

    return;
  }

  try {
    const user = ctx.state.user = await User.authenticate(params.email, params.password);
  } catch (e) {
    if (e instanceof AuthenticationError) {
      ctx.response.status = 402;
      ctx.response.redirect('/login');
    } else {
      throw e;
    }
  }
}

export function authenticationResponse(ctx: Koa.Context) {
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
}

export async function registerUser(ctx: Koa.Context) {
  const params = ctx.request.body;

  if (!params.email || !params.password) {
    ctx.body = {
      error: 'Send both email and password',
    };

    return;
  }

  try {
    const user = await User.create(params.name, params.email, params.password);

    ctx.state.user = user;
  } catch (e) {
    // TODO
    // boom authentication error
  }
}

export function verifyAccessToken(ctx: Koa.Context) {
  const tokenHeader = ctx.request.headers['authorization'];

  if (!tokenHeader) {
    return;
  }

  const token = tokenHeader.replace('Bearer ', '');

  // TODO
  // Ensure this terminates and prevents further middleware from executing.
  try {
    ctx.state.user = User.verify(token);
  } catch (e) {
    if (e instanceof TokenVerificationError) {
      ctx.response.status = 402;
      ctx.response.redirect('/login');
    } else {
      throw e;
    }
  }
}

export async function verifyRefreshToken(ctx: Koa.Context) {
  if (ctx.body.refreshToken != '') {
    try {
      const user = await User.getByRefreshToken(ctx.body.refreshToken);

      ctx.state.user = user;
    } catch (e) {
      ctx.status = 402;
      ctx.body = 'Not authenticated';
    }
  }
}
