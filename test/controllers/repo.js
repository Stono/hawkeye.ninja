'use strict';
const RepoController = require('../../lib/controllers/repo');
const Repo = require('../../lib/models/repo');
const ScanManager = require('../../lib/scanManager');
const RepoManager = require('../../lib/managers/repo');
const deride = require('deride');
const should = require('should');
const Dal = require('../../lib/dal');

describe('Controllers.Repo', () => {
  let controller, scanManager, repoManager, dal, req;
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
        repo: 'hawkeye'
      },
      user: {
        profile: require('../samples/github/profile.json'),
        oauth: { accessToken: 'oauth here' },
        repos: require('../samples/github/repos.json').map(r => { return new Repo().fromGithub(r); })
      }
    };
    scanManager = deride.wrap(new ScanManager({
      dal: dal,
      id: 85411269
    }));

    dal.flushall(done);
  });
  afterEach(done => {
    dal.flushall(done);
  });

  describe('viewRepo', () => {
    it('should append the scanManager scans', done => {
      let res = deride.stub(['render']);
      res.setup.render.toDoThis((view, model) => {
        scanManager.scans((err, scans) => {
          should(model.scans).eql(scans);
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
        repoManager.get(85411269, (err, tracking) => {
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
      should(data.repo.id).eql(85411269);
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
        scanManager.scans((err, s) => {
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
      should(data.tracking.repo.id).eql(85411269);
      should(data.tracking.token).match(/[a-z0-9]{96}/);
      should(data.tracking.schedule.freq).eql('never');
    });
  });

  describe('newScan', () => {
    it('should schedule a new scan', done => {
      let res = deride.stub(['redirect']);
      res.setup.redirect.toDoThis(url => {
        should(url).match(/\/repo\/Stono\/hawkeye\/1/);
        scanManager.popPending(err => {
          should.ifError(err);
          done();
        });
      });
      controller.newScan(req, res);
    });
  });

});
