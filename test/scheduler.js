'use strict';
const RepoManager = require('../lib/managers/repo');
const ScanManager = require('../lib/managers/scan');
const ScheduleManager = require('../lib/managers/scheduler');
const Dal = require('../lib/dal');
const Repo = require('../lib/models/repo');
const User = require('../lib/models/user');
const should = require('should');
const async = require('async');

describe('ScheduleManager', () => {
  let repoManager, scanManager, dal, repo, user, scheduler, userStore;
  before(() => {
    dal = new Dal();
    scheduler = new ScheduleManager({ dal: dal });
    userStore = dal.collection('users');
    repo = new Repo({
      id: 123456,
      name: 'test',
      private: false,
      description: 'Some Test Repo',
      owner: 'someorg',
      fullName: 'someorg/test'
    });
    user = new User({
      oauth: { accessToken: 'accesstoken' }
    });
    repoManager = new RepoManager({ dal: dal });
    scanManager = new ScanManager({ dal: dal, id: repo.id });
  });
  beforeEach(done => {
    async.series([
      dal.flushall,
      next => { repoManager.track(repo, next); },
        next => { userStore.set(123456, user, next) }
    ], done);
  });
  afterEach(done => {
    dal.flushall(done);
  });

  describe('Scheduling', () => {
    let tracked, last;
    beforeEach(done => {
      last = new Date().setMinutes(-120);
      repoManager.get(repo.id, (err, data) => {
        tracked = data;
        repoManager.schedule(123456, {
          freq: 'hourly',
          when: 'always',
          email: 'test@test.com',
          user: 123456,
          last: last
        }, () => {
          scheduler.run(done);
        });
      });
    });

    it('take repos that are scheduled, and put them on the queue of scheduled scans', done => {
      scanManager.popPending((err, scheduled) => {
        should.ifError(err);
        should(scheduled.oauth.accessToken).eql(user.oauth.accessToken);
        should(scheduled.token).eql(tracked.token);
        should(scheduled.repo).eql(repo);
        done();
      });
    });

    it('should update the last stamp for after scheduling', done => {
      repoManager.get(repo.id, (err, data) => {
        should(data.schedule.last).not.eql(last);
        done();
      });
    });
  });
});
