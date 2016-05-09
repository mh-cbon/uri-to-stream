require('should')

var fs    = require('fs');
var http  = require('http');
var net   = require('net');
var uriToStream = require('../index.js');

describe('uri-to-stream readable', function () {

  it('should read a file', function (done) {
    var content = '';
    var events = '';
    uriToStream.read('./index.js')
    .on('end', function () {
      events+= 'end'
    })
    .on('close', function () {
      events+= 'close'
    })
    .on('open', function () {
      events+= 'open'
    })
    .on('data', function (d) {
      content += d.toString();
    })
    .on('close', function () {
      content.should.match(/var miss  = /);
      events.should.eql('openendclose')
      done();
    })
  })

  it('should emit error for a file not found', function (done) {
    var err = '';
    var events = '';
    uriToStream.read('./nop.js')
    .on('end', function () {
      events+= 'end'
    })
    .on('close', function () {
      events+= 'close'
    })
    .on('open', function () {
      events+= 'open'
    })
    .on('error', function (e) {
      err = e
      events.should.eql('')
      done();
    })
  })

  it('should read an url', function (done) {
    var server = http.createServer((req, res) => {
      res.end('hello world');
      server.close();
    });
    server.listen(8000, function () {
      var content = '';
      var events = '';
      var headers = null;
      var response = null;
      uriToStream.read('http://127.0.0.1:8000/')
      .on('end', function () {
        events+= 'end'
      })
      .on('close', function () {
        events+= 'close'
      })
      .on('open', function () {
        events+= 'open'
      })
      .on('headers', function (h) {
        events+= 'headers';
        headers = h;
      })
      .on('response', function (r) {
        events+= 'response';
        response = r;
      })
      .on('data', function (d) {
        content += d.toString();
      })
      .on('end', function () {
        events.should.eql('openresponseheadersend');
        (headers && headers.connection).should.eql('close');
        (response && response.statusCode).should.eql(200);
        done();
      })
    });
  })

  it('should emit error if the url is not served', function (done) {
    var err = '';
    var events = '';
    uriToStream.read('http://127.0.0.1:3232/')
    .on('end', function () {
      events+= 'end'
    })
    .on('close', function () {
      events+= 'close'
    })
    .on('headers', function (h) {
      events+= 'headers';
      headers = h;
    })
    .on('response', function (r) {
      events+= 'response';
      response = r;
    })
    .on('open', function () {
      events+= 'open'
    })
    .on('error', function (e) {
      err = e
      events.should.eql('')
      done();
    })
  })

  it('should read a 404 url', function (done) {
    var server = http.createServer((req, res) => {
      res.writeHead(404, 'not found')
      res.end('hello world');
      server.close();
    });
    server.listen(8000, function () {
      var content = '';
      var events = '';
      var headers = null;
      var response = null;
      uriToStream.read('http://127.0.0.1:8000/')
      .on('end', function () {
        events+= 'end';
      })
      .on('headers', function (h) {
        events+= 'headers';
        headers = h;
      })
      .on('response', function (r) {
        events+= 'response';
        response = r;
      })
      .on('close', function () {
        events+= 'close';
      })
      .on('open', function () {
        events+= 'open';
      })
      .on('data', function (d) {
        content += d.toString();
      })
      .on('end', function () {
        content.should.match(/^hello world$/);
        events.should.eql('openresponseheadersend');
        (headers && headers.connection).should.eql('close');
        (response && response.statusCode).should.eql(404);
        done();
      })
    });
  })

  it('should read a tcp socket via ipv4', function (done) {
    var server = net.createServer((c) => {
      c.end('hello world');
      server.close();
    });
    server.listen(8124, '127.0.0.1', () => {
      var content = '';
      var events = '';
      uriToStream.read('tcp://127.0.0.1:8124/')
      .on('end', function () {
        events+= 'end'
      })
      .on('close', function () {
        events+= 'close'
      })
      .on('open', function () {
        events+= 'open'
      })
      .on('data', function (d) {
        content += d.toString();
      })
      .on('close', function () {
        content.should.match(/^hello world$/);
        events.should.eql('endclose')
        done();
      })
    });
  })

  it('should read a tcp socket via ipv6', function (done) {
    var server = net.createServer((c) => {
      c.end('hello world');
      server.close();
    });
    server.listen(8124, '::1', () => {
      var content = '';
      var events = '';
      uriToStream.read('tcp://[::1]:8124/')
      .on('end', function () {
        events+= 'end'
      })
      .on('close', function () {
        events+= 'close'
      })
      .on('open', function () {
        events+= 'open'
      })
      .on('data', function (d) {
        content += d.toString();
      })
      .on('close', function () {
        content.should.match(/^hello world$/);
        events.should.eql('endclose')
        done();
      })
    });
  })

  it('should emit error if the tcp socket is not served', function (done) {
    var err = '';
    var events = '';
    uriToStream.read('tcp://127.0.0.1:3232/')
    .on('end', function () {
      events+= 'end'
    })
    .on('close', function () {
      events+= 'close'
    })
    .on('open', function () {
      events+= 'open'
    })
    .on('error', function (e) {
      err = e
      events.should.eql('')
      done();
    })
  })

});


