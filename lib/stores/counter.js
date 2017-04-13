'use strict';
const util = require('../util');

module.exports = function Counter(options) {
  util.enforceArgs(options, ['id', 'redis']);
  let self = {};
  const namespace = `counter:${options.id}`;
  self.inc = function(amount, done) {
    options.redis.incrby(namespace, amount, done);
  };
  self.get = function(done) {
    options.redis.get(namespace, (err, data) => {
      if(err) { return done(err); }
      done(null, (data === null) ? 0 : parseInt(data));
    });
  };
  return Object.freeze(self);
};
