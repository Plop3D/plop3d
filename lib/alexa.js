app.post('/alexa', function(req, res) {
  var body = req.body
  var response
  if (body.request.type == 'IntentRequest') {
    var intent = body.request.intent
    if (intent.name == 'SearchThing') {
      var thing = intent.slots.Thing.value
      if (thing) {
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
      } else {
        response = {
          "version": "1.0",
          "response": {
            "outputSpeech": {
              "type": "PlainText",
              "text": "Please let me kow what you want search for."
            },
            "reprompt": {
              "outputSpeech": {
                "type": "PlainText",
                "text": "Do you still need to search?"
              }
            },
            "shouldEndSession": false
          }
        }
      }
    } else if (intent.name == 'PlopShape') {
      var shape = intent.slots.Shape.value
      if (shape) {
        shape = shape.toLowerCase()
        if (['box', 'sphere', 'torus', 'cylinder', 'cone'].indexOf(shape)) {
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
          for (var i = 0; i < clients.length; i++) {
            clients[i].emit('shape', { name: shape });
          }
        } else {
          response = {
            "version": "1.0",
            "response": {
              "outputSpeech": {
                "type": "PlainText",
                "text": "I'm sorry I cannot plot " + shape + ". Can I plop another shape?"
              },
              "reprompt": {
                "outputSpeech": {
                  "type": "PlainText",
                  "text": "Do you still need to plop?"
                }
              },
              "shouldEndSession": false
            }
          }
        }
      } else {
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
      }

    } else if (intent.name == 'End') {
      response = {
        "version": "1.0",
        "response": {
          "outputSpeech": {
            "type": "PlainText",
            "text": "Buy"
          },
          "shouldEndSession": true
        }
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
