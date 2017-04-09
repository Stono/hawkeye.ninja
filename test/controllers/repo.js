'use strict';
const RepoController = require('../../lib/controllers/repo');
const Repo = require('../../lib/models/repo');
const ScanManager = require('../../lib/scanManager');
const deride = require('deride');
const should = require('should');
const Redis = require('../../lib/redis');

describe('Controllers.Repo', () => {
  let repo, scanManager;
  beforeEach(done => {
    let redis = new Redis();
    redis.once('ready', () => {
      scanManager = deride.wrap(new ScanManager({ redis: redis }));
      repo = new RepoController({
        scanManager: scanManager
      });
      redis.flushall(done);
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
      res.setup.render.toDoThis((view, model) => {
        scanManager.scans(85411269, (err, scans) => {
          scanManager.expect.scans.called.withArg(85411269);
          should(model.scans).eql(scans);
          done();
        });
      });
      repo.viewRepo(req, res);
    });
  });
});
