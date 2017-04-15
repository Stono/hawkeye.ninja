'use strict';
module.exports = function KeyValuePair(key, command) {
  let self = {};
  let namespace = `kvp:${key}`;
  self.set = function(value, done) {
    command.set(namespace, value, done);
  };
  self.get = function(done) {
    command.get(namespace, done);
  };
  return Object.freeze(self);
};
