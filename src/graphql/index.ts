import fs from 'fs';
import path from 'path';

import _ from 'lodash';
import { IResolvers, makeExecutableSchema } from 'graphql-tools';

import * as User from './resolvers/user';
import { logger } from '../logger';

export function createSchema() {
  // TODO: Split this up and merge it?
  // eslint-disable-next-line no-sync
  const typeDefs = fs.readFileSync(path.join(process.cwd(), 'src/graphql/schema.graphql'), 'utf8');

  const rootResolvers: IResolvers = {
    Query: {},
    Mutation: {},
  };

  const resolvers: IResolvers = _.merge(rootResolvers, User.createResolvers());

  return makeExecutableSchema({
    typeDefs,
    resolvers,
    logger: {
      log(e: any) {
        logger().error(e);
      },
    },
  });
}
