
/**
 *
 */
const sg                      = require('sgsg');
const _                       = sg._;
const podLib                  = require('./pod');
// const lib                     = require('../ra');

// var   aws                     = require('./aws/aws');

const ARGV                    = sg.ARGV();
const argvGet                 = sg.argvGet;
const argvExtract             = sg.argvExtract;
const setOnn                  = sg.setOnn;
const deref                   = sg.deref;

var   lib                     = {};

// lib.aws                       = aws;

var   wrappers                = {};

wrappers.def = function(otherLib, options, fname, fn) {
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
wrappers.awsLambdaInvoke = function(otherLib, options, fname_, fn) {
  const [ mod, action ] = fname_.split('_');

  var   fname = `${mod}_${action}_invoke`;
  const wrappedFn = function(event, context_, callback_) {
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

  const ra = {...(otherLib.ra || {}),
    [fname]: {
      input: `aws_lambda_invoke`
    }
  };

  return {...otherLib,
    [fname] : wrappedFn,
    ra
  };
};

//...
lib.adapt = function(otherLib, options, fnObj_) {
  if (arguments.length === 2)         { return lib.adapt(otherLib, {}, arguments[1]); }
  if (typeof options === 'string')    { return lib.adapt(otherLib, {hint: arguments[1]}, arguments[2]); }
  if (_.isFunction(fnObj_))           { return lib.adapt(otherLib, options, {[fnKeyName(options)]:fnObj_}); }

  var result = {...otherLib};
  _.each(fnObj_, function(fn, key) {
    var   wrapper     = wrappers[options.hint || 'def']  || wrappers.def;

    result = wrapper(result, options, key, fn);
  });

  return result;
};

lib.load = function(filename, mod) {
  const [script, appDir] = filename.split(path.sep).reverse();
  const [scriptRoot, scriptExt] = script.split('.');

  var ra = sg.reduce({...mod.ra}, {}, (m, value, key) => {
    return sg.kv(m, key, {...value,
      CodeUri: `${appDir}/`,
      Handler: `${scriptRoot}.${key}`
    });
  });

  return {...mod, ra};
};


lib.hook = function(options, handler) {

  return function(event, context_, callback) {

    // We are going to supply our own context object
    var   context = context_ || {};

    // Finally, call the users function, and eventually call into the
    // user code.
    return handler(event, context, function(err, ...rest) {

      // Then make the final callback
      return callback(err, ...rest);
    });
  };
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

function fnKeyName(options) {
  return options.hint || 'just';
}
