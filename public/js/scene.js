var scene, camera
Cute.ready(function() {
  scene = Cute.one('a-scene')
  camera = Cute.one('a-camera')
  assets = Cute.one('a-assets')
})

Cute.on('touchend', function() {
  scene.enterVR()
  socket.emit('mode', 'vr')
})

window.moveFinger = function (finger) {
  var element = Cute.one('#' + finger.id)
  var position = finger.x + ' ' + finger.y + ' ' + finger.z
  Cute.attr(element, 'position', position)
}

// Cute.on('point:start', function () {
//   var shapes = ['box', 'cone', 'cylinder', 'torus', 'sphere']
//   var shape = shapes[Math.floor(Math.random() * 5)]
//   plopShape({name: shape})
// })

window.emit = function (name, hand) {
  Cute.emit(document, name, hand)
  if (false) {
    socket.emit('gesture', name)
  }
}

var flyTimer
var flyHands = []
Cute.on('fly:start', function (hand) {
  flyHands[hand.i] = hand
  clearInterval(flyTimer)
  flyTimer = setInterval(fly, 20)
})

Cute.on('fly:end', function (hand) {
  clearInterval(flyTimer)
})

function fly () {
  var dx = 0
  var dz = 0
  Cute.each(flyHands, function (hand) {
    dx += hand.thumb.x - hand.index.x
    dz += hand.thumb.z - hand.index.z
  })
  var c3d = camera.object3D
  var yaw = c3d.rotation._y
  if (window.isMobile) {
    c3d.rotateY(dx * 0.03)
    c3d.translateZ(-dz * 0.2 + 0.1)
  } else {
    c3d.rotateY(-dx * 0.03)
    c3d.translateZ(dz * 0.2 - 0.1)
  }
}

var last
Cute.on('draw:start', function (data) {
  last = camera.object3D.localToWorld(
    new THREE.Vector3(data.x, data.y, data.z))
})

var drawN = 0
Cute.on('draw:move', function (data) {
  if (last) {
    data = camera.object3D.localToWorld(
      new THREE.Vector3(data.x, data.y, data.z))

    var position = [(data.x + last.x) / 2, (data.y + last.y) / 2, (data.z + last.z) / 2]
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

    Cute.add(scene, 'a-cylinder.draw-stroke?color=#ff0&radius=' + radius + '&segments-radial=6&height=' + (height) + '&position=' + position.join(' ') + '&rotation=' + rotation.join(' '))
    last = data
  }
})

socket.on('draw:end', function(data) {
  last = undefined
})

var assetsMap = {}
function plopThing (data) {
  var position = getTargetPosition()
  var name = data.name
  var path = data.path
  if (!assetsMap[name]) {
    Cute.add(assets, 'a-asset-item#' + name + '-obj?src=' + path + '.obj')
    Cute.add(assets, 'a-asset-item#' + name + '-mtl?src=' + path + '.mtl')
    assetsMap[name] = true
  }
  Cute.add(scene, 'a-entity.operable?obj-model=obj: #' + name + '-obj; mtl: #' + name + '-mtl&position=' + position.join(' '))
}

socket.on('thing', plopThing)

socket.on('search-results', function (results) {
  Cute.all(camera, '.search-results-box', Cute.remove)
  var s = 1
  var g = 20
  var w = 2 * s + 1 * (s / g)
  var h = 2 * s + 1 * (s / g)
  for (var i = 0, l = results.length; i < 4 && i < l; i++) {
    var x = (-w / 2) + (i % 2) * s + s / 2
    var y = (h / 2) - Math.floor(i / 2) * s - s / 2
    var size = (s - s / g)
    var resultsBox = Cute.add(camera,
      'a-box.search-results-box?opacity=0.3&width=' + size + '&height=' + size + '&depth=' + size +
      '&position=' + x + ' ' + y + ' -2.5')
    var result = results[i]
    resultsBox.result = result
    Cute.add(resultsBox, 'a-image?width=' + size + '&height=' + size + '&src=' + result.img + '&position= 0 0 0')
  }
})

socket.on('shape', plopShape)

function plopShape (data) {
  var position = getTargetPosition()
  var shape = data.name
  var attrs
  switch (shape) {
    case 'cone':
      attrs = 'radius-bottom=0.3&radius-top=0&height=0.5';
      break
    case 'sphere':
      attrs = 'radius=0.3';
      break
    case 'box':
      attrs = 'width=0.5&height=0.5&depth=0.5';
      break
    case 'cylinder':
      attrs = 'radius=0.3&height=0.5';
      break
    case 'torus':
      attrs = 'radius=0.3&radius-tubular=0.1';
      break
  }
  Cute.add(scene, 'a-' + shape + '.operable?' + attrs +
    '&color=#06c&position=' + position.join(' '))
}

function getTargetPosition (id) {
  var target = Cute.one('#right-index-finger')
  var point = Cute.attr(target, 'position')
  var vector = new THREE.Vector3(point.x, point.y, point.z)
  var coords = camera.object3D.localToWorld(vector)
  return [coords.x, coords.y, coords.z]
}

var lastGrab
var selectedModel
Cute.on('grab:start', function(data) {
  if (!camera) {
    return
  }
  var point = camera.object3D.localToWorld(
    new THREE.Vector3(data.x, data.y, data.z))

  var searchBoxFrames = Cute.all('.search-results-box')
  var searchBoxFrame = null

  for (var i = 0; i < searchBoxFrames.length; i++) {
    searchBoxFrame = searchBoxFrames[i];
    var searchBox = new THREE.Box3().setFromObject(searchBoxFrame.object3D)
    if (searchBox.containsPoint(point)) {
      break
    }
    searchBoxFrame = null;
  }

  if (searchBoxFrame) {
    for (var i = 0; i < searchBoxFrame.result.paths.length; i++) {
      plopThing(searchBoxFrame.result.paths[i])
    }
    selectedModel = lastGrab = undefined;
    Cute.each(searchBoxFrames, Cute.remove);
    return
  }

  lastGrab = data
  var models = Cute.all('.operable')
  for (var i = 0; i < models.length; i++) {
    var box = new THREE.Box3().setFromObject(models[i].object3D)
    if (box.containsPoint(point)) {
      selectedModel = models[i]
      break;
    }
  }
})

Cute.on('grab:move', function(data) {
  var model = selectedModel || camera
  var speed = (model === camera) ? -5 : 1
  if (lastGrab) {
    var pos = model.getAttribute('position')
    pos.x += speed * (data.x - lastGrab.x)
    pos.y += speed * (data.y - lastGrab.y)
    pos.z += speed * (data.z - lastGrab.z)
    Cute.attr(model, 'position', [pos.x, pos.y, pos.z].join(' '))
    lastGrab = data
  }
})

Cute.on('grab:end', function(data) {
  lastGrab = selectedModel = undefined;
})

socket.on('clear', function(){
  Cute.all('.operable', Cute.remove);
  Cute.all('.search-results-box', Cute.remove);
})
