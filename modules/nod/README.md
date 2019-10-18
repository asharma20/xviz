# Nod module

Converts raw buffer pose, image data into xviz data and sends to visualizer.

## Quick start

You need [Node.js](https://nodejs.org/en/) and [yarn](https://yarnpkg.com/lang/en/docs/install) to
run the examples.

```bash
# Clone XVIZ
$ cd xviz

# Install dependencies
$ yarn bootstrap
```

Start live XVIZ server:

```bash
# Start server
$ ./bin/xvizserver --live --port [visualizer port] -s [url of incoming data]
$ ./bin/xvizserver --live --port 8081 -s 'ws://localhost:9997'

```

## NPM Scripts

- `bootstrap` - install dependencies
- `build` - rebuild all modules