app.use(function (request, response, next) {
  response.state = new State(request, response)
  next()
})

var State = module.exports = function State (request, response) {
  this.url = request.url
  this.agent = request.headers['user-agent']
  this.mobile = /Android|iP(hone|ad)/.test(this.agent)
}

State.prototype.bust = Date.now()
