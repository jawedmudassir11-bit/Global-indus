const assert = require('assert');
const { sanitizeStructure } = require('./utils');

// Run tests
function runTests() {
    console.log("Running sanitizeStructure tests...");

    // Test 1: Null or undefined structure
    assert.deepStrictEqual(sanitizeStructure(null), []);
    assert.deepStrictEqual(sanitizeStructure(undefined), []);

    // Test 2: Falsy values filtered out
    assert.deepStrictEqual(sanitizeStructure([null, undefined, { name: 'Site A' }, false]), [{ name: 'Site A', subgroups: [] }]);

    // Test 3: Object input
    const structObj = {
        site1: { name: 'Site A' },
        site2: { name: 'Site B' },
        site3: null // falsy value in object
    };
    assert.deepStrictEqual(sanitizeStructure(structObj), [
        { name: 'Site A', subgroups: [] },
        { name: 'Site B', subgroups: [] }
    ]);

    // Test 4: Subgroups as array
    const structWithSubgroupsArray = [
        { name: 'Site A', subgroups: [{ name: 'Sub A1' }, null, { name: 'Sub A2' }] }
    ];
    assert.deepStrictEqual(sanitizeStructure(structWithSubgroupsArray), [
        { name: 'Site A', subgroups: [{ name: 'Sub A1' }, { name: 'Sub A2' }] }
    ]);

    // Test 5: Subgroups as object
    const structWithSubgroupsObject = [
        {
            name: 'Site B',
            subgroups: {
                sub1: { name: 'Sub B1' },
                sub2: { name: 'Sub B2' },
                sub3: undefined
            }
        }
    ];
    assert.deepStrictEqual(sanitizeStructure(structWithSubgroupsObject), [
        { name: 'Site B', subgroups: [{ name: 'Sub B1' }, { name: 'Sub B2' }] }
    ]);

    // Test 6: Missing subgroups defaults to empty array
    assert.deepStrictEqual(sanitizeStructure([{ name: 'Site C' }]), [{ name: 'Site C', subgroups: [] }]);

    console.log("All tests passed! ✅");
}

try {
    runTests();
} catch (error) {
    console.error("Test failed: ", error.message);
    process.exit(1);
}
