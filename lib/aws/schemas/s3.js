const sg                      = require('sgsg');
const _                       = sg._;
const s3SchemaJson            = require('./json/s3.json');
const {
  coerce,
  s3Resolve,
}                             = s3SchemaJson;
const quickMerge              = require('quick-merge');
const {
  qm,
  resolve
}                             = quickMerge;
const utils                   = require('../../utils');
const {
  reduceObj,
  isnt,
}                             = utils;
const asyncReduceObj          = utils.async.reduceObj;
const AWS                     = require('aws-sdk');

var lib = {params:{}};

lib.params.getObject = async function(argv, context, callback) {
  const json = s3SchemaJson.getObject({});

  var result = {};

  var ok = true;
  result = await asyncReduceObj(json.required, result, async (m, spec, key) => {
    const value = await s3Resolve(spec, argv, key);
    ok = (isnt(value) === true) ? false : ok;
    return [key, value];
  });

  result = await asyncReduceObj(json.optional, result, async (m, spec, key) => {
    const value = await s3Resolve(spec, argv, key);
    return [key, value];
  });

  return {...result, ok};
};

_.each(lib, (v,k) => {
  exports[k] = v;
});
