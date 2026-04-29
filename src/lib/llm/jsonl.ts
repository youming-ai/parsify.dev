export interface JsonlRecord {
  index: number;
  raw: string;
  data: unknown;
  valid: boolean;
  error?: string;
}

export interface JsonlParseResult {
  records: JsonlRecord[];
  validCount: number;
  invalidCount: number;
  fieldSummary: Record<string, string[]>;
}

function inferTypes(values: unknown[]): string[] {
  const types = new Set<string>();
  for (const value of values) {
    if (value === null) types.add('null');
    else if (Array.isArray(value)) types.add('array');
    else types.add(typeof value);
  }
  return Array.from(types);
}

export function parseJsonl(text: string): JsonlParseResult {
  const lines = text.split('\n').filter((line) => line.trim().length > 0);
  const records: JsonlRecord[] = [];
  let validCount = 0;
  let invalidCount = 0;
  const fieldValuesMap = new Map<string, unknown[]>();

  for (let index = 0; index < lines.length; index++) {
    const raw = lines[index]!;
    try {
      const data = JSON.parse(raw) as unknown;
      records.push({ index, raw, data, valid: true });
      validCount++;
      if (data !== null && typeof data === 'object' && !Array.isArray(data)) {
        for (const [key, value] of Object.entries(data as Record<string, unknown>)) {
          const list = fieldValuesMap.get(key) ?? [];
          list.push(value);
          fieldValuesMap.set(key, list);
        }
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Invalid JSON';
      records.push({ index, raw, data: null, valid: false, error: message });
      invalidCount++;
    }
  }

  const fieldSummary: Record<string, string[]> = {};
  for (const [key, values] of fieldValuesMap) {
    fieldSummary[key] = inferTypes(values);
  }

  return { records, validCount, invalidCount, fieldSummary };
}

export function serializeJsonl(records: unknown[]): string {
  return records.map((record) => JSON.stringify(record)).join('\n');
}

export function updateJsonlRecord(
  text: string,
  index: number,
  update: (record: unknown) => unknown
): string {
  const lines = text.split('\n');
  const nonEmptyIndices: number[] = [];
  for (let i = 0; i < lines.length; i++) {
    if (lines[i]!.trim().length > 0) nonEmptyIndices.push(i);
  }
  if (index < 0 || index >= nonEmptyIndices.length) return text;

  const lineIndex = nonEmptyIndices[index]!;
  const parsed = JSON.parse(lines[lineIndex]!);
  lines[lineIndex] = JSON.stringify(update(parsed));
  return lines.join('\n');
}
