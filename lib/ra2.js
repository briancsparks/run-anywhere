
/**
 *
 */
const sg                      = require('sgsg');
const _                       = sg._;
const podLib                  = require('./pod');
const loading                 = require('./loading');

var   aws                     = require('./run-hosts/aws/aws');

const ARGV                    = sg.ARGV();
const argvGet                 = sg.argvGet;
const argvExtract             = sg.argvExtract;
const setOnn                  = sg.setOnn;
const deref                   = sg.deref;

var   lib                     = {};
var   wrappers                = {};

lib.aws                       = aws;


_.each(lib, (value, key) => {
  exports[key] = value;
});

_.each(loading, (value, key) => {
  exports[key] = value;
});

