// Shared esbuild options: JSX for the React app by default; design and build
// presets switch to their own string serializers with @jsx pragmas.
import * as esbuild from 'esbuild';
export const reactGlobals = {
  name: 'react-globals',
  setup(b) {
    b.onResolve({ filter: /^react(-dom)?(\/client)?$/ }, a => ({ path: a.path, namespace: 'g' }));
    b.onLoad({ filter: /.*/, namespace: 'g' }, a => ({
      contents: a.path.startsWith('react-dom') ? 'module.exports = window.ReactDOM;' : 'module.exports = window.React;', loader: 'js',
    }));
  },
};
export async function bundle(entry, extra = {}) {
  const r = await esbuild.build({
    entryPoints: [entry], bundle: true, format: 'iife', write: false, target: 'es2020', minify: false,
    jsx: 'transform', jsxFactory: 'React.createElement', jsxFragment: 'React.Fragment',
    loader: { '.js': 'jsx' }, plugins: [reactGlobals], logLevel: 'warning', legalComments: 'none', charset: 'utf8', ...extra,
  });
  return r.outputFiles[0].text;
}
