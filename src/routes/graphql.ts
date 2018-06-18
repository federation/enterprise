import fs from 'fs';
import path from 'path';

import Koa from 'koa';
import Router from 'koa-router';
import HttpStatus from 'http-status';

import { graphqlKoa, graphiqlKoa } from 'apollo-server-koa';
import { IResolvers, makeExecutableSchema } from 'graphql-tools';

import { config } from '../config';
import { logger } from '../logger';

const router = new Router();

async function graphQLTextParser(ctx: Koa.Context, next: Function) {
  if (ctx.request.is('application/graphql')) {
    ctx.body = { query: ctx.request.body };
  }

  await next();
}

// eslint-disable-next-line no-sync
const typeDefs = fs.readFileSync(path.join(__dirname, '../graphql/schema.graphql'), 'utf8');

const resolvers: IResolvers = {
  Query: {
    currentUser(parent, args, context, info) {
      return {
        uuid: 'abc',
        name: 'bob',
        email: 'bob@loblaw.com'
      };
    }
  },
  Mutation: {},
};

const schema = makeExecutableSchema({
  typeDefs,
  resolvers,
  logger: {
    log(e: any) {
      logger.error(e);
    }
  }
});

function graphQLOptions(ctx: Koa.Context) {
  return {
    schema,
    context: {
      koa: ctx,
    },
  };
};

router.post('/graphql', graphQLTextParser, graphqlKoa(graphQLOptions));
router.get('/graphql', graphqlKoa(graphQLOptions));

if (config().NODE_ENV === 'development') {
  router.get('/graphiql', graphiqlKoa({
    endpointURL: '/graphql',
    // passHeader: `'Authorization': 'Bearer lorem ipsum'`
  }));
}

export default router;
