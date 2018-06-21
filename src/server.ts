import Koa from 'koa';
import koaBody from 'koa-bodyparser';
import koaLogger from 'koa-logger';

import { logger } from './logger';

import * as graphQL from './routes/graphql';

import * as auth from './middleware/auth';

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

  app.use(auth.unauthenticatedHandler);

  app.use(koaBody({
    extendTypes: {
      text: ['application/graphql'],
    },
  }));

  const graphQLRouter = graphQL.createRouter();

  app.use(graphQLRouter.routes());
  app.use(graphQLRouter.allowedMethods());

  return app;
}
