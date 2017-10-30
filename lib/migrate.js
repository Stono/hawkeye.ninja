'use strict';
const glob = require('glob');
const async = require('async');
const path = require('path');
const util = require('./util');
const debug = require('debug')('hawkeye:migrate');

module.exports = function Migrate(options) {
  util.enforceNotEmpty(options, ['app', 'path', 'redis']);
  let self = {};
  self.migrate = function(done) {
    debug('validate');
    options.redis.lrange(`he:migrate`, 0, -1, (err, migrationsRan) => {
      if(err) { return done(err); }
      glob(`${options.path}/*.js`, {}, (er, files) => {
        async.eachSeries(files, (file, next) => {
          const name = path.basename(file);
          if(migrationsRan.indexOf(name) > -1) {
            debug('skip', name);
            return next();
          }
          debug('execute', name);
          const instance = new require(file)();
          instance.migrate(err => {
            if(err) { return next(err); }
            debug('complete', name);
            options.redis.rpush(`he:migrate`, name, next);
          });
        }, done);
      });
    });
  };
  return Object.freeze(self);
};
