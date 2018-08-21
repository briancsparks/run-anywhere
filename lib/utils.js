
const isnt = exports.isnt = function(x) {
  return (x === (void 0) || x === null);
};

const isArray = exports.isArray = function(a) {
  if (typeof a !== 'object')  { return false; }
  return (typeof a.length === 'number') && (typeof a.slice === 'function');
};

exports.reduceObj = function(obj, init, fn) {
  const keys    = Object.keys(obj);
  var   result  = copyIt(init);

  result = keys.reduce((prev, key, index, coll) => {
    const value = obj[key];
    const nextVal = fn(prev, value, key, obj);
      if (isArray(nextVal)) {
      if (nextVal.length >= 2 && !isnt(nextVal[0]) && !isnt(nextVal[1])) {
        return {...prev, [nextVal[0]]: nextVal[1]};
      }
      return {...prev};
    }
    return nextVal;
  }, init);

  return result;
};

exports.async = {};

exports.async.reduceObj = async function(obj, init, fn) {
  const keys    = Object.keys(obj);
  var   result  = copyIt(init);

  result = await keys.reduce(async(prevPromise, key, index, coll) => {
    const prev  = await prevPromise;
    const value = obj[key];
    const nextVal = await fn(prev, value, key, obj);

    var   result = nextVal;
    if (isArray(nextVal)) {
      if (nextVal.length >= 2 && !isnt(nextVal[0]) && !isnt(nextVal[1])) {
        result = {...prev, [nextVal[0]]: nextVal[1]};
      } else {
        result = {...prev};
      }
    }
    return result;
  }, Promise.resolve(init));

  return result;
};

exports.async.asyncFn = function(fn) {
  return {async: fn};
};

function copyIt(x) {
  if (typeof x === 'array')   { return [...x]; }
  return {...x};
}
