import { graphqlKoa, graphiqlKoa } from 'apollo-server-koa';
import {
  graphql,
  GraphQLSchema,
  GraphQLObjectType,
  GraphQLString
} from 'graphql';

import Koa from 'koa';
import Router from 'koa-router';

import config from '../config';

const router = new Router();

async function graphQLTextParser(ctx: Koa.Context, next: Function) {
  if (ctx.request.is('application/graphql')) {
    ctx.body = { query: ctx.request.body };
  }

  await next();
}

const myGraphQLSchema = new GraphQLSchema({
  query: new GraphQLObjectType({
    name: 'RootQueryType',
    fields: {
      hello: {
        type: GraphQLString,
        resolve() {
          return 'world';
        }
      }
    }
  })
});

router.post('/graphql', graphQLTextParser, graphqlKoa({ schema: myGraphQLSchema }));
router.get('/graphql', graphqlKoa({ schema: myGraphQLSchema }));

if (config.node_env === 'development') {
  router.get('/graphiql', graphiqlKoa({
    endpointURL: '/graphql',
    // passHeader: `'Authorization': 'Bearer lorem ipsum'`
  }));
}

export default router;
