import { ApolloServer } from 'apollo-server-koa';

import { config } from '../config';
import { getTypeDefs, getResolvers } from '../graphql';

export function createServer() {
  const server = new ApolloServer({
    typeDefs: getTypeDefs(),
    resolvers: getResolvers(),
    debug: config().isDevelopment(),
    introspection: config().isDevelopment(),
    subscriptions: false,
    playground: {
      endpoint: '/api/graphql',
      settings: {
        'editor.theme': 'dark',
        'editor.cursorShape': 'line',
      } as any,
    },
    context(context: any) {
      return {
        koa: context.ctx,
      };
    },
  });

  return server;
}
