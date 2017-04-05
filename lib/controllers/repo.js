'use strict';
module.exports = function Repo() {
  let self = {};
  self.selectRepo = function(req, res) {
    res.render('selectRepo', req.user);
  };
  self.viewRepo = function(req, res) {
    res.render('viewRepo', req.user);
  };
  return Object.freeze(self);
};
