'use strict';

var Promise = require('bluebird');
var exec = require('child_process');
var events = require('events');
var util = require('util');
var defer = require('./defer');
var dbx = require('./pinbug')('shjs:executor');

var Executor = function() {
  events.EventEmitter.call(this);
};

util.inherits(Executor, events.EventEmitter);

Executor.prototype.exec = function(kwargs) {
  kwargs = kwargs || {};
  var self = this;
  var deferred = defer();

  dbx.enabled && dbx(' + execute command with options: %s', JSON.stringify(kwargs));

  // Prepare command name & args
  if (typeof(this.commandName) !== 'function') {
    return deferred.reject(new Error('method commandName() should be implemented', -1));
  }
  var commandName = this.commandName();

  if (typeof(this.commandArgs) !== 'function') {
    return deferred.reject(new Error('method commandArgs() should be implemented', -2));
  }
  var commandArgs = this.commandArgs();

  // Prepare the process options
  var options = {};
  options.env = process.env;
  if (kwargs.cwd) options.cwd = kwargs.cwd;
  if (kwargs.shell != undefined) options.shell = kwargs.shell;

  // execute the command
  var output = '';
  var child = exec.spawn(commandName, commandArgs, options);

  child.stdout.on('data', function(data) {
    output += data.toString();
    self.emit('stdout', data);
  });

  child.stderr.on('data', function(data) {
    output += data.toString();
    self.emit('stderr', data);
  });

  child.on('close', function(code) {
    self.emit('close', code);
    deferred.resolve({code: code, output: output});
  });

  child.on('exit', function(code) {
    if (code !== 0) {
      deferred.reject(new Error(output, code));
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

Executor.run = function(_name, _args) {
  var executor = Executor.extend({
    name: _name,
    args: _args
  });
  return executor.exec();
}
