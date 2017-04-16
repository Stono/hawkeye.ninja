'use strict';
const util = require('../util');
const StringifyMiddleware = require('./middleware/stringify');
const CryptoMiddleware = require('./middleware/crypto');
const GzipMiddleware = require('./middleware/gzip');

const KeyValuePair = require('./types/keyValuePair');
const Collection = require('./types/collection');
const List = require('./types/list');
const Counter = require('./types/counter');
const Subscription = require('./types/subscription');

module.exports = function Dal(config) {
  const Redis = require('../../lib/redis');
  config = util.defaultValue(config, () => { return require('../../config') });
  const redis = new Redis(config.redis);
  const subscriber = new Redis(config.redis);

  let command = function() {
    /* jshint maxstatements: 30 */
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
        if(util.isEmpty(data)) { return done(null, data); }
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
      redis.getBuffer(key, handleResponse(done));
    };
    self.hset = function(name, key, value, done) {
      redis.hset(name, key, handleWrite(value), done);
    };
    self.hget = function(name, key, done) {
      redis.hgetBuffer(name, key, handleResponse(done));
    };
    self.hgetall = function(name, done) {
      redis.hgetallBuffer(name, (err, data) => {
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
      redis.lpopBuffer(key, handleResponse(done));
    };
    self.lrange = function(key, start, end, done) {
      redis.lrangeBuffer(key, start, end, (err, data) => {
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
      const gotMessage = (pattern, channel, msg) => {
        msg = parseResponse(msg);
        handler(msg, channel);
      };
      subscriber.psubscribeBuffer(pattern, err => {
        if(err) { return done(err); }
        subscriber.on('pmessageBuffer', gotMessage);
        done(null, gotMessage);
      });
    };
    self.unsubscribe = function(pattern, handler, done) {
      subscriber.removeListener('pmessageBuffer', handler);
      subscriber.punsubscribe(pattern, done);
    };
    self.publish = function(channel, msg, done) {
      redis.publish(channel, handleWrite(msg), done);
    };
    self.flushall = function(done) {
      redis.flushall(done);
    };
    self.use(new StringifyMiddleware());
    if(config.redis.encryptionKey) {
      self.use(new CryptoMiddleware(config.redis.encryptionKey));
    }
    self.use(new GzipMiddleware());
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
