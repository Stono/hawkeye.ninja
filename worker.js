'use strict';
const Worker = require('./lib/worker');
const config = require('./config');
const worker = new Worker(config);
worker.start(() => {});
