'use strict';
const RepoController = require('../../lib/controllers/repo');
const Repo = require('../../lib/models/repo');
const ScanManager = require('../../lib/scanManager');
const deride = require('deride');
const should = require('should');
const Dal = require('../../lib/dal');

describe('Controllers.Repo', () => {
  let repo, scanManager, dal;
  beforeEach(done => {
    dal = new Dal();
    scanManager = deride.wrap(new ScanManager({
      dal: dal,
      id: 85411269
    }));
    repo = new RepoController({
      dal: dal
    });
    dal.flushall(done);
  });
  afterEach(done => {
    dal.flushall(done);
  });

  describe('viewRepo', () => {
    it('should append the scanManager scans', done => {
      let req = {
        params: {
          org: 'stono',
          repo: 'hawkeye'
        },
        user: {
          profile: 'profile info here',
          oauth: 'oauth here',
          repos: require('../samples/github/repos.json').map(r => { return new Repo().fromGithub(r); })
        }
      };
      let res = deride.stub(['render']);
      res.setup.render.toDoThis((view, model) => {
        scanManager.scans((err, scans) => {
          scanManager.expect.scans.called.once();
          should(model.scans).eql(scans);
          done();
        });
      });
      repo.viewRepo(req, res);
    });
  });
});
