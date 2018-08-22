const sg                      = require('sgsg');
const _                       = sg._;
const helpers                 = require('./json/helpers');
const {
  s3Resolve,
}                             = helpers;
const s3SchemaJson            = require('./json/s3.json');
const {
  coerce,
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

var lib = {params:{}, goodParams:{}};

lib.params.getObject = async function(argv, context, callback) {
  const json = s3SchemaJson.getObject({});
  return helpers.specPick(argv, json);
};

lib.goodParams.getObject = function(argv) {
  return require('./json/known-good.json');
};


_.each(lib, (v,k) => {
  exports[k] = v;
});
