//import sourcemaps from 'rollup-plugin-sourcemaps';
import closureCompiler from '@ampproject/rollup-plugin-closure-compiler';
import resolve from 'rollup-plugin-node-resolve';
//import commonjs from 'rollup-plugin-commonjs';

export default [{
    // library
    input: 'src/qr-scanner.js',
    output: {
        file: 'qr-scanner.min.js',
        format: 'esm',
        interop: false,
        sourcemap: true,
    },
    plugins: [
        resolve(),
        closureCompiler({
            language_in: 'ECMASCRIPT6',
            language_out: 'ECMASCRIPT6',
            rewrite_polyfills: false,
        })
    ]
}, /*{
    // worker
    //external: ['get-pixels', 'gl-mat2', 'gl-vec2', 'gl-vec3', 'lodash', 'ndarray', 'ndarray-linear-interpolate'],
    //external: ['get-pixels'],
    input: 'src/worker.js',
    output: {     
        file: 'qr-scanner-worker.min.js',
        format: 'iife',
        interop: false,
        sourcemap: true,
        compact: false,
    },
    //context: 'window',
    plugins: [
        sourcemaps(),
        resolve(),
        commonjs(),
        closureCompiler({
            //compilation_level: 'ADVANCED',
            //warning_level: 'QUIET',
            language_in: 'ECMASCRIPT6',
            language_out: 'ECMASCRIPT6',
            rewrite_polyfills: false,
        }),
    ]
}*/];
