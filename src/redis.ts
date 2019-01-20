import Bluebird from 'bluebird';
import * as redis from 'redis';

import { config } from './config';

Bluebird.promisifyAll(redis);

let client_: any;

export function client() {
  if (!client_) {
    if (config().REDIS) {
      client_ = redis.createClient(config().REDIS);
    } else {
      client_ = redis.createClient();
    }
  }

  return client_;
}
