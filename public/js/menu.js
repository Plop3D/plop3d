// Map experimental features in major browsers.
polyfill(window, 'URL')
polyfill(navigator, 'getUserMedia')
polyfill(window, 'SpeechRecognition')

var isMobile = /Android|iP(hone|ad)/.test(navigator.userAgent)
var touchStart = isMobile ? 'touchstart' : 'mousedown'
var touchMove = isMobile ? 'touchmove' : 'mousemove'
var touchEnd = isMobile ? 'touchend' : 'mouseup'

Cute.on('touchstart', function() {
  var doc = window.document;
  var docEl = doc.documentElement;

  var requestFullScreen = docEl.requestFullscreen || docEl.mozRequestFullScreen || docEl.webkitRequestFullScreen || docEl.msRequestFullscreen;

  if(!doc.fullscreenElement && !doc.mozFullScreenElement && !doc.webkitFullscreenElement && !doc.msFullscreenElement) {
    requestFullScreen.call(docEl);
  }
})

function polyfill (map, key) {
  var cap = key[0].toUpperCase() + key.substr(1)
  map[key] = map[key] || map['webkit' + cap] ||
    map['moz' + cap] || map['ms' + cap] || map['o' + cap]
}

var contexts = ['main', 'shape', 'selected']

Cute.each(contexts, function(context) {
  Cute.on('a-box.' + context + '-button', touchEnd, function() {
    socket.emit('context', context)
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

Cute.on('.cone-button', touchEnd, function() {
  socket.emit('shape', { name: 'cone' });
})

Cute.on('.sphere-button', touchEnd, function() {
  socket.emit('shape', { name: 'sphere' });
})

// TODO: Figure out why context isn't switching.
socket.on('context', function(context) {
  // Hide all contexts in a-frame and on the real phone.
  Cute.all('.context,.context *', function(tag) {
    Cute.attr(tag, 'opacity', 0)
    Cute.attr(tag, 'style', 'display:none')
  })
  // Show the context that we're activating.
  Cute.all('.' + context + '-context,.' + context + '-context *', function(tag) {
    Cute.attr(tag, 'opacity', 1)
    Cute.attr(tag, 'style', 'display:block')
  })
})

Cute.ready(function() {
  Cute.all('a-entity.menu *', function(tag) {
    Cute.attr(tag, 'opacity', 0)
  })
})
