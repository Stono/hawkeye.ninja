'use strict';
const Scan = require('../models/scan');
const RepoManager = require('../managers/repo');
const util = require('../util');
const Metrics = require('./metrics');
const GlobalStats = require('./globalStats');
const debug = require('debug')('hawkeye:scanManager');
const async = require('async');
const pug = require('pug');
const path = require('path');
const MailManager = require('../managers/email');
const ScanLogManager = require('./scanLog');

module.exports = function ScanManager(options) {
  util.enforceArgs(options, ['dal'], true);
  let self = {};
  const pending = options.dal.fifoList('scans:pending');
  const stats = new GlobalStats({ dal: options.dal });
  const metrics = new Metrics({ dal: options.dal });
  const emailManager = new MailManager({ dal: options.dal });
  const repoManager = new RepoManager({ dal: options.dal });
  const scanLogManager = new ScanLogManager({ dal: options.dal });
  const maxScans = 50;

  const map = data => {
    return Object.keys(data).map(m => { return data[m] });
  };

  const store = repoId => {
    return options.dal.collection('scans:' + repoId);
  };

  const incrementScans = (repoId, reason, done) => {
    return self.scans(repoId, (err, data) => {
      const number = data.length + 1;
      if(number === 1) {
        stats.repos(1, () => {
          debug('incremented repo stat by 1');
        });
      }
      debug(repoId, 'scheduling new scan', number);
      const scan = new Scan({
        number: number,
        reason: reason
      });
      if(scan.number > maxScans) {
        const toDel = number - maxScans;
        self.del(repoId, toDel, () => {
          debug('Pruned scan', toDel);
        });
      }
      store(repoId).set(scan.number, scan, err => {
        if(err) { return done(err); }
        done(null, scan);
      });
    });
  };

  const update = function(repoId, number, metadata, output, done) {
    debug('Updating repo: ' + repoId + ', scan number: ' + number);
    util.enforceTypes(arguments, ['number', 'number', 'object', 'object', 'function']);
    util.enforceArgs(metadata, ['state']);
    let scanMetrics;

    const generateMetrics = next => {
      metrics.generate(repoId, output, next);
    };

    const updateStats = (metrics, next) => {
      scanMetrics = metrics;
      const issues = (!util.isEmpty(metrics.new.items)) ? metrics.new.items.length : 0;
      stats.scans(1, () => {});
      stats.issues(issues, () => {});
      next();
    };

    const getScan = next => {
      self.get(repoId, number, next);
    };

    const updateScan = (data, next) => {
      if(util.isEmpty(data)) { return done(); }
      data.status = metadata.state;
      data.metrics = {
        byLevel: scanMetrics.byLevel,
        byModule: scanMetrics.byModule,
        new: {
          byLevel: scanMetrics.new.byLevel
        }
      };
      store(repoId).set(number, data, next);
    };

    const lookupTracking = next => {
      repoManager.get(repoId, next);
    };

    const queueEmail = (tracking, next) => {
      if(util.isEmpty(tracking)) { return next(); }
      if(tracking.schedule.when === 'change' && scanMetrics.new.items.length > 0) {
        const data = {
          issues: scanMetrics.new.items,
          repo: tracking.repo
        };
        const mail = {
          subject: '[Hawkeye] New issues detected in: ' + tracking.repo.fullName,
          to: tracking.schedule.email,
          from: 'noreply@hawkeye.website',
          html: pug.renderFile(path.join(__dirname, '../../emails/newIssues.pug'), data)
        };
        return emailManager.queue(mail, next);
      }
      next();
    };

    async.waterfall([
      generateMetrics,
      updateStats,
      getScan,
      updateScan,
      lookupTracking,
      queueEmail
    ], done);
  };

  self.del = function(repoId, number, done) {
    const delScan = next => {
      store(repoId).del(number, next);
    };
    const delScanLog = next => {
      scanLogManager.del(repoId, number, next);
    };
    async.series([
      delScan,
      delScanLog
    ], done);
  };

  self.pushPending = function(scan, repo, oauth, token, done) {
    const model = {
      scan: scan,
      repo: repo,
      oauth: oauth,
      token: token
    };
    pending.push(model, err => {
      return done(err, scan);
    });
  };

  self.popPending = function(done) {
    pending.pop(done);
  };

  self.scans = function(repoId, done) {
    util.enforceTypes(arguments, ['number', 'function']);
    return store(repoId).all((err, data) => {
      if(err) { return done(err); }
      if(util.isEmpty(data)) { data = []; }
      done(null, map(data));
    });
  };

  self.schedule = function(options, done) {
    util.enforceArgs(options.repo, ['id']);
    util.enforceArgs(options, ['oauth', 'repo', 'token']);
    util.enforceArgs(options.oauth, ['accessToken']);

    const pushNewPending = (scan, next) => {
      self.pushPending(scan, options.repo, options.oauth, options.token, next);
    };
    const doIncrement = next => {
      incrementScans(options.repo.id, options.reason, next);
    };
    async.waterfall([
      doIncrement,
      pushNewPending
    ], done);
  };

  self.handleResult = function(repoId, result, done) {
    util.enforceTypes(arguments, ['number', 'object', 'function']);
    util.enforceArgs(result, ['results', 'metadata']);
    incrementScans(repoId, result.metadata.reason, (err, data) => {
      if(err) { return done(err); }
      update(repoId, data.number, result.metadata, result.results, done);
    });
  };

  self.handleScan = function(repoId, number, result, done) {
    util.enforceTypes(arguments, ['number', 'number', 'object', 'function']);
    util.enforceArgs(result, ['results', 'metadata']);
    update(repoId, number, result.metadata, result.results, done);
  };

  self.get = function(repoId, number, done) {
    util.enforceTypes(arguments, ['number', 'number', 'function']);
    return store(repoId).get(number, done);
  };
  return Object.freeze(self);
};
