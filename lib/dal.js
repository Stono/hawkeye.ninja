'use strict';
const util = require('./util');

const Counter = function(key, command) {
  let self = {};
  self.inc = function(value, done) {
    command.incrby(key, value, done);
  };
  self.get = function(done) {
    command.getcounter(key, done);
  };
  return Object.freeze(self);
};

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
  self.all = function(done) {
    command.hgetall(namespace, done);
  };
  return Object.freeze(self);
};

const Subscription = function(pattern, handler, command, done) {
  let self = {};
  command.subscribe(pattern, handler, done);
  self.unsubscribe = function(done) {
    command.unsubscribe(pattern, done);
  };
  return Object.freeze(self);
};

const StringifyMiddleware = function() {
  let self = {};
  self.name = 'stringify';
  self.read = function(value) {
    if(typeof value === 'string' && value.startsWith('json:')) {
      return JSON.parse(value.replace('json:', ''));
    }
    return value;
  };
  self.write = function(value) {
    return 'json:' + JSON.stringify(value);
  };
  return Object.freeze(self);
};

const CryptoMiddleware = function(key) {
  const Crypto = require('node-crypt');
  const crypto = new Crypto({
    key: key,
    algorithm: 'aes-256-ctr'
  });
  let self = {};
  self.name = 'crypto';
  self.read = function(value) {
    if(typeof value === 'string' && value.startsWith('crypto:')) {
      return crypto.decrypt(value.replace('crypto:', ''));
    }
    return value;
  };
  self.write = function(value) {
    return 'crypto:' + crypto.encrypt(value);
  };
  return Object.freeze(self);
};

module.exports = function Dal() {
  const Redis = require('../lib/redis');
  const config = require('../config');
  const redis = new Redis(config.redis);
  const subscriber = new Redis(config.redis);

  let command = function() {
    let self = {};
    const wrappers = [];
    let applyWrappers = (type, value) => {
      const toApply = (type === 'write') ? wrappers : wrappers.slice(0).reverse();
      toApply.forEach(wrapper => {
        value = wrapper[type](value);
      });
      return value;
    };
    let parseResponse = data => {
      return applyWrappers('read', data);
    };

    let handleResponse = done => {
      return function responseHandler(err, data) {
        if(err) { return done(err); }
        const returnValue = parseResponse(data);
        done(null, returnValue);
      };
    };
    let handleWrite = value => {
      return applyWrappers('write', value);
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
    self.hgetall = function(name, done) {
      redis.hgetall(name, (err, data) => {
        if(err) { return done(err); }
        if(util.isEmpty(data)) { return done(null, null); }
        const result = {};
        Object.keys(data).forEach(key => {
          result[key] = parseResponse(data[key]);
        });
        done(null, result);
      });
    };
    self.rpush = function(key, value, done) {
      value = handleWrite(value);
      redis.rpush(key, value, done);
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
    self.use = function(delegate) {
      wrappers.push(delegate);
      return self;
    };
    self.subscribe = function(pattern, handler, done) {
      const gotMessage = (channel, msg) => {
        msg = parseResponse(msg);
        handler(msg, channel);
      };
      subscriber.subscribe(pattern, () => {
        subscriber.on('message', gotMessage);
        done(null, redis);
      });
    };
    self.unsubscribe = function(pattern, done) {
      subscriber.unsubscribe(pattern, done);
    };
    self.publish = function(channel, msg, done) {
      redis.publish(channel, handleWrite(msg), done);
    };
    self.flushall = function(done) {
      redis.flushall(done);
    };
    self.use(new StringifyMiddleware());
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
  self.counter = function(key) {
    return new Counter(key, getCommand());
  };
  self.subscribe = function(pattern, handler, done) {
    return new Subscription(pattern, handler, getCommand(), done);
  };
  self.publish = function(channel, msg, done) {
    getCommand().publish(channel, msg, done);
  };
  self.use = function(module) {
    middleware.push(module);
  };
  self.flushall = function(done) {
    getCommand().flushall(done);
  };
  self.middleware = {
    Crypto: CryptoMiddleware
  };
  return Object.freeze(self);
};
