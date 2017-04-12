'use strict';
const ScanManager = require('./scanManager');
const util = require('./util');
const rack = require('hat').rack(192);
const path = require('path');

module.exports = function Worker(config) {
  util.enforceArgs(config, ['redis']);
  config.workerInterval = util.defaultValue(config.workerInterval, 2000);
  const exec = util.defaultValue(config.exec, () => { return new require('./exec')(); });
  const fs = util.defaultValue(config.fs, () => { return require('fs'); });
  let working = false;
  let self = {
    id: util.defaultValue(config.workerId, rack())
  };
  const handlePending = (err, model) => {
    /* jshint maxcomplexity: 5*/
    if(err) { return; }
    if(util.isEmpty(model)) { return; }
    working = true;
    const scanManager = new ScanManager({ redis: config.redis, id: model.repo.id });
    const log = scanManager.scanLogFor(model.scan.number);

    log.write('Request being handled by: ' + self.id);
    log.write('Cloning ' + model.repo.fullName);

    const repo = 'https://' + model.oauth.accessToken + ':x-oauth-basic@github.com/' + model.repo.fullName;
    const tmp = `/tmp/scanLogs/${self.id}/${model.scan.id}`;
    let command = `docker run --rm -v ${tmp}:${tmp} --rm stono/hawkeye.ninja-oneshot`;
    command = `${command} ${repo} ${self.id} ${model.scan.id}`;
    exec.command(command, {
      stdout: log.write,
      stderr: log.write,
      env: {
        NODE_ENV: process.env.NODE_ENV,
        PATH: process.env.PATH
      }
    }, (err, result) => {
      const scanLog = path.join(tmp, 'results.json');
      const json = JSON.parse(fs.readFileSync(scanLog));
      fs.unlink(scanLog);

      working = false;
      if(err || result.code !== 0) {
        scanManager.fail(model.scan.number, json, () => {});
        return log.write('Request complete with errors.');
      }
      scanManager.pass(model.scan.number, json, () => {});
      log.write('Request complete');
    });
  };

  let timer;
  self.start = function() {
    const scanManager = new ScanManager({ redis: config.redis, id: 0 });
    const pop = function() {
      if(working) { return; }
      scanManager.popPending(handlePending);
    };
    timer = setInterval(pop, config.workerInterval);
  };
  self.stop = function() {
    clearInterval(timer);
  };
  return self;
};
