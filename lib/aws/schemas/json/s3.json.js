
const _                       = require('underscore');
const helpers                 = require('./helpers');
const {
  typeItems
}                             = helpers;
const utils                   = require('../../../utils');
const {
  isnt
}                             = utils;

const stringType              = {type: 'string'};
const dateType                = {type: 'Date'};
const numberType              = {type: 'number'};
const bufferType              = {type: 'Buffer'};

var lib = {};

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

var   getObjectOptionalString   = 'IfMatch,IfNoneMatch,Range,ResponseCacheControl';
getObjectOptionalString        += ',ResponseContentDisposition,ResponseContentEncoding,ResponseContentLanguage,ResponseContentType';
getObjectOptionalString        += 'SSECustomerAlgorithm,SSECustomerKeyMD5,VersionId';

lib.getObject = function(argv) {

  return {
    required: {
      Bucket: stringType,
      Key:    stringType,
    },
    optional: {...typeItems(getObjectOptionalString, 'string'),
      IfModifiedSince: dateType,
      IfUnModifiedSince: dateType,
      ResponseExpires: dateType,
      PartNumber: numberType,
      SSECustomerKey: bufferType,
    },
  };
};

_.each(lib, (v,k) => {
  exports[k] = v;
});
