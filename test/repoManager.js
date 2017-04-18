'use strict';
const RepoManager = require('../lib/repoManager');
const Dal = require('../lib/dal');
const Repo = require('../lib/models/repo');
const should = require('should');

describe.only('Repo Manager', () => {
  let manager, dal, repo;
  before(() => {
    dal = new Dal();
    repo = new Repo({
      id: 123456,
      name: 'test',
      private: false,
      description: 'Some Test Repo',
      owner: 'someorg',
      fullName: 'someorg/test'
    });
    manager = new RepoManager({ dal: dal });
  });
  beforeEach(done => {
    dal.flushall(() => {
      manager.track(repo, done);
    });
  });
  afterEach(done => {
    dal.flushall(done);
  });
  describe('Tracking', () => {
    let tracked;
    beforeEach(done => {
      manager.get(123456, (err, data) => {
        tracked = data;
        done(err);
      });
    });
    it('should track a repo', () => {
      should(tracked.repo).eql(repo);
    });
    it('should default the schedule of a tracked repo', () => {
      should(tracked.schedule.freq).eql('Never');
      should(tracked.schedule.when).eql('Never');
      should(tracked.schedule.email).eql(null);
    });
    it('should update the schedule frequence', done => {
      manager.schedule(123456, {
        freq: 'Hourly',
        when: 'Always',
        email: 'test@test.com',
        user: 123456
      }, err => {
        should.ifError(err);
        manager.get(123456, (err, data) => {
          should(data.schedule.freq).eql('Hourly');
          should(data.schedule.when).eql('Always');
          should(data.schedule.email).eql('test@test.com');
          should(data.schedule.user).eql(123456);
          should(data.schedule.last).eql(null);
          //should(data.schedule.last.toString().slice(0, -2)).eql(Date.now().toString().slice(0, -2));
          done();
        });
      });
    });
    it('should return a list of scheduled repos based on the given frequence', done => {
      manager.schedule(123456, {
        freq: 'Hourly',
        when: 'Always',
        email: 'test@test.com',
        user: 123456
      }, () => {
        manager.getScheduled((err, data) => {
          should.ifError(err);
          should(data.length).eql(1);
          should(data[0].repo).eql(repo);
          done();
        });
      });
    });
  });
});
