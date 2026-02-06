import typescript from '@rollup/plugin-typescript';

export default {
    input: 'src/main.ts',
    output: {
        file: 'public/bundle.js',
        format: 'iife', // "Immediately Invoked Function Expression" for browsers
        sourcemap: true
    },
    plugins: [typescript()]
};