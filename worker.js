'use strict';
const Worker = require('./lib/worker');
const Redis = require('./lib/redis');
const Dal = require('./lib/dal');
const config = require('./config');
const debug = require('debug')('hawkeye:worker');

const redis = new Redis(config.redis);
const dal = new Dal({ redis: redis });
const worker = new Worker({
  dal: dal
});
worker.start();
debug(`Worker ${worker.id} has started`);
