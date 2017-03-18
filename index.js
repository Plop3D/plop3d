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
    log('Listening at ' + ('http://' + ip + ':' + port + '/').cyan)
  })
  io.attach(server)
})

require('./lib/state')
require('./lib/errors')
require('./lib/io')
var load = require('./lib/load')

var stl = require('stl')
var path = '/Users/sam/Documents/Making/BottleOpeners/Whistle/BLW-Coarse.stl'
var object = stl.toObject(fs.readFileSync(path))
var faces = object.facets
for (var i = 0, l = faces.length; i < l; i++) {
  var face = faces[i].verts
  for (var j = 0; j < 3; j++) {
    var point = face[j]
    face[j] = [(point[0] + 100).toFixed(5) * 1, (point[1] - 100).toFixed(5) * 1, point[2].toFixed(5) * 1]
  }
  faces[i] = face
}
chug.routes.set('/whistle.json', {
  mime: 'application/json',
  content: JSON.scriptify(faces)
})
