import Koa from 'koa';

import { ApolloServer } from 'apollo-server-koa';

import { config } from '../config';
import { getTypeDefs, getResolvers } from '../graphql';

export function createServer() {
  const server = new ApolloServer({
    typeDefs: getTypeDefs(),
    resolvers: getResolvers(),
    debug: config().isDevelopment(),
    mocks: config().isDevelopment(),
    introspection: config().isDevelopment(),
    subscriptions: false,
    playground: {
      endpoint: '/api/graphql',
    },
    context(ctx: Koa.Context) {
      return {
        koa: ctx,
      };
    },
  });

  return server;
}
