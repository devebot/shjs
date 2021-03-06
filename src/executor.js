'use strict';

import assert from 'assert';
import child_process from 'child_process';
import events from 'events';
import util from 'util';
import pinbug from './pinbug';
import misc from './misc';
import { default as Promise, timeoutify } from './promise';

let dbx = pinbug('shjs:executor');

let Executor = function() {
  events.EventEmitter.call(this);

  let __store = {};

  this.getStore = function(action) {
    assert.ok(misc.isFunction(action));
    return action(__store);
  }
};

util.inherits(Executor, events.EventEmitter);

Executor.prototype.addParser = function(f) {
  if (misc.isFunction(f)) {
    this.getStore(function(__store) {
      __store.parsers = __store.parsers || [];
      __store.parsers.push(f);
    });
  }
  return this;
}

Executor.prototype.removeParser = function(f) {
  this.getStore(function(__store) {
    let pos = __store.parsers.indexOf(f);
    if (pos >= 0) {
        __store.parsers = __store.parsers || [];
        __store.parsers.splice(pos, 1);
    }
  });
  return this;
}

Executor.prototype.parse = function(text) {
  if (!misc.isString(text)) return null;
  return this.getStore(function(__store) {
    __store.parsers = __store.parsers || [];
    return __store.parsers.reduce(function(accum, parser) {
      try {
        let r = parser(text, accum);
        if (misc.isObject(r) || misc.isArray(r)) {
          accum = misc._assign(accum, r);
        }
      } catch (err) {}
      return accum;
    }, {});
  });
}

Executor.prototype.exec = function(opts) {
  opts = opts || {};
  let self = this;

  dbx.enabled && dbx(' - execute command with options: %s', JSON.stringify(opts));

  // Prepare command name & args
  if (!misc.isFunction(this.getCmdName)) {
    return Promise.reject(new Error('getCmdName() must be implemented', -10));
  }
  let commandName = this.getCmdName();
  if (!misc.isString(commandName)) {
    return Promise.reject(new Error('getCmdName() must return a string', -11));
  }

  if (!misc.isFunction(this.getCmdArgs)) {
    return Promise.reject(new Error('getCmdArgs() must be implemented', -20));
  }
  let commandArgs = this.getCmdArgs();
  if (!misc.isArray(commandArgs)) {
    return Promise.reject(new Error('getCmdArgs() must return an array', -21));
  }

  // Prepare the process options
  let options = {};
  options.env = process.env;
  if (opts.cwd) options.cwd = opts.cwd;
  if (opts.shell != undefined) options.shell = opts.shell;

  // Check the timeout option
  let timeout = misc.isNumber(opts.timeout) ? opts.timeout : 0;

  // execute the command
  let p = new Promise(function(onResolved, onRejected) {
    let text = '';
    let child = child_process.spawn(commandName, commandArgs, options);

    child.stdout.on('data', function(chunk) {
      text += chunk.toString();
      self.emit('stdout', chunk);
    });

    child.stderr.on('data', function(chunk) {
      text += chunk.toString();
      self.emit('stderr', chunk);
    });

    child.on('close', function(code) {
      self.emit('close', code);
      onResolved({code: code, text: text, data: self.parse(text)});
    });

    child.on('exit', function(code) {
      self.emit('exit', code);
      if (code === 0) return;
      onRejected(new Error(text, code));
    });
  });

  dbx.enabled && dbx(' - return the promise object');
  if (timeout > 0) return timeoutify(p, timeout);
  return p;
}

Executor.extend = function(kwargs) {
  dbx.enabled && dbx(' - extend(%s)', JSON.stringify(kwargs));
  let Impl = function() {
    Executor.call(this);

    this.getCmdName = function() {
      return kwargs.name;
    }

    this.getCmdArgs = function() {
      return kwargs.args;
    }
  }
  util.inherits(Impl, Executor);
  return Impl;
}

Executor.run = function(_name, _args, _opts) {
  dbx.enabled && dbx(' - run(%s, %s, %s)', _name,
    JSON.stringify(_args), JSON.stringify(_opts));
  let Command = Executor.extend({
    name: _name,
    args: _args
  });
  let command = new Command();
  return command.exec(_opts);
}

export default Executor;
