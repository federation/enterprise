/* eslint-disable import/imports-first */
require('dotenv').config();

import Koa from 'koa';
import koaBody from 'koa-bodyparser';
import koaLogger from 'koa-logger';
import Router from 'koa-router';

import { config } from './config';
import { logger } from './logger';

import UserRoutes from './routes/user';
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

app.use(auth.unauthenticatedHandler);

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
