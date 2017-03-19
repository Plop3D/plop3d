// Map experimental features in major browsers.
polyfill(window, 'URL')
polyfill(navigator, 'getUserMedia')
polyfill(window, 'SpeechRecognition')

var isMobile = /Android|iP(hone|ad)/.test(navigator.userAgent)
var touchStart = isMobile ? 'touchstart' : 'mousedown'
var touchMove = isMobile ? 'touchmove' : 'mousemove'
var touchEnd = isMobile ? 'touchend' : 'mouseup'

Cute.on('touchstart', function() {
  var element = document.documentElement
  polyfill(document, 'fullscreenElement')
  polyfill(element, 'requestFullScreen')
  if (!document.fullScreenElement) {
    element.requestFullScreen()
  }
})

function polyfill (map, key) {
  var cap = key[0].toUpperCase() + key.substr(1)
  map[key] = map[key] || map['webkit' + cap] ||
    map['moz' + cap] || map['ms' + cap] || map['o' + cap]
}

var contexts = ['main', 'shape', 'selected', 'sky']
Cute.each(contexts, function(context) {
  Cute.on('a-box.' + context + '-button', touchEnd, function() {
    socket.emit('context', context)
  })
})
socket.on('context', setContext)

function setContext (context) {
  // Hide all contexts in a-frame and on the real phone.
  Cute.all('.context', function(tag) {
    Cute.attr(tag, 'visible', 'false')
    Cute.attr(tag, 'style', 'display:none')
  })
  // Show the context that we're activating.
  Cute.all('.' + context + '-context', function(tag) {
    Cute.attr(tag, 'visible', 'true')
    Cute.attr(tag, 'style', 'display:block')
  })
}

var skies = ['forest', 'pagoda', 'prague', 'reef', 'venice']
Cute.each(skies, function(name) {
  Cute.on('a-box.' + name + '-button', touchEnd, function() {
    socket.emit('sky', {name: name})
  })
})
socket.on('sky', function (data) {
  Cute.one('a-sky', function (sky) {
    var src = '/sky/' + data.name + '.jpg'
    Cute.attr(sky, 'src', src)
  })
})

Cute.on('.search-button', touchEnd, function() {
  if (window.SpeechRecognition) {
    var speech = new SpeechRecognition()
    speech.onresult = function (event) {
      var text
      var confidence = 0
      var alternatives = []
      Cute.each(event.results, function (candidates) {
        Cute.each(candidates, function (candidate) {
          if (candidate.confidence > confidence) {
            confidence = candidate.confidence
            text = candidate.transcript
          } else {
            alternatives.push(candidate.transcript)
          }
        })
      })
      socket.emit('search', {text: text, alternatives: alternatives})
    }
    speech.start()
  }
})

Cute.on('.file-button', touchEnd, function() {
  socket.emit('thing', { name: 'eiffel', path: '/things/eiffel' });
})

Cute.each(['box', 'sphere', 'cylinder', 'cone', 'torus'], function (shape) {
  Cute.on('.' + shape + '-button', touchEnd, function() {
    socket.emit('shape', {
      name: shape
    })
  })
})

Cute.on('.sphere-button', touchEnd, function() {
  socket.emit('shape', { name: 'sphere' });
})
