
const sg                      = require('sgsg');
const _                       = sg._;
const util                    = require('util');

var   verbosity_              = sg.verbosity();
const verbosity               = verbosity_ === 0 ? 1 : verbosity_ === 1 ? 0 : verbosity_;
console.log({verbosity_, verbosity});
var   lib                     = {};


lib.log = function(level, msg, ...objects) {
  if (level > verbosity) { return; }

  const args = sg.reduce(objects, [msg], function(m, obj) {
    return sg.ap(m, inspect(obj));
  });

  console.log(...args);
};






_.each(lib, (value, key) => {
  exports[key] = value;
});

function inspect(x) {
  return util.inspect(x, {depth:null, colors:true});
}
