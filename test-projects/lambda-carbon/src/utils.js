
const _                       = require('underscore');

var lib = {};

var   logAll  = false;
var   logger  = console.error;


const halfLog = lib.halfLog = lib.log = function(message, ...newStuff /*, [oldStuff]  */) {
  const oldStuff = newStuff.pop();

  if (logAll) {
    logger(message, ...newStuff, oldStuff);
  } else {
    logger(message, ...newStuff);
  }
};

lib.logStart = function(event, context, outerCallback, callback) {
  logAll = false;
  halfLog('[3]:utils.logStart--begin', {outerCallback}, {event, context, callback});

  const startTime = new Date();
  var args_  = [ event, context, outerCallback, callback ];

  const last      = arguments.length - 1;
  const endingFn  = function(err, result, ...rest) {
    const endTime = new Date();
    halfLog('[9]:utils.logStart--mwFinishing', {}, {err, result, event, context, ...rest});

    halfLog('[10]:utils.logStart--done!', {}, {err, result, ...rest});
    return outerCallback(err, result, ...rest);
  };

  halfLog('[4]:utils.logStart--calling-kitchensink-back', {}, {event, context, outerCallback, callback});
  return callback(event, context, endingFn);

  // return callback.apply(this, arguments);
};



_.each(lib, (value, key) => {
  exports[key] = value;
});

