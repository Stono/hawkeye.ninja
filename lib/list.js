'use strict';
const util = require('./util');
const _ = require('lodash');

module.exports = function List(namespace, redis) {
  util.enforceNotEmpty(namespace);
  util.enforceNotEmpty(redis);
  let self = {};
  self.push = function(item, done) {
    let cloned = _.cloneDeep(item);
    cloned = JSON.stringify(item);
    redis.rpush(namespace, cloned, done);
  };
  self.pop = function(done) {
    redis.lpop(namespace, (err, result) => {
      if(err) { return done(err); }
      done(null, JSON.parse(result));
    });
  };
  self.all = function(done) {
    redis.lrange(namespace, 0, -1, (err, items) => {
      if(err) { return done(err); }
      done(null, items.map(i => { return JSON.parse(i); }));
    });
  };
  self.flush = function(done) {
    redis.del(namespace, done);
  };
  return Object.freeze(self);
};
