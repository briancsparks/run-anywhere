
/**
 *
 */
require('app-module-path').addPath(`__dirname/../..`);

const sg                      = require('sgsg');
const _                       = sg._;
const path                    = require('path');

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

if (sg.callMain(ARGV, __filename)) {
  return main(function(err, result) {
    if (err)      { console.error(err); return process.exit(2); }
    if (result)   { console.log(result); }
  });
}

