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
  var width, height, area

  // Current pixel RGBA array, and persistent pixel object array.
  var now, pixels

  var scale = 5, offset = scale / 2, sx, sy
  var smoothing = 5
  var isDrawing = false
  var isGrabbing = false

  // Size the canvas to match the video.
  Cute.on(video, 'resize', function () {
    width = video.offsetWidth
    height = video.offsetHeight
    canvas.width = width
    canvas.height = height
    area = width * height
    sx = -scale / width
    sy = -scale / height
    pixels = new Array(area)
    var n = 0
    for (var y = 0; y < width; y++) {
      for (var x = 0; x < width; x++) {
        pixels[n++] = new Pixel(x, y)
      }
    }
    var a = [-width, -1, 1, width]
    for (n = 0; n < area; n++) {
      var neighbors = pixels[n].neighbors = []
      for (var i = 0; i < 4; i++) {
        var m = n + a[i]
        if (m >= 0 && m < area) {
          neighbors.push(pixels[m])
        }
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

  // Copy video contents to canvas, to get a pixel array.
  function draw () {
    try {
      context.drawImage(video, 0, 0, width, height)
      now = context.getImageData(0, 0, width, height).data
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

  // Process a new pixel array.
  function update () {
    var changeThreshold = 15

    context.clearRect(0, 0, width, height)

    // Update pixel colors.
    for (var n = 0; n < area; n++) {
      var pixel = pixels[n]
      pixel.shape = null
      var i = n * 4
      var r = now[i]
      var g = now[i + 1]
      var b = now[i + 2]
      var dr = r - pixel.r
      var dg = g - pixel.g
      var db = b - pixel.b
      dr = dr > 0 ? dr : -dr
      dg = dg > 0 ? dg : -dg
      db = db > 0 ? db : -db
      var drgb = dr + dg + db
      if (drgb > changeThreshold) {
        var color = getColor(r, g, b)
        pixel.color = color
        pixel.fit = getColor.fit
        pixel.r = r
        pixel.g = g
        pixel.b = b
      }
      if (pixel.color) {
        context.fillStyle = pixel.color.name
        context.fillRect(pixel.x, pixel.y, 1, 1)
      }
    }

    for (n = 0; n < area; n++) {
      var pixel = pixels[n]
      var color = pixel.color
      if (color && (pixel.fit > color.bestFit * 0.6)) {
        if (!pixel.shape) {
          pixel.shape = new Shape(pixel)
        }
      }
    }
  }

  function emit () {
    var shapes = []
    colors.forEach(function (color) {
      var best = color.shapes[0]
      if (best) {
        color.shapes.forEach(function (shape) {
          if (shape.fitSum > best.fitSum) {
            best = shape
          }
        })
        shapes.push({
          color: color.name,
          x: (best.x0 + best.x1) / 2,
          y: (best.y0 + best.y1) / 2,
          size: Math.max(best.x1 - best.x0, best.y1 - best.y0)
        })
        color.shapes = []
      }
    })
    Cute.emit(document, 'shapes', shapes)
  }

  function Shape (start) {
    var color = start.color
    var pixels = this.pixels = [start]
    this.x0 = width
    this.x1 = -1
    this.y0 = height
    this.y1 = -1
    this.fitSum = 0
    var visited = 0
    var neighbors
    while (visited < pixels.length) {
      var pixel = pixels[visited++]
      if (pixel.x < this.x0) this.x0 = pixel.x
      if (pixel.x > this.x1) this.x1 = pixel.x
      if (pixel.y < this.y0) this.y0 = pixel.y
      if (pixel.y > this.y1) this.y1 = pixel.y
      this.fitSum += pixel.fit
      var neighbors = pixel.neighbors
      for (var i = 0, n = neighbors.length; i < n; i++) {
        var neighbor = neighbors[i]
        if ((neighbor.color === color) && !neighbor.shape) {
          neighbor.shape = this
          pixels.push(neighbor)
        }
      }
    }
    color.shapes.push(this)
  }

  function getColor (r, g, b, n) {
    var min = Math.min(r, g, b)
    var max = Math.max(r, g, b)
    var d = max - min
    var h
    var f
    if (max === min) {
      h = 0
    } else {
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
    }
    var radius = 0.8
    var indexHue = 0.7
    if ((h > indexHue && h < indexHue + radius) && d > 70) {
      h -= indexHue + radius / 2
      f = d / (h * h + 0.1)
      if (f > YELLOW.bestFit / 10) {
        getColor.fit = f
        if (f > YELLOW.bestFit) {
          YELLOW.bestFit = f
        }
        return YELLOW
      }
    }
    var thumbHue = 2.0
    if ((h > thumbHue && h < thumbHue + radius) && d > 45) {
      h -= thumbHue + radius / 2
      f = d / (h * h + 0.1)
      if (f > BLUE.bestFit / 10) {
        getColor.fit = f
        if (f > BLUE.bestFit) {
          BLUE.bestFit = f
        }
        return BLUE
      }
    }
    return null
  }
})

var Pixel = Cute.type(function Pixel (x, y) {
  this.x = x
  this.y = y
  this.r = 0
  this.g = 0
  this.b = 0
  this.color = null
  this.fit = 1e-9
  this.neighbors = []
  this.shape = null
})

var Color = Cute.type(function (index, name, hex) {
  this.index = index
  this.name = name
  this.hex = hex
  this.bestFit = 0
  this.bestShape = null
  this.shapes = []
}, {})

var fingers = {}

var YELLOW = new Color(0, 'Yellow')
var BLUE = new Color(1, 'DodgerBlue')
var colors = [YELLOW, BLUE]
