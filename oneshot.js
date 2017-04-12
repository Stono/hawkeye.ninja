'use strict';
const OneShot = require('./lib/oneshot');

const repo = process.argv[2];
const workerId = process.argv[3];
const scanId = process.argv[4];
const oneshot = new OneShot({
  repo: repo,
  workerId: workerId,
  scanId: scanId
});

oneshot.scan((err, result) => {
  process.exit(result.code);
});
