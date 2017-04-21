'use strict';
const RepoManager = require('../../lib/managers/repo');
const Dal = require('../../lib/dal');
const Repo = require('../../lib/models/repo');
const should = require('should');

describe('Repo Manager', () => {
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
    it('should let me look up a repo by its token', done => {
      manager.getByToken(tracked.token, (err, data) => {
        should.ifError(err);
        should(data.repo).eql(repo);
        done();
      });
    });
    it('track should be idempotent', done => {
      manager.schedule(123456, {
        freq: 'hourly',
        when: 'always',
        email: 'test@test.com',
        user: 123456
      }, err => {
        should.ifError(err);
        manager.track(repo, err => {
          should.ifError(err);
          manager.get(123456, (err, data) => {
            should(data.schedule.freq).eql('hourly');
            should(data.schedule.when).eql('always');
            should(data.schedule.email).eql('test@test.com');
            should(data.schedule.user).eql(123456);
            should(data.schedule.last).eql(null);
            should(data.token).match(/[a-z0-9]{96}/);
            done();
          });
        });
      });
    });

    it('should default the schedule of a tracked repo', () => {
      should(tracked.schedule.freq).eql('never');
      should(tracked.schedule.when).eql('never');
      should(tracked.schedule.email).eql(null);
    });

    it('should not return repos tracked as never', done => {
      manager.getScheduled((err, data) => {
        should.ifError(err);
        should(data.length).eql(0);
        done();
      });
    });

    it('should update the schedule frequence', done => {
      manager.schedule(123456, {
        freq: 'hourly',
        when: 'always',
        email: 'test@test.com',
        user: 123456
      }, err => {
        should.ifError(err);
        manager.get(123456, (err, data) => {
          should(data.schedule.freq).eql('hourly');
          should(data.schedule.when).eql('always');
          should(data.schedule.email).eql('test@test.com');
          should(data.schedule.user).eql(123456);
          should(data.schedule.last).eql(null);
          should(data.token).match(/[a-z0-9]{96}/);
          //should(data.schedule.last.toString().slice(0, -2)).eql(Date.now().toString().slice(0, -2));
          done();
        });
      });
    });

    it('should return a list of scheduled repos based on the given frequence', done => {
      manager.schedule(123456, {
        freq: 'hourly',
        when: 'always',
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

    it('should return hourly repos that have not been scanned in the last hour', done => {
      manager.schedule(123456, {
        freq: 'hourly',
        when: 'always',
        email: 'test@test.com',
        last: new Date().setMinutes(-61),
        user: 123456
      }, () => {
        manager.getScheduled((err, data) => {
          should.ifError(err);
          should(data.length).eql(1);
          done();
        });
      });
    });

    it('should not return hourly repos that have been scanned in the last hour', done => {
      manager.schedule(123456, {
        freq: 'hourly',
        when: 'always',
        email: 'test@test.com',
        last: new Date().setMinutes(-30),
        user: 123456
      }, () => {
        manager.getScheduled((err, data) => {
          should.ifError(err);
          should(data.length).eql(0);
          done();
        });
      });
    });

    it('should return daily repos that have not been scanned in the last day', done => {
      const date = new Date().setDate(new Date().getDate() - 2);
      manager.schedule(123456, {
        freq: 'daily',
        when: 'always',
        email: 'test@test.com',
        last: date,
        user: 123456
      }, () => {
        manager.getScheduled((err, data) => {
          should.ifError(err);
          should(data.length).eql(1);
          done();
        });
      });
    });

    it('should not return daily repos that have been scanned in the last day', done => {
      manager.schedule(123456, {
        freq: 'daily',
        when: 'always',
        email: 'test@test.com',
        last: new Date().setMinutes(-360),
        user: 123456
      }, () => {
        manager.getScheduled((err, data) => {
          should.ifError(err);
          should(data.length).eql(0);
          done();
        });
      });
    });

    it('should return weekly repos that have not been scanned in the last week', done => {
      const date = new Date().setDate(new Date().getDate() - 12);
      manager.schedule(123456, {
        freq: 'weekly',
        when: 'always',
        email: 'test@test.com',
        last: date,
        user: 123456
      }, () => {
        manager.getScheduled((err, data) => {
          should.ifError(err);
          should(data.length).eql(1);
          done();
        });
      });
    });

    it('should not return weekly repos that have been scanned in the last week', done => {
      const date = new Date().setDate(new Date().getDate() - 5);
      manager.schedule(123456, {
        freq: 'weekly',
        when: 'always',
        email: 'test@test.com',
        last: date,
        user: 123456
      }, () => {
        manager.getScheduled((err, data) => {
          should.ifError(err);
          should(data.length).eql(0);
          done();
        });
      });
    });

    it('should return monthly repos that have been not scanned in the last month', done => {
      const date = new Date().setDate(new Date().getDate() - 40);
      manager.schedule(123456, {
        freq: 'monthly',
        when: 'always',
        email: 'test@test.com',
        last: date,
        user: 123456
      }, () => {
        manager.getScheduled((err, data) => {
          should.ifError(err);
          should(data.length).eql(1);
          done();
        });
      });
    });

    it('should not return monthly repos that have been scanned in the last month', done => {
      const date = new Date().setDate(new Date().getDate() - 20);
      manager.schedule(123456, {
        freq: 'monthly',
        when: 'always',
        email: 'test@test.com',
        last: date,
        user: 123456
      }, () => {
        manager.getScheduled((err, data) => {
          should.ifError(err);
          should(data.length).eql(0);
          done();
        });
      });
    });

  });
});
