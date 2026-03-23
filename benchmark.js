const { performance } = require('perf_hooks');

const course = {
  holes: Array.from({ length: 18 }, (_, i) => ({ hole: i + 1, par: 3 }))
};

const HOLES = Array.from({ length: 18 }, (_, i) => i + 1);

// Original
const getParForHoleOriginal = (holeNum) => {
  if (!course || !course.holes) return '-';
  const holeData = course.holes.find(h => h.hole === holeNum);
  return holeData ? holeData.par : '-';
};

// Optimized
const holeParMap = {};
if (course && course.holes) {
  course.holes.forEach(h => {
    holeParMap[h.hole] = h.par;
  });
}
const getParForHoleOptimized = (holeNum) => {
  return holeParMap[holeNum] !== undefined ? holeParMap[holeNum] : '-';
};

const ITERATIONS = 100000;

let start = performance.now();
for (let i = 0; i < ITERATIONS; i++) {
  HOLES.forEach(hole => getParForHoleOriginal(hole));
}
let end = performance.now();
console.log(`Original: ${end - start} ms`);

start = performance.now();
for (let i = 0; i < ITERATIONS; i++) {
  HOLES.forEach(hole => getParForHoleOptimized(hole));
}
end = performance.now();
console.log(`Optimized: ${end - start} ms`);
