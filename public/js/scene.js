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
  Cute.all('#' + data.phone + '-phone *', function(tag) {
    Cute.attr(tag, 'opacity', 1)
  })
})

var lastCameraY;
var lastPhoneY;
socket.on('tilt', function(data) {
  //console.log(data)
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
  indexPosition = index.getAttribute('position')
  var pos = camera.object3D.localToWorld(
    new THREE.Vector3(indexPosition.x, indexPosition.y, indexPosition.z))
  var position = [pos.x, 0, pos.z]

  if (!assetsMap[data.name]) {
    Cute.add(assets, 'a-asset-item#' + data.name + '-obj?src=' + data.path + '.obj')
    Cute.add(assets, 'a-asset-item#' + data.name + '-mtl?src=' + data.path + '.mtl')
    assetsMap[data.name] = true
  }
  Cute.add(scene, 'a-entity?obj-model=obj: #' + data.name + '-obj; mtl: #' + data.name + '-mtl&position=' + position.join(' '))
})

socket.on('shape', function(data) {
  console.log('Putting down a shape! Shape: ', data.name)
  indexPosition = index.getAttribute('position')
  var pos = camera.object3D.localToWorld(
    new THREE.Vector3(indexPosition.x, indexPosition.y, indexPosition.z))
  var position = [pos.x, 0, pos.z]
  console.log('position: ', position)
  console.log('cone string: ', 'a-cone?color=red&radius-bottom=100&radius-top=0&height=100&position=' + position.join(' '))

  var shape = data.name;
  var entity = Cute.add(scene, 'a-entity.entitittiable?&position=' + position.join(' '))
  if (shape === 'cone') {
    var element = Cute.add(entity, 'a-cone.operable?color=red&radius-bottom=100&radius-top=0&height=100')
    // Cute.attr(element, 'position', position.join(' '))
  } else if (shape === 'sphere') {
    Cute.add(scene, 'a-sphere?color=red&radius=20&position=' + position.join(' '))
  } else if (shape === 'box') {
    Cute.add(scene, 'a-sphere?color=red&radius=20&position=' + position.join(' '))
  } else if (shape === 'cylinder') {
    Cute.add(scene, 'a-sphere?color=red&radius=20&position=' + position.join(' '))
  } else if (shape === 'torus') {
    Cute.add(scene, 'a-sphere?color=red&radius=20&position=' + position.join(' '))
  }
})


var lastGrab
var selectedModel
socket.on('grab:start', function(data) {
  lastGrab = data
  var point = camera.object3D.localToWorld(
    new THREE.Vector3(data.x, data.y, data.z))
  var models = Cute.all('[obj-model]')
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
  if (lastGrab) {
    var pos = model.getAttribute('position');
    if(window.isMobile){
      pos.x += data.x - lastGrab.x
      pos.y += data.y - lastGrab.y
      pos.z += data.z - lastGrab.z
    } else {
      pos.x -= data.x - lastGrab.x
      pos.y -= data.y - lastGrab.y
      pos.z -= data.z - lastGrab.z
    }
    Cute.attr(model, 'position', [pos.x, pos.y, pos.z].join(' '))
    lastGrab = data
  }
})


socket.on('grab:end', function(data) {
  selectedModel = undefined;
  lastGrab = undefined;
})
