import Koa from 'koa';
import koaBody from 'koa-bodyparser';
import koaLogger from 'koa-logger';
import koaSession from 'koa-session';
import { ServerRegistration } from 'apollo-server-koa';

import { logger } from './logger';
import { config } from './config';

import * as graphQL from './routes/graphql';

// TODO: This runs before the request is actually finished. It'll consider a
// request done as soon as reverse proxy starts receiving it? but the koa-logger
// will consider it done until after nginx finishes responding.
async function requestLogger(ctx: Koa.Context, next: Function) {
  const start = Date.now();

  await next();

  const time = Date.now() - start;
  const size = '0kb';

  logger().info(`${ctx.method} ${ctx.path} ${ctx.status} ${time} ${size}`);
}

export function server() {
  const app = new Koa();

  app.keys = [config().COOKIE_SECRET];

  app.use(koaLogger({
    transporter: (str: any, args: any[]) => {
      const [ , method, path, status, time, size ] = args;

      if (!status) {
        logger().info(`Requested ${method} ${path}`);
      } else {
        logger().info(`Responded ${method} ${path} ${status} ${time} ${size}`);
      }
    },
  }));

  app.use(requestLogger);

  const sessionConfiguration = {
    key: 'session',

    // (number || 'session') maxAge in ms (default is 1 days)
    // 'session' will result in a cookie that expires when session/browser is closed
    // Warning: If a session cookie is stolen, this cookie will never expire
    maxAge: 86400000,

    // (boolean) can overwrite or not (default true)
    overwrite: true,

    // (boolean) httpOnly or not (default true)
    httpOnly: true,

    // (boolean) signed or not (default true)
    signed: true,

    // (boolean) Force a session identifier cookie to be set on every response.
    // The expiration is reset to the original maxAge, resetting the expiration
    // countdown. (default is false)
    rolling: false,

    // (boolean) renew session when session is nearly expired, so we can always
    // keep user logged in. (default is false)
    renew: false,
  };

  app.on('session:missed', () => {
    logger().info("Couldn't get a session value from Redis");
  });

  app.on('session:invalid', () => {
    logger().info('Session value is invalid');
  });

  app.on('session:expired', () => {
    logger().info('Session value is expired');
  });

  app.use(koaSession(sessionConfiguration, app));

  app.use(koaBody({
    extendTypes: {
      text: ['application/graphql'],
    },
  }));

  const apollo = graphQL.createServer();
  const serverRegistration = { app } as ServerRegistration;

  apollo.applyMiddleware(serverRegistration);

  return app;
}