describe('uri-to-stream writable', function () {
  after(function (done) {
    fs.unlink(__dirname + '/var/write', function () {
      done()
    })
  })
  it('should write a file', function (done) {
    var events = '';
    var file = __dirname + '/var/write';
    uriToStream.write(file)
    .on('open', function () {
      events+= 'open'
    })
    .on('data', function (d) {
      content += d.toString();
    })
    .on('error', done)
    .on('end', function () {
      events+= 'end'
    })
    .on('close', function () {
      events+= 'close'
    })
    .on('close', function () {
      fs.readFile(file, function (err, content) {
        (!err).should.eql(true)
        events.should.eql('openclose')
        content.toString().should.eql('some content')
        done();
      })
    })
    .end('some content')
  })

  it('should emit error if the file is not writable', function (done) {
    var err = '';
    var events = '';
    uriToStream.write('/nop.js')
    .on('end', function () {
      events+= 'end'
    })
    .on('close', function () {
      events+= 'close'
    })
    .on('open', function () {
      events+= 'open'
    })
    .on('error', function (e) {
      err = e
      events.should.eql('')
      done();
    })
  })

  it('should write an url', function (done) {
    var events = '';
    var contentWrite = '';
    var contentRead = '';
    var server = http.createServer((req, res) => {
      req.on('data', function (d) {
        contentWrite += d.toString();
      });
      res.end('hello you');
      server.close();
    });
    server.listen(8000, '127.0.0.1', function () {
      uriToStream.write('http://127.0.0.1:8000/')
      .on('end', function () {
        events+= 'end'
      })
      .on('close', function () {
        events+= 'close'
      })
      .on('open', function () {
        events+= 'open'
      })
      .on('response', function (response) {
        events+= 'response'
        response.on('data', function (d) {
          contentRead += d.toString();
        });
      })
      .on('close', function () {
        events.should.eql('responseclose')
        contentWrite.should.eql('hello world')
        contentRead.should.eql('hello you')
        done();
      })
      .end('hello world');
    });
  })

  it('should emit error if the url is not served', function (done) {
    var events = '';
    var e;
    uriToStream.write('http://127.0.0.1:6546/')
    .on('error', function (err) {
      e = err;
    })
    .on('end', function () {
      events+= 'end'
    })
    .on('close', function () {
      events+= 'close'
    })
    .on('open', function () {
      events+= 'open'
    })
    .on('response', function (response) {
      events+= 'response'
    })
    .on('close', function () {
      (!e).should.eql(false);
      events.should.eql('close');
      done();
    })
    .end('hello world');
  })

  it('should write a tcp socket via ipv4', function (done) {
    var contentWrite = '';
    var contentRead = '';
    var events = '';
    var server = net.createServer((c) => {
      c.on('data', function (d) {
        contentWrite += d.toString();
      })
      c.end('hello you');
      server.close();
    });
    server.listen(8124, '127.0.0.1', () => {
      uriToStream.write('tcp://127.0.0.1:8124/')
      .on('end', function () {
        events+= 'end'
      })
      .on('close', function () {
        events+= 'close'
      })
      .on('open', function () {
        events+= 'open'
      })
      .on('data', function (d) {
        contentRead += d.toString();
      })
      .on('close', function () {
        contentWrite.should.match(/^hello world$/);
        contentRead.should.match(/^hello you$/);
        events.should.eql('endclose')
        done();
      }).write('hello world');
    });
  })

  it('should write a tcp socket via ipv6', function (done) {
    var contentWrite = '';
    var contentRead = '';
    var events = '';
    var server = net.createServer((c) => {
      c.on('data', function (d) {
        contentWrite += d.toString();
      })
      c.end('hello you');
      server.close();
    });
    server.listen(8124, '::1', () => {
      uriToStream.write('tcp://[::1]:8124/')
      .on('end', function () {
        events+= 'end'
      })
      .on('close', function () {
        events+= 'close'
      })
      .on('open', function () {
        events+= 'open'
      })
      .on('data', function (d) {
        contentRead += d.toString();
      })
      .on('close', function () {
        contentWrite.should.match(/^hello world$/);
        contentRead.should.match(/^hello you$/);
        events.should.eql('endclose')
        done();
      }).write('hello world');
    });
  })

  it('should emit error if the tcp socket is not served', function (done) {
    var err = '';
    var events = '';
    uriToStream.write('tcp://127.0.0.1:3232/')
    .on('end', function () {
      events+= 'end'
    })
    .on('close', function () {
      events+= 'close'
    })
    .on('open', function () {
      events+= 'open'
    })
    .on('error', function (e) {
      err = e
      events.should.eql('')
      done();
    })
  })

});
