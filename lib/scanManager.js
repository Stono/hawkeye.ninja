'use strict';
const Scan = require('./models/scan');
const debug = require('debug')('hawkeye:scanManager');
const util = require('./util');
const JsonStore = require('./stores/jsonStore');
const List = require('./list');
const ScanLog = require('./scanLog');
module.exports = function ScanManager(options) {
  util.enforceArgs(options, ['redis']);
  let self = {};

  const store = new JsonStore('scans', options.redis);
  const pending = new List({ id: 'scans:pending', redis: options.redis });
  const isNumeric = n => {
    if(isNaN(parseFloat(n)) || !isFinite(n)) {
      throw new Error('Repo ID must be numeric');
    }
  };

  self.popPending = function(done) {
    pending.pop(done);
  };

  self.scans = function(repoId, done) {
    isNumeric(repoId);
    return store.get(repoId, (err, data) => {
      if(err) { return done(err); }
      if(util.isEmpty(data)) { data = []; }
      done(null, data);
    });
  };

  self.scanLogFor = function(repoId) {
    return new ScanLog({ id: repoId, redis: options.redis });
  };

  self.schedule = function(options, done) {
    util.enforceArgs(options, ['repo', 'oauth']);
    util.enforceArgs(options.repo, ['id']);
    const repoId = options.repo.id;

    return self.scans(repoId, (err, data) => {
      const number = data.length + 1;
      debug(repoId, 'scheduling new scan', number);
      const scan = new Scan({
        number: number
      });

      const log = self.scanLogFor(repoId);
      log.write('Scan scheduled');
      data.push(scan);
      store.set(repoId, data, err => {
        if(err) { return done(err); }
        const model = {
          scan: scan,
          repo: options.repo,
          oauth: options.oauth
        };
        pending.push(model, () => {
          return done(null, scan);
        });
      });
    });
  };

  self.get = function(repoId, number, done) {
    self.scans(repoId, (err, data) => {
      if(err) { return done(err); }
      let result = data.find(x => { return x.number === number });
      done(null, result);
    });
  };
  return Object.freeze(self);
};
