const assert = require('assert');

(async () => {
  const {
    generateMountainRangePath,
    generateCirclesPath,
    generateSinePath,
    generateScallopedPath
  } = await import('../shapes.mjs');

  function check(fn) {
    const path = fn();
    assert.strictEqual(typeof path, 'string');
    assert.ok(path.startsWith('M'), 'Path should start with M');
    assert.ok(path.endsWith('Z'), 'Path should end with Z');
  }

  check(generateMountainRangePath);
  check(generateCirclesPath);
  check(generateSinePath);
  check(generateScallopedPath);

  console.log('All tests passed.');
})();
