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
export class NodGPSConverter {
  constructor(options) {
    // XVIZ stream names produced by this converter
    this.poses = [];
    this.options = options;
    this.VEHICLE_ACCELERATION = '/vehicle/acceleration';
    this.VEHICLE_VELOCITY = '/vehicle/velocity';
    this.VEHICLE_TRAJECTORY = '/vehicle/trajectory';
    this.VEHICLE_WHEEL = '/vehicle/wheel_angle';
    this.VEHICLE_AUTONOMOUS = '/vehicle/autonomy_state';
  }

  log(...msg) {
    const {logger} = this.options;
    if (logger && logger.log) {
      logger.log(...msg);
    }
  }

  getPoses() {
    return this.poses;
  }

  _getPoseTrajectory() {
    const poses = [];
    for (let i = 0; i < this.poses.length; i++) {
      const currPose = this.poses[i];
      poses.push([currPose.x, currPose.y, currPose.z]);
    }
    return poses;
  }

  quaternionToEulerAngle(w, x, y, z) {
    const ysqr = y * y;
    const t0 = -2.0 * (ysqr + z * z) + 1.0;
    const t1 = 2.0 * (x * y + w * z);
    let t2 = -2.0 * (x * z - w * y);
    const t3 = 2.0 * (y * z + w * x);
    const t4 = -2.0 * (x * x + ysqr) + 1.0;

    t2 = t2 > 1.0 ? 1.0 : t2;
    t2 = t2 < -1.0 ? -1.0 : t2;

    const pitch = Math.asin(t2);
    const roll = Math.atan2(t3, t4);
    const yaw = Math.atan2(t1, t0);

    return [roll, pitch, yaw];
  }

  async convertMessage(message, xvizBuilder) {
    if (!message) {
      return;
    }

    // Just image data, use previous pose
    var pose = {};
    var poseTrajectory = [];
    if (message.pose.length == 0) {
      if (this.poses.length == 0) { // Don't sent without pose data
        pose = {
          timestamp : message.image.timestamp / 1e9,
          x: Number.MAX_VALUE,
          y: Number.MAX_VALUE,
          z: Number.MAX_VALUE,
          roll: Number.MAX_VALUE,
          pitch: Number.MAX_VALUE,
          yaw: Number.MAX_VALUE
        };
        poseTrajectory = [[Number.MAX_VALUE, Number.MAX_VALUE, Number.MAX_VALUE]];
        // return;
      } else { // If message doesn't have pose data, send previous pose
        var prev_pose = this.poses[this.poses.length-1];
        pose = {
          timestamp : prev_pose.timestamp,
          x: prev_pose.x,
          y: prev_pose.y,
          z: prev_pose.z,
          roll: prev_pose.roll,
          pitch: prev_pose.pitch,
          yaw: prev_pose.yaw
        };
        poseTrajectory = this._getPoseTrajectory();
      }
    } else {
      var [timestamp, x, y, z, qx, qy, qz, qw] = message.pose;
      timestamp = timestamp / 1e9;
      const [roll, pitch, yaw] = this.quaternionToEulerAngle(qw, qx, qy, qz);
      pose = {
        timestamp,
        x,
        y,
        z,
        roll,
        pitch,
        yaw
      };

      this.poses.push(pose);
      poseTrajectory = this._getPoseTrajectory();
    }

    // Every message *MUST* have a pose. The pose can be considered
    // the core reference point for other data and usually drives the timing
    // of the system.
    // const rotation = quaternionToEuler(message.pose.orientation);
    xvizBuilder
      .pose('/vehicle_pose')
      .timestamp(pose.timestamp)
      .position(pose.x, pose.y, pose.z)
      .orientation(pose.roll, pose.pitch, pose.yaw);

    xvizBuilder.primitive(this.VEHICLE_TRAJECTORY).polyline([[pose.x, pose.y, pose.z]]);
  }

  getMetadata(xvizMetaBuilder) {
    // You can see the type of metadata we allow to define.
    // This helps validate data consistency and has automatic
    // behavior tied to the viewer.
    const xb = xvizMetaBuilder;
    xb.stream('/vehicle_pose')
      .category('pose')

      .stream(this.VEHICLE_TRAJECTORY)
      .category('primitive')
      .type('polyline')
      .coordinate('IDENTITY')

      // This styling information is applied to *all* objects for this stream.
      // It is possible to apply inline styling on individual objects.
      .streamStyle({
        stroke_color: '#79FFBC', //'#47B27588',
        stroke_width: this.options.strokewidth,
        stroke_width_min_pixels: this.options.strokewidth,
        stroke_width_max_pixels: this.options.strokewidth+0.2,
      });
  }
}
