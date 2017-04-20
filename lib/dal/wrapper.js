'use strict';
const util = require('../util');
const StringifyMiddleware = require('./middleware/stringify');
const CryptoMiddleware = require('./middleware/crypto');
const GzipMiddleware = require('./middleware/gzip');
const BufferToStringMiddleware = require('./middleware/bufferToString');

module.exports = function Wrapper(config) {
  const wrappers = [];
  let self = {};
  self.applyWrappers = function(type, value) {
    const toApply = (type === 'write') ? wrappers : wrappers.slice(0).reverse();
    toApply.forEach(wrapper => {
      value = wrapper[type](value);
    });
    return value;
  };
  self.parseResponse = function(data) {
    return self.applyWrappers('read', data);
  };
  self.handleResponse = function(done) {
    return function responseHandler(err, data) {
      if(err) { return done(err); }
      if(util.isEmpty(data)) { return done(null, data); }
      const returnValue = self.parseResponse(data);
      done(null, returnValue);
    };
  };
  self.handleWrite = function(value) {
    return self.applyWrappers('write', value);
  };
  self.use = function(delegate) {
    wrappers.push(delegate);
  };
  self.use(new StringifyMiddleware());
  if(!util.isEmpty(config.encryptionKey)) {
    self.use(new CryptoMiddleware(config.encryptionKey));
  }
  if(config.gzip) {
    self.use(new GzipMiddleware());
  } else {
    self.use(new BufferToStringMiddleware());
  }
  return Object.freeze(self);
};
