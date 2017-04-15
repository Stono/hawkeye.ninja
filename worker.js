'use strict';
const Worker = require('./lib/worker');
const Dal = require('./lib/dal');
const debug = require('debug')('hawkeye:worker');

const dal = new Dal();
const worker = new Worker({
  dal: dal
});
worker.start();
debug(`Worker ${worker.id} has started`);
