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

  var __parsers = [];

  this.addParser = function(f) {
    if (typeof f === 'function') {
      __parsers.push(f);
    }
    return this;
  }

  this.removeParser = function(f) {
    var pos = __parsers.indexOf(f);
    if (pos >= 0) {
      __parsers.splice(pos, 1);
    }
    return this;
  }

  this.parse = function(text) {
    if (typeof text !== 'string') return null;
    return __parsers.reduce(function(accum, parser) {
      try {
        var r = parser(text, accum);
        if (r && typeof r === 'object') {
          accum = misc._assign(accum, r);
        }
      } catch (err) {}
      return accum;
    }, {});
  }
};

util.inherits(Executor, events.EventEmitter);

Executor.prototype.exec = function(opts) {
  opts = opts || {};
  var self = this;
  var deferred = defer();

  dbx.enabled && dbx(' + execute command with options: %s', JSON.stringify(opts));

  // Prepare command name & args
  if (!misc.isFunction(this.getCmdName)) {
    return deferred.reject(new Error('getCmdName() must be implemented', -10));
  }
  var commandName = this.getCmdName();
  if (!misc.isString(commandName)) {
    return deferred.reject(new Error('getCmdName() must return a string', -11));
  }

  if (!misc.isFunction(this.getCmdArgs)) {
    return deferred.reject(new Error('getCmdArgs() must be implemented', -20));
  }
  var commandArgs = this.getCmdArgs();
  if (!misc.isArray(commandArgs)) {
    return deferred.reject(new Error('getCmdArgs() must return an array', -21));
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
    deferred.resolve({code: code, text: text, data: self.parse(text)});
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

Executor.extend = function(kwargs) {
  var Impl = function() {
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
  var Command = Executor.extend({
    name: _name,
    args: _args
  });
  var command = new Command();
  return command.exec(_opts);
}
