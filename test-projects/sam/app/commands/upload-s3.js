const ra                      = require('run-anywhere').v2;
const {
  sg,
  sg: {_}
}                             = ra;
const AWS                     = require('aws-sdk');

var lib = {};

_.each(lib, (v,k) => {
  exports[k] = v;
});