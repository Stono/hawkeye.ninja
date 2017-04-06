'use strict';
require('colors');
const util = require('../lib/util');
const validateEnv = key => {
  if(!process.env[key]) {
    console.error('Error'.red + ' ' + key + ' is a required environment variable!');
    console.log('Please set it and try again');
    process.exit(1);
  }
  return process.env[key];
};

const callbackUrl = port => {
  const localUrl = 'http://127.0.0.1:' + port;
  return util.defaultValue(process.env.GITHUB_CALLBACK_URL, localUrl);
};

let config = {
  github: {}
};

config.github.clientid = validateEnv('GITHUB_CLIENTID');
config.github.clientsecret = validateEnv('GITHUB_SECRET');
config.github.callbackUrl = `${callbackUrl()}/oauth/github/callback`;
config.port = 5000;
module.exports = config;
