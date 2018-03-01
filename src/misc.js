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

misc._assign = function() {
  return Object.assign.apply(null, arguments);
}

misc._pick = function(r, fields) {
  if (!(r && typeof r === 'object')) return {};
  var o = {};
  fields = fields || Object.keys(r);
  fields.forEach(function(k) {
    if (r.hasOwnProperty(k)) {
      o[k] = r[k];
    }
  });
  return o;
}

module.exports = misc;
