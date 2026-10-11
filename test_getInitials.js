const fs = require('fs');

const html = fs.readFileSync('index.html', 'utf8');

// Use a more robust regex that just grabs everything between function getInitials(name) { and the next function
const getInitialsMatch = html.match(/function getInitials\(name\) \{[\s\S]*?(?=function getAttendanceMonthKey)/);

if (!getInitialsMatch) {
    console.error("Failed to find getInitials function in index.html");
    process.exit(1);
}

let getInitials;
try {
    eval("getInitials = function" + getInitialsMatch[0].replace('function getInitials', ''));
} catch (e) {
    console.error("Failed to eval getInitials:", e);
    process.exit(1);
}

let testsFailed = 0;

function assertEqual(actual, expected, message) {
    if (actual !== expected) {
        console.error(`❌ ${message}. Expected '${expected}', got '${actual}'`);
        testsFailed++;
    } else {
        console.log(`✅ ${message}`);
    }
}

console.log("Running tests for getInitials...\n");

assertEqual(getInitials('John Doe'), 'JD', "Normal name 'John Doe'");
assertEqual(getInitials('John'), 'J', "Single name 'John'");
assertEqual(getInitials(''), 'U', "Empty string");
assertEqual(getInitials(null), 'U', "null");
assertEqual(getInitials(undefined), 'U', "undefined");
assertEqual(getInitials('  John   Doe  '), 'JD', "Extra spaces '  John   Doe  '");

console.log("");

if (testsFailed > 0) {
    console.error(`${testsFailed} tests failed!`);
    process.exit(1);
} else {
    console.log("All tests passed!");
    process.exit(0);
}
