// Fill the form with the email if we have it already.
Cute.ready(function () {
  Cute.one('#email', function (input) {
    input.value = Cute.cookie('email') || ''
  })
})

Cute.on('#email', 'change', function (target) {
  var email = target.value
  var userId = Cute.md5(email)
  Cute.cookie('email', email, {path: '*', maxAge: 9e9})
  socket.emit('user', {id: userId, agent: navigator.userAgent})
})
