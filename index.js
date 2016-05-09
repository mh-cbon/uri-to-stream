var miss  = require('mississippi');
var http  = require('http');
var net   = require('net');
var url   = require('url');
var ip    = require('ip');

var uriToReadStream = function (uri, opts) {
  var stream;
  if (uri.match(/^http/)) {
    stream = miss.through();
    var options = Object.assign({}, opts, url.parse(uri));
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

  } else if (uri.match(/^tcp/)) {
    uri = url.parse(uri);
    var host = uri.hostname || uri.host;
    var options = Object.assign({}, opts, {
      port: uri.port,
      host: host,
      family: (ip.isV4Format(host) && '4') || (ip.isV6Format(host) && '6') || null
    })
    stream = net.createConnection(options);

  } else {
    stream = require('fs').createReadStream(uri, opts);
  }
  return stream;
}
var uriToWriteStream = function (uri, opts) {
  var stream;
  if (uri.match(/^http/)) {
    if(typeof(opts)==='string') opts = {method: opts};
    var options = Object.assign({}, opts, url.parse(uri));
    delete options.host;
    if(!options.method) options.method = 'POST';
    // not that GET won t let you write.
    stream = http.request(options)

  } else if (uri.match(/^tcp/)) {
    stream = miss.through();
    uri = url.parse(uri);
    var host = uri.hostname || uri.host;
    var options = Object.assign({}, opts, {
      port: uri.port,
      host: host,
      family: (ip.isV4Format(host) && '4') || (ip.isV6Format(host) && '6') || null
    })
    stream = net.createConnection(options)
  } else {
    stream = require('fs').createWriteStream(uri, opts);
  }
  return stream;
}

module.exports = {
  read:   uriToReadStream,
  write:  uriToWriteStream
};
