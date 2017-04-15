'use strict';
const util = require('./util');

module.exports = function ScanLog(options) {
  util.enforceArgs(options, ['repoId', 'number', 'dal']);
  let self = {};
  const namespace = `scans:${options.repoId}:log:${options.number}`;
  const list = options.dal.fifoList(namespace);

  self.write = function(msgs, done) {
    /* jshint maxcomplexity: 5 */
    done = done || function() {};
    if(typeof msgs === 'string') {
      msgs = msgs.split('\n');
      const blocked = [
        /json results saved/,
        /Doing writer: /,
        /Cloning into/,
        /Target for scan/,
        /\[info\]  -> /
      ];
      msgs = msgs.filter(msg => {
        let allowed = true;
        blocked.forEach(item => {
          const result = msg.match(item);
          if(!util.isEmpty(result)) {
            allowed = false;
            return;
          }
        });
        return allowed;
      });
    }
    const isArray = msgs instanceof Array;
    if(!isArray) {
      msgs = [msgs];
    }
    msgs.forEach(msg => {
      options.dal.publish(namespace, msg, () => {});
      list.push(msg, done);
    });
  };

  self.all = function(done) {
    list.all(done);
  };

  let subscriber;
  self.subscribe = function(handler, done) {
    if(!util.isEmpty(subscriber)) { return done(null, subscriber); }
    subscriber = options.dal.subscribe(namespace, handler, done);
  };

  self.stop = function(done) {
    if(!util.isEmpty(subscriber)) {
      subscriber.unsubscribe(err => {
        subscriber = undefined;
        done(err);
      });
    } else {
      return done();
    }
  };
  return Object.freeze(self);
};
