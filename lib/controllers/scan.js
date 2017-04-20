'use strict';
const util = require('../util');
const ScanManager = require('../scanManager');
const RepoManager = require('../repoManager');

module.exports = function Repo(options) {
  util.enforceArgs(options, ['dal']);
  let self = {};

  self.handleResult = function(req, res) {
    const token = req.params.token;
    const payload = req.body;

    const repoManager = new RepoManager({
      dal: options.dal
    });
    repoManager.getByToken(token, (err, tracked) => {
      if(err) { throw err }
      const scanManager = new ScanManager({
        dal: options.dal,
        id: tracked.repo.id
      });
      scanManager.handleResult(payload, err => {
        if(util.isEmpty(err)) { return res.send(201); }
        res.send(400);
      });
    });
  };

  self.handleScan = function(req, res) {
    const number = req.params.number;
    const token = req.params.token;
    const payload = req.body;

    const repoManager = new RepoManager({
      dal: options.dal
    });
    repoManager.getByToken(token, (err, tracked) => {
      if(err) { throw err }
      const scanManager = new ScanManager({
        dal: options.dal,
        id: tracked.repo.id
      });
      scanManager.handleScan(number, payload, err => {
        if(util.isEmpty(err)) { return res.send(201); }
        res.send(400);
      });
    });
  };

  return Object.freeze(self);
};
