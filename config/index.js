'use strict';
require('colors');
const util = require('../lib/util');
const validateEnv = (key, warnOnly) => {
  if(!process.env[key]) {
    if(warnOnly) {
      console.error('Warning'.yellow + ' ' + key + ' should really be set!');
      return null;
    } else {
      console.error('Error'.red + ' ' + key + ' is a required environment variable!');
      console.log('Please set it and try again');
      process.exit(1);
    }
  }
  return process.env[key];
};

const callbackUrl = port => {
  const localUrl = 'http://127.0.0.1:' + port;
  return util.defaultValue(process.env.GITHUB_CALLBACK_URL, localUrl);
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
config.github.callbackUrl = `${callbackUrl()}/oauth/github/callback`;
config.port = 5000;
module.exports = config;
