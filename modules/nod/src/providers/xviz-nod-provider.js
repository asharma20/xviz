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
import {XVIZData, XVIZEnvelope} from '@xviz/io';
import {XVIZNodConverter} from './../converters/xviz-nod-converter'
import {NodWebsocketSender} from './nod-websocket-sender';
const nano = require('nanomsg');

// Generic iterator that stores context for context for an iterator
class MessageIterator {
  constructor(start, end, increment = 1) {
    this.start = start;
    this.end = end;
    this.increment = increment;
    this.current = start;
  }

  valid() {
    return this.current <= this.end || this.end == -1;
  }

  value() {
    return this.current;
  }

  next() {
    const valid = this.valid();
    if (!valid) {
      return {valid};
    }

    const index = this.current;
    this.current += this.increment;

    return {
      valid,
      index
    };
  }
}

export class XVIZNodProvider {
  constructor(params) {
    this.metadata = null;
    this._valid = false;
    this.options = params.options;
    this.sink_client = new nano.socket('pair');
    this._setupSocket();
    this.socket = params.socket;
    this.visualize_client = new NodWebsocketSender(this.socket, this.options);
  }

  log(...msg) {
    const {logger} = this.options;
    if (logger && logger.log) {
      logger.log(...msg);
    }
  }

  // Read index & metadata
  async init() {
    this.log('Nod Provider, data sink url: ', this.options.sinkurl);
    this.data = [];
    this.converter = new XVIZNodConverter(this.options, {});
    this.converter.initialize();

    if (!this.converter) {
      return;
    }

    this.metadata = this._readMetadata();

    if (this.metadata) {
      this._valid = true;
    } else if (options.d) {
      this._valid = false;
    } else {
      throw new Error('Invalid metadata');
    }
  }

  _setupSocket() {
    var provider = this;
    this.sink_client.connect(this.options.sinkurl);
    this.sink_client.reconn(this.options.reconnect);
    this.sink_client.rcvmaxsize(64 * 1024 * 1024); // 64MiB
    this.sink_client.on('data', function (msg) {
      provider.xvizMessage(msg);
    });
  }

  valid() {
    return this._valid;
  }

  xvizMetadata() {
    return this.metadata;
  }

  async xvizMessage(message) {
    const data = await this.converter.convertMessage(message);
    const xvizData = new XVIZData(XVIZEnvelope.StateUpdate(data));
    if (data && xvizData) {
      this.data.push(xvizData);
      this.visualize_client.sendMessage(xvizData);
      return xvizData;
    }
  }

  // The Provider provides an iterator since
  // different sources may "index" their data independently
  // however all iterators are based on a startTime/endTime
  getMessageIterator({startTime, endTime} = {}, options = {}) {
    return new MessageIterator(0, -1);
  }

  // return Metadata or undefined
  _readMetadata() {
    const data = this.converter.getMetadata();
    if (data) {
      return new XVIZData(data);
    }
    return undefined;
  }

  close() {
    this.socket.close();
    this.sink_client.close();
  }
}