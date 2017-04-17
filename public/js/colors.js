// Pixel objects.
var pixels

// TODO: REMOVE
var keepGoing = true
function end (data) {
  console.log(data)
  keepGoing = false
}

// TODO: Expose this API in a package.
Cute.ready(function () {
  var video = Cute.one('#video')
  var canvas = Cute.one('#canvas')
  var context = canvas.getContext('2d')
  var deviceId

  // Canvas dimensions.
  var width, height

  // Fake pixel.
  var out = {color: null}

  var scale = 5, offset = scale / 2, sx, sy
  var smoothing = 5
  var isDrawing = false
  var isGrabbing = false

  // Size everything to the video dimensions.
  Cute.on(video, 'resize', function () {
    width = video.offsetWidth
    height = video.offsetHeight
    canvas.width = width
    canvas.height = height
    sx = -scale / width
    sy = -scale / height
    pixels = new Array(width * height)
    squares = new Array(width * height / 9)
    var n = 0
    for (var y = 0; y < height; y++) {
      for (var x = 0; x < width; x++) {
        pixels[n] = new Pixel(n, x, y)
        n++
      }
    }
    n = 0
    for (y = 0; y < height; y++) {
      for (x = 0; x < width; x++) {
        pixels[n].adjacent = [
          x < width - 1 ? pixels[n + 1] : undefined,
          y < height - 1 ? pixels[n + width] : undefined,
          x > 0 ? pixels[n - 1] : undefined,
          y > 0 ? pixels[n - width]: undefined
        ]
        n++
      }
    }
  })()

  navigator.mediaDevices.enumerateDevices().then(gotDevices).catch(startStreaming)

  // Capture the last camera device ID.
  function gotDevices (devices) {
    Cute.each(devices, function (device) {
      if (device.kind === 'videoinput') {
        deviceId = device.deviceId
      }
    })
    startStreaming()
  }

  // Start streaming camera data.
  function startStreaming () {
    navigator.getUserMedia({
      video: {deviceId: deviceId},
      audio: false
    }, function (stream) {
      try {
        video.src = window.URL.createObjectURL(stream)
      } catch (ignore) {
        video.src = stream
      }
    }, function() {
      throw Error('Failed to get camera.')
    })
  }

  // Copy video contents to canvas, and update using the RGBA data array.
  function draw () {
    try {
      context.drawImage(video, 0, 0, width, height)
      rgba = context.getImageData(0, 0, width, height).data
      update()
      emit()
    } catch (err) {
      console.error(err)
    }
    if (keepGoing) {
      window.requestAnimationFrame(draw)
    }
  }
  draw()

  // Update pixels with a new RGBA array.
  function update () {
    var beforeUpdate = performance.now()
    context.clearRect(0, 0, width, height)

    for (var y = 1; y < height; y += 3) {
      var a = y * width + 1
      var b = (y + 1) * width
      for (var n = a; n < b; n += 3) {
        var pixel = pixels[n]
        pixel.update()
        var color = pixel.color
        if (color) {
          var up = n - width
          var last
          while (up >= 0) {
            last = pixel
            pixel = pixels[up]
            pixel.update()
            if (pixel.color !== color) {
              break
            }
            up -= width
          }
          if (!last.path) {
            var path = new Path(last)
            var list = path.pixels
            var length = list.length
            if (length > 15) {
              for (var i = 0; i < length; i++) {
                var p = list[i]
                context.fillStyle = p.color.name
                context.fillRect(p.x, p.y, 1, 1)
              }
            }
          }
        }
      }
    }

    var afterPaths = performance.now()
    // console.log(afterPaths - beforeUpdate)
  }

  var Path = Cute.type(function Path (start) {
    var color = this.color = start.color
    var list = this.pixels = [start]
    var pixel = start
    var direction = 0
    var l, t = 0
    while (++t < 1e4) {
      var a = pixel.adjacent
      for (var i = 0; i < 4; i++) {
        var p = a[(direction + i) % 4]
        if (p) {
          p.update()
          if (p.color === color) {
            direction = (direction + i + 3) % 4
            pixel = p
            p.path = this
            list.push(p)
            break
          }
        }
      }
      if (pixel === start) {
        break
      }
    }
    if (t > 15) {
      this.update()
    } else {
      this.radius = 0
      this.score = 0
      this.circularity = 0
    }
    color.paths.push(this)
  }, {
    update: function () {
      var list = this.pixels
      var pairs = []
      for (var i = 0, l = Math.floor(list.length / 2); i < l; i++) {
        var a = list[i]
        var b = list[i + l]
        var dx = a.x - b.x
        var dy = a.y - b.y
        pairs.push({a: a, b: b, s: dx * dx + dy * dy})
      }
      pairs.sort(function (a, b) {
        return b.s - a.s
      })
      var xSum = 0
      var ySum = 0
      var dSum = 0
      var n = Math.floor(l / 4)
      pairs.slice(0, n).forEach(function (pair) {
        var a = pair.a
        var b = pair.b
        xSum += a.x + b.x
        ySum += a.y + b.y
        dSum += Math.sqrt(pair.s)
      })
      var x = this.x = xSum / n / 2
      var y = this.y = ySum / n / 2
      var radius = this.radius = dSum / n / 2
      var score = 0
      for (i = 0, l = list.length; i < l; i++) {
        var pixel = list[i]
        dx = x - pixel.x
        dy = y - pixel.y
        score += 1 / (Math.abs(radius - Math.sqrt(dx * dx + dy * dy)) + 1)
      }
      this.score = score
      this.circularity = score / l
    }
  })

  function emit () {
    var shapes = []
    colors.forEach(function (color) {
      var paths = color.paths.sort(function (a, b) {
        return b.score - a.score
      }).slice(0, 2)
      for (i = 0, l = paths.length; i < l; i++) {
        var path = paths[i]
        var pixels = path.pixels
        for (j = 0, m = pixels.length; j < m; j++) {
          var pixel = pixels[j]
          pixel.path = null
        }
        if (path.circularity > 0.35) {
          context.strokeStyle = 'white'
          context.beginPath()
          context.arc(path.x, path.y, path.radius, 0, 2 * Math.PI)
          context.stroke()
          shapes.push({
            color: color.name,
            x: path.x,
            y: path.y,
            size: path.radius * 2
          })
        }
      }
      color.paths = []
    })
    Cute.emit(document, 'shapes', shapes)
  }
})

