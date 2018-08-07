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

import {flattenToTypedArray} from '../utils/flatten';

const DEFAULT_TOKENIZE = index => `$$$${index}`;

const DEFAULT_UNTOKENIZE = value => {
  if (typeof value === 'string') {
    const matches = value.match(/\$\$\$([0-9]+)/);
    if (matches) {
      const index = matches[1];
      return parseInt(index, 10);
    }
  }
  return -1;
};

// Recursively packs objects, replacing typed arrays with "JSON pointers" to binary data
export function packJsonArrays(json, bufferPacker, options = {}) {
  const {tokenize = DEFAULT_TOKENIZE, flattenArrays = true} = options;
  let object = json;

  if (Array.isArray(object)) {
    // TODO - handle numeric arrays, flatten them etc.
    const typedArray = flattenArrays && flattenToTypedArray(object);
    if (typedArray) {
      object = typedArray;
    } else {
      return object.map(element => packJsonArrays(element, bufferPacker, options));
    }
  }

  // Typed arrays, pack them as binary
  if (ArrayBuffer.isView(object) && bufferPacker) {
    const bufferIndex = bufferPacker.addBuffer(object);
    return tokenize(bufferIndex);
  }

  if (object !== null && typeof object === 'object') {
    const newObject = {};
    for (const key in object) {
      newObject[key] = packJsonArrays(object[key], bufferPacker, options);
    }
    return newObject;
  }

  return object;
}

// Recursively unpacks objects, replacing "JSON pointers" with typed arrays
export function unpackJsonArrays(json, buffers, options = {}) {
  const {untokenize = DEFAULT_UNTOKENIZE} = options;

  const object = json;

  // Check if a buffer token in that case replace with buffer
  const bufferIndex = untokenize(object);
  if (bufferIndex >= 0) {
    return buffers[bufferIndex];
  }

  // Copy array
  if (Array.isArray(object)) {
    return object.map(element => unpackJsonArrays(element, buffers, options));
  }

  // Copy object
  if (object !== null && typeof object === 'object') {
    const newObject = {};
    for (const key in object) {
      newObject[key] = unpackJsonArrays(object[key], buffers, options);
    }
    return newObject;
  }

  return object;
}
