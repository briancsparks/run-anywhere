
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
  return sg.iwrap('fn', callback, abort, function(eabort) {
    return sg.__run3([function(next, enext, enag, ewarn) {

      command = ARGV.args.shift();

      if (!(commandFn = commands[command])) {
        return abort("Unknown command, known commands: ", _.keys(commands));
      }

      return next();

    }, function(next, enext, enag, ewarn) {
      return commandFn(ARGV, {}, function(err, data, ...rest) {
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

commands.invoke = function(ARGV, context, callback) {
  const mod_        = ARGV.args.shift();
  const fname       = ARGV.args.shift();
  const fullMod     = path.normalize(path.join(process.cwd(), mod_));
  const relMod      = path.relative(__dirname, fullMod);

  const mod         = require(relMod);

  var   result      = {};

  const analysis  = sg.reduce(mod, {}, (m, value, key) => {
    if (!(typeof value === 'function')) {
      // console.log(`Found non fn: ${key}`);
      return m;
    }

    return sg.kv(m, key, {type: typeof value, fn: value, arity: value.length});
  });

  // result = {...result, mod_, fname, fullMod, relMod, mod, analysis};
  result = {...result, analysis};

  if (!analysis[fname]) {
    return callback(null, {msg:`dont have ${fname}`, ...result});
  }

  // console.log({fname, analysis, it: analysis[fname]});
  return analysis[fname].fn(ARGV, context, function(err, data) {
    return callback(err, {result, data});
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

