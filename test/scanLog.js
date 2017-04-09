'use strict';
const config = require('../config');
const ScanLog = require('../lib/scanLog');
const should = require('should');
const deride = require('deride');

describe('Scan Log', () => {
  let log, list;
  beforeEach(() => {
    list = deride.stub(['push']);
    log = new ScanLog({ id: 'test', list: list, redis: config.redis });
  });
  afterEach(() => {
    log.stop();
  });
  it('should publish log messages to redis', done => {
    const logMessage = 'testing';
    log.subscribe(msg => {
      should(msg).eql(logMessage);
      done();
    }, err => {
      should.ifError(err);
      log.write(logMessage);
    });
  });
  it('should log messages to the list', () => {
    log.write('test');
    list.expect.push.called.once();
  });
});
