var fs = require('fs');
var http = require('http');
var server = http.createServer(serve);
var io = require('socket.io')(server);
var port = process.env.PORT || 8080;
var ip = require('ip').address();

// Start listening for requests.
server.listen(port);
console.log('Listening at http://' + ip + ':' + port);

/**
 * Handle an HTTP request for a static resource.
 * NOTE: This is insecure because it reads and servesany repo file.
 * NOTE: This is inefficient because it reads from disk on each request.
 */
function serve (request, response) {
  var url = request.url;
  var rel = url.substr(1);
  var path = 'index.html';
  if(rel){
    if(rel.substr(0, 4) === 'room'){
      path = 'room.html';
    }
    else {
      path = rel;
    }
  }
  fs.readFile(path, function (error, content) {
    if (error) {
      response.statusCode = 404;
      response.end('Page not found');
    }
    response.end(content);
  });
}


// var rooms = {};
// var initroom = {};
//
// io.on('connection', function (client) {
//   client.on('stroke', function(data) {
//     if(client.room){
//       for(var i = 0; i < client.room.length; i++){
//         client.room[i].emit('stroke', data);
//       }
//     }
//   });
//
//   client.on('room', function(data) {
//     var room;
//     if(rooms[data.room] === undefined){
//       room = rooms[data.room] = [client];
//     } else {
//       room = rooms[data.room];
//       room.push(client);
//     }
//     client.on('disconnection', function() {
//       for(var i = 0; i < room.length; i++){
//         if(room[i] === client){
//           room.splice(i, 1);
//         }
//       }
//     });
//     if(room.length > 0){
//       var init_id = Math.floor(Math.random() * 1000);
//       initroom[init_id] = {
//         from: room[0],
//         to: client
//       };
//       room[0].emit('pull-state', { id: init_id});
//     }
//     client.room = room;
//   });
//
//   client.on('pull-state-response', function(data) {
//     initroom[data.id].emit('push-state', data.state);
//     delete initroom[data.id];
//   });
//
//   // client.emit('alexa-plop', {shape: 'cubes'});
// });
