var jsdom = require('jsdom')
var request = require('request')
var fs = require("fs")
var unzip = require('unzip')
var glob = require('glob')
var stl = require('stl')
var Json2obj = require('obj-exporter').default
var stream = require('stream')

module.exports = function (text, client) {
  log.info('search: ' + text)
  // TODO: Also do POST requests to /ajax/search/results/ to get more than 12.
  var q = encodeURIComponent(text)
  var url = 'http://www.thingiverse.com/search?q=' + q + '&sa='
  request(url, function(error, response, body) {
    if (error) {
      log.error(error)
    }
    jsdom.env(body, [], function(err, window) {
      var results = []
      var document = window.document
      var things = document.querySelectorAll('.thing')
      for (var i = 0, l = things.length; i < 4 && i < l; i++) {
        results.push(new Promise(function(resolve) {
          var thing = things[i]
          var img = thing.querySelector('.thing-img')
          var id = thing.getAttribute('data-thing-id')
          var title = thing.getAttribute('title')
          var imgUrl = img.getAttribute('data-cfsrc')
            .replace('https://cdn.thingiverse.com', '/thing')
          var thingUrl = 'http://www.thingiverse.com/thing:' + id + '/zip'
          var output = __dirname + "/../public/things/" + id + '/';


          var finish = function(count) {
            var paths = []
            for (var i = 0; i < count; i++) {
              paths.push({
                name: 'thing-' + id + '-' + i,
                path: '/things/' + id + '/' + i
              });
            }
            resolve({ id: id, title: title, img: imgUrl, paths: paths })
          }

          if (!fs.existsSync(output)) {
            var process = function() {
              glob(output + '**/*.[sS][tT][lL]', function(err, files) {
                var objPromises = [];
                for (var i = 0; i < files.length; i++) {
                  objPromises.push(new Promise(function(objResolve) {
                      fs.createReadStream(files[i])
                        .pipe(stl.createParseStream())
                        .pipe(stream.Transform({
                          writableObjectMode: true,
                          readableObjectMode: true,
                          transform: function(chunk, encoding, done) {
                            if (chunk.normal || chunk.verts) {
                              var vertices = []
                              for (var j = 0; j < chunk.verts.length; j++) {
                                var vert = chunk.verts[j]
                                vertices.push({
                                  x: vert[0] / 15,
                                  y: vert[1] / 15,
                                  z: vert[2] / 15,
                                })
                              }
                              this.push({
                                vertices: vertices,
                                normal: {
                                  x: chunk.normal[0],
                                  y: chunk.normal[1],
                                  z: chunk.normal[2],
                                }
                              })
                            }
                            done()
                          }
                        }))
                        .pipe(new Json2obj())
                        .pipe(fs.createWriteStream(output + i + '.obj'))
                        .on('finish', function() {
                          objResolve(i);
                        })
                        .on('error', function() {
                          objResolve(null);
                        })

                      fs.writeFile(output + i + '.mtl',
                        "newmtl None\n" +
                        "Ns 0\n" +
                        "Ka 0.000000 0.000000 0.000000\n" +
                        "Kd 0.8 0.8 0.8\n" +
                        "Ks 0.8 0.8 0.8\n" +
                        "d 1\n" +
                        "illum 2\n")
                    }
                  ))
                }
                Promise.all(objPromises).then(function(vals) {
                  finish(vals.length)
                })
              })
            }

            request(thingUrl)
              .pipe(unzip.Extract({ path: output }))
              .on('finish', process)
              .on('error', process)
          } else {
            glob(output + '**/*.obj', function(err, files) {
              finish(files.length)
            })
          }
        }))
      }
      Promise.all(results).then(function(res) {
        client.to('search-results', res)
      })
    })
  })
}
