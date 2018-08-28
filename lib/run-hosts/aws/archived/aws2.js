
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

var ctorX = function(name, CtorFn) {
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

const ctor = function(aws, key, item) {
  console.log(`ctoring ${key}, arity: ${item.length}`);

  aws.objs = aws.objs || {};

  aws[`mk${key}`] = function() {
    aws.objs[key] = aws.objs[key] || new AWS[key];
    const keys = Object.keys(aws.objs[key]);

    console.log(key, {keys, newly: aws.objs[key]});
    _.each(aws.objs[key], (v, key) => {
      console.log(key, {v, len: v && v.length || 0});
    });

    aws[key] = {};

    aws[key].fn = function(fname, params, callback) {
      const fnn = aws.objs[key][fname];
      console.log(`${key}.${fname}`, typeof fnn, fnn && fnn.length, {params});
      if (typeof fnn !== 'function') { console.log(`${key}.${fname} is ${typeof fnn}, not invoking`); return; }

      if (fname === 'describeKeyPairs') {
        aws.objs.EC2.describeKeyPairs();
      }

      fnn(params, function(err, ...data) {
        console.log(`retfrom:${key}.${fname}`, {params, err, ...data});
        return callback(err, ...data);
      });
    };

    return aws[key].fn;
  };
};

_.each(AWS, (item, key) => {
  if (typeof item === 'function') {
    if (item.length === 0) {
      ctor(aws, key, item);
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
