'use strict';

import Koa from 'koa';
import koaRouter from 'koa-router';
import koaBody from 'koa-bodyparser';
import { graphqlKoa, graphiqlKoa } from 'apollo-server-koa';
import {
  graphql,
  GraphQLSchema,
  GraphQLObjectType,
  GraphQLString
} from 'graphql';

import { Client } from 'pg';

const client = new Client();

// Constants
const PORT = 8080;
const HOST = '0.0.0.0';

const app = new Koa();
const router = new koaRouter();

app.use(koaBody({
  extendTypes: {
    text: ['application/graphql']
  }
}));

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

// NOTE
// This endpoint should be disabled on production.
router.get('/graphiql', graphiqlKoa({
  endpointURL: '/graphql',
  // passHeader: `'Authorization': 'Bearer lorem ipsum'`
}));

app.use(router.routes());
app.use(router.allowedMethods());

app.listen(PORT, HOST);

console.log(`Running on http://${HOST}:${PORT}`);
