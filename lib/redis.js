'use strict';
const util = require('./util');

module.exports = function Redis(options) {
  const config = util.defaultValue(options, {});
  config.keyPrefix = 'he:';
  return new require('ioredis')(config);
};
