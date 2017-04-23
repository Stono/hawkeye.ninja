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
  util.enforceTypes([options.dal], 'object');

  const levels = {
    critical: 8,
    high: 4,
    medium: 2,
    low: 1
  };

  const addByModule = results => {
    results.items.forEach(item => {
      results.byModule[item.module] = util.defaultValue(results.byModule[item.module], 0) + 1;
    });

  };

  const addByLevel = results => {
    Object.keys(levels).forEach(level => {
      const count = results.items.filter(x => { return x.level === level; }).length;
      results.byLevel[level] = count;
    });
  };

  const enrichWithDifference = (current, previous) => {
    if(util.isEmpty(previous)) {
      current.new = {
        items: current.items,
        byLevel: current.byLevel
      };
      return current;
    }
    current.new = {
      byLevel: {},
      items: current.items.filter(item => {
        return util.isEmpty(previous.items.find(previous => { return previous.code === item.code; }));
      })
    };
    addByLevel(current.new);
    return current;
  };

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

    let result = {
      byLevel: {},
      byModule: {}
    };
    result.items = pivot.sort((a, b) => {
      return levels[a.level] - levels[b.level];
    }).reverse();
    addByLevel(result);
    addByModule(result);
    return result;
  };

  const history = repoId => {
    const namespace = `scans:metrics:${repoId}`;
    return options.dal.fifoList(namespace);
  };

  let self = {};
  self.latest = function(id, done) {
    util.enforceTypes(arguments, ['number', 'function']);
    self.tminus(id, 1, (err, data) => {
      if(err) { return done(err); }
      if(util.isEmpty(data)) { return done(null); }
      done(null, data[0]);
    });
  };

  self.tminus = function(id, amount, done) {
    util.enforceTypes(arguments, ['number', 'number', 'function']);
    history(id).fromEnd(amount, (err, data) => {
      if(err) { return done(err); }
      if(util.isEmpty(data)) { return done(null); }
      done(null, data);
    });
  };

  self.update = function(id, data, done) {
    util.enforceTypes(arguments, ['number', 'object', 'function']);
    util.enforceNotEmpty(arguments);
    let results = pivot(data);
    self.latest(id, (err, data) => {
      if(err) { return done(err); }
      results = enrichWithDifference(results, data);
      history(id).push(results, err => {
        if(!util.isEmpty(err)) { return done(err); }
        return done(null, results);
      });
    });
  };

  return Object.freeze(self);
};
