'use strict';
const ScanController = require('../../lib/controllers/scan');
const ScanManager = require('../../lib/managers/scan');
const RepoManager = require('../../lib/managers/repo');
const deride = require('deride');
const should = require('should');
const Dal = require('../../lib/dal');
const path = require('path');
const fs = require('fs');
const async = require('async');
const User = require('../../lib/models/user');
const errHandler = done => {
  return err => {
    return done(err);
  };
};

describe('Controllers.Scan', () => {
  let controller, dal, req, repoManager, scanManager, result, repo, user, userStore;
  beforeEach(done => {
    dal = new Dal();
    userStore = dal.collection('users');
    result = JSON.parse(fs.readFileSync(path.join(__dirname, '../samples/hawkeye/results.json')));
    controller = new ScanController({
      dal: dal
    });
    repoManager = new RepoManager({
      dal: dal
    });
    repo = {
      id: 123,
      name: 'test',
      private: false,
      description: 'test',
      owner: 'org',
      fullName: 'org/test'
    };
    user = new User({
      profile: require('../samples/github/profile.json'),
      oauth: { accessToken: 'accesstoken' }
    });

    scanManager = deride.wrap(new ScanManager({
      dal: dal
    }));

    const setreq = (tracked, next) => {
      req = {
        params: {
          token: tracked.token
        },
        body: {
          metadata: { state: 'failed' },
          results: result
        },
        query: {}
      };
      next();

    };
    const trackRepo = next => {
      repoManager.track(repo, user.profile.id, next);
    };
    const createUser = (result, next) => {
      userStore.set(user.profile.id, user, next);
    };
    const flush = next => {
      dal.flushall(next);
    };
    async.waterfall([
      flush,
      createUser,
      trackRepo,
      setreq
    ], done);
  });
  afterEach(done => {
    dal.flushall(done);
  });

  describe('handleResult', () => {
    it('should pass the result to the scanManager', done => {
      let res = deride.stub(['sendStatus']);

      res.setup.sendStatus.toDoThis(() => {
        scanManager.get(repo.id, 1, (err, data) => {
          should(data.status).eql('failed');
          done();
        });
      });
      controller.handleResult(req, res);
    });
  });

  describe('handleScan', () => {
    it('should pass the result to the scanManager', done => {
      let res = deride.stub(['sendStatus']);

      res.setup.sendStatus.toDoThis(() => {
        scanManager.get(repo.id, 1, (err, data) => {
          should(data.status).eql('failed');
          done();
        });
      });

      const schedule = {
        repo: repo,
        oauth: { accessToken: 'test' },
        token: 'token'
      };
      scanManager.schedule(schedule, (err, data) => {
        req.params.number = data.number;
        controller.handleScan(req, res);
      });
    });
  });

  describe('handleGithubHook', () => {
    it('should trigger a new scan', done => {
      let res = deride.stub(['sendStatus']);

      res.setup.sendStatus.toDoThis(code => {
        should(code).eql(204);
        scanManager.get(repo.id, 1, (err, data) => {
          should(data.status).eql('pending');
          should(data.reason).match(/github/i);
          done();
        });
      });

      controller.handleGithubHook(req, res, errHandler(done));
    });
    it('should return an error with a bad token', done => {
      let res = deride.stub(['sendStatus']);

      res.setup.sendStatus.toDoThis(code => {
        should(code).eql(204);
        scanManager.get(repo.id, 1, (err, data) => {
          should(data.status).eql('pending');
          should(data.reason).match(/github/i);
          done();
        });
      });

      req.params.token = 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa';
      controller.handleGithubHook(req, res, err => {
        should(err.message).match(/no tracking user/i);
        done();
      });
    });

  });


});
