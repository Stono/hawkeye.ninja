'use strict';
const util = require('./util');
const tmp = require('tmp');

module.exports = function OneShot(options) {
  util.enforceArgs(options, ['repo', 'url']);
  const exec = util.defaultValue(options.exec, () => { return new require('./exec')(); });

  let self = {};
  self.scan = function(done) {
    tmp.dir({ unsafeCleanup: true, template: '/tmp/repo-XXXXXX' }, (err, target, cleanupCallback) => {
      const scanComplete = function(err, result) {
        done(err, result);
        cleanupCallback();
      };

      const doScan = function() {
        const command = `hawkeye scan -t ${target} -h ${options.url}`;
        exec.command(command, {
          stdout: console.log,
          stderr: console.error
        }, scanComplete);
      };

      const cloneComplete = function(err, result) {
        if(result.code !== 0 || !util.isEmpty(err)) { return done(err, result); }
        doScan();
      };

      (function clone() {
        if (err) { throw err }
        const command = `git clone ${options.repo} --depth=1 ${target}`;

        exec.command(command, {
          stdout: console.log,
          stderr: console.error
        }, cloneComplete);
      })();
    });
  };
  return Object.freeze(self);
};
