'use strict';
const List = require('../lib/list');
const Redis = require('../lib/redis');
const should = require('should');

describe('FIFO List', () => {
  let list, redis;
  before(done => {
    redis = new Redis();
    redis.once('ready', () => {
      list = new List('he:scan-list:test', redis);
      done();
    });
  });
  beforeEach(done => {
    redis.del('he:scan-list:test', done);
  });
  it('should flush a list', done => {
    list.push({ id: 1 }, () => {
      list.flush(err => {
        should.ifError(err);
        list.pop((err, data) => {
          should.ifError(err);
          should(data).eql(null);
          done();
        });
      });
    });
  });
  it('should push an item1 to the back of the list', done => {
    const item1 = { id: 1 };
    const item2 = { id: 2 };
    const firstInList = (err, result) => {
      should(item1).eql(result);
      done();
    };
    list.push(item1, err => {
      should.ifError(err);
      list.push(item2, err => {
        should.ifError(err);
        list.pop(firstInList);
      });
    });
  });
});
