'use strict';
module.exports = function Subscription(pattern, handler, command, done) {
  let self = {};
  let eventHandler;
  command.subscribe(pattern, handler, (err, ev) => {
    eventHandler = ev;
    done(err);
  });
  self.unsubscribe = function(done) {
    command.unsubscribe(pattern, eventHandler, done);
  };
  return Object.freeze(self);
};
