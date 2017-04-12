'use strict';
require('colors');
const util = require('../lib/util');
const fs = require('fs');
const path = require('path');
const _ = require('lodash');

const validateEnv = (key) => {
  if(!process.env[key]) {
      console.error('Warning'.yellow + ' ' + key + ' should really be set!');
      return null;
  }
  return process.env[key];
};

const callbackUrl = port => {
  const localUrl = 'http://127.0.0.1:' + port;
  return util.defaultValue(process.env.HE_GITHUB_CALLBACK_URL, localUrl);
};

let config = {
  github: {},
  redis: {
    host: 'localhost',
    port: 6379
  }
};

config.redis.password = validateEnv('HE_REDIS_PASSWORD');
config.redis.encryptionKey = validateEnv('HE_REDIS_ENCRYPTION_KEY', true);
config.github.clientid = validateEnv('HE_GITHUB_CLIENTID');
config.github.clientsecret = validateEnv('HE_GITHUB_SECRET');
config.sessionSecret = validateEnv('HE_SESSION_SECRET');

config.port = 5000;
config.github.callbackUrl = `${callbackUrl(config.port)}/oauth/github/callback`;
const envConfigFile = `./${process.env.NODE_ENV}.js`;
if(process.env.NODE_ENV && fs.existsSync(path.join(__dirname, envConfigFile))) {
  const envConfig = require(envConfigFile);
  config = _.merge(config, envConfig);
} else {
  console.warn('Warning'.yellow + ' no environmental configuration found for environment: ' + process.env.NODE_ENV);
}
module.exports = config;
