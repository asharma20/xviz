# Nod module

Converts raw buffer pose, image data into xviz data and sends to visualizer.

## Server quick start

You need [Node.js](https://nodejs.org/en/) and [yarn](https://yarnpkg.com/lang/en/docs/install) to
run the examples.

```bash
# Clone XVIZ
$ cd xviz

# Install dependencies and build
$ yarn bootstrap
```

Start live XVIZ server:

```bash
# Start server
$ ./modules/server/bin/babel-xvizserver --live --port [visualizer port] -s [url of incoming data]
$ ./modules/server/bin/babel-xvizserver --live --port 8081 -s 'ws://localhost:9997'

```

## Visualizer

```bash
# Clone streetscape.gl
$ cd streetscape.gl

# Install dependencies and build
$ yarn bootstrap

# Link custom xviz parser to streetscape.gl for visualizer
$ cd xviz/modules/parser
$ npm link
$ cd ../../../streetscape.gl
$ npm link @xviz/parser
$ cd examples/website-demo
$ npm link @xviz/parser
```

Start live XVIZ client:

```bash
# Start client
$ cd streetscape.gl/examples/website-demo/
$ yarn start-live-local
$ yarn start-live-local [--env.port=port number] [--env.maxConcurrency=number of workers]

```

## NPM Scripts

- `bootstrap` - install dependencies and build
- `build` - rebuild all modules