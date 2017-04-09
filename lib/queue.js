'use strict';
const util = require('./util');
const _ = require('lodash');

module.exports = function Queue(namespace, redis) {
  util.enforceNotEmpty(namespace);
  util.enforceNotEmpty(redis);
  let self = {};
  self.push = function(item, done) {
    let cloned = _.cloneDeep(item);
    cloned = JSON.stringify(item);
    redis.lpush(namespace, cloned, done);
  };
  self.pop = function(done) {
    redis.rpop(namespace, (err, result) => {
      if(err) { return done(err); }
      done(null, JSON.parse(result));
    });
  };
  return Object.freeze(self);
};
