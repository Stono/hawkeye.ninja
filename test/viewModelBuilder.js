'use strict';
const ViewModelBuilder = require('../lib/viewModelBuilder');
const Dal = require('../lib/dal');
const should = require('should');
const Repo = require('../lib/models/repo');
const ScanManager = require('../lib/managers/scan');

describe('ViewModels', () => {
  let model, request, dal, builder, scanManager;
  beforeEach(done => {
    dal = new Dal();
    builder = new ViewModelBuilder({ dal: dal });
    scanManager = new ScanManager({ dal: dal });

    request = {
      params: {
        org: 'stono',
        repo: 'hawkeye',
        scanNumber: 1,
        token: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa'
      },
      user: {
        profile: require('./samples/github/profile.json'),
        oauth: 'oauth here',
        repos: require('./samples/github/repos.json').map(r => { return new Repo().fromGithub(r); })
      }
    };
    dal.flushall(done);
  });
  afterEach(done => {
    dal.flushall(done);
  });
  const userInfo = () => {
    it('should have user info', () => {
      should(model.user).eql(request.user.profile);
    });
  };
  const shouldHaveKeys = (obj, keys) => {
    should(Object.keys(obj).sort()).eql(keys.sort());
  };

  describe('withTitle', () => {
    beforeEach(done => {
      builder(request)
      .withTitle('title')
      .build((err, data) => {
        should.ifError(err);
        model = data;
        done();
      });
    });
    it('should set the title', done => {
      should(model.page.title).eql('title');
      done();
    });
  });

  describe('withUser', () => {
    beforeEach(done => {
      builder(request)
      .withUser()
      .build((err, data) => {
        should.ifError(err);
        model = data;
        done();
      });
    });
    userInfo();
    it('should throw an error if no user info found in the request', done => {
      builder({}).withUser().build(err => {
        should(err.message).eql('No user found in request');
        done();
      });
    });
  });

  describe('withRepo', () => {
    beforeEach(done => {
      builder(request)
      .withUser()
      .withRepo()
      .build((err, data) => {
        should.ifError(err);
        model = data;
        done();
      });
    });
    userInfo();
    it('should have the repo', () => {
      should(model.repo.name).eql(request.params.repo);
    });
    it('should error if the repo is not found', done => {
      request.params.repo = 'unknown';
      builder(request)
      .withUser()
      .withRepo()
      .build(err => {
        should(err.message).match(/Repo not found/);
        done();
      });
    });
  });

  describe('withStats', () => {
    beforeEach(done => {
      builder(request)
      .withStats()
      .build((err, data) => {
        should.ifError(err);
        model = data;
        done();
      });
    });
    it('should have the stats', () => {
      should(model.stats.repos).eql(0);
    });
  });

  describe('withMenu', () => {
    beforeEach(done => {
      builder(request)
      .withUser()
      .withRepoList()
      .withMenu()
      .build((err, data) => {
        should.ifError(err);
        model = data;
        done();
      });
    });
    userInfo();
    it('should have nav items', () => {
      should(model.navItems[0].name).eql('Stono');
    });
    it('should have breadcrumbs', () => {
      should(model.breadCrumbs[0].text).eql('Dashboard');
    });
  });

  describe('loadRepoTracking', () => {
    beforeEach(done => {
      builder(request)
      .withUser()
      .withRepo()
      .loadRepoTracking()
      .build((err, data) => {
        should.ifError(err);
        model = data;
        done();
      });
    });
    userInfo();
    it('should have the tracking information', () => {
      should(model.tracking.repo.id).eql(85411269);
    });
  });

  describe('withRepoList', () => {
    beforeEach(done => {
      builder(request)
      .withUser()
      .withRepoList()
      .build((err, data) => {
        should.ifError(err);
        model = data;
        done();
      });
    });
    userInfo();
    it('should have the repo list', () => {
      should(model.repos).eql(request.user.repos);
    });
  });

  describe('withScan', () => {
    beforeEach(done => {
      const target = { oauth: { accessToken: 'abc' }, repo: { id: 85411269 }, token: 'abc', reason: 'test' };

      scanManager.schedule(target, err => {
        should.ifError(err);

        builder(request)
        .withUser()
        .withRepo()
        .loadScans()
        .withScan()
        .build((err, data) => {
          should.ifError(err);
          model = data;
          done();
        });
      });
    });
    userInfo();
    it('should have the specific scan information', () => {
      should(model.scan.number).eql(request.params.scanNumber);
    });
    it('should error if the scan is not found', done => {
      request.params.scanNumber = 'unknown';
      builder(request)
      .withUser()
      .withRepo()
      .loadScans()
      .withScan()
      .build(err => {
        should(err.message).match(/Scan not found/);
        done();
      });
    });
  });

  describe('loadScans', () => {
    beforeEach(done => {
      builder(request)
      .withUser()
      .withRepo()
      .loadScans()
      .build((err, result) => {
        should.ifError(err);
        model = result;
        done();
      });
    });
    it('should have the repo information', () => {
      shouldHaveKeys(model.repo, Object.keys(request.user.repos[0]));
      should(model.repo.fullName).eql('Stono/hawkeye');
    });
    it('should have the list of scans', () => {
      should(model.scans).eql([]);
    });
  });

  describe('validateToken', () => {
    it('should accept valid tokens', done => {
      builder(request)
      .validateToken()
      .build(err => {
        should(err).eql(null);
        done();
      });
    });
    it('should reject invalid tokens', done => {
      request.params.token = 'bad';
      builder(request)
      .validateToken()
      .build(err => {
        should(err.message).match(/invalid token/i);
        done();
      });
    });
  });
});
