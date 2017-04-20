'use strict';
const util = require('../util');
const rack = require('hat').rack(192);
const moment = require('moment');

module.exports = function Scan(options) {
  let self = {
    status: 'pending'
  };
  util.enforceArgs(options, ['number']);
  self.id = util.defaultValue(options.id, () => { return rack(); });
  self.number = options.number;
  self.reason = util.defaultValue(options.reason, 'unknown');
  self.timestamp = Date.now();
  self.datetime = moment().format('YYYY-MM-DD hh:mm:ss');
  return Object.freeze(self);
};
