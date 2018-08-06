import fs from 'fs';
import path from 'path';

import _ from 'lodash';
import { IResolvers } from 'graphql-tools';
import { gql, AuthenticationError, UserInputError } from 'apollo-server-koa';
import { JsonWebTokenError, TokenExpiredError } from 'jsonwebtoken';

import { User } from '../../models/user';
import { logger } from '../../logger';
import { TokenTypeError } from '../../errors';

export function getTypeDefs() {
  const graphQLPath = path.join(process.cwd(), 'src/graphql/resolvers/user.graphql');
  // eslint-disable-next-line no-sync
  const contents = fs.readFileSync(graphQLPath, 'utf8');
  const typeDefs = gql(contents);

  return typeDefs;
}

function authenticate(parent: any, args: any, context: any, _info: any) {
  const koa = context.koa;

  if (!koa) {
    throw new Error('Missing Koa context');
  }

  // eslint-disable-next-line dot-notation
  const tokenHeader = koa.request.headers['authorization'];

  if (!tokenHeader) {
    throw new Error('Missing authorization header');
  }

  const token = tokenHeader.replace('Bearer ', '');

  context.user = User.fromAccessToken(token);
}

export function getResolvers(): IResolvers {
  return {
    Query: {
      currentUser(parent, args, context, info) {
        authenticate(parent, args, context, info);

        return context.user;
      },
    },

    Mutation: {
      async register(parent, args, _context, _info) {
        if (!args.name || !args.email || !args.password) {
          throw new UserInputError('Missing registration arguments', {
            missingArguments: _.difference(['name', 'email', 'password'], Object.keys(args)),
          });
        }

        const user = new User({ name: args.name, email: args.email });
        const accessToken = user.createAccessToken();

        await user.create(args.password);

        return {
          accessToken,
          refreshToken: user.refreshToken,
          user: user as User,
        };
      },

      async login(parent, args, _context, _info) {
        if (!args.name || !args.password) {
          throw new AuthenticationError('Missing username or password');
        }

        const user = await User.getByName(args.name);
        const isAuthenticated = await user.authenticate(args.password);

        if (!isAuthenticated) {
          throw new AuthenticationError('Could not authenticate user');
        }

        const accessToken = user.createAccessToken();

        return {
          accessToken,
          refreshToken: user.refreshToken,
          user: user as User,
        };
      },

      async createAccessToken(_parent, args, _context, _info) {
        if (!args.refreshToken) {
          throw new UserInputError('Missing refresh token');
        }

        try {
          const user = User.fromRefreshToken(args.refreshToken);

          return user.createAccessToken();
        } catch (e) {
          logger().error('Failed to refresh an access token', e);

          if (e instanceof TokenTypeError) {
            throw e;
          } else if (e instanceof TokenExpiredError) {
            throw new Error(`Token expired at ${e.expiredAt}. Please re-authenticate`);
          } else if (e instanceof JsonWebTokenError) {
            throw new Error('Error validating token');
          } else {
            throw e;
          }
        }
      },
    },

    User: {},
  };
}
