
/**
 *
 */
const sg                      = require('sgsg');
const _                       = sg._;

const test                    = require('ava');

// Unconditional:
// t.pass('[message]');
// t.fail('[message]');
//
// Assertions:
// t.truthy(data, '[message]');
// t.falsy(data, '[message]');
// t.true(data, '[message]');
// t.false(data, '[message]');
// t.is(data, expected, '[message]');
// t.not(data, expected, '[message]');
// t.deepEqual(data, expected, '[message]');
// t.notDeepEqual(data, expected, '[message]');
// t.throws(function|promise, [error, '[message]']);
// t.notThrows(function|promise, '[message]');
// t.regex(data, regex, '[message]');
// t.notRegex(data, regex, '[message]');
// t.ifError(error, '[message]');         /* assert that error is falsy */
//
// t.skip.is(foo(), 5);

const raUtils                   = require('../lib/utils');
const {
  asyncFn
}                               = raUtils.async;
const s3params                  = require('../lib/aws/s3').s3params;
const {
  getObject
}                               = s3params;

test('s3params no async data', async t => {
  const params = await getObject({Bucket: 'a'});

  t.deepEqual(params, {ok:false, Bucket: 'a'});
});


test('s3params async data', async t => {
  const Bucket = later___iPromise('a', 200, `Bucket resolved`);

  const config = {Bucket};
  const params = await getObject(config);
  t.deepEqual(params, {ok:false, Bucket: 'a'});
});

test('s3params async data multiple', async t => {
  const Bucket  = later___iPromise('a', 20, `Bucket resolved`);
  const Key     = later___iPromise('a/b/ddd', 200, `Key resolved`);
  const IfMatch = later___iPromise('abcdefg', 200, `IfMatch resooved`);

  const config = {Bucket, IfMatch, Key};
  const params = await getObject(config);
  t.deepEqual(params, {ok:true, Bucket: 'a', IfMatch: 'abcdefg', Key: 'a/b/ddd'});
});

test('s3params mixed data multiple', async t => {
  const Bucket  = later___iPromise('a', 20, `Bucket resolved`);
  const Key     = 'a/b/ddd';
  const IfMatch = later___iPromise('abcdefg', 200, `IfMatch resooved`);

  const config = {Bucket, IfMatch, Key};
  const params = await getObject(config);
  t.deepEqual(params, {ok:true, Bucket: 'a', IfMatch: 'abcdefg', Key: 'a/b/ddd'});
});

test('s3params mixed sync and unsync', async t => {
  const Bucket  = later___iPromise('a', 20, `Bucket resolved`);
  const Key     = mkSync(function() { return 'a/b/ddd'; });
  const IfMatch = later___iPromise('abcdefg', 200, `IfMatch resooved`);

  const config = {Bucket, IfMatch, Key};
  const params = await getObject(config);
  t.deepEqual(params, {ok:true, Bucket: 'a', IfMatch: 'abcdefg', Key: 'a/b/ddd'});
});

function mkSync(kf) {
  return {sync: kf};
}


const later___iPromise = function(data, time, msg) {
  return {async: async function() {
    return iPromiseLater(time, data, msg);
  }};
};

function iPromiseLater(time, data, msg) {
  const start = Date.now();

  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const elapsed = Date.now() - start;
      // console.log(`${msg} after ${time} (actual: ${elapsed})`);
      resolve(data);
    }, time);
  });
}

