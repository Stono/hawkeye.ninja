'use strict';
const zlib = require('zlib');
module.exports = function CryptoMiddleware() {
  let self = {};
  self.name = 'gzip';
  self.read = function(value) {
    return zlib.gunzipSync(value).toString();
  };
  self.write = function(value) {
    return zlib.gzipSync(value);
  };
  return Object.freeze(self);
};
