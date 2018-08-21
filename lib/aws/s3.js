const ra                      = require('../ra2');
const sg                      = require('sgsg');
const _                       = sg._;
const params                  = require('./schemas/s3');
const s3params                = params.params;
const AWS                     = require('aws-sdk');
const util                    = require('util');
const {
  callbackify
}                             = util;
const getObjectParams         = util.callbackify(s3params.getObject);
const s3                      = new AWS.S3();

var lib = {};

lib.getObject = ra.hook({}, function(argv, context, callback) {

  var params = {};
  var result = {};

  return sg.__run3([function(next, enext, enag, ewarn) {
    return getObjectParams(argv, enag(function(err, data) {

      // Must separate the 'ok'
      const ok = sg.extract(data, 'ok');

      params = {...data};

      // Check for errors
      if (!sg.ok(err, data) || !ok) {
        console.error({ok, msg: `Failed to get params (getObjectParams)`, argv, err, data});
      }

      return next();

    }, 'getObjNag'));
  }, function(next, enext, enag, ewarn) {
    return s3.getObject(params, enag(function(err, data) {
      result = {...data};
      return next();
    }, 's3getObject'));
  }], function() {
    return callback(null, result);
  });
});

lib.params = params;
lib.s3params = s3params;

_.each(lib, (v,k) => {
  exports[k] = v;
});
