var math = require('mathjs');

module.exports = {
    Point: Point,
    Plane: Plane,
    CalculateNormal: calculateNormal,
    ProjectPointOntoPlane: projectPointOntoPlane
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

function projectPointOntoPlane (plane, point) {
    console.log(plane);
    var projectedPoint = plane.plane3.projectPoint(point);
    return projectedPoint;
}


