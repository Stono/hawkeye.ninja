'use strict';
const ScanManager = require('../lib/scanManager');
const Redis = require('../lib/redis');
const Worker = require('../lib/worker');
const Dal = require('../lib/dal');
const deride = require('deride');
const should = require('should');

describe('Worker', () => {
  let scanManager, redis, worker, exec, fs, dal;
  before(done => {
    redis = new Redis();
    dal = new Dal({ redis: redis });
    redis.once('ready', done);
  });

  beforeEach(done => {
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
    redis.flushall(done);
  });
  afterEach(done => {
    worker.stop();
    redis.flushall(done);
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
