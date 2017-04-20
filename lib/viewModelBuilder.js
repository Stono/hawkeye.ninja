'use strict';
const _ = require('lodash');
const GlobalStats = require('./globalStats');
const RepoManager = require('./repoMAnager');
const async = require('async');
const util = require('./util');

module.exports = function ViewModelScaner(options) {
  util.enforceArgs(options, ['dal']);

  let self = {
    page: {}
  };
  const queue = [];

  self.withMenu = function(req) {
    self.withRepoList(req);

    let navItems = [];

    let breadCrumbs = [{
      url: '/',
      text: 'Dashboard'
    }];
    let owners = self.repos.map(repo => {
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

      parent.repos = self.repos.filter(repo => {
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
    self.breadCrumbs = breadCrumbs;
    self.navItems = navItems;
    return self;
  };

  self.withUser = function(req) {
    self.user = req.user.profile;
    self.oauth = req.user.oauth;
    return self;
  };

  self.withRepo = function(req) {
    const fullName = `${req.params.org}/${req.params.repo}`.toLowerCase();
    const repo = req.user.repos.find(repo => {
      return repo.fullName.toLowerCase() === fullName;
    });
    self.repo = repo;
    return self;
  };

  self.withRepoList = function(req) {
    self.withUser(req);
    self.repos = req.user.repos;
    return self;
  };

  self.withStats = function() {
    const globalStats = new GlobalStats({ dal: options.dal });
    queue.push(next => {
      globalStats.all((err, data) => {
        self.stats = data;
        self.stats.issues = self.stats.issues.toString().split('');
        next(err);
      });
    });
    return self;
  };

  self.withRepoTracking = function() {
    const manager = new RepoManager({ dal: options.dal });
    queue.push(next => {
      manager.track(self.repo, (err, data) => {
        self.tracking = data;
        next(err);
      });
    });
    return self;
  };

  self.withScans = function(scans) {
    const mapped = scans.map(s => {
      s.label = 'label-default';
      if(s.status === 'failed') { s.label = 'label-danger'; }
      if(s.status === 'pass') { s.label = 'label-success'; }
      return s;
    });
    self.scans = mapped;
    return self;
  };

  self.withScan = function(req) {
    self.scan = self.scans.find(scan => {
      return scan.number === parseInt(req.params.scanNumber);
    });
    return self;
  };

  self.withTitle = function(title, subTitle) {
    self.page.title = title;
    self.page.subTitle = subTitle;
    return self;
  };

  self.build = function(done) {
    async.series(queue, err => {
      return done(err, self);
    });
  };

  return self;
};
