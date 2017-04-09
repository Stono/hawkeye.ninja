'use strict';
const util = require('./util');
const _ = require('lodash');

module.exports = function List(options) {
  util.enforceArgs(options, ['id', 'redis']);
  let self = {};
  self.push = function(item, done) {
    let cloned = _.cloneDeep(item);
    cloned = JSON.stringify(item);
    options.redis.rpush(options.id, cloned, done);
  };
  self.pop = function(done) {
    options.redis.lpop(options.id, (err, result) => {
      if(err) { return done(err); }
      done(null, JSON.parse(result));
    });
  };
  self.all = function(done) {
    options.redis.lrange(options.id, 0, -1, (err, items) => {
      if(err) { return done(err); }
      done(null, items.map(i => { return JSON.parse(i); }));
    });
  };
  self.flush = function(done) {
    options.redis.del(options.id, done);
  };
  return Object.freeze(self);
};
