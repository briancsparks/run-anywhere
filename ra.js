
/**
 *  The main object for Run-anywhere.
 *
 *  This is the module that gets required.
 *
 *  At its heart, run-anywhere are the adapters between your code that
 *  is written in the `RA style`, and the various places it could be run.
 *
 *  The `RA style` is simple, and is taken from the AWS Lamba style. Your function
 *  is top-level, and takes arguments as its `argv` param, takes a `context` param,
 *  which has information about the context of the call (not information for the semantics
 *  of the function), and the ever-present Node.js `callback`.
 *
 *          foo = function(argv, context, callback) ...
 *
 *  On the other side (the system that 'hosts' your function), things are more complex.
 *  RA has to adapt to all of the styles out there. The initial goal is:
 *
 *  1.  CLI
 *  2.  Inside the typical Node.js network app.
 *  3.  Inside an Express app.
 *  4.  Inside AWS Lambda.
 *  5.  As part of a `routes` based app.
 *  6.  Inside CLI-helpers like Vorpal.
 *  --- Longer-term
 *  7.  Inside things like Electron/Atom/Node-Webkit, etc.
 *  8.  React-Native, ParseServer-CloudCode
 *
 *  And then, RA makes the two layers work together, in such a way that you spend your
 *  time improving your app, instead of worrying about how to get your code to run in
 *  the popular service today.
 *
 *  -------- <aside>
 *  RA is not trying to make your code run inside any/all of these containers -- that is
 *  impossible. The idea is that your function always works in a CLI context, where you
 *  get a huge benefit that your code is very automated-test friendly. Then, as long as
 *  you do not try to break things, it should also work without any effort in the container
 *  that it is destined for. And you can feel more confident that if you have to run
 *  your code in another container, it will *integrate* auto-magically.
 *  -------- </aside>
 *
 *  So, there are three contexts that you need to be aware of:
 *
 *  1.  Your function. You just use the RA function signature and calling-convention.
 *      And you have to have some small boilerplate at the top of each of your functions.
 *  2.  The container. RA has all the code to deal with the container.
 *  3.  Calling your own RA-styled code.
 *
 */

var sg            = require('sgsg');
var _             = sg._;
var path          = require('path');
var urlLib        = require('url');

var nextMatch     = sg.routes().nextMatch;

var libRa = {};

exports.invoke = function(params_, spec_, fn, callback) {
  var params  = params_ || {};
  var spec    = spec_   || {};

  var args = [];

  args.push(params.params  || {});
  args.push(params.context || {});

  var cb = function(err) {
    return callback.apply(this, arguments);
  };

  args.push(cb);

  // ... other args
  if (spec.raEnv) {
    args.push(params);
  }

  // Always put the callback last
  if (_.last(args) !== cb) {
    args.push(cb);
  }

  return fn.apply(this, args);
};

libRa.exportFunction = libRa.raify = function(name, fn_, options_) {
  var options   = options || {};
  var fn        = fn_;

  fn.ra = {
    raified : (fn.raified = true),
    name    : (fn.raName  = name)     // Cannot use 'name'
  };

  return fn;
};

libRa.routesify = function(a, b) {
  var options, fn;
  if (arguments.length === 1) {
    options = {};
    fn      = a;
  } else {
    options = a || {};
    fn      = b;
  }

  var toRr = function(req, res, match, path_) {
    var path      = path_ || urlLib.parse(req.url).path;
    var rr        = {req:req, res:res, params:match.params, splats:match.splats, match:match, path:path};

    return fn(rr, {}, function(err, a) {
      if (err)                          { return nextMatch(req, res, match, err); }
      if (err === null && a === false)  { return nextMatch(req, res, match, err); }
    });
  };

  return toRr;
};

libRa.wrap = function(lib) {

  var wrapped = {};
  _.each(lib, function(value, key) {
    var fn = value;
    if (_.isFunction(value)) {
      wrapped[key] = function(a,b,c) {
        if (arguments.length === 1 && _.isFunction(a)) { return fn.call(this, {}, {}, a); }

        return fn.apply(this, arguments);
      };
    } else {
      wrapped[key] = value;
    }
  });

  return wrapped;
};

libRa.middlewareify = function(lib) {

  _.each(lib, function(origFn, origFnName) {
    if (_.isFunction(origFn)) {
      lib[origFnName] = function(a,b,c) {
        if (arguments.length === 1 && _.isFunction(a)) { return origFn.call(this, {}, {}, a); }

        return origFn.apply(this, arguments);
      };
    }
  });

  return lib;
};

libRa.require = function(libname_, dirname) {
  var libname = dirname ? path.join(dirname, libname_) : libname_;
  var lib     = require(libname);

  return libRa.middlewareify(lib);
};

//------------------------------------------------------------------------------------------------
//
//    Error handling
//
//

var errorHandlers = require('./lib/error-handlers');

libRa.ErrorHandler = function(argv, context, callback) {
  var self      = this;
  var modnames  = ['console'];

  var errorMods = {}, errorModNames = [];

  self.loadErrorHandler = function(mod) {
    if (errorHandlers[mod]) {
      errorMods[mod] = new errorHandlers[mod]();
      errorModNames.push(mod);
    }
  };

  self.die = function(err, loc) {
    var i;
    for (i = 0; i < errorModNames.length; i++) {
      errorMods[errorModNames[i]].die(err, loc);
    }
    return callback(sg.toError(err));
  };

  _.each(modnames, function(modname) {
    self.loadErrorHandler(modname);
  });

};

libRa.errorHandler = function(argv, context, callback) {
  return new libRa.ErrorHandler(argv, context, callback);
};

// Export the libRa object.
_.each(libRa, function(value, key) {
  exports[key] = value;
});

