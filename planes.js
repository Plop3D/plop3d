var math = require('mathjs');
var events = require('events');
var dollarP = require('./dollarP');
var PointP = dollarP.Point;
var PointCloudP = dollarP.PointCloud;

module.exports = {
    Point: Point,
    Plane: Plane,
    CalculateNormal: calculateNormal,
    ProjectPointOntoPlane: projectPointOntoPlane,
    LookAtEvent: lookAtEvent,
    DetectShape: detectShape
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

}

function extractPositions(strokeSet) {
    // Extract the position objects into a standalone array
    var positions = [];
    strokeSet.forEach(function (stroke) {
        if (stroke.position) {
            var position = stroke.position;
            var positionVector = new THREE.Vector3(position.x, position.y, position.z);
            positions.push(positionVector);
        }
    });
    return positions;
}

function calculatePlane(positions) {
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
    return plane;
}

function accuracyOfPlane(plane, positions) {
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

    // Need to weight each attribute of score equally
    var score = (standardDeviation + mean + median);
    // console.log(standardDeviation);
    // console.log(mean);
    // console.log(median);
    // console.log(max);

    return score;
}

function projectedPointsOnto2dPlane (plane, positions) {
    // Project points onto plane
    var projectedPoints = [];
    positions.forEach(function (position) {
        var projectedPoint = position.projectOnPlane(plane.normal);
        projectedPoints.push(projectedPoint);
    });

    // Change basis of points to xy plane normal to z axis
    // This part is not complete !!!

    // Step 1: Find 3 normalized vectors orthogonal to one another.
    // Z will be the normalized normal to our plane
    var Z = plane.normal.normalize();

    // X is the projection of arbitrary vector A onto Z. This gives us a vector orthogonal to Z
    var A = new THREE.Vector3(0, 0, 1);
    var X = A.projectOnPlane(plane.normal);

    // Y is orthogonal to both X and Z so is found by taking the cross product of these two vectors
    var Y = new THREE.Vector3();
    Y.crossVectors(Z, X);

    // Find the translated points in 2d positions
    var positions2d = [];
    projectedPoints.forEach(function (point) {
        var xCoordinate = point.dot(X);
        var yCoordinate = point.dot(Y);
        var point2d = new PointP(xCoordinate, yCoordinate, 1);
        positions2d.push(point2d);
    });

    return positions2d;
}

function detectShape(strokeSet) {
    var positions = extractPositions(strokeSet);
    var plane = calculatePlane(positions);
    var score = accuracyOfPlane(plane, positions);
    var positions2d = projectedPointsOnto2dPlane(plane, positions);
    var recognizer = new dollarP.Recognizer;
    var recoResult = recognizer.Recognize(positions2d);
    console.log(recoResult);

    return recoResult.Name;
}