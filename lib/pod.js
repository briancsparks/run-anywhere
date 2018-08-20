
/**
 *
 */
const sg                      = require('sgsg');
const _                       = sg._;

const ARGV                    = sg.ARGV();
const argvGet                 = sg.argvGet;
const argvExtract             = sg.argvExtract;
const setOnn                  = sg.setOnn;
const deref                   = sg.deref;
const isFunction              = _.isFunction;
const deepExtend              = sg.deepExtend;

var lib = {};

var pod     = lib.pod = {};

pod.raw = function(obj) {
  return sg.reduce(obj, {}, (m, value, key) => {
    const valueType = typeof value;
    if (valueType === 'function')       { return m; }

    return sg.kv(m, key, value);
  });
};


pod.lambda = {};

pod.lambda.invokeContext = function(context_) {
  var   result = pod.raw(context_);

  result = deepExtend(result, fizzling(context_, 'getRemainingTimeInMillis'));

  return result;
};


_.each(lib, (value, key) => {
  exports[key] = value;
});


function dud() {
  return function() {
    return null;
  };
}

function arity0(obj, fname, ...args) {
  if (sg.isnt(obj))         { return dud(); }
  if (sg.isnt(fname))       { return dud(); }

  const fn = obj[fname];
  if (!_.isFunction(fn))    { return dud(); }

  return bind3(obj, fn, ...args);
}

function bind3(obj, fn, ...args) {
  return function() {
    return fn.apply(obj, args);
  }
}

function resolve(x) {
  if (_.isFunction(x))    { return x(); }
  return x;
}

function first(ar, predicate) {
  for (var i = 0; i < ar.length; ++i) {
    if (predicate(ar[i])) {
      return ar[i];
    }
  }

  return /*undefined*/;
}

function fizzling(obj, spec) {
  if (!sg.isObject(spec))     { return fizzling(obj, sg.keyMirror(spec)); }

  return sg.reduce(spec, {}, function(m, x, key) {
    const fn    = first([x, obj[x]], isFunction);
    const value = resolve(fn);

    if (!key || !value) {
      console.error('FIZZLING', key);
      return m;
    }

    return sg.kv(m, key, resolve(fn));
  });
}



