import fs from 'fs';
import path from 'path';

import HttpStatus from 'http-status';
import { IResolvers } from 'graphql-tools';
import { AuthenticationError } from 'apollo-server-errors';

import { TokenVerificationError } from '../../errors';
import { User } from '../../models/user';
import { logger } from '../../logger';

export function readTypeDefs() {
  // eslint-disable-next-line no-sync
  return fs.readFileSync(path.join(process.cwd(), 'src/graphql/resolvers/user.graphql'), 'utf8');
}

export function createResolvers(): IResolvers {
  return {
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
          koa.state.user = User.fromAccessToken(token);

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

        logger().info('args:', args);

        // TODO: catch
        const user = new User({ name: args.name, email: args.email });

        await user.create(args.password);

        logger().info('created user:', user);

        const accessToken = user.createAccessToken();

        logger().info('created access token:', accessToken);

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

      // refreshAccessToken(parent, args, context, info) {},

      // createEmployer(parent, args, context, info) {}
    },

    User: {},
  };
}
