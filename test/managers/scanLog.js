'use strict';
const ScanLog = require('../../lib/managers/scanLog');
const Dal = require('../../lib/dal');
const should = require('should');

describe('Scan Log', () => {
  let log, dal;
  const repoId = 'repo';
  const number = 'test';
  before(() => {
    dal = new Dal();
  });
  beforeEach(done => {
    log = new ScanLog({ dal: dal });
    dal.flushall(done);
  });
  afterEach(done => {
    log.stop(() => {
      dal.flushall(done);
    });
  });

  it('should publish log messages', done => {
    const logMessage = 'testing';
    log.subscribe(repoId, number, msg => {
      should(msg).eql(logMessage);
      done();
    }, err => {
      should.ifError(err);
      log.write(repoId, number, logMessage);
    });
  });
  it('stop should stop the subscriber', done => {
    const logMessage = 'testing';
    log.subscribe(repoId, number, () => {
      done(new Error('should not have hit this'));
    }, err => {
      log.stop(() => {
        should.ifError(err);
        log.write(repoId, number, logMessage, done);
      });
    });
  });
  it('should log messages to the list', () => {
    log.write('test');
  });
  it('should let me return all log messages', done => {
    log.write(repoId, number, 'test1');
    log.write(repoId, number, 'test2');
    log.all(repoId, number, (err, messages) => {
      should.ifError(err);
      should(messages).eql(['test1', 'test2']);
      done();
    });
  });
  it('handle objects', done => {
    const item1 = { id: 'rwar' };
    log.subscribe(repoId, number, msg => {
      should(msg).eql(item1);
      log.all(repoId, number, (err, messages) => {
        should.ifError(err);
        should(messages).eql([item1]);
        done();
      });
    }, err => {
      should.ifError(err);
      log.write(repoId, number, item1);
    });
  });
});
