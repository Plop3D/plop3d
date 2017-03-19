var jsdom = require('jsdom')
var request = require('request')

module.exports = function(text){
  log.info('search: ' + text)
  // TODO: Also do POST requests to /ajax/search/results/ to get more than 12.
  var q = encodeURIComponent(text)
  var url = 'http://www.thingiverse.com/search?q=' + q + '&sa='
  request(url, function (error, response, body) {
    if (error) {
      log.error(error)
    }
    jsdom.env(body, [], function (err, window) {
      var results = []
      var document = window.document
      var things = document.querySelectorAll('.thing')
      for (var i = 0, l = things.length; i < l; i++) {
        var thing = things[i]
        var img = thing.querySelector('.thing-img')
        var id = thing.getAttribute('data-thing-id')
        var title = thing.getAttribute('title')
        var imgUrl = img.getAttribute('data-cfsrc')
          .replace('https://cdn.thingiverse.com', '/thing')

        results.push({id: id, title: title, img: imgUrl})
      }
      io.emit('search-results', results)
    })
  })
}
