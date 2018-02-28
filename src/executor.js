'use strict';

var Promise = require('bluebird');
var exec = require('child_process');
var events = require('events');
var util = require('util');
var defer = require('./defer');
var dbx = require('./pinbug')('shjs:executor');
var misc = require('./misc');

var Executor = function() {
  events.EventEmitter.call(this);
};

util.inherits(Executor, events.EventEmitter);

Executor.prototype.exec = function(opts) {
  opts = opts || {};
  var self = this;
  var deferred = defer();

  dbx.enabled && dbx(' + execute command with options: %s', JSON.stringify(opts));

  // Prepare command name & args
  if (!misc.isFunction(this.commandName)) {
    return deferred.reject(new Error('method commandName() should be implemented', -10));
  }
  var commandName = this.commandName();
  if (!misc.isString(commandName)) {
    return deferred.reject(new Error('method commandName() must return a string', -11));
  }

  if (!misc.isFunction(this.commandArgs)) {
    return deferred.reject(new Error('method commandArgs() should be implemented', -20));
  }
  var commandArgs = this.commandArgs();
  if (!misc.isArray(commandArgs)) {
    return deferred.reject(new Error('method commandArgs() must return an array', -21));
  }

  // Prepare the process options
  var options = {};
  options.env = process.env;
  if (opts.cwd) options.cwd = opts.cwd;
  if (opts.shell != undefined) options.shell = opts.shell;

  // execute the command
  var text = '';
  var child = exec.spawn(commandName, commandArgs, options);

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
    deferred.resolve({code: code, text: text});
  });

  child.on('exit', function(code) {
    if (code !== 0) {
      deferred.reject(new Error(text, code));
    }
  });

  dbx.enabled && dbx(' - return the promise object');
  return deferred.promise;
}

module.exports = Executor;

Executor.extend = function(kwargs, context) {
  var Impl = function() {
    Executor.call(this, context);

    this.commandName = function() {
      return kwargs.name;
    }

    this.commandArgs = function() {
      return kwargs.args;
    }
  }
  util.inherits(Impl, Executor);
  return Impl;
}

Executor.run = function(_name, _args, _opts) {
  var executor = Executor.extend({
    name: _name,
    args: _args
  });
  return executor.exec(_opts);
}
