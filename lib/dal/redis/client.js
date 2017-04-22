'use strict';
const util = require('../../util');
const IORedis = require('ioredis');

module.exports = function Redis(options) {
  const config = util.defaultValue(options, {});
  config.keyPrefix = 'he:';
  return new IORedis(config);
};
