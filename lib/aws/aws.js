
const sg                      = require('sgsg');
const _                       = sg._;
// const ra                      = require('run-anywhere').v2;

var lib = {
  s3 :                          require('./s3'),

  schemas: {
    s3:                         require('./schemas/s3'),
  }
};



_.each(lib, (v,k) => {
  exports[k] = v;
});
