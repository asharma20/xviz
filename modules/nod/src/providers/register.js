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
/* global console */
/* eslint-disable no-console */
import {XVIZProviderFactory} from '@xviz/io';
import {XVIZNodProvider} from './xviz-nod-provider';
//import {DEFAULT_CONVERTERS} from '../messages';

export function registerXVIZNodProvider(
  {converters} = {}
) {

//   let config = null;
//   if (rosConfig) {
//     const data = fs.readFileSync(rosConfig);
//     if (data) {
//       config = JSON.parse(data);
//     }
//   }

//   const ros2xvizFactory = new ROS2XVIZFactory(converters);
//   const rosbagProviderConfig = {
//     rosConfig: config,
//     ros2xvizFactory,
//     BagClass
//   };

  XVIZProviderFactory.addProviderClass(XVIZNodProvider);
}
