'use strict';
const util = require('../util');

const PivotResult = function(module, level, results) {
  return results.map(result => {
    const mapped = Object.assign({
      level: level,
      module: module.key
    }, result);
    return mapped;
  });
};

module.exports = function MetricsManager(options) {
  util.enforceArgs(options, ['dal'], true);

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

  const history = (repoId) => {
    const namespace = `scans:metrics:${repoId}`;
    return options.dal.fifoList(namespace);
  };

  let self = {};
  self.latest = function(id, done) {
    self.tminus(id, 1, (err, data) => {
      if(err) { return done(err); }
      if(util.isEmpty(data)) { return done(null); }
      done(null, data[0]);
    });
  };

  self.tminus = function(id, amount, done) {
    history(id).fromEnd(amount, (err, data) => {
      if(err) { return done(err); }
      if(util.isEmpty(data)) { return done(null); }
      done(null, data);
    });
  };

  self.update = function(id, data, done) {
    let results = pivot(data);
    history(id).push(results, err => {
      if(!util.isEmpty(err)) { return done(err); }
      return done(null, results);
    });
  };

  return Object.freeze(self);
};
