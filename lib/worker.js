'use strict';
const EncryptedRedis = require('./encryptedRedis');
const ScanManager = require('./scanManager');
const util = require('./util');
const rack = require('hat').rack(192);
const exec = new require('./exec')();

module.exports = function Worker(config) {
  util.enforceNotEmpty(config);
  const encryptedRedis = new EncryptedRedis(config.redis);
  const scanManager = new ScanManager({ redis: encryptedRedis });
  const id = rack();

  let working = false;

  const handlePending = (err, model) => {
    if(err) { return; }
    if(util.isEmpty(model)) { return; }
    working = true;
    const log = scanManager.scanLogFor(model.scan.id);
    log.write('Request being handled by: ' + id);
    log.write('Cloning ' + model.repo.fullName);
    const repo = 'https://' + model.oauth.accessToken + ':x-oauth-basic@github.com/' + model.repo.fullName;
    const command = 'docker run --rm stono/hawkeye.ninja-oneshot ' + repo;
    exec.command(command, {
      stdout: log.write,
      stderr: log.write
    }, (err, result) => {
      working = false;
      if(err || result.code !== 0) {
        return log.write('Request complete with errors.');
      }
      log.write('Request complete');
    });
  };

  let self = {};
  let interval;
  self.start = function() {
    interval = setInterval(() => {
      if(working) { return; }
      scanManager.popPending(handlePending);
    }, 5000);
  };
  self.stop = function() {
    clearInterval(interval);
  };
  return self;
};
