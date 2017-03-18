var express = require('express')
var http = require('http')
var https = require('https')
var fs = require('fs')
var chug = require('chug')
var JSON = require('lighter-json')
var ip = require('ip').address()
var app = express()
var io = new (require('socket.io'))()

var key = fs.readFileSync('config/ssl.key')
var cert = fs.readFileSync('config/ssl.crt')
var ports = [8888, 8443]

app.config = require('lighter-config')
global.app = app
global.io = io
global.log = require('cedar')()

ports.forEach(function (port, ssl) {
  var server = ssl
    ? https.createServer({key: key, cert: cert}, app)
    : http.createServer(app)

  server.listen(port, function () {
    var protocol = ssl ? 'https:' : 'http:'
    log('Listening at ' + (protocol + '//' + ip + ':' + port + '/').cyan)
  })
  io.attach(server)
})

require('./lib/state')
require('./lib/errors')
require('./lib/io')
var load = require('./lib/load')
