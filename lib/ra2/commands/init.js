
/**
 *
 */
const sg                      = require('sgsg');
const _                       = sg._;
const sh                      = sg.extlibs.shelljs;
const path                    = require('path');

const ARGV                    = sg.ARGV();

const name  = ARGV.name;
const loc   = ARGV.location;

const templFilename = path.join(__dirname, 'template.yaml');
const dest          = path.join(process.cwd(), loc);

console.log(`${templFilename} -> ${dest}`);
sh.sed('HelloWorld', name, templFilename).to('../../template.yaml');;


