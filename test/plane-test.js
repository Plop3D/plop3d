global.THREE = require("three.js");
var planes = require('../src/planes');
var Point = planes.Point;
var Plane = planes.Plane;
describe("planes", function () {
    describe(".point", function() {
        it("constructs a point", function () {
            var point = new Point(1,2,3);
            is(point.x, 1);
            is(point.y, 2);
            is(point.z, 3);
        });
    });

    describe(".plane", function() {
        it("constructs a plane", function() {
            var plane = new Plane(1,2,3,4);
            is(plane.a, 1);
            is(plane.b, 2);
            is(plane.c, 3);
            is(plane.d, 4);
        })
    });

    describe(".calculateNormal", function () {
        it("calculate normal of a plane", function () {
            var point1 = new Point(1, 2, -2);
            var point2 = new Point(3, -2, 1);
            var point3 = new Point(5, 1, -4);
            var plane = planes.CalculateNormal(point1, point2, point3);
            is(plane.a, 11);
            is(plane.b, 16);
            is(plane.c, 14);
            is(plane.d, -15);
        })
    });

    describe(".projectPointOntoPlane", function () {
        it("project a point onto a plane", function () {
            var plane = new Plane(0, 1, 0, -10);
            var point = new Point(10, 20, -5);
            var pointOnPlane = planes.ProjectPointOntoPlane(plane, point);
            is(pointOnPlane.x, 10);
            is(pointOnPlane.y, 10);
            is(pointOnPlane.z, -5);
        })
    })

});
