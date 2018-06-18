/* eslint-disable import/imports-first */
require('dotenv').config();

import Koa from 'koa';
import koaBody from 'koa-bodyparser';
import koaLogger from 'koa-logger';
import Router from 'koa-router';

import { config } from './config';
import { logger } from './logger';

import GraphQLRoutes from './routes/graphql';

import * as auth from './middleware/auth';

logger.info('Starting Koa server', { host: config().HOST, port: config().PORT });

const app = new Koa();

app.use(koaLogger({
  transporter: (str: any, args: any[]) => {
    const [ , method, path, status, time, size ] = args;

    if (!status) {
      logger.info(`Requested ${method} ${path}`);
    } else {
      logger.info(`Responded ${method} ${path} ${status} ${time} ${size}`);
    }
  }
}))

// TODO: This runs before the request is actually finished. It'll consider a
// request done as soon as reverse proxy starts receiving it? but the koa-logger
// will consider it done until after nginx finishes responding.
async function requestLogger(ctx: Koa.Context, next: Function) {
  const start = Date.now();

  await next();

  const time = Date.now() - start;
  const size = '0kb';

  logger.info(`${ctx.method} ${ctx.path} ${ctx.status} ${time} ${size}`);
}

app.use(requestLogger);

app.use(auth.unauthenticatedHandler);

app.use(koaBody({
  extendTypes: {
    text: ['application/graphql']
  }
}));

app.use(GraphQLRoutes.routes());
app.use(GraphQLRoutes.allowedMethods());

app.listen(config().PORT, config().HOST);

logger.info(`Running on http://${config().HOST}:${config().PORT}`);
