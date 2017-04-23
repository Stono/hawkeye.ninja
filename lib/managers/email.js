'use strict';
const util = require('../util');
const debug = require('debug')('hawkeye:email');
const config = require('../../config');
const mailgun = require('mailgun-js')(config.mailgun);

module.exports = function Email(options) {
  util.enforceArgs(options, ['dal'], true);
  const email = new options.dal.fifoList('emails:pending');
  let self = {};
  self.queue = function(msg, done) {
    util.enforceArgs(msg, ['to', 'from', 'subject', 'html'], true);
    email.push(msg, done);
  };
  self.pop = function(done) {
    email.pop(done);
  };
  self.send = function(msg, done) {
    util.enforceArgs(msg, ['to', 'from', 'subject', 'html'], true);
    mailgun.messages().send(msg, err => {
      done(err);
    });
  };
  const sendNext = () => {
    self.pop((err, msg) => {
      if(util.isEmpty(msg)) { return; }
      self.send(msg, err => {
        if(err) {
          return debug('failed to send email to: ' + msg.to, err);
        }
        debug('email sent to: ' + msg.to);
      });
    });
  };

  let timer;
  self.start = function(interval) {
    timer = setInterval(sendNext, util.defaultValue(interval, 2000));
  };
  self.stop = function() {
    clearInterval(timer);
  };
  return Object.freeze(self);
};
