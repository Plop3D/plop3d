app.post('/alexa', function(req, res) {
  var body = req.body
  if (body.request.type == 'IntentRequest') {
    var intent = body.request.intent
    if (intent.name == 'SearchThing') {
      var thing = intent.slots.Thing.value
      for (var i = 0; i < clients.length; i++) {
        clients[i].emit('thing', { name: thing, path: '/things/' + thing });
      }
    } else if (intent.name == 'PlopShape') {
      var shape = intent.slots.Shape.value
      for (var i = 0; i < clients.length; i++) {
        clients[i].emit('shape', { name: shape });
      }
    }
  }
  res.end()
})
