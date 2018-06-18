import fs from 'fs';
import path from 'path';

import Koa from 'koa';
import Router from 'koa-router';
import HttpStatus from 'http-status';

import { graphqlKoa, graphiqlKoa } from 'apollo-server-koa';
import { IResolvers, makeExecutableSchema } from 'graphql-tools';

import { config } from '../config';
import { logger } from '../logger';
import { TokenVerificationError } from '../errors';

import { User } from '../models/user';

const router = new Router();

// eslint-disable-next-line no-sync
const typeDefs = fs.readFileSync(path.join(__dirname, '../graphql/schema.graphql'), 'utf8');

const resolvers: IResolvers = {
  Query: {
    currentUser(_parent, _args, context, _info) {
      const koa = context.koa;

      // eslint-disable-next-line dot-notation
      const tokenHeader = koa.request.headers['authorization'];

      if (!tokenHeader) {
        throw new Error('Not authenticated');
      }

      const token = tokenHeader.replace('Bearer ', '');

      try {
        koa.state.user = User.verifyAccessToken(token);

        return koa.state.user;
      } catch (e) {
        // TODO: Ensure this terminates and prevents further middleware from executing.
        if (e instanceof TokenVerificationError) {
          koa.response.status = HttpStatus.INTERNAL_SERVER_ERROR;
          koa.response.redirect('/login');
        } else {
          throw e;
        }
      }
    },
  },
  Mutation: {
    async register(parent, args, context, _info) {
      if (!args.name || !args.email || !args.password) {
        context.koa.response.status = HttpStatus.INTERNAL_SERVER_ERROR;

        return;
      }

      // TODO: Perform other necessary validation.

      logger.info('parent:', parent);
      logger.info('args:', args);
      logger.info('context:', context);

      // TODO: catch
      const user = new User({ name: args.name, email: args.email });
      const createdUser = await user.create(args.password);

      logger.info('created user:', createdUser);

      const accessToken = createdUser.createAccessToken();

      logger.info('created access token:', accessToken);

      return {
        accessToken,
        refreshToken: user.refreshToken,
        user: user as User,
      };
    },

    async login(parent, args, context, info) {
      if (!args.name || !args.password) {
        context.koa.response.status = HttpStatus.INTERNAL_SERVER_ERROR;

        return;
      }

      // TODO: Perform other necessary validation.

      logger.info('parent:', parent);
      logger.info('args:', args);
      logger.info('context:', context);

      const user = await User.authenticate(args.name, args.password);

      logger.info('authenticated user:', user);

      const accessToken = user.createAccessToken();

      return {
        accessToken,
        refreshToken: user.refreshToken,
        user: user as User,
      };
    },

    // refreshAccessToken(parent, args, context, info) {},

    // createEmployer(parent, args, context, info) {}
  },
};

const schema = makeExecutableSchema({
  typeDefs,
  resolvers,
  logger: {
    log(e: any) {
      logger.error(e);
    },
  },
});

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

if (config().NODE_ENV === 'development') {
  router.get('/graphiql', graphiqlKoa({
    endpointURL: '/api/graphql',
    // passHeader: `'Authorization': 'Bearer lorem ipsum'`
  }));
}

export default router;
