const ra                      = require('run-anywhere').v2;
const {
  sg,
  sg: {_}
}                             = ra;
const AWS                     = require('aws-sdk');

var lib = {};

lib.getObject = ra.aws.s3.getObject;

_.each(lib, (v,k) => {
  exports[k] = v;
});
