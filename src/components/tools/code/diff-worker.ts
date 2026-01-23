export {};

type DiffLineType = 'unchanged' | 'added' | 'removed';

interface DiffLine {
  type: DiffLineType;
  content: string;
  oldLineNum?: number;
  newLineNum?: number;
}

interface ComputeRequest {
  id: number;
  a: string;
  b: string;
}

interface ComputeResponse {
  id: number;
  diffLines: DiffLine[];
}

type DiffOp = 'equal' | 'insert' | 'delete';

function myersDiff(aLines: string[], bLines: string[]): DiffOp[] {
  const n = aLines.length;
  const m = bLines.length;
  const max = n + m;
  const offset = max;

  const v = new Array<number>(2 * max + 1).fill(0);
  const trace: Array<number[]> = [];

  for (let d = 0; d <= max; d++) {
    const vSnapshot = v.slice();
    trace.push(vSnapshot);

    for (let k = -d; k <= d; k += 2) {
      const kIndex = k + offset;

      let x: number;
      if (k === -d) {
        x = v[kIndex + 1] ?? 0;
      } else if (k === d) {
        x = (v[kIndex - 1] ?? 0) + 1;
      } else {
        const down = v[kIndex + 1] ?? 0;
        const right = (v[kIndex - 1] ?? 0) + 1;
        x = down > right ? down : right;
      }

      let y = x - k;

      while (x < n && y < m && aLines[x] === bLines[y]) {
        x++;
        y++;
      }

      v[kIndex] = x;

      if (x >= n && y >= m) {
        return backtrack(trace, aLines, bLines, offset);
      }
    }
  }

  return [];
}

function backtrack(
  trace: Array<number[]>,
  aLines: string[],
  bLines: string[],
  offset: number
): DiffOp[] {
  let x = aLines.length;
  let y = bLines.length;
  const ops: DiffOp[] = [];

  for (let d = trace.length - 1; d >= 0; d--) {
    const v = trace[d]!;
    const k = x - y;
    const kIndex = k + offset;

    let prevK: number;
    if (k === -d) {
      prevK = k + 1;
    } else if (k === d) {
      prevK = k - 1;
    } else {
      const down = v[kIndex + 1] ?? 0;
      const right = v[kIndex - 1] ?? 0;
      prevK = down > right ? k + 1 : k - 1;
    }

    const prevX = (v[prevK + offset] ?? 0) as number;
    const prevY = prevX - prevK;

    while (x > prevX && y > prevY) {
      ops.unshift('equal');
      x--;
      y--;
    }

    if (d === 0) {
      break;
    }

    if (x === prevX) {
      ops.unshift('insert');
      y--;
    } else {
      ops.unshift('delete');
      x--;
    }
  }

  return ops;
}

function buildDiffLines(a: string, b: string): DiffLine[] {
  const aLines = a.split('\n');
  const bLines = b.split('\n');

  const ops = myersDiff(aLines, bLines);
  const diffLines: DiffLine[] = [];

  let i = 0;
  let j = 0;

  for (const op of ops) {
    if (op === 'equal') {
      const line = aLines[i] ?? '';
      diffLines.push({
        type: 'unchanged',
        content: line,
        oldLineNum: i + 1,
        newLineNum: j + 1,
      });
      i++;
      j++;
      continue;
    }

    if (op === 'delete') {
      const line = aLines[i] ?? '';
      diffLines.push({
        type: 'removed',
        content: line,
        oldLineNum: i + 1,
      });
      i++;
      continue;
    }

    const line = bLines[j] ?? '';
    diffLines.push({
      type: 'added',
      content: line,
      newLineNum: j + 1,
    });
    j++;
  }

  while (i < aLines.length) {
    diffLines.push({
      type: 'removed',
      content: aLines[i] ?? '',
      oldLineNum: i + 1,
    });
    i++;
  }

  while (j < bLines.length) {
    diffLines.push({
      type: 'added',
      content: bLines[j] ?? '',
      newLineNum: j + 1,
    });
    j++;
  }

  return diffLines;
}

self.onmessage = (event: MessageEvent<ComputeRequest>) => {
  const { id, a, b } = event.data;
  const diffLines = buildDiffLines(a, b);
  const response: ComputeResponse = { id, diffLines };
  self.postMessage(response);
};
