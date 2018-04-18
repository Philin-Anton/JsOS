// Copyright 2014-present runtime.js project authors
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

'use strict';

/* eslint-disable no-console */

const packagejson = require('../package.json');

require('module-singleton')(packagejson);
require('./version');

console.log(`JsOS runtime v${packagejson.version}`);
console.log('Preparing to load...');

const isDebug = packagejson.runtimejs.debug;

global.debug = isDebug ? console.log : () => {};

require('./persistence');

// Load runtime.js core
const runtime = require('./core');

// Start services
require('./service/dhcp-client');

runtime.shell = require('./service/shell');
runtime.dns = require('./service/dns-resolver');

runtime.debug = isDebug;

// Init base commands
require('./service/shell/commands');

// Init app manager
runtime.appman = require('./service/appman');

// Start device drivers
require('./driver/ps2');
require('./driver/virtio');
require('./driver/ata');
require('./driver/realtek/rtl8139');

// Set time
require('./core/cmos-time'); // load cmos
if (isDebug) require('./core/set-time'); // fetch NTP

module.exports = runtime;
