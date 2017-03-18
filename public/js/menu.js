var contexts = ['main', 'shape', 'selected']
var isMobile = /Android|iP(hone|ad)/.test(navigator.userAgent)
var touchStart = isMobile ? 'touchstart' : 'mousedown'
var touchMove = isMobile ? 'touchmove' : 'mousemove'
var touchEnd = isMobile ? 'touchend' : 'mouseup'

Cute.each(contexts, function (context) {
  Cute.on('a-box.' + context + '-button', touchEnd, function () {
    console.log('context', context)
    socket.emit('context', context)
  })
})

Cute.on('.search-button', touchEnd, function () {
  alert('TODO: WebKit Speech Recognition')
})

// TODO: Figure out why context isn't switching.
socket.on('context', function (context) {
  // Hide all contexts in a-frame and on the real phone.
  Cute.all('.context,.context *', function (tag) {
    console.log('hide', tag)
    // Hide in a-frame and in Set opacity to zero for a-frame.
    Cute.attr(tag, 'opacity', 0)
    Cute.css(tag, 'display', 'none')
  })
  Cute.all('.' + context + '-context,.' + context + '-context *', function (tag) {
    // Hide in a-frame and in Set opacity to zero for a-frame.
    console.log('show', tag)
    Cute.attr(tag, 'opacity', 1)
    Cute.css(tag, 'display', 'block')
  })
})

Cute.ready(function () {
  Cute.all('a-entity.menu *', function (tag) {
    Cute.attr(tag, 'opacity', 0)
  })
})
