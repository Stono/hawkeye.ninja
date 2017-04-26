'use strict';
const async = require('async');

const util = require('../util');
const ScanManager = require('../managers/scan');
const ViewModelBuilder = require('../viewModelBuilder');

module.exports = function Scan(options) {
  util.enforceArgs(options, ['dal'], true);
  let self = {};
  const scanManager = new ScanManager({
    dal: options.dal
  });
  const builder = new ViewModelBuilder({
    dal: options.dal
  });

  self.handleGithubHook = function(req, res, next) {
    const schedule = (model, next) => {
      const schedule = {
        oauth: model.oauth,
        repo: model.tracking.repo,
        token: model.tracking.token,
        reason: 'GitHub Webhook'
      };
      scanManager.schedule(schedule, next);
    };

    const viewModel = builder(req)
    .loadTracking()
    .loadUserFromTracking();

    async.waterfall([
      viewModel.build,
      schedule
    ], err => {
      if(err) { return next(err); }
      return res.sendStatus(204);
    });
  };

  self.handleResult = function(req, res, next) {
    const payload = req.body;

    const validateReason = next => {
      payload.metadata.reason = util.defaultValue(req.query.reason, 'Unknown');
      if(util.isEmpty(payload.metadata.reason.match(/^[a-z0-9\ ]+$/i))) {
        return next(new Error('Invalid reason'));
      }
      next();
    };

    const viewModel = builder(req)
    .loadTracking();

    const handleResult = (model, next) => {
      scanManager.handleResult(model.tracking.repo.id, payload, next);
    };

    async.waterfall([
      validateReason,
      viewModel.build,
      handleResult
    ], err => {
      if(err) { return next(err); }
      return res.sendStatus(204);
    });
  };

  self.handleScan = function(req, res, next) {
    const number = parseInt(req.params.number);
    const payload = req.body;

    const viewModel = builder(req)
    .loadTracking();

    const handleResult = (model, next) => {
      scanManager.handleScan(model.tracking.repo.id, number, payload, next);
    };

    async.waterfall([
      viewModel.build,
      handleResult
    ], err => {
      if(err) { return next(err); }
      return res.sendStatus(204);
    });
  };

  return Object.freeze(self);
};
