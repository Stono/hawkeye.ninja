'use strict';
const deride = require('deride');

module.exports = function  MockGithubApi() {
  const repoData = require('./samples/github/repos.json');
  const createHook = require('./samples/github/createHook.json');
  const getHooks = require('./samples/github/getHooks.json');
  const deleteHook = require('./samples/github/deleteHook.json');

  const repos = deride.stub(['getAll', 'getHooks', 'createHook', 'deleteHook']);
  let self = deride.stub(['authenticate'], [{
    name: 'repos', options: { value: repos, enumerable: true}
  }]);
  repos.setup.getAll.toCallbackWith([null, { data: repoData }]);
  repos.setup.getHooks.toCallbackWith([null, { data: getHooks }]);
  repos.setup.createHook.toCallbackWith([null, { data: createHook }]);
  repos.setup.deleteHook.toCallbackWith([null, { data: deleteHook }]);
  return self;
};

