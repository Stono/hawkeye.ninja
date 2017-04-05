'use strict';
const util = require('../util');
const rack = require('hat').rack(192);

module.exports = function Build(options) {
  let self = {
    status: 'pending'
  };
  util.enforceArgs(options, ['number']);
  self.id = util.defaultValue(options.id, () => { return rack(); });
  self.number = options.number;
  return Object.freeze(self);
};
