'use strict';
const OneShot = require('../lib/oneshot');
const deride = require('deride');
const should = require('should');
describe('OneShot', () => {
  let oneshot, exec;
  beforeEach(() => {
    exec = deride.stub(['command']);
    oneshot = new OneShot({
      repo: 'https://github.com/some/repo',
      url: 'http://post.to',
      exec: exec
    });
  });

  it('should clone the repo', done => {
    exec.setup.command.toDoThis((command, options, next) => {
      should(command).match(/git clone https:\/\/github.com\/some\/repo --depth=1 \/tmp\/repo-/);
      done();

      next(null, {
        code: 0
      });
    });
    oneshot.scan(done);
  });

  it('should execute the scan', done => {
    exec.setup.command.toDoThis((command, options, next) => {

      exec.setup.command.toDoThis((command, options, next) => {
        should(command).match(/hawkeye scan -t \/tmp\/repo-.* -h http:\/\/post\.to/);
        next(null, {
          code: 0
        });
      });

      next(null, {
        code: 0
      });
    });
    oneshot.scan(done);
  });
});
