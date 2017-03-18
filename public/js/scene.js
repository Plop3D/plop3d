var scene, camera
Cute.ready(function () {
  scene = Cute.one('a-scene')
  camera = Cute.one('a-camera')
})

Cute.on('touchend', function () {
  scene.enterVR()
  socket.emit('mode', 'vr')
})

socket.on('phone', function (data) {
  Cute.all('#' + data.phone + '-phone *', function (tag) {
    Cute.attr(tag, 'opacity', 1)
  })
})

socket.on('tilt', function (data) {
  var phone = Cute.one('#' + data.phone + '-phone')
  var rotation = data.beta + ' ' + data.alpha + ' ' + -data.gamma
  Cute.attr(phone, 'rotation', rotation)
})

socket.on('acceleration', function (data) {
  var phone = Cute.one('#' + data.phone + '-phone')
  var position = data.x + ' ' + data.y + ' ' + data.z
})

socket.on('finger', function (data) {
  var finger = Cute.one('#' + data.name + '-finger')
  var position = data.x + ' ' + data.y + ' ' + data.z
  Cute.attr(finger, 'position', position)
})

var last
socket.on('draw:start', function (data) {
  last = data
  Cute.all('a-cylinder.draw-stroke', Cute.remove)
})

var drawN = 0
socket.on('draw:move', function (data) {
  var position = [
    (data.x + last.x) / 2,
    (data.y + last.y) / 2,
    (data.z + last.z) / 2
  ]
  var dx = data.x - last.x
  var dy = data.y - last.y
  var dz = data.z - last.z
  var s = dx * dx + dz * dz
  var height = Math.sqrt(s + dy * dy) + 0.05
  if (height < 0.05) {
    return
  }
  var dc = Math.sqrt(s)
  var r2d = 180 / Math.PI
  var a = dy ? Math.atan(dc / dy) * r2d : 0
  var b = dz ? Math.atan(dx / dz) * r2d : 0
  if (dy < 0) a += 180
  if (dz < 0) b += 180
  var rotation = [a, b, 0]
  var radius = 0.01

  Cute.add(camera, 'a-cylinder.draw-stroke?color=#ff0&radius=' + radius + '&segments-radial=6&height=' + (height + radius / 2) + '&position=' + position.join(' ') + '&rotation=' + rotation.join(' '))

  last = data
})

socket.on('draw:end', function (data) {
})
