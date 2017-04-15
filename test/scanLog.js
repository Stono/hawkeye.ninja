'use strict';
const ScanLog = require('../lib/scanLog');
const should = require('should');
const Redis = require('../lib/redis');
const Dal = require('../lib/dal');
const config = require('../config');

describe('Scan Log', () => {
  let log, redis, dal;
  before(done => {
    redis = new Redis(config.redis);
    dal = new Dal({ redis: redis });
    dal.use(new dal.middleware.Crypto(config.redis.encryptionKey));
    redis.once('ready', done);
  });
  beforeEach(done => {
    log = new ScanLog({ repoId: 'repo', number: 'test', dal: dal });
    redis.flushall(done);
  });
  afterEach(done => {
    log.stop();
    redis.flushall(done);
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
  it('stop should stop the subscriber', done => {
    const logMessage = 'testing';
    log.subscribe(() => {
      done(new Error('should not have hit this'));
    }, err => {
      should.ifError(err);
      log.stop();
      log.write(logMessage, done);
    });
  });
  it('should log messages to the list', () => {
    log.write('test');
  });
  it('should let me return all log messages', done => {
    log.write('test1');
    log.write('test2');
    log.all((err, messages) => {
      should.ifError(err);
      should(messages).eql(['test1', 'test2']);
      done();
    });
  });
  it('handle objects', done => {
    const item1 = { id: 'rwar' };
    log.subscribe(msg => {
      should(msg).eql(item1);
      log.all((err, messages) => {
        should.ifError(err);
        should(messages).eql([item1]);
        done();
      });
    }, err => {
      should.ifError(err);
      log.write(item1);
    });

  });
});
