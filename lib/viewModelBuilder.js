'use strict';
const _ = require('lodash');

module.exports = function ViewModelScaner() {
  let self = {};
  let model = {};

  self.withMenu = function(req) {
    self.withRepoList(req);

    let navItems = [];
    navItems.push({
      name: 'Dashboard',
      url: '/',
      icon: 'fa-dashboard'
    });

    let owners = model.repos.map(repo => {
      return repo.owner;
    });
    owners.filter((item, pos) => {
      return owners.indexOf(item) === pos;
    }).forEach(org => {
      navItems.push({
        name: org,
        url: '/',
        icon: 'fa-github-alt',
        repos: model.repos.filter(repo => {
          return repo.owner === org;
        }).map(repo => {
          repo = _.cloneDeep(repo);
          repo.icon = 'fa-git';
          return repo;
        })
      });
    });
    navItems.forEach(item => {
      if(item.url === req.path) {
        item.active = true;
      }
    });
    model.navItems = navItems;
    return self;
  };

  self.withUser = function(req) {
    model.user = req.user.profile;
    return self;
  };

  self.withRepo = function(req) {
    const fullName = `${req.params.org}/${req.params.repo}`.toLowerCase();
    const repo = req.user.repos.find(repo => {
      return repo.fullName.toLowerCase() === fullName;
    });
    model.repo = repo;
    return self;
  };

  self.withRepoList = function(req) {
    self.withUser(req);
    model.repos = req.user.repos;
    return self;
  };

  self.withScans = function(scans) {
    model.scans = scans;
    return self;
  };

  self.build = function() {
    const result = _.cloneDeep(model);
    return result;
  };

  return Object.freeze(self);
};
