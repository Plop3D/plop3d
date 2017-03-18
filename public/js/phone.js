var data2 = {}
var data = {}
var body = Cute.one('body')
// var pre = Cute.add(body, 'pre')

var agent = navigator.userAgent
var phone = (/Android/.test(navigator.userAgent) ? 'left' : 'right')

socket.on('connect', function () {
  socket.emit('phone', {agent: agent, phone: phone})
})

function show () {
  Cute.html(pre, JSON.stringify(data, null, '  '))
  for (var key in data) {
    var map = data[key]
    var map2 = data2[key] = data2[key] || {}
    for (var name in map) {
      map2[name] = (map2[name] || map[name]) * 0.99 + map[name] * 0.01
    }
  }
}

Cute.on(window, 'deviceorientation', function (type, event) {
  var tilt = {
    alpha: event.alpha,
    beta: event.beta,
    gamma: event.gamma
  }
  socket.emit('tilt', tilt)
  data.tilt = tilt
  // show()
})

// Acceleration baseline.
var ab = {x: 0, y: 0, z: 0, n: 0, s: 0}

Cute.on(window, 'devicemotion', function (type, event) {
  var a = event.acceleration
  var n = Math.min(++ab.n, 1000)
  var d = {x: a.x - ab.x, y: a.y - ab.y, z: a.z - ab.z}
  ab.x += d.x / n
  ab.y += d.y / n
  ab.z += d.z / n
  var s = Math.sqrt(d.x * d.x + d.y * d.y + d.z * d.z)
  if (Math.abs(s - ab.s) > 0.5) {
    socket.emit('motion', {
      acceleration: data.acceleration
    })
  }
  ab.s = s
  data.acceleration = d
  // show()
})
