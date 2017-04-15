'use strict';
module.exports = function StringifyMiddleware() {
  let self = {};
  self.name = 'stringify';
  self.read = function(value) {
    if(typeof value === 'string' && value.startsWith('json:')) {
      return JSON.parse(value.replace('json:', ''));
    }
    return value;
  };
  self.write = function(value) {
    return 'json:' + JSON.stringify(value);
  };
  return Object.freeze(self);
};
