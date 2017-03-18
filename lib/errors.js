app.use(function (error, request, response, next) {
  log.error(error.stack)
  response.state.error = error.stack
  response.status(500).view('error500')
})

process.on('uncaughtException', function (error) {
  log.error(error)
  process.exit()
})
