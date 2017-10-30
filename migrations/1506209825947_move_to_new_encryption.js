'use strict';
const Redis = require('../lib/dal/redis/client');
const config = require('../config');
const async = require('async');

module.exports = function MigrateFromOldEncryption() {
  const redis = new Redis(config.dal.redis);
  let self = {};
  self.migrate = function(done) {
    const removeKeys = (err, keys) => {
      async.forEachOf(keys, (key, idx, next) => {
        redis.del(key.replace('he:', ''), next);
      }, done);
    };
    redis.keys('he:*', removeKeys);
  };
  return Object.freeze(self);
};
