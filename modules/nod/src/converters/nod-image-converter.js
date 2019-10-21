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
const sharp = require('sharp');

export class NodImageConverter {
  constructor(camera = 'image_00', imageOptions, options = {}) {
    this.streamName = `/camera/${camera}`;
    this.options = options;
    this.encoding = this.options.encoding;
    this.imageOptions = imageOptions;
    const buf = new Buffer(this.imageOptions.maxWidth * this.imageOptions.maxHeight * 3);
    this.prevImage = {
      cols : this.imageOptions.maxWidth,
      rows : this.imageOptions.maxHeight,
      imageData : buf
    };
    this.isRawBuffer = true;
  }

  log(...msg) {
    const {logger} = this.options;
    if (logger && logger.log) {
      logger.log(...msg);
    }
  }

  async convertMessage(message, xvizBuilder) {
    var image;
    if (Object.keys(message.image).length === 0 && message.image.constructor === Object) {
      if (this.isRawBuffer) {
        this.prevImage.imageData = await sharp(this.prevImage.imageData, {
            raw: {
                width: this.imageOptions.maxWidth,
                height: this.imageOptions.maxHeight,
                channels: 3
            }
          })
          .jpeg()
          .toBuffer();
      }
      image = this.prevImage;
    } else {
      image = message.image;
    }
    const width = image.cols;
    const height = image.rows;
    const imageData = image.imageData;
    if (imageData === undefined) {
      this.log('ERROR: image is undefined');
      return;
    }
    xvizBuilder
      .primitive(this.streamName)
      .image(nodeBufferToTypedArray(imageData), this.encoding)
      .dimensions(width, height);
    this.prevImage = image;
    this.isRawBuffer = false;
  }

  getMetadata(xvizMetaBuilder) {
    const xb = xvizMetaBuilder;
    xb.stream(this.streamName)
      .category('primitive')
      .type('image');
  }
}

function nodeBufferToTypedArray(buffer) {
  // TODO - per docs we should just be able to call buffer.buffer, but there are issues
  const typedArray = new Uint8Array(buffer);
  return typedArray;
}
