var rollup = require('rollup');
var babel = require('rollup-plugin-babel');
var fs = require('fs');

rollup.rollup({
    entry: '../src/index-test.js',
    plugins: [
        babel({ exclude: 'node_modules/**', }),
    ],
}).then(function writeToUMD(bundle) {
    console.log('Writing transplied lib to ../build/test.js');
    var result = bundle.generate({
        format: 'umd',
        moduleName: 'Raytracer',
    });
    fs.writeFileSync('../build/test.js', result.code);
}).catch(function error(err) {
    console.log(err);
});
