var scene, camera
Cute.ready(function() {
  scene = Cute.one('a-scene')
  camera = Cute.one('a-camera')
  assets = Cute.one('a-assets')
  index = Cute.one('#index-finger')
})

Cute.on('touchend', function() {
  scene.enterVR()
  socket.emit('mode', 'vr')
})

socket.on('phone', function(data) {
  Cute.all('#' + data.phone + '-phone', function(tag) {
    Cute.attr(tag, 'visible', true)
  })
})

var lastCameraY;
var lastPhoneY;
socket.on('tilt', function(data) {
  if (camera) {
    var phone = Cute.one('#' + data.phone + '-phone')
    var rot = camera.getAttribute('rotation')
    if (!lastCameraY || !lastPhoneY || Math.abs(data.alpha) % 360 < 3) {
      lastCameraY = rot.y
      lastPhoneY = data.alpha
    }
    var rotation = (data.beta) + ' ' + (data.alpha - lastPhoneY + lastCameraY - rot.y + 10) + ' ' + (-data.gamma)
    Cute.attr(phone, 'rotation', rotation)

    if (data.beta < 0) {
      if (!phone.timerToHide) {
        phone.timerToHide = setTimeout(function() {
          Cute.attr(phone, 'visible', false)
        }, 500)
      }
    } else {
      clearTimeout(phone.timerToHide)
      delete phone.timerToHide
      Cute.attr(phone, 'visible', true)
    }
  }
})

socket.on('acceleration', function(data) {
  var phone = Cute.one('#' + data.phone + '-phone')
  var position = data.x + ' ' + data.y + ' ' + data.z
})

socket.on('finger', function(data) {
  var finger = Cute.one('#' + data.name + '-finger')
  var position = data.x + ' ' + data.y + ' ' + data.z
  Cute.attr(finger, 'position', position)
  Cute.attr(finger, 'visible', true)
  clearTimeout(finger.timerToHide)
  finger.timerToHide = setTimeout(function() {
    Cute.attr(finger, 'visible', false)
  }, 200)
})

var last
socket.on('draw:start', function(data) {
  last = camera.object3D.localToWorld(
    new THREE.Vector3(data.x, data.y, data.z))
})

var drawN = 0
socket.on('draw:move', function(data) {
  if (last) {
    data = camera.object3D.localToWorld(
      new THREE.Vector3(data.x, data.y, data.z))

    var position = [
      (data.x + last.x) / 2, (data.y + last.y) / 2, (data.z + last.z) / 2]
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

    Cute.add(scene, 'a-cylinder.draw-stroke?color=#ff0&radius=' + radius + '&segments-radial=6&height=' + (height + radius / 2) + '&position=' + position.join(' ') + '&rotation=' + rotation.join(' '))

    last = data
  }
})

socket.on('draw:end', function(data) {
  last = undefined
})

var assetsMap = {}
socket.on('thing', function(data) {
  var position = getTargetPosition()
  if (!assetsMap[data.name]) {
    Cute.add(assets, 'a-asset-item#' + data.name + '-obj?src=' + data.path + '.obj')
    Cute.add(assets, 'a-asset-item#' + data.name + '-mtl?src=' + data.path + '.mtl')
    assetsMap[data.name] = true
  }
  Cute.add(scene, 'a-entity.operable?obj-model=obj: #' + data.name + '-obj; mtl: #' + data.name + '-mtl&position=' + position.join(' '))
})

socket.on('search-results', function(results) {
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
    // var position = x + ' ' + y + ' 0'
    Cute.add(resultsBox, 'a-image?width=' + size + '&height=' + size + '&src=' + result.img + '&position= 0 0 0')
  }
})

socket.on('shape', function(data) {
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
    '&color=red&position=' + position.join(' '))
})

function getTargetPosition() {
  var target = Cute.one('#index-finger')
  var point = Cute.attr(target, 'position')
  var vector = new THREE.Vector3(point.x, point.y, point.z)
  var coords = camera.object3D.localToWorld(vector)
  return [coords.x, coords.y, coords.z]
}

var lastGrab
var selectedModel
socket.on('grab:start', function(data) {
  lastGrab = data
  var point = camera.object3D.localToWorld(new THREE.Vector3(data.x, data.y, data.z))
  Cute.all('.search-results-box', function(searchBoxFrame){
      var searchBox = new THREE.Box3().setFromObject(searchBoxFrame.object3D)
      if (searchBox.containsPoint(point)) {
        console.log(searchBoxFrame.result)
      }
  })

  var models = Cute.all('.operable')
  for (var i = 0; i < models.length; i++) {
    var box = new THREE.Box3().setFromObject(models[i].object3D)
    if (box.containsPoint(point)) {
      selectedModel = models[i]
      break;
    }
  }

})

socket.on('grab:move', function(data) {
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

socket.on('grab:end', function(data) {
  selectedModel = undefined;
  lastGrab = undefined;
})
