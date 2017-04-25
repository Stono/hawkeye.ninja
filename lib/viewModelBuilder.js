'use strict';
const _ = require('lodash');
const GlobalStats = require('./managers/globalStats');
const RepoManager = require('./managers/repo');
const ScanManager = require('./managers/scan');
const MetricsManager = require('./managers/metrics');
const async = require('async');
const util = require('./util');
const debug = require('debug')('hawkeye:vmb');

const ViewModelBuilder = function(options) {
  util.enforceArgs(options, ['dal', 'req'], true);
  const globalStats = new GlobalStats({ dal: options.dal });
  const scanManager = new ScanManager({ dal: options.dal });
  const repoManager = new RepoManager({ dal: options.dal });
  const metricsManager = new MetricsManager({ dal: options.dal });
  const req = options.req;

  let model = {
    page: {
      version: require('../package.json').version
    }
  };
  const queued = [];
  const called = [];

  const addToQueue = (name, dependencies, handler) => {
    const wrapHandler = function(next) {
      if(called.indexOf(name) > -1) { return next(); }
      dependencies.forEach(dep => {
        if(called.indexOf(dep) === -1) {
          return next(new Error('Missing Dependency: ' + dep + ' when calling: ' + name));
        }
      });
      debug(name, 'calling');
      called.push(name);
      handler(next);
    };
    const wrapped = wrapHandler;
    queued.push(wrapped);
  };
  let self = {};

  self.withUser = function() {
    addToQueue('withUser', [], next => {
      if(util.isEmpty(req.user)) {
        return next(new Error('No user found in request'));
      }
      model.user = req.user.profile;
      model.oauth = req.user.oauth;
      next();
    });
    return self;
  };

  self.withRepo = function() {
    addToQueue('withRepo', ['withUser'], next => {
      const fullName = `${req.params.org}/${req.params.repo}`.toLowerCase();
      const repo = req.user.repos.find(repo => {
        return repo.fullName.toLowerCase() === fullName;
      });
      model.repo = repo;
      next();
    });
    return self;
  };

  self.withRepoList = function() {
    addToQueue('withRepoList', ['withUser'], next => {
      model.repos = req.user.repos;
      next();
    });
    return self;
  };

  self.loadScans = function() {
    addToQueue('loadScans', ['withRepo'], next => {
      scanManager.scans(model.repo.id, (err, data) => {
        if(err) { return next(err); }
        const mapped = data.map(s => {
          /* jshint maxcomplexity: 6 */
          s.label = 'label-default';
          if(s.status === 'fail' || s.status === 'failed') { s.label = 'label-danger'; }
          if(s.status === 'pass' || s.status === 'success') { s.label = 'label-success'; }
          return s;
        });
        model.scans = mapped;
        next();
      });
    });
    return self;
  };

  self.withMenu = function() {
    addToQueue('withMenu', ['withRepoList'], next => {
      let navItems = [];

      let breadCrumbs = [{
        url: '/',
        text: 'Dashboard'
      }];
      let owners = model.repos.map(repo => {
        return repo.owner;
      });
      owners.filter((item, pos) => {
        return owners.indexOf(item) === pos;
      }).forEach(org => {
        const parent = {
          name: org,
          url: '#',
          icon: 'fa-github-alt'
        };
        if(req.params.org === parent.name) {
          parent.active = true;
          breadCrumbs.push({ url: '/repo/' + parent.name, text: parent.name });
        }

        parent.repos = model.repos.filter(repo => {
          return repo.owner === org;
        }).map(repo => {
          repo = _.cloneDeep(repo);
          repo.active = false;
          repo.icon = 'fa-git';
          if(req.params.repo === repo.name && req.params.org === repo.owner) {
            repo.active = true;
            breadCrumbs.push({ url: '/repo/' + repo.fullName, text: repo.name });
          }
          return repo;
        });
        navItems.push(parent);
      });

      navItems.forEach(item => {
        if(item.url === req.path) {
          breadCrumbs.push({ url: item.url, text: item.name });
          item.active = true;
        }
      });
      breadCrumbs[breadCrumbs.length-1].active = true;
      model.breadCrumbs = breadCrumbs;
      model.navItems = navItems;
      next();
    });
    return self;
  };

  self.withStats = function() {
    addToQueue('withStats', [], next => {
      globalStats.all((err, data) => {
        model.stats = data;
        model.stats.issues = model.stats.issues.toString().split('');
        next(err);
      });
    });
    return self;
  };

  self.loadMetrics = function() {
    addToQueue('loadMetrics', ['withRepo'], next => {
      metricsManager.latest(model.repo.id, (err, data) => {
        model.metrics = data;
        next(err);
      });
    });
    return self;
  };

  self.loadRepoTracking = function() {
    addToQueue('loadRepoTracking', ['withRepo'], next => {
      repoManager.track(model.repo, (err, data) => {
        model.tracking = data;
        next(err);
      });
    });
    return self;
  };

  self.withScan = function() {
    addToQueue('withScan', ['loadScans'], next => {
      model.scan = model.scans.find(scan => {
        return scan.number === parseInt(req.params.scanNumber);
      });
      next();
    });
    return self;
  };

  self.withTitle = function(title, subTitle) {
    addToQueue('withTitle', [], next => {
      if(typeof title === 'function') {
        title(model, (title, subTitle) => {
          model.page.title = title;
          model.page.subTitle = subTitle;
          next();
        });
      } else {
        model.page.title = title;
        model.page.subTitle = subTitle;
        next();
      }
    });
    return self;
  };

  self.build = function(done) {
    async.series(queued, err => {
      return done(err, model);
    });
  };

  return Object.freeze(self);
};

module.exports = function(options) {
  util.enforceArgs(options, ['dal'], true);
  return function(req) {
    util.enforceNotEmpty(req, 'You must pass the request object');
    return new ViewModelBuilder({
      dal: options.dal,
      req: req
    });
  };
};
