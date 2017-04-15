'use strict';
const util = require('./util');
const Crypto = require('node-crypt');

const List = function(key, command) {
  let self = {};
  self.push = function(value, done) {
    command.rpush(key, value, done);
  };
  self.pop = function(done) {
    command.lpop(key, done);
  };
  self.all = function(done) {
    command.lrange(key, 0, -1, done);
  };
  self.fromEnd = function(amount, done) {
    command.llen(key, (err, length) => {
      if(err) { return done(err); }
      command.lrange(key, length-amount, length-(amount-1), done);
    });
  };
  return Object.freeze(self);
};

const KeyValuePair = function(key, command) {
  let self = {};
  self.set = function(value, done) {
    command.set(key, value, done);
  };
  self.get = function(done) {
    command.get(key, done);
  };
  return Object.freeze(self);
};

const Collection = function(namespace, command) {
  let self = {};
  self.set = function(key, value, done) {
    command.hset(namespace, key, value, done);
  };
  self.get = function(key, done) {
    command.hget(namespace, key, done);
  };
  return Object.freeze(self);
};

const CryptoMiddleware = function(key) {
  const crypto = new Crypto({
    key: key,
    algorithm: 'aes-256-ctr'
  });
  let self = {};
  self.read = function(value) {
    return crypto.decrypt(value);
  };
  self.write = function(value) {
    return crypto.encrypt(value);
  };
  return Object.freeze(self);
};

module.exports = function Dal(options) {
  util.enforceArgs(options, ['redis'], true);
  const redis = options.redis;

  let command = function() {
    let self = {};
    const wrappers = [];
    let applyWrappers = (type, value) => {
      wrappers.forEach(wrapper => {
        value = wrapper[type](value);
      });
      return value;
    };
    let parseResponse = data => {
      let returnValue = JSON.parse(data);
      return applyWrappers('read', returnValue);
    };

    let handleResponse = done => {
      return function responseHandler(err, data) {
        if(err) { return done(err); }
        const returnValue = parseResponse(data);
        done(null, returnValue);
      };
    };
    let handleWrite = value => {
      let saveValue = applyWrappers('write', value);
      return JSON.stringify(saveValue);
    };
    self.set = function(key, value, done) {
      redis.set(key, handleWrite(value), done);
    };
    self.get = function(key, done) {
      redis.get(key, handleResponse(done));
    };
    self.hset = function(name, key, value, done) {
      redis.hset(name, key, handleWrite(value), done);
    };
    self.hget = function(name, key, done) {
      redis.hget(name, key, handleResponse(done));
    };
    self.rpush = function(key, value, done) {
      redis.rpush(key, handleWrite(value), done);
    };
    self.llen = function(key, done) {
      redis.llen(key, done);
    };
    self.lpop = function(key, done) {
      redis.lpop(key, handleResponse(done));
    };
    self.lrange = function(key, start, end, done) {
      redis.lrange(key, start, end, (err, data) => {
        if(err) { return done(err); }
        data = data.map(parseResponse);
        done(null, data);
      });
    };
    self.use = function(delegate) {
      wrappers.push(delegate);
      return self;
    };
    return self;
  };

  let self = {};
  let middleware = [];

  let getCommand = () => {
    const result = command();
    middleware.forEach(result.use);
    return result;
  };
  self.kvp = function(key) {
    return new KeyValuePair(key, getCommand());
  };
  self.collection = function(namespace) {
    return new Collection(namespace, getCommand());
  };
  self.fifoList = function(key) {
    return new List(key, getCommand());
  };
  self.use = function(module) {
    middleware.push(module);
  };
  self.middleware = {
    Crypto: CryptoMiddleware
  };
  return Object.freeze(self);
};
