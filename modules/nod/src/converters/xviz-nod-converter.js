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
import {NodGPSConverter} from './nod-gps-converter';
import {NodImageConverter} from './nod-image-converter';
import {getDeclarativeUI} from './declarative-ui';
import {XVIZBuilder, XVIZMetadataBuilder} from '@xviz/builder';

export class XVIZNodConverter {
  constructor(options, {disabledStreams, fakeStreams, imageMaxWidth = 320, imageMaxHeight = 200}) {
    this.options = options;
    this.disabledStreams = disabledStreams;
    this.fakeStreams = fakeStreams;
    this.imageOptions = {
      maxWidth: imageMaxWidth,
      maxHeight: imageMaxHeight
    };

    this.metadata = null;
    this.cameraName = 'image_00';
  }

  log(...msg) {
    const {logger} = this.options;
    if (logger && logger.log) {
      logger.log(...msg);
    }
  }

  initialize() {
    // These are the converters for the various data sources.
    // Notice that some data sources are passed to others when a data dependency
    // requires coordination with another data source.
    const gpsConverter = new NodGPSConverter(this.options);

    // Note: order is important due to data deps on the pose
    this.converters = [
      gpsConverter,
      new NodImageConverter(this.cameraName, this.imageOptions, this.options)
    ];
  }

  async convertMessage(message_data, datatype) {
    // The XVIZBuilder provides a fluent API to construct objects.
    // This makes it easier to incrementally build objects that may have
    // many different options or variant data types supported.
    const xvizBuilder = new XVIZBuilder({
      metadata: this.metadata,
      disabledStreams: this.disabledStreams
    });

    var pose = [];
    var image = {};
    var datatype = message_data.readUInt8(0);
    var offset = 1; // byte offset
    if (datatype == 1) {
      // Expects pose data: datatype, timestamp, pose (px py pz qx qy qz qw)
      pose.push(parseInt(message_data.readBigUInt64LE(offset)));
      offset = offset + 8;
      while (offset < message_data.length) {
        pose.push(message_data.readDoubleLE(offset));
        offset = offset + 8;
      }
    } else {
      // Expects camera data: datatype, timestamp, rows, cols, channels, image
      const timestamp = parseInt(message_data.readBigUInt64LE(offset));
      offset = offset + 8;
      const rows = parseInt(message_data.readBigUInt64LE(offset));
      offset = offset + 8;
      const cols = parseInt(message_data.readBigUInt64LE(offset));
      offset = offset + 8;
      const channels = parseInt(message_data.readBigUInt64LE(offset));
      offset = offset + 8;
      const image_data_buffer = message_data.subarray(offset);

      image = {
                timestamp : timestamp,
                rows : rows,
                cols : cols,
                channels : channels,
                imageData : image_data_buffer
              };
    }

    var message = {pose: pose, image: image};
    // As builder instance is shared across all the converters, to avoid race conditions',
    // Need wait for each converter to finish
    for (let i = 0; i < this.converters.length; i++) {
      await this.converters[i].convertMessage(message, xvizBuilder);
    }

    try {
      const frm = xvizBuilder.getMessage();
      return frm;
    } catch (err) {
      return null;
    }
  }

  getMetadata() {
    const xb = new XVIZMetadataBuilder();
    this.converters.forEach(converter => converter.getMetadata(xb));
    xb.ui(getDeclarativeUI({fakeStreams: this.fakeStreams}));
    xb.logInfo({
      description: 'Conversion of live Nod data into XVIZ',
    });
    return xb.getMetadata();
  }
}