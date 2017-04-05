'use strict';
const _ = require('lodash');
const fs = require('fs');
const path = require('path');

module.exports = function ViewModelBuilder(pageName) {
  let self = {};
  let model = {};

  self.withRequest = function(req) {
    model.user = req.user.profile;
    return self;
  };

  self.build = function() {
    const result = _.cloneDeep(model);
    return result;
  };

  const vm = path.join(__dirname, `${pageName}.js`);
  if(fs.existsSync(vm)) {
    const page = new require(`./${pageName}`)();
    Object.keys(page).forEach(func => {
      let original = () => {};
      if(self[func]) {
        original = self[func].bind(self);
      }
      self[func] = function(...args) {
        original(...args);
        page[func](model, ...args);
        return self;
      };
    });
  }

  return Object.freeze(self);
};
