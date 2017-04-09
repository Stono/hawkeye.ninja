'use strict';
const util = require('./util');
const EncryptedRedis = require('./encryptedRedis');
const List = require('./list');
const config = require('../config');

module.exports = function ScanLog(options) {
  util.enforceArgs(options, ['id', 'redis']);
  let self = {};
  const namespace = `scans:log:${options.id}`;
  const list = new List({ id: namespace, redis: options.redis });

  let subscriber;
  const getSubscriber = done => {
    if(!util.isEmpty(subscriber)) { return done(null, subscriber); }
    subscriber = new EncryptedRedis(config.redis);
    subscriber.subscribe(namespace, err => {
      done(null, err);
    });
  };

  self.write = function(msg, done) {
    options.redis.publish(namespace, msg);
    list.push(msg, done);
  };

  self.subscribe = function(handler, done) {
    getSubscriber(err => {
      if(err) { return done(err); }
      subscriber.on('message', (channel, msg) => {
        handler(msg);
      });
      done();
    });
    return self;
  };
  self.stop = function() {
    if(subscriber) { subscriber.quit(); }
  };
  return Object.freeze(self);
};
