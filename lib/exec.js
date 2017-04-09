'use strict';
const spawn = require('child_process').spawn;
const spawnSync = require('child_process').spawnSync;
const util = require('./util');
const commandExists = require('command-exists').sync;
const debug = require('debug')('hawkeye:exec');
const EventEmitter = require('events');

require('colors');

const Exec = function(options) {
  options = util.defaultValue(options, {});
  const p = util.defaultValue(options.process, process);
  const self = {};

  const async = (root, args, options, done) => {
    const emitter = new EventEmitter();
    (function emitters() {
      if(options.stdout) { emitter.on('stdout', options.stdout); }
      if(options.stderr) { emitter.on('stderr', options.stderr); }
    })();

    let stdout = '';
    let stderr = '';
    const spawnOpts = {
      stdio: [
        p.stdin, 'pipe', 'pipe'
      ]
    };
    if(options.cwd) {
      spawnOpts.cwd = options.cwd;
    }
    setTimeout(() => {
      const proc = spawn(root, args, spawnOpts);
      proc.stdout.on('data', data => {
        data = data.toString();
        emitter.emit('stdout', data.slice(0, data.length - 1));
        stdout = stdout + data;
      });
      proc.stderr.on('data', data => {
        data = data.toString();
        emitter.emit('stderr', data.slice(0, data.length - 1));
        stderr = stderr + data;
      });
      proc.on('error', err => {
        if(options.exit) {
          p.exitCode = 1;
          p.exit(1);
        }
        done(err, {
          stdout: stdout.trim(),
          stderr: stderr.trim()
        }, 1);
      });
      proc.on('exit', code => {
        if(code !== 0 && options.exit) {
          p.exitCode = code;
          p.exit(code);
        }
        done(null, {
          stdout: stdout.trim(),
          stderr: stderr.trim(),
          code: code
        });
      });
    }, 10);
  };

  const sync = (root, args, options) => {
    const proc = spawnSync(root, args, options);
    return {
      stdout: proc.stdout.toString().trim(),
      stderr: proc.stderr.toString().trim()
    };
  };

  self.commandExists = commandExists;

  self.command = function(command, options, done) {
    debug(command);
    options = util.defaultValue(options, {});
    options.exit = util.defaultValue(options.exit, false);
    const args = (command instanceof Array) ? command : command.split(' ');
    const root = args.shift();
    return async(root, args, options, done);
  };

  self.commandSync = function(command, options) {
    debug(command);
    options = util.defaultValue(options, {});
    options.exit = util.defaultValue(options.exit, false);
    const args = (command instanceof Array) ? command : command.split(' ');
    const root = args.shift();
    return sync(root, args, options);
  };

  return Object.freeze(self);
};
module.exports = Exec;
