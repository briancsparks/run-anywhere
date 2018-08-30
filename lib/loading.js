
// aws sts get-caller-identity --output text --query "Account"
// aws --profile $PROFILE sts get-caller-identity --output text --query "Account"

/**
 *
 */
const sg                      = require('sgsg');
const _                       = sg._;
const podLib                  = require('./pod');
const util                    = require('util');

const ARGV                    = sg.ARGV();
const argvGet                 = sg.argvGet;
const argvExtract             = sg.argvExtract;
const setOnn                  = sg.setOnn;
const deref                   = sg.deref;

var   lib                     = {};

var   wrappers                = {};


const hostNames = {
  cli:            'cli',
  awsApiGateway:  'aws-gateway-api',
  awsLambda:      'aws-lambda-invoke',
};

/**
 *  Hook into an AWS handler -- that is, this function is the function
 *  that is directly called by AWS, and this function is the one that makes
 *  the final call to callback.
 *
 *  @param handler -- the typical run-anywhere function(argv, context, callback)
 */
const hook = lib.hook = function(options_, handler) {
  var   options   = options_          || {};
  const fname     = options.fname     || 'noname';
  const runHost   = options.runHost   || 'cli';     /* how are we being invoked? */
  const host      = require(`./run-host-adapters/${hostNames[runHost]}`) || {};
  const wantEvent = options.wantEvent;

  // This function is the one that gets assigned to exports.fname
  return function(event, context_, callback) {

    // We just got invoked -- log it
    host.log(1, `${fname} loading `, {event, context:context_});

    // We are going to supply our own context object
    var   context = context_ || {};

    // TODO: Fixup context with an `ra` object that has lots of helpers

    // TODO: Build up argv
    var   argv = {...event};

    // Finally, call the users function, and eventually call into the user code.
    host.log(1, `${fname} starting`, {argv, context});

    const start     = Date.now();
    return handler(wantEvent? event : argv, context, function(err, ...rest) {
      const end       = Date.now();
      const elapsed   = end - start;
      host.log(1, `${fname} done in ${elapsed} ms`, {err, ...rest});

      // Then make the final callback
      return callback(err, ...rest);
    });
  };
};

lib.testHook = hook({runHost: 'cli', fname:'testHook'}, function(argv, context, callback) {
  return sg.setTimeout(argv.time || 1000, function() {
    return callback(null, {argv, context});
  });
});







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

function inspect(x) {
  return util.inspect(x, {depth:null, colors:true});
}
