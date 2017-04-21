'use strict';
const ScanManager = require('../lib/managers/scan');
const Worker = require('../lib/worker');
const Dal = require('../lib/dal');
const util = require('../lib/util');
const deride = require('deride');
const should = require('should');

describe('Worker', () => {
  let scanManager, worker, exec, fs, dal;

  beforeEach(done => {
    dal = new Dal();
    exec = deride.stub(['command']);
    fs = deride.stub(['readFileSync', 'unlink']);
    scanManager = new ScanManager({
      dal: dal, id: 0
    });
    worker = new Worker({
      dal: dal,
      fs: fs,
      exec: exec,
      workerId: 'workerId',
      workerInterval: 10
    });
    dal.flushall(done);
  });
  afterEach(done => {
    worker.stop();
    dal.flushall(done);
  });
  const go = done => {
    scanManager.schedule({
      oauth: { accessToken: 'token' },
      repo: { id: 'repoid', fullName: 'repo/repo' },
      token: 'abc'
    }, done);
    worker.start();
  };

  it('should invoke the oneshot docker container', done => {
    let scanId;
    exec.setup.command.toDoThis(command => {
      let boot = util.defaultValue(process.env.ONESHOT_CMD, 'docker run --rm stono/hawkeye.ninja-oneshot');
      let rxp = new RegExp(boot + ' https://token:x-oauth-basic@github.com/repo/repo http://.*');
      should(command).match(rxp);
      done();
    });
    go((err, scan) => {
      scanId = scan.id;
    });
  });
});
