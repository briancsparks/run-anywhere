
const sg                      = require('sgsg');
// const sg                      = require('../../../../../sg/sg');
const fs                      = require('fs');


// A good default set of data
var   result = {
};

// Custom data
const config = sg.config('run-anywhere');
if (config && config.usableAwsData && fs.existsSync(config.usableAwsData)) {

  var content = fs.readFileSync(config.usableAwsData, {encoding:'utf8'});

  result = {...result,
    ...sg.safeJSONParseQuiet(content, {})
  };
}

// Better than nothing
result = {...result,
};

module.exports = result;
