/* global io location navigator */

var host = location.protocol + '//' + location.host;
var socket = window.socket = io(host);

var disconnected = false;
var room = location.pathname.split('/')[2];
var scene;
var stroke = null;
var strokes = [];
var shapes = {cube: 'cubes', sphere: 'spheres'};
var skies = ['dom', 'forest', 'gallery', 'venice', 'prague', 'office'];

document.addEventListener('DOMContentLoaded', function () {
  var sky = skies.indexOf(room) > -1 ? room : 'prague';
  document.querySelector('#skymap').src = '/assets/sky/' + sky + '.jpg';

  scene = document.querySelector('a-scene');
  var brushSystem = scene.systems.brush;
  socket.on('plop', function (shape) {
    brushSystem.addShape(shapes[shape] || shape);
  });
  socket.on('stroke', function (data) {
    brushSystem.addEvent(data);
  });
  socket.on('disconnect', function () {
    disconnected = true;
  });
  socket.on('reload', function () {
    location.reload();
  });

  window.addEventListener('load', function () {
    var vr = /(^|&)vr=(vive)(&|$)/.test(document.cookie);
    var enter = document.querySelector('.a-enter-vr-button');
    if (enter && vr) {
      enter.click();
    }
  });

  var depth = 0;
  var height = 20;
  for (var i = -height / 2; i <= height / 2; i++) {
    var bar = document.createElement('a-cylinder');
    bar.setAttribute('color', 'gray');
    bar.setAttribute('radius', '0.01');
    bar.setAttribute('height', height);
    bar.setAttribute('rotation', '0 0 90');
    bar.setAttribute('position', '0 -' + depth + ' ' + i);
    scene.appendChild(bar);
    bar = document.createElement('a-cylinder');
    bar.setAttribute('color', 'gray');
    bar.setAttribute('radius', '0.01');
    bar.setAttribute('height', height);
    bar.setAttribute('rotation', '90 0 0');
    bar.setAttribute('position', i + ' -' + depth + ' 0');
    scene.appendChild(bar);
  }
});

socket.on('connect', function () {
  if (disconnected) {
    return location.reload();
  }
  socket.emit('join', room);
});

// These are just some desktop and mobile device events.
// TODO: Figure out what events actually get sent by the VIVE.
var types = {
  mousedown: 'start',
  mousemove: 'move',
  mouseup: 'end',
  touchstart: 'start',
  touchmove: 'move',
  touchend: 'end'
};

for (var type in types) {
  document.addEventListener(type, relay);
}

function relay (event) {
  var type = types[event.type];

  // Start or stop a stroke.
  if (type === 'start') {
    stroke = new Stroke();
  } else if (type === 'stop') {
    strokes.push(stroke);
    stroke = null;
  }

  if (!stroke) {
    return;
  }

  var x = event.x || event.pageX;
  var y = event.y || event.pageY;
  var z = event.z || event.pageZ || 0; // Doesn't actually exist now.
  var t = Date.now();
  var data = { type: type, x: x, y: y, z: z, t: t };
  socket.emit('event', data);
  stroke.add(x, y, z, t);
}

function Stroke () {
  this.points = [];
}

function Point (x, y, z, t) {
  this.x = x;
  this.y = y;
  this.z = z;
  this.t = t;
}

Stroke.prototype.add = function (x, y, z, t) {
  this.points.push(new Point(x, y, z, t));
};
