'use strict';
const RepoController = require('../../lib/controllers/repo');
const Repo = require('../../lib/models/repo');
const BuildManager = require('../../lib/buildManager');
const deride = require('deride');
const should = require('should');

describe('Controllers.Repo', () => {
  let repo, buildManager;
  before(() => {
    buildManager = deride.wrap(new BuildManager());
    repo = new RepoController({
      buildManager: buildManager
    });
  });
  describe('viewRepo', () => {
    it('should append the buildManager builds', done => {
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
        buildManager.builds(fullName, (err, builds) => {
          buildManager.expect.builds.called.withArg(fullName);
          should(model.builds).eql(builds);
          done();
        });
      });
      repo.viewRepo(req, res);
    });
  });
});
