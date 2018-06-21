/* eslint-disable import/imports-first */
require('dotenv').config();

import { config } from './config';
import { logger } from './logger';
import { server } from './server';

const app = server();

app.listen(config().PORT, config().HOST, () => {
  logger().info(`Listening on http://${config().HOST}:${config().PORT}`);
});
