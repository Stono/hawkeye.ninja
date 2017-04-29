'use strict';
const util = require('../../util');

module.exports = function RedisCommand(redis, wrapper) {
  let self = {};
  self.set = function(key, value, done) {
    redis.set(key, wrapper.handleWrite(value), done);
  };
  self.get = function(key, done) {
    redis.getBuffer(key, wrapper.handleResponse(done));
  };
  self.hset = function(name, key, value, done) {
    redis.hset(name, key, wrapper.handleWrite(value), done);
  };
  self.hdel = function(name, key, done) {
    redis.hdel(name, key, done);
  };
  self.del = function(key, done) {
    redis.hdel(key, done);
  };
  self.hget = function(name, key, done) {
    redis.hgetBuffer(name, key, wrapper.handleResponse(done));
  };
  self.expire = function(key, ttl, done) {
    redis.expire(key, ttl, done);
  };
  self.hgetall = function(name, done) {
    redis.hgetallBuffer(name, (err, data) => {
      if(err) { return done(err); }
      if(util.isEmpty(data)) { return done(null, null); }
      const result = {};
      Object.keys(data).forEach(key => {
        result[key] = wrapper.parseResponse(data[key]);
      });
      done(null, result);
    });
  };
  self.rpush = function(key, value, done) {
    value = wrapper.handleWrite(value);
    redis.rpush(key, value, done);
  };
  self.llen = function(key, done) {
    redis.llen(key, done);
  };
  self.lpop = function(key, done) {
    redis.lpopBuffer(key, wrapper.handleResponse(done));
  };
  self.lrange = function(key, start, end, done) {
    redis.lrangeBuffer(key, start, end, (err, data) => {
      if(err) { return done(err); }
      data = data.map(wrapper.parseResponse);
      done(null, data);
    });
  };
  self.incrby = function(key, amount, done) {
    redis.incrby(key, amount, done);
  };
  self.getcounter = function(key, done) {
    redis.get(key, (err, data) => {
      if(err) { return done(err); }
      if(util.isEmpty(data)) { return done(null, 0); }
      done(null, parseInt(data));
    });
  };
  self.flushall = function(done) {
    redis.flushall(done);
  };
  return Object.freeze(self);
};
