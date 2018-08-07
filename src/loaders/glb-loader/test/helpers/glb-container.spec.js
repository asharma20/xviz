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

/* eslint-disable max-len */
import test from 'tape-catch';

import {
  _GLBContainer as GLBContainer,
  _GLBBufferPacker as GLBBufferPacker,
  _unpackGLBBuffers as unpackGLBBuffers
} from '../../index';

import TEST_JSON from '../test-data.json';

const BUFFERS = [
  new Int8Array([3, 2, 3]),
  new Uint16Array([6, 2, 4, 5]),
  new Float32Array([8, 2, 4, 5])
];

test('glb-container#create-and-parse', t => {
  const bufferPacker = new GLBBufferPacker();
  const {arrayBuffer, jsonDescriptors} = bufferPacker.packBuffers(BUFFERS);
  const json = Object.assign({}, TEST_JSON, jsonDescriptors);

  const glbFileBuffer = GLBContainer.createGlbBuffer(json, arrayBuffer);

  t.equal(glbFileBuffer.byteLength, 1584, 'should be equal');

  const parsedData = GLBContainer.parseGlbBuffer(glbFileBuffer);

  t.equal(parsedData.binaryByteOffset, 1556);
  t.deepEqual(parsedData.json, json, 'JSON is equal');

  const buffers2 = unpackGLBBuffers(arrayBuffer, json);

  t.comment(JSON.stringify(BUFFERS));
  t.comment(JSON.stringify(buffers2));
  t.deepEqual(buffers2, BUFFERS, 'should be deep equal');
  t.end();
});
