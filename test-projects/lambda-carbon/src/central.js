
const inKSink                 = require('./in/kitchen-sink');
const {
  kitchensink,
}                             = inKSink;
const utils                   = require('./utils');
const {
  logStart,
  halfLog,
}                             = utils;


exports.kitchensink = function(a, b, c) {
  halfLog('[1]:central.kitchensink--begin', {a, b, c}, {});

  halfLog('[2]:central.kitchensink--calling-logStart', {}, {a, b, c});
  return logStart(a, b, c, function(argv, context, callback) {
    halfLog('[5]:central.kitchensink--called-from-logStart', {}, {argv, context, callback});

    // Dispatch the function call to the real handler
    halfLog('[6]:central.kitchensink--calling-kitchensink--done!', {}, {argv, context, callback});
    return kitchensink(argv, context, callback);
  });
};

