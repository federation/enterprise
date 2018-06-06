'use strict';

require('dotenv').config();

import Koa from 'koa';
import koaBody from 'koa-bodyparser';
import koaLogger from 'koa-logger';
import Router from 'koa-router';

import logger from './logger';
import { config } from './config';

import UserRoutes from './routes/user';
import GraphQLRoutes from './routes/graphql';

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

async function unauthenticatedHandler(ctx: Koa.Context, next: Function) {
  try {
    await next();
  } catch (err) {
    if (err.status == 401) {
      ctx.status = 401;
      ctx.body = 'Protected resource';
    } else {
      throw err;
    }
  }
}

app.use(unauthenticatedHandler);

app.use(koaBody({
  extendTypes: {
    text: ['application/graphql']
  }
}));

app.use(GraphQLRoutes.routes());
app.use(GraphQLRoutes.allowedMethods());

app.use(UserRoutes.routes());
app.use(UserRoutes.allowedMethods());

app.listen(config().PORT, config().HOST);

logger.info(`Running on http://${config().HOST}:${config().PORT}`);
