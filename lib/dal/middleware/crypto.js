'use strict';
const Crypto = require('node-crypt');
module.exports = function CryptoMiddleware(key) {
  const crypto = new Crypto({
    key: key,
    algorithm: 'aes-256-ctr'
  });
  let self = {};
  self.name = 'crypto';
  self.read = function(value) {
    if(typeof value === 'string' && value.startsWith('crypto:')) {
      return crypto.decrypt(value.replace('crypto:', ''));
    }
    return value;
  };
  self.write = function(value) {
    return 'crypto:' + crypto.encrypt(value);
  };
  return Object.freeze(self);
};
