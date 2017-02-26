var fs = require('fs');
var http = require('http');
var server = http.createServer(serve);
var io = require('socket.io')(server);
var port = process.env.PORT || 8080;
var ip = require('ip').address();

// Start listening for requests.
server.listen(port);
console.log('Listening at http://' + ip + ':' + port);

var rooms = {};

/**
 * Handle an HTTP request for a static resource.
 * NOTE: This is insecure because it reads and serves any repo file.
 * NOTE: This is inefficient because it reads from disk on each request.
 */
function serve (request, response) {
  var url = request.url;
  var rel = url.substr(1);
  var path = rel || 'index.html';
  var parts = rel.split('/');
  var section = parts[0];
  switch (section) {
    case 'room':
      path = 'room.html';
      break;
    case 'plop':
      var name = parts[2];
      var room = rooms[parts[2]];
      if (room) {
        var shape = parts[1];
        console.log('Plop ' + shape + ' in ' + name + '(' + room.length + ')');
        room.forEach(function (client) {
          client.emit('plop', shape);
        });
      }
      return response.end('OK');
  }
  fs.readFile(path, function (error, content) {
    if (error) {
      response.statusCode = 404;
      response.end('Page not found');
    }
    response.end(content);
  });
}

io.on('connection', function (client) {
  client.on('stroke', function (data) {
    var room = client.room;
    for (var i = 0, l = room.length; i < l; i++) {
      var peer = room[i];
      if (peer.id !== client.id) {
        peer.emit('stroke', data);
      }
    }
  });

  client.on('join', function (name) {
    var room = rooms[name] || (rooms[name] = []);
    client.room = room;
    room.push(client);
    console.log('Joined ' + name + '(' + room.length + '): ' + client.id);
    client.on('disconnect', function () {
      for (var i = 0, l = room.length; i < l; i++) {
        if (room[i] === client) {
          room.splice(i, 1);
          break;
        }
      }
      console.log('Left ' + name + '(' + room.length + '): ' + client.id);
    });
  });
});
