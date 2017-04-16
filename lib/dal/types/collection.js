'use strict';
module.exports = function Collection(key, command) {
  let self = {};
  let namespace = `col:${key}`;
  self.set = function(key, value, done) {
    command.hset(namespace, key, value, done);
  };
  self.get = function(key, done) {
    command.hget(namespace, key, done);
  };
  self.all = function(done) {
    command.hgetall(namespace, done);
  };
  return Object.freeze(self);
};