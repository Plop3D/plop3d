Cute.ready(function() {
  var canvas = Cute.one('#canvas')

  var fingers = {Yellow: 'index', ForestGreen: 'thumb'}

  var smoothing = 2
  var scale = 5
  var width = canvas.offsetWidth
  var height = canvas.offsetHeight
  var offset = scale / 2
  var isDrawing = false
  var isGrabbing = false

  Cute.each(fingers, function(name, color) {
    fingers[name] = fingers[color] = {
      name: name,
      x: 0, y: 0, z: 0,
      n: 0
    }
  })
  fingers.avg = {x: 0, y: 0, z: 0}

  Cute.on(document, 'shapes', function(shapes) {
    Cute.each(shapes, function(shape) {
      var size = Math.max(shape.size, 1) / width
      var x, y, z
      if (window.isMobile) {
        x = (shape.x / width - 0.5) / size / 8
        y = (0.5 - shape.y / height) / size / 8
        z = -0.2 / size
      }
      else {
        x = (0.5 - shape.x / width) / size / 8
        y = (0.5 - shape.y / height) / size / 8
        z = 0.2 / size - 6
      }
      var finger = fingers[shape.color]
      var n = Math.min(++finger.n, smoothing)
      finger.x += (x - finger.x) / n
      finger.y += (y - finger.y) / n
      finger.z += (z - finger.z) / Math.min(++finger.n, smoothing * 3)
      socket.emit('finger', finger)
    })
    var index = fingers.index
    var thumb = fingers.thumb
    if (!index.n || !thumb.n) {
      return
    }
    var center = {
      x: (index.x + thumb.x) / 2,
      y: (index.y + thumb.y) / 2,
      z: (index.z + thumb.z) / 2
    }
    var gap = getDistance(index, thumb)
    var pointiness = thumb.z - index.z
    var isPointing = gap > 0.4 && pointiness > 0.3
    if (isPointing) {
      if (!isDrawing) {
        isDrawing = true
        socket.emit('draw:start', cleanCoords(index))
      } else {
        socket.emit('draw:move', cleanCoords(index))
      }
    } else if (isDrawing) {
      socket.emit('draw:end', cleanCoords(index))
      isDrawing = false
    }

    var isPinched = gap < 0.2
    if (isPinched) {
      if (!isGrabbing) {
        isGrabbing = true
        socket.emit('grab:start', cleanCoords(center))
      } else {
        socket.emit('grab:move', cleanCoords(center))
      }
    } else if (isGrabbing) {
      socket.emit('grab:end', cleanCoords(center))
      isGrabbing = false
    }
  })
})

function cleanCoords(o) {
  return {
    x: o.x.toFixed(4) * 1,
    y: o.y.toFixed(4) * 1,
    z: o.z.toFixed(4) * 1
  }
}

function getDistance(a, b) {
  var x = b.x - a.x, y = b.y - a.y, z = b.z - a.z
  return Math.sqrt(x * x + y * y + z * z)
}

setTimeout(function() {
  location.reload()
}, 1e6)
