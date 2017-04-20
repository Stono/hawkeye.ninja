'use strict';
const RepoController = require('../../lib/controllers/repo');
const Repo = require('../../lib/models/repo');
const ScanManager = require('../../lib/scanManager');
const deride = require('deride');
const should = require('should');
const Dal = require('../../lib/dal');

describe('Controllers.Repo', () => {
  let repo, scanManager, dal, req;
  beforeEach(done => {
    dal = new Dal();
    repo = new RepoController({
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
      repo.viewRepo(req, res);
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
      repo.newScan(req, res);
    });
  });

});
