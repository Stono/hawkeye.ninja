'use strict';
module.exports = function Counter(key, command) {
  let self = {};
  let namespace = `cnt:${key}`;
  self.inc = function(value, done) {
    command.incrby(namespace, value, done);
  };
  self.get = function(done) {
    command.getcounter(namespace, done);
  };
  self.expire = function(ttl, done) {
    command.expire(namespace, ttl, done);
  };
  return Object.freeze(self);
};
