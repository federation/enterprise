import fs from 'fs';
import path from 'path';

import _ from 'lodash';
import { IResolvers } from 'graphql-tools';
import { DocumentNode } from 'graphql';
import { gql } from 'apollo-server-koa';

import * as User from './resolvers/user';

export function getTypeDefs(): Array<DocumentNode> {
  // eslint-disable-next-line no-sync
  const typeDefs = fs.readFileSync(path.join(process.cwd(), 'src/graphql/schema.graphql'), 'utf8');
  const parsed = gql(typeDefs);

  return [parsed, User.getTypeDefs()];
}

export function getResolvers() {
  const rootResolvers: IResolvers = {
    Query: {},
    Mutation: {},
  };

  const resolvers: IResolvers = _.merge(rootResolvers, User.getResolvers());

  return resolvers;
}
