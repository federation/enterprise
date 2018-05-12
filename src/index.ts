'use strict';

const Koa = require('koa');

// Constants
const PORT = 8080;
const HOST = '0.0.0.0';

const app = new Koa();

app.use((ctx: any) => {
  ctx.body = 'Hello world';
});

app.listen(PORT, HOST);

console.log(`Running on http://${HOST}:${PORT}`);
