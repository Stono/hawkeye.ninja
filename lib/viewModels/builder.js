'use strict';
const _ = require('lodash');
const fs = require('fs');
const path = require('path');

module.exports = function ViewModelBuilder(pageName) {
  let self = {};
  let model = {};
  const page = fs.existsSync(path.join(__dirname, `${pageName}.js`)) ? new require(`./${pageName}`)() : undefined;
  const proxyToPage = function(f, ...args) {
    if(page) { page[f](model, ...args); }
  };
  self.withRequest = function(req) {
    model.user = req.user.profile;
    proxyToPage('withRequest', req);
    return self;
  };
  self.build = function() {
    const result = _.cloneDeep(model);
    model = {};
    return result;
  };
  return Object.freeze(self);
};
