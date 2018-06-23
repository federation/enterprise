import Koa from 'koa';
import Router from 'koa-router';

import { graphqlKoa, graphiqlKoa } from 'apollo-server-koa';

import { config } from '../config';
import { createSchema } from '../graphql';

export function createRouter() {
  const router = new Router();

  const schema = createSchema();

  function graphQLOptions(ctx: Koa.Context) {
    return {
      schema,
      context: {
        koa: ctx,
      },
    };
  }

  function graphQLTextParser(ctx: Koa.Context, next: Function) {
    if (ctx.request.is('application/graphql')) {
      ctx.body = { query: ctx.request.body };
    }

    return next();
  }

  router.get('/graphql', graphqlKoa(graphQLOptions));
  router.post('/graphql', graphQLTextParser, graphqlKoa(graphQLOptions));

  if (config().isDevelopment()) {
    // TODO: Is there a better way to handle this? Automatically discoverable?
    const prefix = process.env.IS_SERVICE ? '/api' : '';

    router.get('/graphiql', graphiqlKoa({
      endpointURL: prefix + '/graphql',
      // passHeader: `'Authorization': 'Bearer lorem ipsum'`
    }));
  }

  return router;
}
