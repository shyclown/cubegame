import typescript from '@rollup/plugin-typescript';
import copy from 'rollup-plugin-copy';
import serve from 'rollup-plugin-serve';
import livereload from 'rollup-plugin-livereload';

// Check if we are in watch mode
const isWatch = process.env.ROLLUP_WATCH === 'true';

export default {
    input: 'src/main.ts',
    output: {
        file: 'dist/bundle.js',
        format: 'iife', // "Immediately Invoked Function Expression" for browsers
        sourcemap: true
    },
    plugins: [typescript(),copy({
        targets: [
            // Moves HTML to dist
            { src: 'src/index.html', dest: 'dist' },
            // Moves all CSS from styles folder to dist root
            { src: 'src/styles/*.css', dest: 'dist' },
            // Moves images to dist root
            { src: 'src/public/*.{jpg,png}', dest: 'dist' }
        ],
        copyOnce: false // Ensures files update when you change them
    }),
        // Only run these if we are watching
        isWatch && serve({
            contentBase: 'dist',
            port: 3000,
            open: true // Automatically opens your browser
        }),
        isWatch && livereload('dist')
    ]
};