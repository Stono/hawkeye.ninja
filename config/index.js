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
  port: 5000,
  sessionSecret: validateEnv('HE_SESSION_SECRET'),
  github: {
    clientid: validateEnv('HE_GITHUB_CLIENTID'),
    clientsecret: validateEnv('HE_GITHUB_SECRET'),
    authorizationURL: 'https://github.com/login/oauth/authorize',
    tokenURL: 'https://github.com/login/oauth/access_token',
    userProfileURL: 'https://api.github.com/user',
    callbackUrl: `${callbackUrl(5000)}/oauth/github/callback`
  },
  dal: {
    encryptionKey: validateEnv('HE_DAL_ENCRYPTION_KEY', true),
    gzip: util.defaultValue(validateEnv('HE_DAL_GZIP'), false),
    redis: {
      host: 'localhost',
      port: 6379,
      password: validateEnv('HE_REDIS_PASSWORD')
    }
  }
};

const env = util.defaultValue(process.env.NODE_ENV, 'local');
const envConfigFile = `./${env}.js`;
if(env && fs.existsSync(path.join(__dirname, envConfigFile))) {
  const envConfig = require(envConfigFile);
  config = _.merge(config, envConfig);
} else {
  console.warn('Warning'.yellow + ' no environmental configuration found for environment: ' + env);
}
module.exports = config;
