'use strict';
module.exports = function BufferToStringMiddleware() {
  let self = {};
  self.name = 'bufferToString';
  self.read = function(value) {
    return value.toString();
  };
  self.write = function(value) {
    return Buffer.from(value, 'utf8');
  };
  return Object.freeze(self);
};
