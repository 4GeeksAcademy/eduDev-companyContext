// CommonJS setup runs before module imports to align Jest errors with host Node.
// eslint-disable-next-line @typescript-eslint/no-require-imports -- Jest setupFiles loads this CommonJS tooling file before application modules.
const { runInThisContext } = require('node:vm');

// Node's native DOMException/fetch use host errors, not Jest's VM constructors.
// Align the built-in family before imports so TypeError et al. still extend Error.
for (const name of [
  'Error', 'EvalError', 'RangeError', 'ReferenceError',
  'SyntaxError', 'TypeError', 'URIError', 'AggregateError',
]) {
  globalThis[name] = runInThisContext(name);
}
