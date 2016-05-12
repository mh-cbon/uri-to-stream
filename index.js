var miss  = require('mississippi');
var http  = require('http');
var net   = require('net');
var url   = require('url');
var ip    = require('ip');

var isHttpUri = function (uri) {
  return typeof(uri)==='string' && uri.match(/^http/) || uri.protocol && uri.protocol.match(/http/);
}
var isTcpUri = function (uri) {
  return typeof(uri)==='number' || typeof(uri)==='string' && uri.match(/^tcp/) || uri.port && uri.host
}
var isFsUri = function (uri) {
  return typeof(uri)==='string'
}
function tcpUriToOpts (uri) {
  var options;
  if (typeof(uri)==='string') {
    uri = url.parse(uri);
    var host = uri.hostname || uri.host;
    options = Object.assign({}, {
      port: uri.port,
      host: host,
      family: (ip.isV4Format(host) && '4') || (ip.isV6Format(host) && '6') || null
    })
  } else if (typeof(uri)==='options') {
    options = Object.assign({}, uri);
  } else {
    options = uri;
  }
  return options;
}
var uriToReadStream = function (uri, opts) {
  var stream;
  if (isHttpUri(uri)) {
    stream = miss.through();

    var options;
    if (typeof(uri)==='string') options = Object.assign({}, opts, url.parse(uri));
    else options = Object.assign({}, opts, uri);
    delete options.host;

    var data = options.data || '';
    delete options.data;

    http.request(options, (res) => {
      stream.emit('open');
      var response = {
        statusCode: res.statusCode,
        statusMessage: res.statusMessage,
        method: res.method,
        httpVersion: res.httpVersion,
      }
      stream.emit('response', response);
      stream.emit('headers', res.headers);
      res.on('end', () => {
        stream.end();
      }).on('error', (e) => {
        stream.emit('error', e);
      })
      res.pipe(stream);
      res.resume();
    }).on('error', (e) => {
      stream.emit('error', e);
    }).end(data);

  } else if (isTcpUri(uri)) {

    var options = Object.assign({}, opts, tcpUriToOpts(uri));
    stream = net.createConnection(options);

  } else if(isFsUri(uri)) {
    stream = require('fs').createReadStream(uri, opts);

  } else {
    process.nextTick(function () {
      stream.emit('error', new Error('unhandled uri : ' + JSON.stringify(uri)))
    })
  }
  return stream;
}
var uriToWriteStream = function (uri, opts) {
  var stream;
  if (isHttpUri(uri)) {

    if(typeof(opts)==='string') opts = {method: opts};
    if(!opts) opts = {}
    if(!opts.method) opts.method = 'POST';

    var options;
    if (typeof(uri)==='string') options = Object.assign({}, opts, url.parse(uri));
    else options = Object.assign({}, opts, uri);

    if(options.hostname) delete options.host;

    // not that GET won t let you write.
    stream = http.request(options)

  } else if (isTcpUri(uri)) {

    var options = Object.assign({}, opts, tcpUriToOpts(uri));
    stream = net.createConnection(options)

  } else if(isFsUri(uri)) {
    stream = require('fs').createWriteStream(uri, opts);

  } else {
    process.nextTick(function () {
      stream.emit('error', new Error('unhandled uri : ' + JSON.stringify(uri)))
    })
  }
  return stream;
}

module.exports = {
  tcpUriToOpts: tcpUriToOpts,
  isHttpUri:    isHttpUri,
  isTcpUri:     isTcpUri,
  isFsUri:      isFsUri,
  read:         uriToReadStream,
  write:        uriToWriteStream
};
