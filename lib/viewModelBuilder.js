'use strict';
const _ = require('lodash');
module.exports = function ViewModelScaner() {
  let self = {
    page: {}
  };

  self.withMenu = function(req) {
    self.withRepoList(req);

    let navItems = [];
    navItems.push({
      name: 'Dashboard',
      url: '/',
      icon: 'fa-dashboard'
    });

    let breadCrumbs = [];

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
        if(req.params.repo === repo.name) {
          repo.active = true;
          breadCrumbs.push({ url: '/repo/' + repo.name, text: repo.name });
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

  self.withScans = function(scans) {
    self.scans = scans;
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

  return self;
};
