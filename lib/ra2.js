
/**
 *
 */
const sg                      = require('sgsg');
const _                       = sg._;
const podLib                  = require('./pod');
// const lib                     = require('../ra');

const ARGV                    = sg.ARGV();
const argvGet                 = sg.argvGet;
const argvExtract             = sg.argvExtract;
const setOnn                  = sg.setOnn;
const deref                   = sg.deref;

var   lib                     = {};

var   wrappers                = {};

wrappers.def = function(options, fname, fn) {
  return function(argv_, context_, callback_) {
    var   argv      = argv_     || {};
    var   context   = context_  || {};
    var   callback  = callback_ || function(){};

    console.log(`default ra adapter`);

    return fn(argv, context, callback);
  };
};

/**
 *  Wraps a function that will be invoked by aws Lambda.
 *
 */
wrappers.awsLambdaInvoke = function(options, fname, fn) {
  return function(event, context_, callback_) {
    const handlers = {
      argv: event => {return {...event}}
    };

    var   {argv, context, callback} = prepArgs(event, context_, callback_, handlers);
    const { ra }                    = context;
    const { inspect }               = ra;

    context.ra.pod  = podLib.pod.lambda.invokeContext(context_);

    console.log(`${fname} ra adapter INPUT`, inspect({event, argv, context: context.ra.pod}));

    return fn(argv, context, callback);
  };
};

//...
lib.adapt = function(options, fnObj_) {
  if (arguments.length === 1)         { return lib.adapt({}, arguments[0]); }
  if (typeof options === 'string')    { return lib.adapt({hint: arguments[0]}, arguments[1]); }
  if (_.isFunction(fnObj_))           { return lib.adapt(options, {just:fnObj_}); }

  const fnObj = sg.reduce(fnObj_, lib, function(m, fn, key_) {
    const name        = key_ === 'just' ? options.hint || key_ : key_;
    var   wrapper     = wrappers[options.hint || 'def']  || wrappers.def;

    return sg.kv(m, key_, wrapper(options, name, fn));
  });

  if (fnObj.just) {
    return fnObj.just;
  }

  return fnObj;
};




_.each(lib, (value, key) => {
  exports[key] = value;
});

_.each(podLib, (value, key) => {
  exports[key] = value;
});

function mkCallback(event, context, callback) {
  // TOOD use context.done, context.succeed, context.fail if sg.isnt(callback)
  return function(err, ...rest) {
    return callback(err, ...rest);
  }
}

function prepArgs(event, context_, callback_, handlers) {
  const stdargs   = [event, context_, callback_];
  var   argv      = invokeIt(handlers.argv, ...stdargs) || {};
  var   callback  = mkCallback(event, context_, callback_);

  const consoleOutput   = sg.smartValue(process.env.AWS_SAM_LOCAL || false);
  const colors          = consoleOutput;

  var   origRa    = {...context_.ra};
  var   ra        = {
    orig : {
      event     : {...event},
      context   : {...context_},
      callback  : callback_
    },
    consoleOutput,
    inspect: (x) => { return sg.v2.inspect(x, colors) }
  };

  var   context   = {...context_,
    runAnywhere : ra,
    restoreRa   : () => {context.ra = origRa},
  };

  context.ra = context.runAnywhere;
  return {argv, context, callback};
}

function invokeIt(fn, ...args) {
  if (_.isFunction(fn)) {
    return fn(...args);
  }
  return /*undefined*/;
}
