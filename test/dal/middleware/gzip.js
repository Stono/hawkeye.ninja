'use strict';
const GzipMiddleware = require('../../../lib/dal/middleware/gzip');
const should = require('should');

describe('DAL Middleware: GZip', () => {
  let gzip;
  beforeEach(() => {
    gzip = new GzipMiddleware();
  });
  it('should gzip things being written', () => {
    const test = 'this is some text';
    const output = gzip.write(test);
    should(output instanceof Buffer);
  });
  it('should gunzip things being read', () => {
    const test = 'this is some text';
    const zipped = gzip.write(test);
    const output = gzip.read(zipped);
    should(output).eql(test);
  });
});
