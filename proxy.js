var ip = require('ip');
var bouncy = require('bouncy');
var argv = require('yargs').argv;

var remote = new Host({
  host: argv.host || argv.h || '0.0.0.0',
  port: 8080
});

var local = new Host({
  host: ip.address(),
  port: 8888
});

function Host (options) {
  this.protocol = options.protocol || 'http:';
  this.host = options.host || '0.0.0.0';
  this.port = options.port;
}

Host.prototype.toString = function () {
  return this.protocol + '//' + this.host + ':' + this.port;
};

bouncy(function (request, response, bounce) {
  console.log(request.method + ' ' + request.url);
  bounce(remote);
}).listen(local.port);

console.log('Listening at ' + local);
console.log('Proxying to ' + remote);
