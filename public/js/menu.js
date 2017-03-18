var isMobile = /Android|iP(hone|ad)/.test(navigator.userAgent)
var touchStart = isMobile ? 'touchstart' : 'mousedown'
var touchMove = isMobile ? 'touchmove' : 'mousemove'
var touchEnd = isMobile ? 'touchend' : 'mouseup'

var contexts = ['main', 'shape', 'selected']

Cute.each(contexts, function(context) {
  Cute.on('a-box.' + context + '-button', touchEnd, function() {
    console.log('context', context)
    socket.emit('context', context)
  })
})

Cute.on('.search-button', touchEnd, function() {
  alert('TODO: WebKit Speech Recognition')
})

Cute.on('.cone-button', touchEnd, function() {
  socket.emit('thing', { name: 'eiffel', path: '/things/eiffel' });
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
