
const _                       = require('underscore');
const utils                   = require('../../../utils');
const {
  reduceObj,
  isnt
}                             = utils;
const asyncReduceObj          = utils.async.reduceObj;

lib = {};

const coerce = lib.coerce = function(spec, x) {
  if (typeof x === spec.type)   { return x; }
  // if (x instanceof spec.type)   { return x; }

  if (spec.type === 'string') {
    return ''+x;
  }

  if (spec.type === 'number') {
    return +x;
  }

  return x;
};

var resolveKv, resolveX;

resolveKv = async function(spec, obj, key) {
  const value = obj[key];
  if (isnt(value)) { return value; }
  return await resolveX(spec, value);
};

resolveX = async function(spec, value_) {
  var value = value_;
  if (value.sync && typeof value.sync === 'function') {
    return await resolveX(spec, await value.sync());
  }  if (value.async && typeof value.async === 'function') {
    const v = await value.async();
    const result = await resolveX(spec, v);
    return result;
  }
  return coerce(spec, value);
};

const s3Resolve = lib.s3Resolve = async function(spec, obj, key) {
  if (arguments.length === 2) { return await resolveX(spec, arguments[1]); }
  return await resolveKv(spec, obj, key);
};

exports.typeItems = lib.typeItems = function(names, type) {
  if (typeof names === 'string')    { return lib.typeItems(names.split(','), type); }

  return names.reduce((m, name) => {
    return {...m, [name]: {type}};
  }, {});
}

/**
 *  Pick the right items out of the users data, from a template.
 *
 */
lib.specPick = async function(argv, jsonTemplate) {

  var result = {};

  var ok = true;
  result = await asyncReduceObj(jsonTemplate.required, result, async (m, spec, key) => {
    const value = await s3Resolve(spec, argv, key);
    ok = (isnt(value) === true) ? false : ok;
    return [key, value];
  });

  result = await asyncReduceObj(jsonTemplate.optional, result, async (m, spec, key) => {
    const value = await s3Resolve(spec, argv, key);
    return [key, value];
  });

  if (ok) {
    return {ok: result};
  } else {
    return {fail: result};
  }
};

_.each(lib, (v,k) => {
  exports[k] = v;
});

