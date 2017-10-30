'use strict';
const App = require('./lib/app');
const config = require('./config');
const Dal = require('./lib/dal');
const dal = new Dal();
const async = require('async');
const Migrate = require('./lib/migrate');

const redis = new require('./lib/dal/redis/client')(config.dal.redis);
console.log(redis);
const migrate = new Migrate({
  path: __dirname + '/migrations',
  redis: redis
});

const app = new App({
  dal: dal,
  port: config.port
});

async.series([
  migrate.migrate,
  app.start
]);
