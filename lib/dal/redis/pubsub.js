'use strict';
module.exports = function RedisPubSub(publisher, subscriber, wrapper) {
  let self = {};
  self.subscribe = function(pattern, handler, done) {
    const gotMessage = (pattern, channel, msg) => {
      msg = wrapper.parseResponse(msg);
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
    publisher.publish(channel, wrapper.handleWrite(msg), done);
  };
  return Object.freeze(self);
};
