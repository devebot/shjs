var misc = {};

misc.isFunction = function(f) {
  return typeof(f) === 'function';
}

misc.isArray = function(a) {
  return a instanceof Array;
}

misc.isObject = function(o) {
  return o && typeof(o) === 'object' && !(o instanceof Array);
}

misc.isString = function(s) {
  return typeof(s) === 'string';
}

module.exports = misc;
