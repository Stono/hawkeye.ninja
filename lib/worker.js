'use strict';
const EncryptedRedis = require('./encryptedRedis');
const ScanManager = require('./scanManager');
const util = require('./util');
const rack = require('hat').rack(192);
const exec = new require('./exec')();
const path = require('path');
const fs = require('fs');

module.exports = function Worker(config) {
  util.enforceNotEmpty(config);
  const encryptedRedis = new EncryptedRedis(config.redis);
  const id = rack();

  let working = false;
  const handlePending = (err, model) => {
    /* jshint maxcomplexity: 5*/
    if(err) { return; }
    if(util.isEmpty(model)) { return; }
    working = true;
    const scanManager = new ScanManager({ redis: encryptedRedis, id: model.repo.id });
    const log = scanManager.scanLogFor(model.scan.number);
    log.write('Request being handled by: ' + id);
    log.write('Cloning ' + model.repo.fullName);
    const repo = 'https://' + model.oauth.accessToken + ':x-oauth-basic@github.com/' + model.repo.fullName;
    //let command = `node ${path.join(__dirname, '../oneshot.js')}`;
    const tmp = `/tmp/scanLogs/${id}/${model.scan.id}`;
    let command = `docker run --rm -v ${tmp}:${tmp} --rm stono/hawkeye.ninja-oneshot`;
    command = `${command} ${repo} ${id} ${model.scan.id}`;
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

  let self = {};
  let interval;
  self.start = function() {
    const scanManager = new ScanManager({ redis: encryptedRedis, id: 0 });
    interval = setInterval(() => {
      if(working) { return; }
      scanManager.popPending(handlePending);
    }, 2000);
  };
  self.stop = function() {
    clearInterval(interval);
  };
  return self;
};
