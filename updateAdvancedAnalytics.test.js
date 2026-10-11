const { JSDOM } = require('jsdom');
const fs = require('fs');
const path = require('path');

describe('updateAdvancedAnalytics', () => {
    let window;
    let document;

    beforeEach(() => {
        // Read the actual index.html to ensure we test the real source code
        let html = fs.readFileSync(path.resolve(__dirname, 'index.html'), 'utf8');

        // Instead of executing the entire script (which contains blocking Firebase/Threejs calls
        // that cause JSDOM to hang), we can safely extract the exact function text dynamically
        // at runtime to evaluate it in isolation within a minimal JSDOM.

        const startStr = "function updateAdvancedAnalytics() {";
        const endStr = "} catch(e) {}";
        const startIndex = html.indexOf(startStr);
        const endIndex = html.indexOf(endStr, startIndex);

        if (startIndex === -1 || endIndex === -1) {
            throw new Error("Could not locate updateAdvancedAnalytics function in index.html");
        }

        const funcCode = html.substring(startIndex, endIndex + endStr.length + 1) + "\n    }";

        const minimalHtml = `
            <!DOCTYPE html>
            <html>
                <body>
                    <div id="ana-syncs"></div>
                    <div id="ana-payload"></div>
                    <div id="ana-zones"></div>
                    <div id="ana-workforce"></div>
                    <div id="ana-kp"></div>
                    <div id="ana-rain"></div>
                    <div id="ana-mat"></div>
                </body>
            </html>
        `;

        const dom = new JSDOM(minimalHtml, { runScripts: "dangerously" });
        window = dom.window;
        document = window.document;

        // Set up the globals that the function needs
        window.totalSyncs = 0;
        window.appState = { workers: [], keyPersons: [], dpr: {} };
        window.siteStructure = [];
        window.Blob = dom.window.Blob;

        // Inject the dynamically extracted function
        const script = document.createElement('script');
        script.textContent = `
            ${funcCode}
            window.runUpdate = updateAdvancedAnalytics;
        `;

        const virtualConsole = new (require('jsdom').VirtualConsole)();
        virtualConsole.on("error", (e) => {
            console.error("Script error:", e);
        });
        dom.virtualConsole = virtualConsole;

        document.body.appendChild(script);
    });

    test('should handle missing elements gracefully', () => {
        document.getElementById('ana-syncs').remove();
        expect(() => {
            window.runUpdate();
        }).not.toThrow();
    });

    test('should update analytics correctly when all elements are present', () => {
        window.totalSyncs = 5;
        window.appState = {
            workers: [{}, {}],
            keyPersons: [{}],
            dpr: { '2023-10-01': { weather: 'Rain', matReceived: [{}], matConsumed: [{}] } }
        };
        window.siteStructure = [{ subgroups: [{}, {}] }];

        window.runUpdate();

        expect(document.getElementById('ana-syncs').textContent).toBe('5');
        expect(document.getElementById('ana-zones').textContent).toBe('2');
        expect(document.getElementById('ana-workforce').textContent).toBe('2');
        expect(document.getElementById('ana-kp').textContent).toBe('1');
        expect(document.getElementById('ana-rain').textContent).toBe('1');
        expect(document.getElementById('ana-mat').textContent).toBe('2');
    });
});
