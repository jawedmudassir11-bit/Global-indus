const fs = require('fs');
const path = require('path');

const html = fs.readFileSync(path.resolve(__dirname, '../index.html'), 'utf8');

// Extract the sanitizeState function string
const regex = /function sanitizeState\s*\([\s\S]*?^    \}/m;
const match = html.match(regex);

if (!match) {
  throw new Error("Could not find sanitizeState function in index.html");
}

// Evaluate the function in the current context
const sanitizeState = new Function('state', `
  ${match[0]}
  return sanitizeState(state);
`);

describe('sanitizeState', () => {
  it('should initialize empty state when null or undefined is passed', () => {
    const expected = {
      workers: [],
      keyPersons: [],
      attendance: {},
      kpAttendance: {},
      advances: {},
      timeline: {},
      dpr: {}
    };
    expect(sanitizeState(null)).toEqual(expected);
    expect(sanitizeState(undefined)).toEqual(expected);
  });

  it('should handle workers and keyPersons as arrays with falsy values', () => {
    const state = {
      workers: ['Alice', '', null, 'Bob', false],
      keyPersons: [undefined, 'Charlie', 'Dave', null, '']
    };
    const expected = {
      workers: ['Alice', 'Bob'],
      keyPersons: ['Charlie', 'Dave'],
      attendance: {},
      kpAttendance: {},
      advances: {},
      timeline: {},
      dpr: {}
    };
    expect(sanitizeState(state)).toEqual(expected);
  });

  it('should handle workers and keyPersons as objects', () => {
    const state = {
      workers: { 0: 'Alice', 1: null, 2: 'Bob' },
      keyPersons: { a: 'Charlie', b: '', c: 'Dave' }
    };
    const expected = {
      workers: ['Alice', 'Bob'],
      keyPersons: ['Charlie', 'Dave'],
      attendance: {},
      kpAttendance: {},
      advances: {},
      timeline: {},
      dpr: {}
    };
    expect(sanitizeState(state)).toEqual(expected);
  });

  it('should transform arrays into objects for attendance, kpAttendance, advances, timeline, and dpr', () => {
    const state = {
      attendance: ['a1', 'a2'],
      kpAttendance: ['kp1', 'kp2'],
      advances: ['adv1'],
      timeline: ['t1'],
      dpr: ['dpr1']
    };
    const result = sanitizeState(state);
    expect(result.attendance).toEqual({ 0: 'a1', 1: 'a2' });
    expect(result.kpAttendance).toEqual({ 0: 'kp1', 1: 'kp2' });
    expect(result.advances).toEqual({ 0: 'adv1' });
    expect(result.timeline).toEqual({ 0: 't1' });
    expect(result.dpr).toEqual({ 0: 'dpr1' });
  });

  it('should keep objects as objects for attendance, kpAttendance, advances, timeline, and dpr', () => {
    const state = {
      attendance: { a: 1 },
      kpAttendance: { b: 2 },
      advances: { c: 3 },
      timeline: { d: 4 },
      dpr: { e: 5 }
    };
    const result = sanitizeState(state);
    expect(result.attendance).toEqual({ a: 1 });
    expect(result.kpAttendance).toEqual({ b: 2 });
    expect(result.advances).toEqual({ c: 3 });
    expect(result.timeline).toEqual({ d: 4 });
    expect(result.dpr).toEqual({ e: 5 });
  });

  it('should sanitize matReceived and matConsumed inside dpr when they are arrays', () => {
    const state = {
      dpr: {
        '2023-10-01': {
          matReceived: ['Steel', null, 'Cement', ''],
          matConsumed: [false, 'Wood', 'Paint', undefined]
        }
      }
    };
    const result = sanitizeState(state);
    expect(result.dpr['2023-10-01'].matReceived).toEqual(['Steel', 'Cement']);
    expect(result.dpr['2023-10-01'].matConsumed).toEqual(['Wood', 'Paint']);
  });

  it('should sanitize matReceived and matConsumed inside dpr when they are objects', () => {
    const state = {
      dpr: {
        '2023-10-02': {
          matReceived: { 0: 'Bricks', 1: null, 2: 'Sand' },
          matConsumed: { a: 'Glass', b: '', c: 'Tiles' }
        }
      }
    };
    const result = sanitizeState(state);
    expect(result.dpr['2023-10-02'].matReceived).toEqual(['Bricks', 'Sand']);
    expect(result.dpr['2023-10-02'].matConsumed).toEqual(['Glass', 'Tiles']);
  });

  it('should handle dpr entries with no matReceived or matConsumed', () => {
     const state = {
      dpr: {
        '2023-10-03': {
           someOtherData: 'data'
        }
      }
    };
    const result = sanitizeState(state);
    expect(result.dpr['2023-10-03'].matReceived).toEqual([]);
    expect(result.dpr['2023-10-03'].matConsumed).toEqual([]);
    expect(result.dpr['2023-10-03'].someOtherData).toBe('data');
  });
});
