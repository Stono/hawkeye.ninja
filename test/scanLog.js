'use strict';
const config = require('../config');
const ScanLog = require('../lib/scanLog');
const should = require('should');
const List = require('../lib/list');
const Redis = require('../lib/redis');

describe('Scan Log', () => {
  let log, list, redis;
  beforeEach(done => {
    redis = new Redis(config.redis);
    redis.on('ready', () => {
      log = new ScanLog({ id: 'test', redis: redis });
      list = new List({ id: 'scans:pending', redis: redis });
      done();
    });
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
  });
});
