'use strict';
const ScanManager = require('../lib/scanManager');
const Worker = require('../lib/worker');
const Dal = require('../lib/dal');
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
      command = command.split(' ');
      should(command[0]).eql('docker');
      should(command[1]).eql('run');
      should(command[2]).eql('--rm');
      should(command[3]).eql('stono/hawkeye.ninja-oneshot');
      should(command[4]).eql('https://token:x-oauth-basic@github.com/repo/repo');
      should(command[5]).match(/http.*abc/);
      done();
    });
    go((err, scan) => {
      scanId = scan.id;
    });
  });
});
