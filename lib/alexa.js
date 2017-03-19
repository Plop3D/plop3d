app.post('/alexa', function(req, res) {
  var body = req.body
  var response
  if (body.request.type == 'IntentRequest') {
    var intent = body.request.intent
    if (intent.name == 'SearchThing') {
      var thing = intent.slots.Thing.value
      response = {
        "version": "1.0",
        "response": {
          "outputSpeech": {
            "type": "PlainText",
            "text": "Enjoy your " + thing + ". Can I help you with anything else?"
          },
          "reprompt": {
            "outputSpeech": {
              "type": "PlainText",
              "text": "Can I help you with anything else?"
            }
          },
          "shouldEndSession": false
        }
      }
      for (var i = 0; i < clients.length; i++) {
        clients[i].emit('thing', { name: thing, path: '/things/' + thing });
      }
    } else if (intent.name == 'PlopShape') {
      response = {
        "version": "1.0",
        "response": {
          "outputSpeech": {
            "type": "PlainText",
            "text": "Enjoy your " + shape + ". Can I help you with anything else?"
          },
          "reprompt": {
            "outputSpeech": {
              "type": "PlainText",
              "text": "Can I help you with anything else?"
            }
          },
          "shouldEndSession": false
        }
      }
      var shape = intent.slots.Shape.value
      for (var i = 0; i < clients.length; i++) {
        clients[i].emit('shape', { name: shape });
      }

    }
  } else {
    response = {
      "version": "1.0",
      "response": {
        "outputSpeech": {
          "type": "PlainText",
          "text": "Welcome to Plop 3d. Let me know what you would love to plop?"
        },
        "reprompt": {
          "outputSpeech": {
            "type": "PlainText",
            "text": "Can I help you to plop?"
          }
        },
        "shouldEndSession": false
      }
    }
  }

  res.json(response)
})
