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
export class NodLidarConverter {
  constructor(options) {
    this.LIDAR_POINTS = '/lidar/points';
    this.options = options;
    this.prevPoints = {positions : [], colors : []};
  }

  log(...msg) {
    const {logger} = this.options;
    if (logger && logger.log) {
      logger.log(...msg);
    }
  }

  _parsePoints(size, buf) {
    const pointSize = 13;
    var reflectivity;
    var positions = new Array(size);
    var colors = new Array(size);
    for (let i = 0; i < size; i++) {
      positions[i] = [buf.readInt32LE(i * pointSize), buf.readInt32LE(i * pointSize + 4), buf.readInt32LE(i * pointSize + 8)];
      reflectivity = buf.readUInt8(i * pointSize + 12) / 255;
      colors[i] = [80 + reflectivity * 80, 80 + reflectivity * 80, 80 + reflectivity * 60];
    }
    return {positions, colors}
  }

  async convertMessage(message, xvizBuilder) {
    if (!message) {
      return;
    }
    var lidarData;
    if (message.datatype == 3) {
      const {positions, colors} = this._parsePoints(message.lidar.size, message.lidar.lidarPoints);
      lidarData = {positions, colors};
      this.prevPoints = lidarData;
    } else {
      lidarData = this.prevPoints;
    }
    if (lidarData.positions.length == 0) {
      return;
    }
    xvizBuilder
      .primitive(this.LIDAR_POINTS)
      .points(lidarData.positions)
      .colors(lidarData.colors);
  }

  getMetadata(xvizMetaBuilder) {
    const xb = xvizMetaBuilder;
    xb.stream(this.LIDAR_POINTS)
      .category('primitive')
      .type('point')
      .streamStyle({
        fill_color: '#00ffff',
        radius_pixels: 3
      })
      .coordinate('IDENTITY');
  }
}
