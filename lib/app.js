'use strict';
const util = require('./util');
const ScanManager = require('./scanManager');
require('colors');

module.exports = function App() {
  const port = 5000;
  const callbackUrl = util.defaultValue(process.env.GITHUB_CALLBACK_URL, `http://127.0.0.1:${port}`);
  const scanManager = new ScanManager();

  const validateEnv = key => {
    if(!process.env[key]) {
      console.error('Error'.red + ' ' + key + ' is a required environment variable!');
      console.log('Please set it and try again');
      process.exit(1);
    }
    return process.env[key];
  };
  const passport = new require('./passport')({
    clientid: validateEnv('GITHUB_CLIENTID'),
    secret: validateEnv('GITHUB_SECRET'),
    callbackUrl: `${callbackUrl}/oauth/github/callback`
  });
  const server = new require('./server')({
    passport: passport,
    scanManager: scanManager,
    port: port
  });
  return server;
};
