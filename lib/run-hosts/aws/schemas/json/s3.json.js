
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

var lib = {defaults:{}};

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

lib.defaults.getObject = function(argv) {
  const knownGood = require('./known-good.json');
  return helpers.specPick(knownGood, lib.getObject({}));
};

_.each(lib, (v,k) => {
  exports[k] = v;
});
