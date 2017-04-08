'use strict';
module.exports = function OAuth() {
  let self = {};
  self.callback = function(req, res) {
    res.redirect('/');
  };
  self.logout = function(req, res) {
    req.session.destroy();
    res.redirect('/');
  };
  return Object.freeze(self);
};
