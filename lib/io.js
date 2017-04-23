var search = require('./search')
var Cache = require('lighter-lru-cache')

// Client types.
var ANY = 0
var DISPLAY = 1
var CONTROLLER = 2

// Emit destinations.
var MY_DEVICES = 0
var MY_DISPLAYS = 1
var MY_CONTROLLERS = 2
var OTHER_DEVICES = 3
var OTHER_DISPLAYS = 4
var OTHER_CONTROLLERS = 5
var ALL_DEVICES = 6
var ALL_DISPLAYS = 7
var ALL_CONTROLLERS = 8

/**
 * A group cache stores many rooms/users/etc.
 */
var GroupCache = Cache.extend(function GroupCache () {
  this.constructor._super.call(this)
}, {
  /**
   * Join a new or existing group of clients.
   * @param  {String}  name    Group name (e.g. room name or user ID).
   * @param  {Object}  client  Client to add to the group.
   */
  join: function (name, client) {
    var group = this.get(name)
    if (!group) {
      group = new ClientGroup()
      this.set(name, group)
    }
    group.connect(client)
    return group
  }
})

// A group of clients can be contacted together.
var ClientGroup = Cache.extend(function ClientGroup () {
  this.constructor._super.call(this)
}, {
  /**
   * Send a message to all clients in the group.
   *
   * @param  {String}  type  Message type.
   * @param  {Object}  data  Data to send.
   */
  emit: function (type, data) {
    this.forEach(function (client) {
      client.emit(type, data)
    })
    return this
  },

  /**
   * Add a client to this group of client connections.
   *
   * @param  {Object} client  The client to add.
   */
  connect: function (client) {
    this.set(client.id, client)
    return this
  },

  /**
   * Remove a client from this group of client connections.
   *
   * @param  {Object} client  The client to remove.
   */
  disconnect: function (client) {
    this.remove(client.id)
    return this
  }
})

// Users and rooms are collections of device clients.
var users = io.users = new GroupCache()
var rooms = io.rooms = new GroupCache()

io.on('connection', function (client) {

  // Assume it's a display (until we get a tilt event).
  client.type = DISPLAY

  client.to = function (to, type, data) {
    var self = this
    var me = this.user
    if (!me) {
      return this.emit('unauthorized')
    }
    var room = me.room
    if (!room) {
      room = rooms.get('general')
    }
    var targetType = to % 3
    switch (to) {
      case MY_DISPLAYS:
      case MY_CONTROLLERS:
      case MY_DEVICES:
        me.forEach(function (client) {
          if (!targetType || (targetType === client.type)) {
            client.emit(type, data)
          }
        })
        break
      case OTHER_DISPLAYS:
      case OTHER_CONTROLLERS:
      case OTHER_DEVICES:
        room.forEach(function (user) {
          if (user !== me) {
            user.forEach(function (client) {
              if (!targetType || (targetType === client.type)) {
                client.emit(type, data)
              }
            })
          }
        })
        break
      case ALL_DISPLAYS:
      case ALL_CONTROLLERS:
      case ALL_DEVICES:
        room.forEach(function (user) {
          user.forEach(function (client) {
            if (!targetType || (targetType === client.type)) {
              client.emit(type, data)
            }
          })
        })
        break
    }
  }

  // When a user device logs in, add it to the user's client group.
  client.on('user', function (data) {
    var userId = data.id
    var user = client.user = users.join(userId, client)
    client.agent = client.agent || data.agent
    user.id = userId
  })

  client.on('disconnect', function () {
    var user = client.user
    if (user) {
      // Remove this device from the user.
      user.disconnect(client)
      // If the user has no devices left, remove them from their room.
      if (!user.size) {
        var room = user.room
        if (room) {
          room.remove(user.id)
        }
      }
    }
    client.user
  })

  // When a client joins a room, put all of that user's devices into the room.
  client.on('room', function (data) {
    var user = client.user
    if (!user) {
      return client.emit('unauthorized')
    }
    user.room = rooms.join(data.name, user)
    log.info('User ' + user.id + ' joined "' + data.name + '".')
  })

  client.on('log', log)

  client.on('vr', function () {
    client.mode = 'vr'
    client.phones = {
      left: new Hand(),
      right: new Hand()
    }
  })

  client.on('phone', function (data) {
    client.mode = 'phone'
    client.phone = data.phone
    client.to(MY_DISPLAYS, 'phone', data)

    client.on('tilt', function (data) {
      // TODO: Only emit to devices we're connected to.
      data.phone = client.phone
      client.type = CONTROLLER
      client.to(MY_DEVICES, 'tilt', data)
    })

    client.on('motion', function (data) {
      var v = client.velocity
      var a = data.acceleration
      if (v && a && !isNaN(a.x)) {
        a.phone = client.phone
        client.to(MY_DEVICES, 'acceleration', a)
        var t = Date.now()
        var dt = (t - v.t) / 1000
        v.x += a.x * dt
        v.y += a.y * dt
        v.z += a.z * dt
        v.t = t
        v.phone = client.phone
        client.to(MY_DEVICES, 'motion', v)
      }
    })
  })

  client.on('finger', function (data) {
    client.mode = 'finger'
    client.to(MY_DEVICES, 'finger', data)
  })

  client.on('draw:start', function (data) {
    client.to(ALL_DISPLAYS, 'draw:start', data)
  })

  client.on('draw:move', function (data) {
    client.to(ALL_DISPLAYS, 'draw:move', data)
  })

  client.on('draw:end', function (data) {
    client.to(ALL_DISPLAYS, 'draw:end', data)
  })

  client.on('grab:start', function (data) {
    client.to(MY_DEVICES, 'grab:start', data)
  })

  client.on('grab:move', function (data) {
    client.to(MY_DEVICES, 'grab:move', data)
  })

  client.on('grab:end', function (data) {
    client.to(MY_DEVICES, 'grab:end', data)
  })

  client.on('search', function (data) {
    search(data.text, client)
  })

  client.on('context', function (data) {
    client.to(MY_DEVICES, 'context', data)
  })

  client.on('thing', function (data) {
    client.to(ALL_DISPLAYS, 'thing', data)
  })

  client.on('shape', function (data) {
    client.to(ALL_DISPLAYS, 'shape', data)
  })

  client.on('sky', function (data) {
    log(data)
    client.to(ALL_DISPLAYS, 'sky', data)
    client.to(MY_DEVICES, 'context', 'main')
  })

  client.on('gesture', function (data) {
    if (!/move/.test(data.type)) {
      log(data)
    }
  })

  client.on('clear', function (data) {
    io.emit('clear')
  })
})
