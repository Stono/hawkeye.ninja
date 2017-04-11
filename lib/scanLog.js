'use strict';
const util = require('./util');
const EncryptedRedis = require('./encryptedRedis');
const List = require('./list');
const config = require('../config');

module.exports = function ScanLog(options) {
  util.enforceArgs(options, ['repoId', 'number', 'redis']);
  let self = {};
  const namespace = `scans:${options.repoId}:log:${options.number}`;
  const list = new List({ id: namespace, redis: options.redis });

  let subscriber;
  const getSubscriber = done => {
    if(!util.isEmpty(subscriber)) { return done(null, subscriber); }
    subscriber = new EncryptedRedis(config.redis);
    subscriber.on('ready', () => {
      subscriber.psubscribe(namespace, err => {
        done(null, err);
      });
    });
  };
  const encode = item => {
    if(util.isEmpty(item)) { return item; }
    if(typeof item === 'string') { return item; }
    return 'encoded:' + JSON.stringify(item);
  };
  const decode = item => {
    if(util.isEmpty(item)) { return item; }
    if(item.startsWith('encoded:')) {
      return JSON.parse(item.replace('encoded:', ''));
    }
    return item;
  };

  self.write = function(msg, done) {
    options.redis.publish(namespace, encode(msg));
    list.push(msg, done);
  };

  self.all = function(done) {
    list.all(done);
  };

  self.subscribe = function(handler, done) {
    getSubscriber(err => {
      if(err) { return done(err); }
      subscriber.on('pmessage', (pattern, channel, msg) => {
        handler(decode(msg), channel);
      });
      if(done) { done(); }
    });
    return self;
  };

  self.stop = function(done) {
    if(subscriber) {
      subscriber.punsubscribe(namespace, () => {
        subscriber.quit();
        subscriber = undefined;
        if(done) { done(); }
      });
    }
  };
  return Object.freeze(self);
};
