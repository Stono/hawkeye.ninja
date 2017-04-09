'use strict';
const util = require('./lib/util');
const exec = new require('./lib/exec')();
const tmp = require('tmp');

const dockerScan = function(options) {
  util.enforceArgs(options, ['repo']);

  tmp.dir({ unsafeCleanup: true, template: '/tmp/repo-XXXXXX' }, (err, path, cleanupCallback) => {
    let scanComplete = (err, result) => {
      process.exit(result.code);
      cleanupCallback();
    };

    let scan = () => {
      const command = `hawkeye scan -t ${path} -j results.json`;
      exec.command(command, {
        stdout: console.log,
        stderr: console.error
      }, scanComplete);
    };

    let cloneComplete = (err, result) => {
      if(result.code !== 0) { return process.exit(result.code); }
      scan();
    };

    (function clone() {
      if (err) { throw err }
      const command = `git clone ${options.repo} --depth=1 ${path}`;

      exec.command(command, {
        stdout: console.log,
        stderr: console.error
      }, cloneComplete);
    })();
  });
};

const repo = process.argv[2];
dockerScan({
  repo: repo
});
