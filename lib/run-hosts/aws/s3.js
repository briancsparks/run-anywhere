
const sg                      = require('sgsg');
// const sg                      = require('../../../sg/sg');
const _                       = sg._;
const awsLib                  = require('./aws');
const s3schema                = require('./schemas/s3');
const s3params                = s3schema.params;
const util                    = require('util');
const loading                 = require('../loading');
const {
  hook
}                             = loading;
const {
  callbackify
}                             = util;
const getObjectParams         = util.callbackify(s3params.getObject);
const s3                      = awsLib.mkService('S3');
const deref                   = sg.deref;
const enone                   = sg.enone;

var lib = {checkParams : {}, goodParams : {}};

lib.goodParams.getObject = s3schema.goodParams.getObject;

/**
 *  Validates inputs.
 *
 *  The called helper function will set data.ok to indicate that the
 *  params are good. If ok is true, remove it, because it cannot be present
 *  when the real function is called.
 *
 */
lib.checkParams.getObject = function(argv, context, callback) {
  const watchFn = deref(context, 'runAnywhere.watchFn') || sg.enone;

  return getObjectParams(argv, watchFn(function(err, data) {

    if (!sg.ok(err, data)) {
      console.error({msg: `Failed to get params for (getObjectParams)`, argv, err, data});
    }

    const { ok, fail }  = data;
    data = data.fail || data.ok;

    if (!ok) {
      console.error({msg:`EBADPAYLOAD`, argv, err, data});
    }

    return callback(err, data);
  }, 'getObjNag'));
};

lib.getObject = hook({}, function(argv, context, callback) {

  const checkParams = lib.checkParams.getObject;

  return sg.iwrap('getObject', callback, abort, function(eabort) {
    return checkParams(argv, context, sg.ewarn(callback, function(err, params) {
      return s3.getObject(params, eabort(function(err, data) {

        return callback(null, data);

      }, 'failed_call_to_aws_s3_getObject'));
    }, 'failed_s3_parameter_check'));
  });

  function abort(err, msg) {
    console.error(msg, err);
    return callback(err);
  }

});

lib.params = s3schema;
lib.s3params = s3params;

_.each(lib, (v,k) => {
  exports[k] = v;
});
