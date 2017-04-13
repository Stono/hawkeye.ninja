'use strict';
const RepoController = require('../../lib/controllers/repo');
const Repo = require('../../lib/models/repo');
const ScanManager = require('../../lib/scanManager');
const deride = require('deride');
const should = require('should');
const Redis = require('../../lib/redis');

describe('Controllers.Repo', () => {
  let repo, scanManager, redis;
  before(done => {
    redis = new Redis();
    redis.once('ready', done);
  });

  beforeEach(done => {
    scanManager = deride.wrap(new ScanManager({ redis: redis, id: 85411269 }));
    repo = new RepoController({
      redis: redis
    });
    redis.flushall(done);
  });
  afterEach(done => {
    redis.flushall(done);
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
