'use strict';
const Worker = require('./lib/worker');
const Redis = require('./lib/encryptedRedis');
const config = require('./config');
const debug = require('debug')('hawkeye:worker');

const encryptedRedis = new Redis(config.redis);
const worker = new Worker({
  redis: encryptedRedis
});
worker.start();
debug(`Worker ${worker.id} has started`);
