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
 * NOTE: This is insecure because it reads and servesany repo file.
 * NOTE: This is inefficient because it reads from disk on each request.
 */
function serve(request, response) {
  var url = request.url;
  var rel = url.substr(1);
  var path = 'index.html';
  if (rel) {
    if (rel.substr(0, 4) === 'room') {
      path = 'room.html';
    } else if (rel.substr(0, 5) === 'alexa') {
      rooms['alexa'][0].emit('alexa-plop', {shape: rel.substr(6)});
      response.end();
      return;
    } else {
      path = rel;
    }
  }
  fs.readFile(path, function(error, content) {
    if (error) {
      response.statusCode = 404;
      response.end('Page not found');
    }
    response.end(content);
  });
}

io.on('connection', function(client) {
  client.on('stroke', function(data) {
    for (var i = 0; i < client.room.length; i++) {
      if (client.room[i].id !== client.id) {
        client.room[i].emit('stroke', data);
      }
    }
  });

  client.on('room', function(data) {
    var room;
    if (rooms[data.room] === undefined) {
      room = rooms[data.room] = [client];
    } else {
      room = rooms[data.room];
      room.push(client);
    }
    client.on('disconnect', function() {
      for (var i = 0; i < client.room.length; i++) {
        if (client.room[i] === client) {
          client.room.splice(i, 1);
        }
      }
      console.log('disconnect', client.id, room.map(function(x) {
        return x.id
      }));
    });
    client.room = room;
    console.log('connect', client.id, room.map(function(x) {
      return x.id
    }));
  });
});
