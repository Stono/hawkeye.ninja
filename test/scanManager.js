'use strict';
const ScanManager = require('../lib/scanManager');
const should = require('should');
const Redis = require('../lib/redis');
const List = require('../lib/list');

describe('Scan Manager', () => {
  let scanManager, repo, redis, list;
  beforeEach(done => {
    redis = new Redis();
    repo = {
      id: 123456
    };
    redis.once('ready', () => {
      list = new List({id: 'scans:pending', redis: redis });
      scanManager = new ScanManager({ redis: redis });
      redis.flushall(done);
    });
  });
  it('should return an empty array when there are no scans', done => {
    scanManager.scans(repo.id, (err, scans) => {
      should.ifError(err);
      should(scans).eql([]);
      done();
    });
  });
  it('should create new scans', done => {
    scanManager.schedule(repo.id, (err, scan) => {
      should.ifError(err);
      should(scan.id).match(/[a-z0-9]{40}/);
      should(scan.status).eql('pending');
      should(scan.number).eql(1);
      done();
    });
  });
  it('new scans should be added to the scan list', done => {
    scanManager.schedule(repo.id, () => {
      list.pop((err, scan) => {
        should.ifError(err);
        should(scan.id).match(/[a-z0-9]{40}/);
        done();
      });
    });
  });
  it('scan numbers should increment, and ids should be different', done => {
    scanManager.schedule(repo.id, (err, first) => {
      should(first.number).eql(1);
      should.ifError(err);
      scanManager.schedule(repo.id, (err, scan) => {
        should.ifError(err);
        should(scan.id).not.eql(first.id);
        should(scan.number).eql(2);
        done();
      });
    });
  });
  it('should let me get a scan by its repo and number', done => {
    scanManager.schedule(repo.id, () => {
      scanManager.schedule(repo.id, (err, second) => {
        scanManager.get(repo.id, 2, (err, scan) => {
          should(scan.id).eql(second.id);
          should(scan.number).eql(2);
          done();
        });
      });
    });
  });
});
