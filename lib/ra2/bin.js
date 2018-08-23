#!/usr/bin/env node

/**
 *
 */
const sg                      = require('sgsg');
const _                       = sg._;
const ARGV                    = sg.ARGV();

const cmd                     = ARGV.command || ARGV.args[0];
const command                 = require(`./commands/${cmd}`);

if (command && (typeof command === 'function')) {
  command(ARGV);
}



