'use strict';
const util = require('./util');
const List = require('./stores/list');

const PivotResult = function(module, level, results) {
  return results.map(result => {
    return {
      level: level,
      module: module.key,
      description: result.description,
      offender: result.offender,
      extra: result.extra || '',
      data: result.data
    };
  });
};

module.exports = function Metrics(config) {
  util.enforceArgs(config, ['redis', 'repoId']);
  const namespace = `scans:metrics:${config.repoId}`;
  const history = new List({ id: namespace, redis: config.redis });

  const pivot = results => {
    const isArray = results instanceof Array;
    if(!isArray) { return {} }

    let pivot = [];
    results.forEach(module => {
      Object.keys(module.results).forEach(level => {
        let results = module.results[level];
        pivot.push(...new PivotResult(module.module, level, results));
      });
    });

    const levels = {
      critical: 8,
      high: 4,
      medium: 2,
      low: 1
    };
    let result = {
      byLevel: {},
      byModule: {}
    };
    result.items = pivot.sort((a, b) => {
      return levels[a.level] - levels[b.level];
    }).reverse();
    Object.keys(levels).forEach(level => {
      const count = result.items.filter(x => { return x.level === level; }).length;
      result.byLevel[level] = count;
    });
    result.items.forEach(item => {
      result.byModule[item.module] = util.defaultValue(result.byModule[item.module], 0) + 1;
    });
    return result;
  };

  let self = {};
  self.latest = function(done) {
    self.tminus(1, (err, data) => {
      if(err) { return done(err); }
      if(util.isEmpty(data)) { return done(null); }
      done(null, data[0]);
    });
  };

  self.tminus = function(amount, done) {
    history.fromEnd(amount, (err, data) => {
      if(err) { return done(err); }
      if(util.isEmpty(data)) { return done(null); }
      done(null, data);
    });
  };

  self.update = function(data, done) {
    let results = pivot(data);
    history.push(results, err => {
      if(!util.isEmpty(err)) { return done(err); }
      return done(null, results);
    });
  };

  return Object.freeze(self);
};
