'use strict';
const util = require('../util');

module.exports = function ScanLog(options) {
  util.enforceArgs(options, ['dal'], true);
  util.enforceTypes([options.dal], ['object']);
  let self = {};

  const getNamespace = (repoId, number) => {
    return `scans:${repoId}:log:${number}`;
  };

  self.write = function(repoId, number, msgs, done) {
    util.enforceTypes(arguments, ['number', 'number', null, 'function']);
    util.enforceNotEmpty(repoId, number);
    const namespace = getNamespace(repoId, number);
    const list = options.dal.fifoList(namespace);

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

  self.all = function(repoId, number, done) {
    util.enforceTypes(arguments, ['number', 'number', 'function']);
    const namespace = getNamespace(repoId, number);
    const list = options.dal.fifoList(namespace);
    list.all(done);
  };

  self.del = function(repoId, number, done) {
    util.enforceTypes(arguments, ['number', 'number', 'function']);
    const namespace = getNamespace(repoId, number);
    const list = options.dal.fifoList(namespace);
    list.del(done);
  };

  let subscriber;
  self.subscribe = function(repoId, number, handler, done) {
    util.enforceTypes(arguments, [null, null, 'function', 'function']);
    util.enforceNotEmpty(repoId, number);
    const namespace = getNamespace(repoId, number);
    if(!util.isEmpty(subscriber)) { return done(null, subscriber); }
    subscriber = options.dal.subscribe(namespace, handler, done);
  };

  self.stop = function(done) {
    util.enforceTypes(done, ['function']);
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
