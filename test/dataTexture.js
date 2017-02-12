/* eslint-disable */
var assert = require('assert');
var Raytracer = require('../build/test.js');

var DataTexture = Raytracer.DataTexture;

describe('DataTexture', function() {
    it('should properly calculate width and height', function() {
        var dt = new DataTexture();

        var res = dt.computeTextureSize(1000);

        assert.equal(res.width, 1024);
        assert.equal(res.height, 1);

        var res = dt.computeTextureSize(1);

        assert.equal(res.width, 1);
        assert.equal(res.height, 1);

        var res = dt.computeTextureSize(4);

        assert.equal(res.width, 4);
        assert.equal(res.height, 1);

        var res = dt.computeTextureSize(3);

        assert.equal(res.width, 4);
        assert.equal(res.height, 1);

        var res = dt.computeTextureSize(10000);

        assert.equal(res.width, 4096);
        assert.equal(res.height, 4);

        var res = dt.computeTextureSize(4096 * 4096);

        assert.equal(res.width, 4096);
        assert.equal(res.height, 4096);
    });
    it('should throw errors appropriately', function() {
        var dt = new DataTexture();

        assert.throws(function () {
            dt.computeTextureSize(4096 * 4096 + 1);
        });

        assert.throws(function () {
            dt.computeTextureSize(-1);
        });
    });
});
/* eslint-enable */
