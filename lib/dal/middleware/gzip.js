'use strict';
const zlib = require('zlib');
module.exports = function CryptoMiddleware() {
  let self = {};
  self.name = 'gzip';
  self.read = function(value) {
    return zlib.inflateSync(value).toString();
  };
  self.write = function(value) {
    return zlib.deflateSync(value);
  };
  return Object.freeze(self);
};
