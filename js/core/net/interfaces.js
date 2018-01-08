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

// const assert = require('assert');
const intfs = [];

exports.add = intf => intfs.push(intf);
exports.count = () => intfs.length;

exports.getByName = (intfName) => {
  for (const intf of intfs) {
    if (intfName === intf.name) {
      return intf;
    }
  }

  return null;
};

exports.forEach = fn => intfs.forEach(fn);
exports.getAll = () => intfs;