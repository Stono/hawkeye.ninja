'use strict';
const OneShot = require('./lib/oneshot');

const repo = process.argv[2];
const url = process.argv[3];
const oneshot = new OneShot({
  repo: repo,
  url: url
});
oneshot.scan((err, result) => {
  process.exit(result.code);
});
