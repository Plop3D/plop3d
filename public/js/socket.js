/* global Cute window location io */

var endpoint = location.protocol + '//' + location.host
var socket = window.socket = io(endpoint)

socket.on('load:loaded', function () {
  location.reload()
})

socket._n = 0

socket.log = function (type, data) {
  data = data || {}
  data.type = type
  socket.emit('log', data)
}

socket.emits = function (type, data) {
  data.type = type
  socket.emit('log', data)
}

var CuteIo = {}

CuteIo._local = 0
CuteIo._remote = 0
CuteIo._queue = []
CuteIo.emit = function (type, data) {
  data._n = CuteIo._local++
  socket.emit(type, data)
}
CuteIo.on = function (type, fn) {
  socket.on(type, on)
  function on (data) {
    var n = data._n
    if (n === CuteIo._remote) {
      CuteIo._remote++
      fn(data)
    } else {
      CuteIo._queue.push(data)
      CuteIo._queue.sort(function (a, b) {
        return a._n - b._n
      })
      if (CuteIo._queue[0]._n === CuteIo._remote) {
        on(CuteIo._queue.shift())
      }
    }
  }
}

CuteIo.on('sync', function (data) {
  console.log(data)
})
