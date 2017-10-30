'use strict';
const Crypto = require('node-crypt');
const util = require('../../util');
module.exports = function CryptoMiddleware(key, hmac) {
  util.isEmpty(key, 'You need to specify the encryption key');
  util.isEmpty(hmac, 'You need to specify the encryption hmac');
  const crypto = new Crypto({
    key: key,
    hmacKey: hmac
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
