/* =========================================
       CRITICAL DATA SANITIZER
       ========================================= */
function sanitizeStructure(struct) {
    if (!struct) return [];
    let sArr = Array.isArray(struct) ? struct : Object.values(struct);
    sArr = sArr.filter(Boolean);
    sArr.forEach(site => {
    if (site.subgroups) {
        site.subgroups = Array.isArray(site.subgroups) ? site.subgroups : Object.values(site.subgroups);
        site.subgroups = site.subgroups.filter(Boolean);
    } else { site.subgroups = []; }
    });
    return sArr;
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { sanitizeStructure };
}
