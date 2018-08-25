import fs from 'fs';
import path from 'path';

import _ from 'lodash';
import { IResolvers } from 'graphql-tools';
import { gql, AuthenticationError, UserInputError } from 'apollo-server-koa';
import { User } from '../../models/user';
import { logger } from '../../logger';

export function getTypeDefs() {
  const graphQLPath = path.join(process.cwd(), 'src/graphql/resolvers/user.graphql');
  // eslint-disable-next-line no-sync
  const contents = fs.readFileSync(graphQLPath, 'utf8');
  const typeDefs = gql(contents);

  return typeDefs;
}

async function authenticate(parent: any, args: any, context: any, _info: any) {
  const id = context.koa.session.user_id;

  if (!id) {
    throw new AuthenticationError('User is not authenticated!');
  }

  const user = await User.getById(id);

  logger().info('authenticated user', user);

  context.user = user;
}

function assertUserLoggedOut(context: any) {
  if (!context.koa.session.isNew && context.koa.session.user_id) {
    throw new Error('User is already logged in');
  }
}

function createUserSession(context: any, user: User) {
  context.koa.session.user_id = user.id;

  logger().info('saving session', { user_id: user.id });
}

function destroyUserSession(context: any) {
  // TODO: Identify the session being destroyed
  logger().info('destroying session');

  context.koa.session = null;
}

export function getResolvers(): IResolvers {
  return {
    Query: {
      async currentUser(parent, args, context, info) {
        await authenticate(parent, args, context, info);

        return context.user;
      },
    },

    Mutation: {
      async register(parent, args, context, _info) {
        assertUserLoggedOut(context);

        if (!args.name || !args.email || !args.password) {
          throw new UserInputError('Missing registration arguments', {
            missingArguments: _.difference(['name', 'email', 'password'], Object.keys(args)),
          });
        }

        const user = new User({ name: args.name, email: args.email });

        await user.create(args.password);

        createUserSession(context, user);

        return user as User;
      },

      async login(parent, args, context, _info) {
        assertUserLoggedOut(context);

        if (!args.name || !args.password) {
          throw new UserInputError('Missing username or password', {
            missingArguments: _.difference(['name', 'password'], Object.keys(args)),
          });
        }

        const user = await User.getByName(args.name);
        const isAuthenticated = await user.authenticate(args.password);

        if (!isAuthenticated) {
          throw new AuthenticationError('Could not authenticate user');
        }

        createUserSession(context, user);

        return user as User;
      },

      async logout(parent, args, context, _info) {
        destroyUserSession(context);

        return true;
      },
    },

    User: {},
  };
}
