'use strict';
const RepoController = require('../../lib/controllers/repo');
const Repo = require('../../lib/models/repo');
const ScanManager = require('../../lib/scanManager');
const deride = require('deride');
const should = require('should');
const Dal = require('../../lib/dal');

describe('Controllers.Repo', () => {
  let controller, scanManager, dal, req;
  beforeEach(done => {
    dal = new Dal();
    controller = new RepoController({
      dal: dal
    });
    req = {
      params: {
        org: 'stono',
        repo: 'hawkeye'
      },
      user: {
        profile: 'profile info here',
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
