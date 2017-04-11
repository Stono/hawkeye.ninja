'use strict';
const util = require('./util');
const _ = require('lodash');

module.exports = function List(options) {
  util.enforceArgs(options, ['id', 'redis']);
  let self = {};
  const encode = item => {
    if(util.isEmpty(item)) { return item; }
    if(typeof item === 'string') { return item; }
    return 'encoded:' + JSON.stringify(item);
  };
  const decode = item => {
    if(util.isEmpty(item)) { return item; }
    if(item.startsWith('encoded:')) {
      return JSON.parse(item.replace('encoded:', ''));
    }
    return item;
  };
  self.push = function(item, done) {
    let cloned = _.cloneDeep(item);
    cloned = encode(item);
    if(done) {
      return options.redis.rpush(options.id, cloned, done);
    }
    options.redis.rpush(options.id, cloned);
  };
  self.pop = function(done) {
    options.redis.lpop(options.id, (err, result) => {
      if(err) { return done(err); }
      done(null, decode(result));
    });
  };
  self.all = function(done) {
    options.redis.lrange(options.id, 0, -1, (err, items) => {
      if(err) { return done(err); }
      done(null, items.map(decode));
    });
  };
  self.flush = function(done) {
    options.redis.del(options.id, done);
  };
  return Object.freeze(self);
};
