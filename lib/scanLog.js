'use strict';
const util = require('./util');
const EncryptedRedis = require('./encryptedRedis');
module.exports = function ScanLog(options) {
  util.enforceArgs(options, ['id', 'redis', 'list']);
  let self = {};
  const publisher = new EncryptedRedis(options.redis);
  const namespace = `scan-log:${options.id}`;
  let subscriber;
  const getSubscriber = done => {
    if(!util.isEmpty(subscriber)) { return done(null, subscriber); }
    subscriber = new EncryptedRedis(options.redis);
    subscriber.subscribe(namespace, err => {
      done(null, err);
    });
  };

  self.write = function(msg) {
    publisher.publish(namespace, msg);
    options.list.push(msg);
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
    publisher.quit();
  };
  return Object.freeze(self);
};
