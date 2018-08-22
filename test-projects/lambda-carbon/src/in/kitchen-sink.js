
const utils                   = require('../utils');
const {
  halfLog,
}                             = utils;


exports.kitchensink = function(event, context, callback) {
  halfLog('[7]:in.kitchensink--begin', {}, {event, context, callback});
  const total = event.me + context.getRemainingTimeInMillis;

  // console.error(''+startTime, `starting`, {total, event, context});

  var   response = {hello:21,booya:"foobee"};

  var htttpResponse = {
    statusCode: 200,
    body:       JSON.stringify(response),
    headers:    ['Content-Type: application/json'],
  };

  halfLog('[8]:in.kitchensink--respond-done!', {response, htttpResponse}, {event, context, callback});
  return callback(null, htttpResponse);
};

