'use strict';
const BuildManager = require('../lib/buildManager');
const should = require('should');

describe('Build Manager', () => {
  let buildManager, repo;
  beforeEach(() => {
    repo = {
      fullName: 'testorg/test'
    };
    buildManager = new BuildManager();
  });
  it('should return an empty array when there are no builds', done => {
    buildManager.builds(repo.fullName, (err, builds) => {
      should.ifError(err);
      should(builds).eql([]);
      done();
    });
  });
  it('should create new builds', done => {
    buildManager.schedule(repo.fullName, (err, build) => {
      should.ifError(err);
      should(build.id).match(/[a-z0-9]{40}/);
      should(build.status).eql('pending');
      should(build.number).eql(1);
      done();
    });
  });
  it('build numbers should increment, and ids should be different', done => {
    buildManager.schedule(repo.fullName, (err, first) => {
      should(first.number).eql(1);
      should.ifError(err);
      buildManager.schedule(repo.fullName, (err, build) => {
        should.ifError(err);
        should(build.id).not.eql(first.id);
        should(build.number).eql(2);
        done();
      });
    });
  });
});
