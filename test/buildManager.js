'use strict';
const ScanManager = require('../lib/scanManager');
const should = require('should');

describe('Scan Manager', () => {
  let scanManager, repo;
  beforeEach(() => {
    repo = {
      fullName: 'testorg/test'
    };
    scanManager = new ScanManager();
  });
  it('should return an empty array when there are no scans', done => {
    scanManager.scans(repo.fullName, (err, scans) => {
      should.ifError(err);
      should(scans).eql([]);
      done();
    });
  });
  it('should create new scans', done => {
    scanManager.schedule(repo.fullName, (err, scan) => {
      should.ifError(err);
      should(scan.id).match(/[a-z0-9]{40}/);
      should(scan.status).eql('pending');
      should(scan.number).eql(1);
      done();
    });
  });
  it('scan numbers should increment, and ids should be different', done => {
    scanManager.schedule(repo.fullName, (err, first) => {
      should(first.number).eql(1);
      should.ifError(err);
      scanManager.schedule(repo.fullName, (err, scan) => {
        should.ifError(err);
        should(scan.id).not.eql(first.id);
        should(scan.number).eql(2);
        done();
      });
    });
  });
});
