import fs from 'fs';
import path from 'path';

import Koa from 'koa';
import Router from 'koa-router';

import { graphqlKoa, graphiqlKoa } from 'apollo-server-koa';
import { makeExecutableSchema } from 'graphql-tools';

import { config } from '../config';
import { logger } from '../logger';

const router = new Router();

async function graphQLTextParser(ctx: Koa.Context, next: Function) {
  if (ctx.request.is('application/graphql')) {
    ctx.body = { query: ctx.request.body };
  }

  await next();
}

const typeDefs = fs.readFileSync(path.join(__dirname, '../graphql/schema.graphql'), 'utf8');

const resolvers = {
  Query: {
    currentUser() {
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

const graphQLOptions = {
  schema,
  context: {}
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
