
/**
 *
 */
require('app-module-path').addPath(`__dirname/../..`);

const sg                      = require('sgsg');
const _                       = sg._;
const path                    = require('path');
const util                    = require('util');

const ARGV                    = sg.ARGV();
const argvGet                 = sg.argvGet;
const argvExtract             = sg.argvExtract;
const setOnn                  = sg.setOnn;
const deref                   = sg.deref;

var lib       = {};
var commands  = {};

const main = function(callback) {

  var command;
  var commandFn;

  var result = {};
  return sg.iwrap('invoke_main', callback, abort, function(eabort) {
    return sg.__run3([function(next, enext, enag, ewarn) {

      command = ARGV.args.shift();

      if (!(commandFn = commands[command])) {
        return abort("Unknown command, known commands: ", _.keys(commands));
      }

      return next();

    }, function(next, enext, enag, ewarn) {
      return commandFn(ARGV, {}, function(err, data, ...rest) {
        if (!sg.ok(err, data))  { return abort(err); }

        result = {...data};
        return next();
      });

    }], function() {

      return callback(null, result);
    });
  });

  function abort(err, msg) {
    console.error(msg, err);
    return callback(err);
  }
};

commands.hw = function(argv, context, callback) {
  return callback(null, {msg: `Hello ${ARGV.hw || 'world'}`});
};

const preInvoke = function(ARGV, context, callback) {
  const mod_        = ARGV.args.shift();
  const fname       = ARGV.args.shift();
  const fullMod     = path.normalize(path.join(process.cwd(), mod_));
  const relMod      = path.relative(__dirname, fullMod);

  const mod         = require(relMod);

  var   result      = {mod_, fname, fullMod, relMod, mod};

  var   other     = {};
  const fns       = sg.reduce(mod, {}, (m, value, key) => {
    if (!(typeof value === 'function'))       { return m; }

    // Look for what we specifically need
    if (key === fname) {
      m = sg.kv(m, key, value);

      // Check if there are any known-good params
      if (mod.goodParams && mod.goodParams[key]) {
        m = sg.kv(m, 'goodParams', mod.goodParams[key]);
      }
    }

    // Other interesting stuff -- we know that `value` ia  function
    other = sg.kv(other, key, {
      type:   typeof value,
      fn:     value,
      arity:  value.length
    });

    return m;
  });

  return {...result, other, fns};
};

commands.invoke = function(ARGV, context, callback) {
  const {
    fname,
    fns
  }                 = preInvoke(ARGV, context, callback);
  var   argv        = ARGV.getParams({skipArgs:true}) || {};
  const found       = fns || {};

  if (!found[fname]) {
    return callback(null, {msg:`dont have ${fname}`, ...found});
  }

  return found[fname](argv, context, function(err, data) {
    return callback(err, {found, fname, data});
  });
};

commands.run = function(ARGV, context, callback) {
  const {
    fname,
    fns
  }                 = preInvoke(ARGV, context, callback);
  var   ARGV_       = ARGV.getParams({skipArgs:true}) || {};
  const found       = fns || {};
  const goodParams  = found.goodParams || function() { return {}; }
  const argv        = {...ARGV_, ...goodParams() };

  if (!found[fname]) {
    return callback(null, {msg:`dont have ${fname}`, ...found});
  }

  return found[fname](argv, context, function(err, data) {
    return callback(err, {found, fname, data});
  });
};



_.each(lib, (value, key) => {
  exports[key] = value;
});

var errorOutput   = function(x) { console.error(x); }
var goodOutput    = function(x) { console.log(x); }

if (sg.callMain(ARGV, __filename)) {
  main(function(err, result) {
    if (err)      { errorOutput(err); return process.exit(2); }
    if (result)   { goodOutput(result); }
  });
}

// For developer consumptiomn during dev process
if (cliFlag('human') || cliFlag('h')) {
  // Maximum pretty-formatting-ness

  goodOutput = function(json) {
    const [output, isGood] = wellFormedJson(json);
    if (isGood && typeof output !== 'string') {
      console.log(util.inspect(output, {depth:null, colors:true}));
      return;
    }

    // Just send the output
    console.log(output);
  };

  errorOutput = function(x) {
    console.error(x);
  };
}

// For machine consumption
if (cliFlag('machine')) {
  // Minimize

  goodOutput = function(json) {
    const [output, isGood] = wellFormedJson(json);
    if (isGood && typeof output !== 'string') {
      console.log(JSON.stringify(output));
      return;
    }

    // Just send the output
    console.log(output);
  };

  errorOutput = function(x) {
    console.error(x);
  };
}

// Quiet
if (cliFlag('quiet')) {
  // Only show errors

  goodOutput = function() {}

  errorOutput = function(x) {
    console.error(x);
  };
}

function cliFlag(name) {
  var result = false;
  result = result || process.env[name];
  result = result || process.env[name.toUpperCase()];
  result = result || ARGV[name];

  return result;
}

/**
 *  Coerce it into good JSON (an object), or produce clean text.
 *
 */
function wellFormedJson(payload) {
  var   output = payload;
  var   isGood = true;

  // console.log(`payload is ${typeof payload}`);
  if ((typeof payload !== 'string')) {
    // Lucky! were done
    return [output, isGood];
  }

  // Its a string, but it might be parsable into JSON
  output = (sg.safeJSONParseQuiet(json, 'nope'));

  if (output !== 'nope') {
    // console.log(`At least it parsed as JSON`);
    return [output, isGood = true];
  }

  // Otherwise
  // console.log(`As bad as it gets`);
  return [payload, isGood = false];
}
