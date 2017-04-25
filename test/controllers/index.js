'use strict';
const IndexController = require('../../lib/controllers/index');
const deride = require('deride');
const should = require('should');
const Dal = require('../../lib/dal');
const Repo = require('../../lib/models/repo');

describe('Controllers.Repo', () => {
  let controller, dal, req;
  const errHandler = done => {
    return err => {
      return done(err);
    };
  };

  beforeEach(done => {
    dal = new Dal();
    controller = new IndexController({
      dal: dal
    });
    req = {
      params: {},
      user: {
        profile: require('../samples/github/profile.json'),
        oauth: { accessToken: 'oauth here' },
        repos: require('../samples/github/repos.json').map(r => { return new Repo().fromGithub(r); })
      }
    };
    dal.flushall(done);
  });

  afterEach(done => {
    dal.flushall(done);
  });

  describe('read: logged in', () => {
    let data;
    beforeEach(done => {
      let res = deride.stub(['render']);
      res.setup.render.toDoThis((view, model) => {
        data = model;
        done();
      });
      controller.read(req, res, errHandler(done));
    });
    it('should set the page title', () => {
      should(data.page.title).eql('Dashboard');
    });
  });
  describe('read: not logged in', () => {
    let data;
    beforeEach(done => {
      let res = deride.stub(['render']);
      res.setup.render.toDoThis((view, model) => {
        data = model;
        done();
      });
      delete req.user;
      controller.read(req, res, errHandler(done));
    });
    it('should have stats', () => {
      should(data.stats.repos).eql(0);
    });
  });

});
