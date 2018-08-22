
const sg                      = require('sgsg');
const _                       = sg._;
const AWS                     = require('aws-sdk');

var i = 0;
var lib = {};

// lib = {...lib,
//   s3 :                          require('./s3'),

//   schemas: {
//     s3:                         require('./schemas/s3'),
//   }
// };

var mitm = function(obj, TypeName) {
  console.log(`mitming ${TypeName}`);

  const names = _.keys(obj);

  names.forEach((key) => {
    if (typeof obj[key] !== 'function') {
      console.log(`ignoring ${TypeName}.${key}, it isnt a function (${typeof obj[key]})`);
      return;
    }

    const oldFn = obj[key];
    console.log(`mitming ${TypeName}.${key}, arity: ${oldFn.length} on `, {obj});
    obj[key] = function(...args) {

      // TODO: Log
      console.log(`${TypeName}.${key}`, [...args]);

      return oldFn.apply(this, arguments);
    };
  });

  return obj;
};

var ctor = function(name, CtorFn) {
  console.log(`ctoring ${name}`);

  return function() {
    console.log(`Constructing ${name}`);

    return mitm(new AWS[name], name);
  }
};

var staticGet = function(key, item) {
  console.log(`get-${key}`);
  return function() {
    return AWS[key];
  };
};

var staticSet = function(key, item) {
  console.log(`set-${key}`);
  return function(x) {
    AWS[key] = x;
    return AWS[key];
  };
};

var aws = lib.aws   = {};

lib.invoke = function() {
};

_.each(AWS, (item, key) => {
  if (typeof item === 'function') {
    if (item.length === 0) {
      aws[`mk${key}`] = ctor(key, item);
    }
  } else if (typeof item === 'object') {
    aws[`get_${key}`] = staticGet(key, item);
    aws[`set_${key}`] = staticSet(key, item);
  } else {
    console.log(`???-${key}`);
    aws[key] = item;
  }
});



_.each(lib, (v,k) => {
  exports[k] = v;
});
