'use strict';
const ScanManager = require('../lib/scanManager');
const should = require('should');
const Redis = require('../lib/redis');
const List = require('../lib/list');

describe('Scan Manager', () => {
  let scanManager, repo, redis, list, target;
  beforeEach(done => {
    redis = new Redis();
    repo = {
      id: 123456
    };
    target = { oauth: { accessToken: 'abc' }, repo: repo };
    redis.once('ready', () => {
      list = new List({ id: 'scans:pending', redis: redis });
      scanManager = new ScanManager({ redis: redis, id: repo.id });
      redis.flushall(done);
    });
  });
  it('should return an empty array when there are no scans', done => {
    scanManager.scans((err, scans) => {
      should.ifError(err);
      should(scans).eql([]);
      done();
    });
  });
  it('should create new scans', done => {
    scanManager.schedule(target, (err, scan) => {
      should.ifError(err);
      should(scan.id).match(/[a-z0-9]{40}/);
      should(scan.status).eql('pending');
      should(scan.number).eql(1);
      redis.hget('scans:123456', 1, (err, data) => {
        data = JSON.parse(data);
        should.ifError(err);
        should(data.number).eql(1);
        done();
      });
    });
  });
  it('new scans should be added to the scan list', done => {
    scanManager.schedule(target, () => {
      list.pop((err, model) => {
        should.ifError(err);
        should(model.scan.id).match(/[a-z0-9]{40}/);
        done();
      });
    });
  });
  it('scan numbers should increment, and ids should be different', done => {
    scanManager.schedule(target, (err, first) => {
      should(first.number).eql(1);
      should.ifError(err);
      scanManager.schedule(target, (err, scan) => {
        should.ifError(err);
        should(scan.id).not.eql(first.id);
        should(scan.number).eql(2);
        done();
      });
    });
  });
  it('should let me get a scan by its repo and number', done => {
    scanManager.schedule(target, () => {
      scanManager.schedule(target, (err, second) => {
        scanManager.get(2, (err, scan) => {
          should(scan.id).eql(second.id);
          should(scan.number).eql(2);
          done();
        });
      });
    });
  });
  it('should fail scans', done => {
    scanManager.schedule(target, () => {
      scanManager.fail(1, {}, err => {
        should.ifError(err);
        scanManager.get(1, (err, data) => {
          should(data.status).eql('failed');
          done();
        });
      });
    });
  });
  it('should pass scans', done => {
    scanManager.schedule(target, () => {
      scanManager.pass(1, {}, err => {
        should.ifError(err);
        scanManager.get(1, (err, data) => {
          should(data.status).eql('pass');
          done();
        });
      });
    });
  });
});
