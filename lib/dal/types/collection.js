'use strict';
module.exports = function Collection(key, command) {
  let self = {};
  let namespace = `col:${key}`;
  const handleResult = done => {
    return err => {
      if(err) { return done(err); }
      done();
    };
  };
  self.set = function(key, value, done) {
    command.hset(namespace, key, value, handleResult(done));
  };
  self.del = function(key, done) {
    command.hdel(namespace, key, done);
  };
  self.get = function(key, done) {
    command.hget(namespace, key, done);
  };
  self.all = function(done) {
    command.hgetall(namespace, done);
  };
  return Object.freeze(self);
};
