'use strict';
const Queue = require('../lib/queue');
const Redis = require('../lib/redis');
const should = require('should');

describe('FIFO Queue', () => {
  let queue, redis;
  before(done => {
    redis = new Redis();
    redis.once('ready', () => {
      queue = new Queue('he:scan-queue:test', redis);
      done();
    });
  });
  beforeEach(done => {
    redis.del('he:scan-queue:test', done);
  });
  it('should push an item1 to the back of the queue', done => {
    const item1 = { id : 1 };
    const item2 = { id : 2 };
    const firstInQueue = (err, result) => {
      should(item1).eql(result);
      done();
    };
    queue.push(item1, err => {
      should.ifError(err);
      queue.push(item2, err => {
        should.ifError(err);
        queue.pop(firstInQueue);
      });
    });
  });
});
