'use strict';
const util = require('../util');
const ScanManager = require('../managers/scan');
const RepoManager = require('../managers/repo');

module.exports = function Repo(options) {
  util.enforceArgs(options, ['dal']);
  let self = {};
  const scanManager = new ScanManager({
    dal: options.dal
  });

  self.handleResult = function(req, res, next) {
    const token = req.params.token;
    const payload = req.body;

    payload.metadata.reason = util.defaultValue(req.query.reason, 'Unknown');
    if(util.isEmpty(payload.metadata.reason.match(/^[a-z0-9\ ]+$/i))) {
      return res.sendStatus(400);
    }
    const repoManager = new RepoManager({
      dal: options.dal
    });
    repoManager.getByToken(token, (err, tracked) => {
      if(err) { return next(err); }
      if(util.isEmpty(tracked)) { return next(); }
      scanManager.handleResult(tracked.repo.id, payload, err => {
        if(err) { return next(err); }
        res.sendStatus(201);
      });
    });
  };

  self.handleScan = function(req, res, next) {
    const number = parseInt(req.params.number);
    const token = req.params.token;
    const payload = req.body;

    const repoManager = new RepoManager({
      dal: options.dal
    });
    repoManager.getByToken(token, (err, tracked) => {
      if(err) { return next(err); }
      if(util.isEmpty(tracked)) { return next(); }
      scanManager.handleScan(tracked.repo.id, number, payload, err => {
        if(err) { return next(err); }
        res.sendStatus(201);
      });
    });
  };

  return Object.freeze(self);
};
