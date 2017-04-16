'use strict';
const ScanManager = require('../lib/scanManager');
const should = require('should');

const path = require('path');
const _ = require('lodash');
const GlobalStats = require('../lib/globalStats');

const Dal = require('../lib/dal');

describe('Scan Manager', () => {
  let scanManager, repo, list, target, sample, stats, dal;

  beforeEach(done => {
    dal = new Dal();
    sample = _.cloneDeep(require(path.join(__dirname, 'samples/hawkeye/results.json')));
    stats = new GlobalStats({ dal: dal });
    repo = {
      id: 123456
    };
    target = { oauth: { accessToken: 'abc' }, repo: repo };
    list = dal.fifoList('scans:pending');
    scanManager = new ScanManager({
      id: repo.id,
      dal: dal
    });
    dal.flushall(done);
  });
  afterEach(done => {
    dal.flushall(done);
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
      scanManager.get(1, (err, data) => {
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
      scanManager.fail(1, sample, err => {
        should.ifError(err);
        scanManager.get(1, (err, data) => {
          should.ifError(err);
          should(data.status).eql('fail');
          should(data.metrics.items.length).eql(16);
          done();
        });
      });
    });
  });
  it('should pass scans', done => {
    scanManager.schedule(target, () => {
      scanManager.pass(1, sample, err => {
        should.ifError(err);
        scanManager.get(1, (err, data) => {
          should.ifError(err);
          should(data.status).eql('pass');
          should(data.metrics.items.length).eql(16);
          done();
        });
      });
    });
  });
  it('should increment the scan counter', done => {
    scanManager.schedule(target, () => {
      scanManager.pass(1, sample, () => {
        scanManager.fail(1, sample, () => {
          stats.scans((err, amount) => {
            should.ifError(err);
            should(amount).eql(2);
            done();
          });
        });
      });
    });
  });
});
