'use strict';
const util = require('./lib/util');
const exec = new require('./lib/exec')();
const tmp = require('tmp');
const fs = require('fs');
const mkdirp = require('mkdirp');
const path = require('path');

const dockerScan = function(options) {
  util.enforceArgs(options, ['repo', 'scanId', 'workerId']);
  tmp.dir({ unsafeCleanup: true, template: '/tmp/repo-XXXXXX' }, (err, target, cleanupCallback) => {
    let scanComplete = (err, result) => {
      const payload = {
        exitCode: result.code,
        json: JSON.parse(fs.readFileSync(path.join(__dirname, 'results.json')).toString())
      };
      const tmp = `/tmp/scanLogs/${options.workerId}/${options.scanId}`;
      mkdirp.sync(tmp);

      fs.writeFileSync(path.join(tmp, 'results.json'), JSON.stringify(payload, null, 2));
      process.exit(result.code);
      cleanupCallback();
    };

    let scan = () => {
      const command = `hawkeye scan -t ${target} -j results.json`;
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
      const command = `git clone ${options.repo} --depth=1 ${target}`;

      exec.command(command, {
        stdout: console.log,
        stderr: console.error
      }, cloneComplete);
    })();
  });
};

const repo = process.argv[2];
const workerId = process.argv[3];
const scanId = process.argv[4];
dockerScan({
  repo: repo,
  workerId: workerId,
  scanId: scanId
});
