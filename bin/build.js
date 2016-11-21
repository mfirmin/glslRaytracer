var rollup = require('rollup');
var babel = require('rollup-plugin-babel');
var fs = require('fs');

rollup.rollup({
    entry: '../src/index.js',
    plugins: [
        babel({ exclude: 'node_modules/**', }),
    ],
}).then(function writeToUMD(bundle) {
    console.log('Writing transplied lib to ../build/raytracer.js');
    var result = bundle.generate({
        format: 'umd',
        moduleName: 'Raytracer',
    });
    fs.writeFileSync('../build/raytracer.js', result.code);
}).catch(function error(err) {
    console.log(err);
});
