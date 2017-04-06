'use strict';
const util = require('./util');
module.exports = function UserStore(redis) {
  util.enforceNotEmpty(redis);
  let self = {};
  self.get = function(login, done) {
    redis.hget('he:users', login, (err, data) => {
      done(err, JSON.parse(data));
    });
  };
  self.set = function(login, user, done) {
    redis.hset('he:users', login, JSON.stringify(user), done);
  };
  return Object.freeze(self);
};
