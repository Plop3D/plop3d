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

io.on('connection', function (client) {
  client.on('event', function (data) {
    console.log('event', data);
  });

  var shapesInterval = setInterval(function(){
    client.emit('alexa-plop', {shape: 'cubes'});
  }, 10000);

  client.on('disconnection', function(){
    clearInterval(shapesInterval);
  })
});
