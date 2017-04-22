'use strict';
const util = require('../util');
const Redis = require('./redis/client');
const RedisDal = require('./redis/index');
const Wrapper = require('./wrapper');

module.exports = function Dal(config) {
  config = util.defaultValue(config, require('../../config').dal);
  const redis = new Redis(config.redis);
  const subscriber = new Redis(config.redis);
  const wrapper = new Wrapper(config);

  const dal = new RedisDal(redis, subscriber, wrapper);
  return Object.freeze(dal);
};
