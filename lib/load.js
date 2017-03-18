var fs = require('fs')
var http = require('http')
var chug = require('chug')
var ltl = require('ltl')
var config = require('lighter-config')
var state = require('./state').prototype
var viewsJs

app.use(chug.middleware)
chug.setLog(log)
load()

var views = app.views = ltl.cache

app.get('/', function (request, response) {
  response.view('index')
})
app.get('/views.js', function (request, response) {
  response.end(viewsJs)
})

function load () {
  exports.public = chug('public').route()
  // exports.vendor = chug('vendor').route()
  exports.views = chug('views')
    .compile({
      space: config.isProduction ? '' : '  '
    })
    .each(function (asset) {
      if (asset.compiledContent) {
        var url = asset.path.replace(/(^views|(index)?\.ltl$)/g, '')
        asset.route(url)
      }
    })
    .then(function () {
      viewsJs = 'window.views=' + JSON.scriptify(app.views)
      io.emit('load:loaded')
    })

  for (var key in exports) {
    Object.defineProperty(state, key, {
      enumerable: false,
      configurable: true,
      writable: true,
      value: exports[key]
    })
  }

  chug([
    'node_modules/cute/cute.js',
    'node_modules/aframe/dist/aframe-master.js',
    'node_modules/socket.io-client/dist/socket.io.min.js'
  ])
  .each(function (asset) {
    chug.cache.set(asset.location, asset)
    var path = asset.path.replace(/^.*\//, '/')
    asset.route(path)
  })
}

http.ServerResponse.prototype.view = function (name) {
  var html
  var views = app.views
  var state = this.state
  if (!views[name]) {
    name = 'error404'
  }
  try {
    html = views[name](state, state)
  } catch (error) {
    log.error(error)
    state.error = error
    html = views.error500(state, state)
  }
  this.setHeader('Content-Type', 'text/html')
  this.end(html)
}

// Listen for "lighter-run" changes.
process.stdin.on('data', function (chunk) {
  var change = JSON.parse(chunk.toString())
  var path = change.path
  var asset = chug.cache.get(path)
  if (asset) {
    asset.readFile()
    asset.then(load)
  } else {
    load()
  }
})
