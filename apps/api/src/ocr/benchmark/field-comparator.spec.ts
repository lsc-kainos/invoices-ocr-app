import {
  matchField,
  computeScore,
  type FieldResults,
} from './field-comparator';

describe('matchField', () => {
  it('returns true when expected is null (no penalty)', () => {
    expect(matchField(null, null)).toBe(true);
  });

  it('returns true when expected is null even if extracted has value', () => {
    expect(matchField('anything', null)).toBe(true);
  });

  it('returns true when expected is empty string', () => {
    expect(matchField('anything', '')).toBe(true);
  });

  it.todo('normalize: $232.95 matches 232.95');
  it.todo('normalize: trims whitespace and lowercases');
  it.todo('normalize: handles null extracted vs non-null expected');
});

describe('computeScore', () => {
  it('returns score 1 when no fields are present in ground truth', () => {
    const fr: FieldResults = {
      a: { extracted: null, expected: null, match: true },
      b: { extracted: 'x', expected: null, match: true },
    };
    const r = computeScore(fr);
    expect(r.presentInGT).toBe(0);
    expect(r.score).toBe(1);
  });

  it('returns ~0.667 when 2 of 3 GT fields match', () => {
    const fr: FieldResults = {
      a: { extracted: '1', expected: '1', match: true },
      b: { extracted: '2', expected: '2', match: true },
      c: { extracted: 'x', expected: '3', match: false },
    };
    const r = computeScore(fr);
    expect(r.presentInGT).toBe(3);
    expect(r.score).toBeCloseTo(2 / 3, 3);
  });

  it('returns 0 when all GT fields fail to match', () => {
    const fr: FieldResults = {
      a: { extracted: 'x', expected: '1', match: false },
      b: { extracted: 'y', expected: '2', match: false },
    };
    const r = computeScore(fr);
    expect(r.score).toBe(0);
  });
});
