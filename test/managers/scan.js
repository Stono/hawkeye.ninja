'use strict';
const ScanManager = require('../../lib/managers/scan');
const RepoManager = require('../../lib/managers/repo');
const EmailManager = require('../../lib/managers/email');
const GlobalStats = require('../../lib/managers/globalStats');
const Dal = require('../../lib/dal');
const should = require('should');

const path = require('path');
const _ = require('lodash');

describe('Scan Manager', () => {
  let repoManager, scanManager, emailManager, repo, list, target, sample, stats, dal;

  beforeEach(done => {
    dal = new Dal();
    sample = {
      results: _.cloneDeep(require(path.join(__dirname, '../samples/hawkeye/results.json'))),
      metadata: { state: 'fail' }
    };
    stats = new GlobalStats({ dal: dal });
    repo = {
      id: 123456,
      fullName: 'test'
    };
    target = { oauth: { accessToken: 'abc' }, repo: repo, token: 'abc', reason: 'test' };
    list = dal.fifoList('scans:pending');
    scanManager = new ScanManager({ dal: dal });
    repoManager = new RepoManager({ dal: dal });
    emailManager = new EmailManager({ dal: dal });
    dal.flushall(done);
  });
  afterEach(done => {
    dal.flushall(done);
  });

  it('should return an empty array when there are no scans', done => {
    scanManager.scans(repo.id, (err, scans) => {
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
      should(scan.reason).eql('test');
      scanManager.get(repo.id, 1, (err, data) => {
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
  it('should queue emails if the scan notification is enabled', done => {
    repoManager.track(repo, () => {
      const schedule = {
        freq: 'hourly',
        when: 'change',
        email: 'test@test.com',
        user: 12345
      };
      repoManager.schedule(repo.id, schedule, () => {
        scanManager.schedule(target, () => {
          scanManager.handleScan(repo.id, 1, sample, () => {
            emailManager.pop((err, msg) => {
              should.ifError(err);
              should(msg.subject).match(/New issues detected in: test/);
              should(msg.to).eql(schedule.email);
              should(msg.from).eql('noreply@hawkeye.website');
              should(msg.html).match(/nsp-39/);
              done();
            });
          });
        });
      });
    });
  });
  it('things added to the scan list shoud contain the token', done => {
    scanManager.schedule(target, () => {
      list.pop((err, model) => {
        should.ifError(err);
        should(model.token).eql('abc');
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
        scanManager.get(repo.id, 2, (err, scan) => {
          should(scan.id).eql(second.id);
          should(scan.number).eql(2);
          done();
        });
      });
    });
  });
  it('should increment the scan counter', done => {
    scanManager.schedule(target, () => {
      scanManager.handleScan(repo.id, 1, sample, () => {
        scanManager.handleScan(repo.id, 1, sample, () => {
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
