'use strict';
const ScanLog = require('./managers/scanLog');
const ScanManager = require('./managers/scan');
const util = require('./util');
const rack = require('hat').rack(192);
const server = require('../config').url;

module.exports = function Worker(config) {
  util.enforceArgs(config, ['dal']);
  config.workerInterval = util.defaultValue(config.workerInterval, 2000);
  const exec = util.defaultValue(config.exec, () => { return new require('./exec')(); });
  let working = false;
  let self = {
    id: util.defaultValue(config.workerId, rack())
  };
  const handlePending = (err, model) => {
    /* jshint maxcomplexity: 5*/
    if(err) { return; }
    if(util.isEmpty(model)) { return; }
    working = true;

    const logger = new ScanLog({ dal: config.dal });
    const repoId = model.repo.id;
    const scanNumber = model.scan.number;

    const log = msg => {
      logger.write(repoId, scanNumber, msg);
    };
    log('Cloning ' + model.repo.fullName);

    const repo = 'https://' + model.oauth.accessToken + ':x-oauth-basic@github.com/' + model.repo.fullName;
    const postTo = `${server}/api/scan/${model.token}/${model.scan.number}`;

    let command = util.defaultValue(process.env.ONESHOT_CMD, 'docker run --rm stono/hawkeye.ninja-oneshot');
    command = `${command} ${repo} ${postTo}`;
    exec.command(command, {
      stdout: log,
      stderr: log,
      env: {
        NODE_ENV: process.env.NODE_ENV,
        PATH: process.env.PATH
      }
    }, (err, result) => {
      working = false;
      if(err || result.code !== 0) {
        return log('Request complete with errors.');
      }
      log('Request complete');
    });
  };

  let timer;
  self.start = function() {
    const scanManager = new ScanManager({ dal: config.dal, id: 0 });
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
