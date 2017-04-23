'use strict';
const Dal = require('../../lib/dal');
const EmailManager = require('../../lib/managers/email');
const should = require('should');

describe('Email', () => {
  let manager, dal, sample;
  beforeEach(done => {
    dal = new Dal();
    sample = {
      to: 'me@karlstoney.com',
      from: 'Hawkeye <noreply@hawkeye.website>',
      subject: 'test subject',
      html: 'test body'
    };
    manager = new EmailManager({ dal: dal });
    dal.flushall(done);
  });
  it('should queue emails', done => {
    const checkQueued = () => {
      manager.pop((err, msg) => {
        should(msg).eql(sample);
        done();
      });
    };
    manager.queue(sample, checkQueued);
  });
  it.skip('should send emails', done => {
    manager.send(sample, done);
  });
});
