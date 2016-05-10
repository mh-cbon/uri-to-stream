var miss  = require('mississippi');
var http  = require('http');
var net   = require('net');
var url   = require('url');
var ip    = require('ip');

var uriToReadStream = function (uri, opts) {
  var stream;
  if (typeof(uri)==='string' && uri.match(/^http/) || uri.protocol && uri.protocol.match(/http/)) {
    stream = miss.through();

    var options;
    if (typeof(uri)==='string') options = Object.assign({}, opts, url.parse(uri));
    else options = Object.assign({}, opts, uri);

    var data = options.data || '';
    delete options.data;
    delete options.host;
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

  } else if (typeof(uri)==='string' && uri.match(/^tcp/) || uri.port && uri.host) {

    var options;
    if (typeof(uri)==='string') {
      uri = url.parse(uri);
      var host = uri.hostname || uri.host;
      var options = Object.assign({}, opts, {
        port: uri.port,
        host: host,
        family: (ip.isV4Format(host) && '4') || (ip.isV6Format(host) && '6') || null
      })
    } else {
      options = Object.assign({}, opts, url.parse(uri));
    }

    stream = net.createConnection(options);

  } else if(typeof(uri)==='string') {
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
  if (typeof(uri)==='string' && uri.match(/^http/) || uri.protocol && uri.protocol.match(/http/)) {

    if(typeof(opts)==='string') opts = {method: opts};
    if(!opts) opts = {}
    if(!opts.method) opts.method = 'POST';

    var options;
    if (typeof(uri)==='string') options = Object.assign({}, opts, url.parse(uri));
    else options = Object.assign({}, opts, uri);

    if(options.hostname) delete options.host;

    // not that GET won t let you write.
    stream = http.request(options)

  } else if (typeof(uri)==='string' && uri.match(/^tcp/) || uri.port && uri.host) {
    stream = miss.through();

    var options;
    if (typeof(uri)==='string') {
      uri = url.parse(uri);
      var host = uri.hostname || uri.host;
      var options = Object.assign({}, opts, {
        port: uri.port,
        host: host,
        family: (ip.isV4Format(host) && '4') || (ip.isV6Format(host) && '6') || null
      })
    } else {
      var options = Object.assign({}, uri)
    }

    stream = net.createConnection(options)

  } else if(typeof(uri)==='string') {
    stream = require('fs').createWriteStream(uri, opts);

  } else {
    process.nextTick(function () {
      stream.emit('error', new Error('unhandled uri : ' + JSON.stringify(uri)))
    })
  }
  return stream;
}

module.exports = {
  read:   uriToReadStream,
  write:  uriToWriteStream
};
