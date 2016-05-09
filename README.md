# uri-to-stream

Transforms an uri string to a stream

# install

```
npm i @mh-cbon/uri-to-stream --save
```

# usage

```js
var uriToStream = require('uri-to-stream');

uriToStream.read(__dirname + '/index.js').pipe(process.stdout);
uriToStream.read('http://google.com').pipe(process.stdout);
// uriToStream.read('tcp://something.to.read:1337');


uriToStream.write(__dirname + '/test/write').end('tomate');
uriToStream.write('http://google.com').end('yahoo');
// uriToStream.write('tcp://something.to.write:1337');

```
