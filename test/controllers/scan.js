'use strict';
const ScanController = require('../../lib/controllers/scan');
const ScanManager = require('../../lib/scanManager');
const RepoManager = require('../../lib/repoManager');
const deride = require('deride');
const should = require('should');
const Dal = require('../../lib/dal');
const path = require('path');
const fs = require('fs');
const async = require('async');

describe('Controllers.Scan', () => {
  let controller, dal, req, repoManager, scanManager, result, repo;
  beforeEach(done => {
    dal = new Dal();
    result = JSON.parse(fs.readFileSync(path.join(__dirname, '../samples/hawkeye/results.json')));
    controller = new ScanController({
      dal: dal
    });
    repoManager = new RepoManager({
      dal: dal
    });
    repo = {
      id: 123,
      name: 'test',
      private: false,
      description: 'test',
      owner: 'org',
      fullName: 'org/test'
    };

    scanManager = deride.wrap(new ScanManager({
      dal: dal,
      id: repo.id
    }));

    const setreq = (tracked, next) => {
      req = {
        params: {
          token: tracked.token
        },
        body: {
          metadata: { state: 'failed' },
          results: result
        }
      };
      next();

    };
    const trackRepo = (result, next) => {
      repoManager.track(repo, next);
    };
    const flush = next => {
      dal.flushall(next);
    };
    async.waterfall([
      flush,
      trackRepo,
      setreq
    ], done);
  });
  afterEach(done => {
    dal.flushall(done);
  });

  describe('handleResult', () => {
    it('should pass the result to the scanManager', done => {
      let res = deride.stub(['sendStatus']);

      res.setup.sendStatus.toDoThis(() => {
        scanManager.get(1, (err, data) => {
          should(data.status).eql('failed');
          done();
        });
      });
      controller.handleResult(req, res);
    });
  });

  describe('handleScan', () => {
    it('should pass the result to the scanManager', done => {
      let res = deride.stub(['sendStatus']);

      res.setup.sendStatus.toDoThis(() => {
        scanManager.get(1, (err, data) => {
          should(data.status).eql('failed');
          done();
        });
      });

      const schedule = {
        repo: repo,
        oauth: { accessToken: 'test' },
        token: 'token'
      };
      scanManager.schedule(schedule, (err, data) => {
        req.params.number = data.number;
        controller.handleScan(req, res);
      });
    });
  });


});
