'use strict';
module.exports = function List(key, command) {
  let self = {};
  let namespace = `lst:${key}`;
  self.push = function(value, done) {
    command.rpush(namespace, value, done);
  };
  self.pop = function(done) {
    command.lpop(namespace, done);
  };
  self.all = function(done) {
    command.lrange(namespace, 0, -1, done);
  };
  self.del = function(done) {
    command.del(namespace, done);
  };
  self.fromEnd = function(amount, done) {
    command.llen(namespace, (err, length) => {
      if(err) { return done(err); }
      command.lrange(namespace, length-amount, length-(amount-1), done);
    });
  };
  return Object.freeze(self);
};
