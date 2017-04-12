'use strict';
const ScanManager = require('../lib/scanManager');
const Redis = require('../lib/redis');
const Worker = require('../lib/worker');
const config = require('../config');
const deride = require('deride');
const should = require('should');

describe('Worker', () => {
  let scanManager, redis, worker, exec, fs;
  beforeEach(done => {
    exec = deride.stub(['command']);
    fs = deride.stub(['readFileSync', 'unlink']);
    redis = new Redis(config.redis);
    scanManager = new ScanManager({ redis: redis, id: 0 });
    worker = new Worker({
      redis: redis,
      fs: fs,
      exec: exec,
      workerId: 'workerId',
      workerInterval: 10
    });
    redis.flushall(done);
  });
  afterEach(() => {
    worker.stop();
  });
  const go = done => {
    scanManager.schedule({
      oauth: { accessToken: 'token' },
      repo: { id: 'repoid', fullName: 'repo/repo' }
    }, done);
    worker.start();
  };
  it('should try and read the results from disk', done => {
    let scanId;
    exec.setup.command.toCallbackWith([null, { code: 0 }]);
    fs.setup.readFileSync.toReturn('"{}"');
    fs.setup.unlink.toDoThis(file => {
      should(file).match(/\/tmp\/scanLogs\/workerId\/.*\/results.json/);
      done();
    });

    go((err, scan) => {
      scanId = scan.id;
    });
  });

  it('should invoke the oneshot docker container', done => {
    let scanId;
    exec.setup.command.toDoThis(command => {
      command = command.split(' ');
      should(command[0]).eql('docker');
      should(command[1]).eql('run');
      should(command[2]).eql('--rm');
      should(command[3]).eql('-v');
      should(command[4]).match(/tmp\/scanLog/);
      should(command[5]).eql('--rm');
      should(command[6]).eql('stono/hawkeye.ninja-oneshot');
      should(command[7]).eql('https://token:x-oauth-basic@github.com/repo/repo');
      should(command[8]).eql('workerId');
      should(command[9]).eql(scanId);
      done();
    });
    go((err, scan) => {
      scanId = scan.id;
    });
  });
});