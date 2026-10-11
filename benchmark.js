const { JSDOM } = require("jsdom");

function runBaseline() {
    const dom = new JSDOM(`<!DOCTYPE html><html><body>
        <table id="monthly-table">
            <thead>
                <tr></tr>
                <tr id="sub-headers-row"></tr>
            </thead>
        </table>
    </body></html>`);

    const h1 = dom.window.document.querySelector("#monthly-table thead tr:first-child");
    const h2 = dom.window.document.getElementById("sub-headers-row");
    const currentMonthDays = 31;

    const start = process.hrtime.bigint();

    // Simulate multiple calls to amplify the effect
    for (let i = 0; i < 1000; i++) {
        h1.innerHTML = `<th rowspan="2" class="sticky-col">NAME</th><th rowspan="2">TRADE</th>`;
        h2.innerHTML = "";
        for (let d=1; d<=currentMonthDays; d++) {
            const th=dom.window.document.createElement("th");
            th.colSpan=2;
            th.textContent=d;
            h1.appendChild(th);
            h2.innerHTML+=`<th class="tier2">D</th><th class="tier2">OT</th>`;
        }
    }

    const end = process.hrtime.bigint();
    return Number(end - start) / 1000000; // ms
}

function runOptimized() {
    const dom = new JSDOM(`<!DOCTYPE html><html><body>
        <table id="monthly-table">
            <thead>
                <tr></tr>
                <tr id="sub-headers-row"></tr>
            </thead>
        </table>
    </body></html>`);

    const h1 = dom.window.document.querySelector("#monthly-table thead tr:first-child");
    const h2 = dom.window.document.getElementById("sub-headers-row");
    const currentMonthDays = 31;

    const start = process.hrtime.bigint();

    for (let i = 0; i < 1000; i++) {
        h1.innerHTML = `<th rowspan="2" class="sticky-col">NAME</th><th rowspan="2">TRADE</th>`;
        h2.innerHTML = "";
        let h2Content = "";
        for (let d=1; d<=currentMonthDays; d++) {
            const th=dom.window.document.createElement("th");
            th.colSpan=2;
            th.textContent=d;
            h1.appendChild(th);
            h2Content += `<th class="tier2">D</th><th class="tier2">OT</th>`;
        }
        h2.innerHTML = h2Content;
    }

    const end = process.hrtime.bigint();
    return Number(end - start) / 1000000; // ms
}

console.log("Baseline:", runBaseline().toFixed(2), "ms");
console.log("Optimized:", runOptimized().toFixed(2), "ms");
