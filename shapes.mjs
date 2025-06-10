export function generateMountainRangePath() {
  let path = "M0 150";
  const segments = 8;
  const segmentWidth = 800 / segments;
  for (let i = 1; i <= segments; i++) {
    const x = i * segmentWidth;
    const y = i % 2 === 1 ? Math.random() * 40 + 50 : Math.random() * 20 + 130;
    path += ` L${x} ${y}`;
  }
  path += " L800 200 L0 200 Z";
  return path;
}

export function generateCirclesPath() {
  let path = "M0 100";
  let x = 0;
  while (x < 800) {
    let segmentWidth = Math.random() * 80 + 40;
    if (x + segmentWidth > 800) {
      segmentWidth = 800 - x;
    }
    const radius = segmentWidth / 2;
    const sweepFlag = Math.random() > 0.5 ? 1 : 0;
    path += ` A${radius} ${radius} 0 0 ${sweepFlag} ${x + segmentWidth} 100`;
    x += segmentWidth;
  }
  path += " L800 200 L0 200 Z";
  return path;
}

export function generateSinePath() {
  const amplitude = Math.random() * 30 + 20;
  const frequency = Math.random() * 2 + 1;
  const phase = Math.random() * Math.PI * 2;
  const steps = 40;
  let path = `M0 ${100 + amplitude * Math.sin(phase)}`;
  for (let i = 1; i <= steps; i++) {
    const x = (800 / steps) * i;
    const y = 100 + amplitude * Math.sin((2 * Math.PI * frequency * x) / 800 + phase);
    path += ` L${x} ${y}`;
  }
  path += " L800 200 L0 200 Z";
  return path;
}

export function generateScallopedPath() {
  let path = "M0 100";
  let x = 0;
  let toggle = true;
  while (x < 800) {
    let segmentWidth = Math.random() * 50 + 50;
    if (x + segmentWidth > 800) {
      segmentWidth = 800 - x;
    }
    const radius = segmentWidth / 2;
    const sweepFlag = toggle ? 1 : 0;
    path += ` A${radius} ${radius} 0 0 ${sweepFlag} ${x + segmentWidth} 100`;
    x += segmentWidth;
    toggle = !toggle;
  }
  path += " L800 200 L0 200 Z";
  return path;
}
