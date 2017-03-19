io.on('connection', function (client) {
  client.on('log', log)

  clients.push(client)

  client.on('disconnect', function() {
    var index = clients.indexOf(client)
    if(index > -1){
      clients.splice(index, 1)
    }
  })

  client.on('vr', function () {
    client.mode = 'vr'
    client.mode = mode
    client.phones = {
      left: new Hand(),
      right: new Hand()
    }
  })

  client.on('phone', function (data) {
    client.mode = 'phone'
    client.agent = data.agent
    client.phone = data.phone
    io.emit('phone', data)
    client.position = {x: 0, y: 0, z: 0}
    client.velocity = {x: 0, y: 0, z: 0, t: Date.now()}

    setInterval(function () {
      var v = client.velocity
      var p = client.position
      v.x *= 0.9
      v.y *= 0.9
      v.z *= 0.9
      p.x += v.x / 100
      p.y += v.y / 100
      p.z += v.z / 100
      var s = Math.sqrt(v.x * v.x + v.y * v.y + v.z * v.z)
      if (s > 0.1) {
        p.phone = client.phone
        io.emit('position', p)
      }
    }, 100)

    client.on('tilt', function (data) {
      // TODO: Only emit to devices we're connected to.
      data.phone = client.phone
      io.emit('tilt', data)
    })

    client.on('motion', function (data) {
      var v = client.velocity
      var a = data.acceleration
      if (v && a && !isNaN(a.x)) {
        a.phone = client.phone
        io.emit('acceleration', a)
        var t = Date.now()
        var dt = (t - v.t) / 1000
        v.x += a.x * dt
        v.y += a.y * dt
        v.z += a.z * dt
        v.t = t
        v.phone = client.phone
        io.emit('motion', v)
      }
    })
  })

  client.on('finger', function (data) {
    client.mode = 'finger'
    io.emit('finger', data)
  })

  client.on('draw:start', function (data) {
    log.info('draw:start', data)
    io.emit('draw:start', data)
  })

  client.on('draw:move', function (data) {
    io.emit('draw:move', data)
  })

  client.on('draw:end', function (data) {
    log.info('draw:end', data)
    io.emit('draw:end', data)
  })

  client.on('grab:start', function (data) {
    log.info('grab:start', data)
    io.emit('grab:start', data)
  })

  client.on('grab:move', function (data) {
    io.emit('grab:move', data)
  })

  client.on('grab:end', function (data) {
    log.info('grab:end', data)
    io.emit('grab:end', data)
  })

  client.on('context', function (data) {
    log.info('context', data)
    io.emit('context', data)
  })

  client.on('thing', function (data) {
    log.info('thing', data)
    io.emit('thing', data)
  })

  client.on('shape', function (data) {
    log.info('shape', data)
    io.emit('shape', data)
  })
})
