
const sg                      = require('sgsg');
const _                       = sg._;
const AWS                     = require('aws-sdk');

var i = 0;
var lib = {};

// lib = {...lib,
//   s3 :                          require('./s3'),

//   schemas: {
//     s3:                         require('./schemas/s3'),
//   }
// };

// AWS.config.update({region: "us-east-1", logger: "console"});
AWS.config.update({region: "us-east-1"});

lib.AWS = AWS;
lib.awsServices = {};
lib.mkService = function(name) {
  if (lib.awsServices[name])    { return lib.awsServices[name]; }

  return lib.awsServices[name] = new AWS[name];
};


_.each(lib, (v,k) => {
  exports[k] = v;
});
