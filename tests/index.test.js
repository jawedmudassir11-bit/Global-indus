const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

const html = fs.readFileSync(path.resolve(__dirname, '../index.html'), 'utf8');

describe('index.html state sanitization functions', () => {
  let dom;
  let window;

  beforeEach(() => {
    dom = new JSDOM(html, {
      url: "http://localhost/", // Important for localStorage in jsdom
      runScripts: "dangerously",
      beforeParse(window) {
        window.THREE = {
          Scene: jest.fn().mockReturnValue({ add: jest.fn(), fog: null }),
          FogExp2: jest.fn(),
          PerspectiveCamera: jest.fn().mockReturnValue({ position: { z: 0 }, aspect: 1, updateProjectionMatrix: jest.fn() }),
          WebGLRenderer: jest.fn().mockReturnValue({ setSize: jest.fn(), setPixelRatio: jest.fn(), render: jest.fn() }),
          Color: jest.fn(),
          PointsMaterial: jest.fn(),
          Points: jest.fn().mockReturnValue({ geometry: { attributes: { position: { array: [], needsUpdate: false } } } }),
          Group: jest.fn().mockReturnValue({ add: jest.fn(), position: { set: jest.fn(), x: 0, y: 0, z: 0 }, rotation: { y: 0, x: 0 } }),
          TextureLoader: jest.fn().mockReturnValue({ load: jest.fn() }),
          SphereGeometry: jest.fn(),
          MeshPhongMaterial: jest.fn(),
          Mesh: jest.fn().mockReturnValue({ position: { x: 0, y: 0, z: 0 }, rotation: { y: 0 } }),
          MeshBasicMaterial: jest.fn(),
          AmbientLight: jest.fn(),
          DirectionalLight: jest.fn().mockReturnValue({ position: { set: jest.fn() } }),
          BufferGeometry: jest.fn().mockReturnValue({ setAttribute: jest.fn() }),
          BufferAttribute: jest.fn(),
          AdditiveBlending: 1,
          BackSide: 1
        };
        window.firebase = {
          initializeApp: jest.fn(),
          database: jest.fn().mockReturnValue({
            ref: jest.fn().mockReturnValue({
              off: jest.fn(),
              on: jest.fn(),
              set: jest.fn(),
              push: jest.fn(),
              once: jest.fn().mockResolvedValue({ val: jest.fn() }),
              orderByChild: jest.fn().mockReturnThis(),
              startAt: jest.fn().mockReturnThis(),
              onDisconnect: jest.fn().mockReturnValue({ remove: jest.fn() })
            })
          })
        };
        window.gsap = {
          timeline: jest.fn().mockReturnValue({ to: jest.fn().mockReturnThis() }),
          to: jest.fn()
        };
        window.requestAnimationFrame = jest.fn();
        window.BroadcastChannel = jest.fn().mockImplementation(() => {
           return {
             postMessage: jest.fn(),
             onmessage: null,
             close: jest.fn()
           }
        });
      }
    });
    window = dom.window;
  });

  describe('sanitizeStructure', () => {
    it('should return empty array if struct is falsy', () => {
      expect(window.sanitizeStructure(null)).toEqual([]);
      expect(window.sanitizeStructure(undefined)).toEqual([]);
    });

    it('should convert object to array', () => {
      const struct = {
        '1': { id: '1', name: 'Site 1' },
        '2': { id: '2', name: 'Site 2' }
      };
      const sanitized = window.sanitizeStructure(struct);
      expect(Array.isArray(sanitized)).toBe(true);
      expect(sanitized.length).toBe(2);
      expect(sanitized[0].name).toBe('Site 1');
    });

    it('should filter out falsy items', () => {
      const struct = [{ id: '1', name: 'Site 1' }, null, undefined, { id: '2', name: 'Site 2' }];
      const sanitized = window.sanitizeStructure(struct);
      expect(sanitized.length).toBe(2);
    });

    it('should handle missing subgroups and set them to empty array', () => {
      const struct = [{ id: '1', name: 'Site 1' }];
      const sanitized = window.sanitizeStructure(struct);
      expect(sanitized[0].subgroups).toEqual([]);
    });

    it('should convert subgroups object to array and filter falsy items', () => {
      const struct = [{
        id: '1',
        name: 'Site 1',
        subgroups: {
          'sub1': { id: 'sub1', name: 'Sub 1' },
          'sub2': null
        }
      }];
      const sanitized = window.sanitizeStructure(struct);
      expect(Array.isArray(sanitized[0].subgroups)).toBe(true);
      expect(sanitized[0].subgroups.length).toBe(1);
      expect(sanitized[0].subgroups[0].name).toBe('Sub 1');
    });
  });

  describe('sanitizeState', () => {
    it('should return initialized state if state is falsy', () => {
      const state = window.sanitizeState(null);
      expect(state.workers).toEqual([]);
      expect(state.keyPersons).toEqual([]);
      expect(state.attendance).toEqual({});
      expect(state.kpAttendance).toEqual({});
      expect(state.advances).toEqual({});
      expect(state.timeline).toEqual({});
      expect(state.dpr).toEqual({});
    });

    it('should sanitize workers converting object to array and filtering', () => {
      const state = {
        workers: {
          'w1': { id: 'w1', name: 'Worker 1' },
          'w2': null
        }
      };
      const sanitized = window.sanitizeState(state);
      expect(Array.isArray(sanitized.workers)).toBe(true);
      expect(sanitized.workers.length).toBe(1);
      expect(sanitized.workers[0].name).toBe('Worker 1');
    });

    it('should sanitize keyPersons converting object to array and filtering', () => {
      const state = {
        keyPersons: {
          'kp1': { id: 'kp1', name: 'KP 1' },
          'kp2': null
        }
      };
      const sanitized = window.sanitizeState(state);
      expect(Array.isArray(sanitized.keyPersons)).toBe(true);
      expect(sanitized.keyPersons.length).toBe(1);
      expect(sanitized.keyPersons[0].name).toBe('KP 1');
    });

    it('should maintain objects or convert arrays to objects for associative state properties', () => {
      const state = {
        attendance: [], // Should be object assigned
        kpAttendance: [{ '1': {} }], // Array becomes object assigned
        advances: { 'w1': 50 },
        timeline: { 'date1': [] },
        dpr: []
      };
      const sanitized = window.sanitizeState(state);
      expect(typeof sanitized.attendance).toBe('object');
      expect(Array.isArray(sanitized.attendance)).toBe(false);
      expect(typeof sanitized.kpAttendance).toBe('object');
      expect(sanitized.advances).toEqual({ 'w1': 50 });
      expect(sanitized.timeline).toEqual({ 'date1': [] });
    });

    it('should sanitize dpr matReceived and matConsumed objects to arrays and filter', () => {
      const state = {
        dpr: {
          'date1': {
            matReceived: {
              '0': { item: 'Cement', qty: 10 },
              '1': null
            },
            matConsumed: {
              '0': null,
              '1': { item: 'Sand', qty: 20 }
            }
          }
        }
      };
      const sanitized = window.sanitizeState(state);
      const dprDate1 = sanitized.dpr['date1'];
      expect(Array.isArray(dprDate1.matReceived)).toBe(true);
      expect(dprDate1.matReceived.length).toBe(1);
      expect(dprDate1.matReceived[0].item).toBe('Cement');

      expect(Array.isArray(dprDate1.matConsumed)).toBe(true);
      expect(dprDate1.matConsumed.length).toBe(1);
      expect(dprDate1.matConsumed[0].item).toBe('Sand');
    });
  });
});
