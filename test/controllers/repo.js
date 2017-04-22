'use strict';
const RepoController = require('../../lib/controllers/repo');
const Repo = require('../../lib/models/repo');
const ScanManager = require('../../lib/managers/scan');
const RepoManager = require('../../lib/managers/repo');
const deride = require('deride');
const should = require('should');
const Dal = require('../../lib/dal');

describe('Controllers.Repo', () => {
  let controller, scanManager, repoManager, dal, req;
  const repoId = 85411269;
  beforeEach(done => {
    dal = new Dal();
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
      user: {
        profile: require('../samples/github/profile.json'),
        oauth: { accessToken: 'oauth here' },
        repos: require('../samples/github/repos.json').map(r => { return new Repo().fromGithub(r); })
      }
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
      let res = deride.stub(['render', 'sendStatus']);
      res.setup.render.toDoThis((view, model) => {
        data = model;
        done();
      });
      res.setup.sendStatus.toDoThis(code => {
        done(new Error('Controller returned a ' + code));
      });
      controller.viewScan(req, res, done);
    });
    it('should append the scanManager scan', () => {
      should(data.scan.number).eql(1);
    });
  });

  describe('viewRepo', () => {
    it('should append the scanManager scans', done => {
      let res = deride.stub(['render']);
      res.setup.render.toDoThis((view, model) => {
        scanManager.scans(repoId, (err, scans) => {
          should(model.scans[0].id).eql(scans[0].id);
          done();
        });
      });
      controller.viewRepo(req, res);
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
        email: 'test@test.com'
      };
      controller.apiUpdateSchedule(req, res);
    });

    it('should update the tracking info', () => {
      should(data.repo.id).eql(repoId);
      should(data.schedule.freq).eql('hourly');
      should(data.schedule.when).eql('always');
      should(data.schedule.email).eql('test@test.com');
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
      should(data.scans).eql(scans);
    });

    it('should append the tracking info', () => {
      should(data.tracking.repo.id).eql(repoId);
      should(data.tracking.token).match(/[a-z0-9]{96}/);
      should(data.tracking.schedule.freq).eql('never');
    });
  });

  describe('newScan', () => {
    it('should schedule a new scan', done => {
      let res = deride.stub(['redirect']);
      res.setup.redirect.toDoThis(url => {
        should(url).match(/\/repo\/Stono\/hawkeye\/2/);
        scanManager.popPending(err => {
          should.ifError(err);
          done();
        });
      });
      controller.newScan(req, res);
    });
  });
});