function byRadius (a, b) {
  return b.radius - a.radius
}

function byFitness (a, b) {
  return b.fitness - a.fitness
}

var Pixel = Cute.type(function Pixel (n, x, y) {
  this.n = n
  this.x = x
  this.y = y
  this.color = null
  this.adjacent = null
  this.path = null
}, {
  update: function () {
    var i = this.n * 4
    var r = rgba[i]
    var g = rgba[i + 1]
    var b = rgba[i + 2]
    var color = null
    var min = Math.min(r, g, b)
    var max = Math.max(r, g, b)
    var d = max - min
    var h
    if (d > 40) {
      switch (max) {
        case r:
          h = (g - b) / d + (g < b ? 6 : 0)
          break
        case g:
          h = (b - r) / d + 2
          break
        case b:
          h = (r - g) / d + 4
          break
      }
      if ((h > 0.8 && h < 1.8) && d > 40) {
        color = YELLOW
      } else if ((h > 1.8 && h < 2.8) && d > 40) {
        color = GREEN
      } else if ((h > 3.4 && h < 4.4) && d > 40) {
        color = BLUE
      }
    }
    this.color = color
  }
})

var Color = Cute.type(function (index, name, hex) {
  this.index = index
  this.name = name
  this.hex = hex
  this.paths = []
}, {})

var fingers = {}

var YELLOW = new Color(0, 'Yellow')
var GREEN = new Color(1, 'ForestGreen')
var BLUE = new Color(2, 'Blue')
var colors = [YELLOW, GREEN, BLUE]
