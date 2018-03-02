'use strict';

let debug = null;

let pinbug = function(pkgName) {
  if (debug == null) {
    try {
      debug = require('debug');
    } catch(err) {
      debug = function() {
        let log = function() {
          return console.log.apply(console, arguments);
        }
        log.enabled = false;
        return log;
      };
    }
  }
  return debug(pkgName);
};

module.exports = pinbug;
