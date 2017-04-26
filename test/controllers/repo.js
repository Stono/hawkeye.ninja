'use strict';
const RepoController = require('../../lib/controllers/repo');
const Repo = require('../../lib/models/repo');
const ScanManager = require('../../lib/managers/scan');
const RepoManager = require('../../lib/managers/repo');
const deride = require('deride');
const should = require('should');
const Dal = require('../../lib/dal');
const User = require('../../lib/models/user');
const MockGithubApi = require('../mockGithub');
const util = require('../../lib/util');

describe('Controllers.Repo', () => {
  let controller, scanManager, repoManager, dal, req, mockGithubApi;
  const repoId = 85411269;
  const errHandler = done => {
    return err => {
      return done(err);
    };
  };

  beforeEach(done => {
    dal = new Dal();
    mockGithubApi = new MockGithubApi();
    controller = new RepoController({
      dal: dal
    });
    repoManager = new RepoManager({
      dal: dal
    });
    req = {
      params: {
        org: 'stono',
        repo: 'hawkeye',
        scanNumber: 1
      },
      user: new User({
        profile: require('../samples/github/profile.json'),
        oauth: { accessToken: 'oauth here' },
        repos: require('../samples/github/repos.json').map(r => { return new Repo().fromGithub(r); })
      }, mockGithubApi)
    };
    scanManager = deride.wrap(new ScanManager({
      dal: dal,
    }));

    dal.flushall(() => {
      const target = { oauth: { accessToken: 'abc' }, repo: { id: repoId }, token: 'abc', reason: 'test' };
      scanManager.schedule(target, done);
    });
  });

  afterEach(done => {
    dal.flushall(done);
  });

  describe('viewScan', () => {
    let data;
    beforeEach(done => {
      let res = deride.stub(['render']);
      res.setup.render.toDoThis((view, model) => {
        data = model;
        done();
      });
      controller.viewScan(req, res, errHandler(done));
    });
    it('should append the scanManager scan', () => {
      should(data.scan.number).eql(1);
    });
    it('should error with bad scanNumber values', done => {
      req.params.scanNumber = 'bad';
      controller.viewScan(req, null, err => {
        should(util.isEmpty(err)).eql(false);
        done();
      });
    });
  });

  describe('viewRepo', () => {
    let model;
    beforeEach(done => {
      let res = deride.stub(['render']);
      res.setup.render.toDoThis((view, page) => {
        model = page;
        done();
      });
      controller.viewRepo(req, res, errHandler(done));
    });
    it('should set the title', () => {
      should(model.page.title).eql(req.params.repo);
    });
  });

  describe('apiUpdateSchedule', () => {
    let data;
    beforeEach(done => {
      let res = deride.stub(['sendStatus']);
      res.setup.sendStatus.toDoThis(code => {
        should(code).eql(204);
        repoManager.get(repoId, (err, tracking) => {
          should.ifError(err);
          data = tracking;
          done();
        });
      });
      req.body = {
        freq: 'hourly',
        when: 'always',
        email: 'test@test.com',
        github: 'push'
      };
      controller.apiUpdateSchedule(req, res, errHandler(done));
    });

    it('should update the tracking info', () => {
      should(data.repo.id).eql(repoId);
      should(data.schedule.freq).eql('hourly');
      should(data.schedule.when).eql('always');
      should(data.schedule.email).eql('test@test.com');
      should(data.schedule.github).eql('push');
    });
  });

  describe('apiViewRepo', () => {
    let data, scans;
    beforeEach(done => {
      let res = deride.stub(['json']);
      res.setup.json.toDoThis(model => {
        data = model;
        scanManager.scans(repoId, (err, s) => {
          scans = s;
          done();
        });
      });
      controller.apiViewRepo(req, res);
    });

    it('should append the scanManager scans', () => {
      should(data.scans.length).eql(scans.length);
    });

    it('should append the tracking info', () => {
      should(data.tracking.repo.id).eql(repoId);
      should(data.tracking.token).match(/[a-z0-9]{96}/);
      should(data.tracking.schedule.freq).eql('never');
    });
  });

  describe('newScan', () => {
    let url;
    beforeEach(done => {
      let res = deride.stub(['redirect']);
      res.setup.redirect.toDoThis(target => {
        url = target;
        done();
      });
      controller.newScan(req, res);
    });
    it('should redirect to the scan page', () => {
      should(url).match(/\/repo\/Stono\/hawkeye\/2/);
    });
    it('should schedule a new scan', done => {
      scanManager.popPending((err, pending) => {
        should.ifError(err);
        should(pending.repo.id).eql(85411269);
        done();
      });
    });
  });
});
