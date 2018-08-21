const sg                      = require('sgsg');
const _                       = sg._;
const params                  = require('./schemas/s3');
const s3params                = params.params;
// const AWS                     = require('aws-sdk');

var lib = {};

lib.getObject = function(argv, context, callback) {
  const params = await s3params.getObject(argv);
};

lib.params = params;
lib.s3params = s3params;
_.each(lib, (v,k) => {
  exports[k] = v;
});
