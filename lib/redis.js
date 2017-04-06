'use strict';
const util = require('./util');
require('colors');

module.exports = function Redis(config) {
  util.enforceArgs(config, ['host', 'port', 'password']);
  if(util.isEmpty(config.encryptionKey)) {
    console.warn('Warning'.yellow + ' Using unencrpyted Redis');
    return new require('ioredis')(config);
  }
  return new require('ioredis-encrypted')(config.encryptionKey)(config);
};
