'use strict';
const ScanLog = require('../lib/scanLog');
const should = require('should');
const Dal = require('../lib/dal');

describe('Scan Log', () => {
  let log, dal;
  before(() => {
    dal = new Dal();
  });
  beforeEach(done => {
    log = new ScanLog({ repoId: 'repo', number: 'test', dal: dal });
    dal.flushall(done);
  });
  afterEach(done => {
    log.stop(() => {
      dal.flushall(done);
    });
  });

  it('should publish log messages', done => {
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
      log.stop(() => {
        should.ifError(err);
        log.write(logMessage, done);
      });
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
