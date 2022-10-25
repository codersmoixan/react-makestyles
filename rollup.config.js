import { defineConfig } from "rollup";
import nodeResolve from 'rollup-plugin-node-resolve'
import replace from 'rollup-plugin-replace'
import commonjs from 'rollup-plugin-commonjs'
import inject from 'rollup-plugin-inject'
import babel from 'rollup-plugin-babel'
import json from 'rollup-plugin-json'
import { terser } from 'rollup-plugin-terser'
import builtins from 'rollup-plugin-node-builtins'
import visualizer from 'rollup-plugin-visualizer'
import typescript from "@rollup/plugin-typescript"

const processShim = '\0process-shim'

const prod = process.env.PRODUCTION
const mode = prod ? 'production' : 'development'

console.log(`Creating ${mode} bundle...`)

const moduleName = 'makestyles'
const exports = 'named'

const globals = { react: 'React' }

const prodOutput = [
  { exports, file: 'dist/react-makestyles.min.js', format: 'umd', name: moduleName },
  { exports, file: 'dist/react-makestyles.esm.js', format: 'esm', name: moduleName },
  { exports, file: 'dist/react-makestyles.cjs.js', format: 'cjs', name: moduleName }
]

const devOutput = [
  { exports, globals, file: 'dist/react-makestyles.js', format: 'umd', name: moduleName },
  { exports, globals, file: 'dist/react-makestyles.esm.js', format: 'es', name: moduleName }
]

const external = ['react']

const output = prod ? prodOutput : devOutput

const plugins = [
  commonjs(),
  babel({
    babelrc: true
  }),
  // Unlike Webpack and Browserify, Rollup doesn't automatically shim Node
  // builtins like `process`. This ad-hoc plugin creates a 'virtual module'
  // which includes a shim containing just the parts the bundle needs.
  {
    resolveId (importee) {
      if (importee === processShim) return importee
      return null
    },
    load (id) {
      if (id === processShim) return 'export default { argv: [], env: {} }'
      return null
    }
  },
  builtins(),
  nodeResolve({
    mainFields: ['module', 'main', 'jsnext', 'browser']
  }),
  replace({
    'process.env.NODE_ENV': JSON.stringify(prod ? 'production' : 'development')
  }),
  inject({
    process: processShim
  }),
  json(),
  typescript({
    outputToFilesystem: true,
    tsconfig: './tsconfig.json',
  })
]

if (prod) plugins.push(terser(), visualizer({ filename: './bundle-stats.html' }))

export default defineConfig([
  {
    input: 'src/index.ts',
    output,
    plugins,
    external
  },
])
