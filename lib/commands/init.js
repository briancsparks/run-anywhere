
/**
 *
 */
const sg                      = require('sgsg');
const _                       = sg._;
const sh                      = sg.extlibs.shelljs;
const path                    = require('path');

const ARGV                    = sg.ARGV();

var lib       = {};

const main = lib.main = function(argv) {

  const name      = ARGV.name;
  const loc       = ARGV.location;
  const dryRun    = ARGV.dry_run;

  const templFilename = path.join(__dirname, '..', 'templates', 'sam-template.yaml');
  const dest          = path.join(process.cwd(), loc);

  console.log(`${templFilename} -> ${dest}`);
  const output = sh.sed('HelloWorld', name, templFilename);

  if (dryRun) {
    sh.echo(output);
    return;
  }

//  output.to(dest);
};


_.each(lib, (value, key) => {
  exports[key] = value;
});

