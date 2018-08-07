// Copyright (c) 2019 Uber Technologies, Inc.
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

/* eslint-disable */
import test from 'tape-catch';
import {toLowPrecision} from './test-utils';

import {encodeGLB, parseGLB, _packJsonArrays as packJsonArrays} from '../index';

const TEST_CASES = {
  flat: {
    vertices: [
      [
        12.458602928956001,
        2.7320427081205123,
        0,
        11.504415873922731,
        4.285679511764174,
        0,
        15.282629201197484,
        6.606120324948342,
        0,
        16.236816256230753,
        5.05248352130468,
        0,
        12.458602928956001,
        2.7320427081205123,
        0
      ]
    ]
  },

  nested: {
    vertices: [
      [12.458602928956001, 2.7320427081205123, 0],
      [11.504415873922731, 4.285679511764174, 0],
      [15.282629201197484, 6.606120324948342, 0],
      [16.236816256230753, 5.05248352130468, 0],
      [12.458602928956001, 2.7320427081205123, 0]
    ]
  },

  full: require('./test-data.json')
};

test('GLBLoader#encode-and-parse', t => {
  for (const tcName in TEST_CASES) {
    const TEST_JSON = TEST_CASES[tcName];

    const glbFileBuffer = encodeGLB(TEST_JSON);
    const json = parseGLB(glbFileBuffer);

    t.ok(Array.isArray(json.buffers), `${tcName} Encoded and parsed GLB - has JSON buffers field`);
    t.ok(
      Array.isArray(json.bufferViews),
      `${tcName} Encoded and parsed GLB - has JSON bufferViews field`
    );
    t.ok(
      Array.isArray(json.accessors),
      `${tcName} Encoded and parsed GLB - has JSON accessors field`
    );

    delete json.buffers;
    delete json.bufferViews;
    delete json.accessors;

    t.deepEqual(
      toLowPrecision(json),
      toLowPrecision(packJsonArrays(TEST_JSON)),
      `${tcName} Encoded and parsed GLB did not change data`
    );
  }

  t.end();
});

test('GLBLoader#encode-and-parse#full', t => {
  const tcName = 'full';
  const TEST_JSON = TEST_CASES[tcName];

  const glbFileBuffer = encodeGLB(TEST_JSON);
  const json = parseGLB(glbFileBuffer);

  // t.comment(JSON.stringify(TEST_JSON, null, 2));
  // t.comment(JSON.stringify(json, null, 2))

  t.ok(Array.isArray(json.buffers), `${tcName} Encoded and parsed GLB - has JSON buffers field`);
  t.ok(
    Array.isArray(json.bufferViews),
    `${tcName} Encoded and parsed GLB - has JSON bufferViews field`
  );
  t.ok(
    Array.isArray(json.accessors),
    `${tcName} Encoded and parsed GLB - has JSON accessors field`
  );

  delete json.buffers;
  delete json.bufferViews;
  delete json.accessors;

  t.deepEqual(
    json.state_updates[0].primitives.tracklets[0],
    packJsonArrays(TEST_JSON.state_updates[0].primitives.tracklets[0]),
    'Encoded and parsed GLB did not change data'
  );

  t.end();
});
