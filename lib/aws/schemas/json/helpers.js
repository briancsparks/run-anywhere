
const utils                   = require('../../../utils');
const {
  reduceObj
}                             = utils;

lib = {};

exports.typeItems = lib.typeItems = function(names, type) {
  if (typeof names === 'string')    { return lib.typeItems(names.split(','), type); }

  return names.reduce((m, name) => {
    return {...m, [name]: {type}};
  }, {});
}
