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
    assert.ok(
      path.includes('L800 200 L0 200 Z'),
      'Path should close with the final segment'
    );
    return path;
  }

  const mountainPath = check(generateMountainRangePath);
  assert.ok(mountainPath.startsWith('M0 150'));
  assert.strictEqual((mountainPath.match(/ L/g) || []).length, 10);

  const circlesPath = check(generateCirclesPath);
  assert.ok(circlesPath.startsWith('M0 100'));
  assert.ok(circlesPath.includes('A'), 'Circles path should contain arc commands');

  const sinePath = check(generateSinePath);
  assert.strictEqual((sinePath.match(/ L/g) || []).length, 42);

  const scallopedPath = check(generateScallopedPath);
  assert.ok(scallopedPath.startsWith('M0 100'));
  assert.ok(scallopedPath.includes('A'), 'Scalloped path should contain arc commands');

  console.log('All tests passed.');
})();
