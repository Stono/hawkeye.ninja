'use strict';
const RepoController = require('../../lib/controllers/repo');
const Repo = require('../../lib/models/repo');
const ScanManager = require('../../lib/scanManager');
const deride = require('deride');
const should = require('should');

describe('Controllers.Repo', () => {
  let repo, scanManager;
  before(() => {
    scanManager = deride.wrap(new ScanManager());
    repo = new RepoController({
      scanManager: scanManager
    });
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
      let fullName = `${req.params.org}/${req.params.repo}`;
      res.setup.render.toDoThis((view, model) => {
        scanManager.scans(fullName, (err, scans) => {
          scanManager.expect.scans.called.withArg(fullName);
          should(model.scans).eql(scans);
          done();
        });
      });
      repo.viewRepo(req, res);
    });
  });
});