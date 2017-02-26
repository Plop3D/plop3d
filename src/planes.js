var math = require('mathjs');
var events = require('../events');

module.exports = {
    Point: Point,
    Plane: Plane,
    CalculateNormal: calculateNormal,
    ProjectPointOntoPlane: projectPointOntoPlane,
    LookAtEvent: lookAtEvent
};

function Point (x, y, z) {
    this.x = x;
    this.y = y;
    this.z = z;
}

function Plane (a, b, c, d) {
    this.a = a;
    this.b = b;
    this.c = c;
    this.d = d;
    this.normal = new THREE.Vector3(a,b,c);
    this.plane3 = new THREE.Plane(this.normal, d);
}

function calculateNormal (a, b, c) {
    var vAB = math.matrix([b.x - a.x, b.y - a.y, b.z - a.z]);
    var vAC = math.matrix([c.x - a.x, c.y - a.y, c.z - a.z]);
    var abXac = math.cross(vAB, vAC)._data;
    var d = -((abXac[0] * a.x) + (abXac[1] * a.y) + (abXac[2] * a.z));
    return new Plane (abXac[0], abXac[1], abXac[2], d);
}

function calculatePlane (a, b, c) {

}

function projectPointOntoPlane (plane, point) {
    var projectedPoint = plane.plane3.projectPoint(point);
    return projectedPoint;
}

function lookAtEvent() {
    // Import the data set, probably make this the entry point and the dataset is pass as an event object
    var line = events.GetLine();

    // Extract the position objects into a standalone array
    var positions = [];
    line.forEach(function (stroke) {
        if (stroke.position) {
            var position = stroke.position;
            var positionVector = new THREE.Vector3(position.x, position.y, position.z);
            positions.push(positionVector);
        }
    });

    // Calculate a plane using three points equally interspersed through the data
    var plane = new THREE.Plane();
    var oneThirdLength = Math.floor(positions.length/3);
    var twoThirdsLength = Math.floor(positions.length * 2/3);

    // console.log(twoThirdsLength);
    // console.log(positions[0]);
    // console.log(positions[oneThirdLength]);
    // console.log(positions[twoThirdsLength]);
    plane.setFromCoplanarPoints(positions[0], positions[oneThirdLength], positions[twoThirdsLength]);
    // console.log(plane);

    // Determine if the plane is a good fit.
    var distancesFromPlane = [];
    positions.forEach(function (position) {
        distanceFromPlane = Math.abs(plane.distanceToPoint(position));
        distancesFromPlane.push(distanceFromPlane);
    });

    // console.log(distancesFromPlane.sort());
    var standardDeviation = math.std(distancesFromPlane);
    var mean = math.mean(distancesFromPlane);
    var median = math.median(distancesFromPlane);
    var max = Math.max.apply(null, distancesFromPlane);
    // console.log(standardDeviation);
    // console.log(mean);
    // console.log(median);
    // console.log(max);

    // Project points onto plane
    var projectedPoints = [];
    positions.forEach(function (position) {
        var projectedPoint = position.projectOnPlane(plane.normal);
        projectedPoints.push(projectedPoint);
    });

    // Change basis of points to xy plane normal to z axis
    // This part is not complete !!!
    var zV = plane.z.zize();
    console.log(zV);
    u = new THREE.Vector3(0, 0, 1);
    uDotz = u.dot(z);


}
