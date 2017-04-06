'use strict';
const util = require('./util');
require('colors');

module.exports = function EncryptedRedis(options) {
  const config = util.defaultValue(options, {});
  if(util.isEmpty(config.encryptionKey)) {
    console.warn('Warning'.yellow + ' Using unencrpyted Redis');
    return new require('ioredis')(config);
  }
  return new require('ioredis-encrypted')(config.encryptionKey)(config);
};
