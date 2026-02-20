// define our global table variables so we can initialize them on setup
let vTable;
let qTable;
let eTable;

// when the page loads, initialize our table variables
document.addEventListener('DOMContentLoaded', async function() {
    const tables = await initializeData(); // call the function which loads and reads the JSON data...
    vTable = tables.vTable_data; // and then set our variables according to the imported data
    qTable = tables.qTable_data;
    eTable = tables.eTable_data;
});

// load and read JSON data
async function initializeData() {
    try {
        // load the file
        const response = await fetch('raw_to_scaled_data.json'); 
        const data = await response.json();
        
        // initialize the data variables that we'll store json data in
        const vTable_data = {};
        const qTable_data = {};
        const eTable_data = {};

        // there are 3 different data types - math, verbal, and english, but they each scale the same
        data.forEach(row => {
            const i = row.index;
            if (row.vTable !== null) vTable_data[i] = row.vTable;
            if (row.qTable !== null) qTable_data[i] = row.qTable;
            if (row.eTable !== null) eTable_data[i] = row.eTable;
        });

        return { vTable_data, qTable_data, eTable_data }; // return our table data to the initializer, which will set them as global
    } catch (error) {
        console.error("Error loading data file:", error); // shouldn't happen, but just in case
    }
}

function getRange(w) {
    const r = Math.round(w);
    if (r <= 50) return "200";
    const ranges = [[51,55,"221 - 248"],[56,60,"249 - 276"],[61,65,"277 - 304"],[66,70,"305 - 333"],[71,75,"334 - 361"],[76,80,"362 - 389"],[81,85,"390 - 418"],[86,90,"419 - 446"],[91,95,"447 - 474"],[96,100,"475 - 503"],[101,105,"504 - 531"],[106,110,"532 - 559"],[111,115,"560 - 587"],[116,120,"588 - 616"],[121,125,"617 - 644"],[126,130,"645 - 672"],[131,135,"673 - 701"],[136,140,"702 - 729"],[141,145,"730 - 761"],[146,149,"762 - 795"]];
    for (let range of ranges) if (r >= range[0] && r <= range[1]) return range[2];
    return "800";
}

function getPercentile(rangeStr) {
    if (rangeStr === "200") return "Approximately 0% scored below this score.";
    if (rangeStr === "800") return "Approximately 97% scored below this score.";
    
    const avgScore = parseInt(rangeStr.split(' - ')[0]);
    const percentiles = [
        {max: 349, below: 0}, {max: 374, below: 6}, {max: 399, below: 10}, 
        {max: 424, below: 15}, {max: 449, below: 20}, {max: 474, below: 26}, 
        {max: 499, below: 33}, {max: 524, below: 40}, {max: 549, below: 47}, 
        {max: 574, below: 54}, {max: 599, below: 61}, {max: 624, below: 68}, 
        {max: 649, below: 76}, {max: 674, below: 83}, {max: 699, below: 89}, 
        {max: 724, below: 94}, {max: 800, below: 97}
    ];
    for (let p of percentiles) {
        if (avgScore <= p.max) return `Approximately ${p.below}% of examinees scored below this range.`;
    }
    return "";
}
function pickTwoRandom(className) {
    const inputs = Array.from(document.querySelectorAll(className))
                        .map(i => i.value)
                        .filter(v => v !== "");
    if (inputs.length === 2) return Number(inputs[0]) + Number(inputs[1]);
    const shuffled = inputs.sort(() => 0.5 - Math.random());
    return Number(shuffled[0]) + Number(shuffled[1]);
}
function calculateRandomized() {
    let hasError = false;
    const allDomains = [
        { selector: '.q-in', section: 'q-section', max: 20, name: 'Quantitative' },
        { selector: '.v-in', section: 'v-section', max: 20, name: 'Verbal' },
        { selector: '.e-in', section: 'e-section', max: 22, name: 'English' }
    ];

    document.querySelectorAll('input').forEach(i => i.classList.remove('error-border'));
    document.querySelectorAll('.domain-section').forEach(s => s.classList.remove('domain-error'));
    for (const domain of allDomains) {
        const inputs = Array.from(document.querySelectorAll(domain.selector));
        const activeValues = inputs.map(i => i.value.trim()).filter(v => v !== "");

        if (activeValues.length < 2) {
            document.getElementById(domain.section).classList.add('domain-error');
            hasError = true;
        }

        for (const input of inputs) {
            const val = Number(input.value);
            if (input.value !== "" && (isNaN(val) || val < 0 || val > domain.max)) {
                input.classList.add('error-border');
                hasError = true;
            }
        }
    }
    if (hasError) {
        return; // don't calculate anything because something is wrong
    }

    const vRaw = pickTwoRandom('.v-in');
    const qRaw = pickTwoRandom('.q-in');
    const eRaw = pickTwoRandom('.e-in');

    const vStd = vTable[vRaw] || 50;
    const qStd = qTable[qRaw] || 50;
    const eStd = eTable[eRaw] || 50;

    const multi = (2*vStd + 2*qStd + eStd) / 5;
    const hum = (3*vStd + qStd + eStd) / 5;
    const sci = (3*qStd + vStd + eStd) / 5;

    const rMulti = getRange(multi);
    const rHum = getRange(hum);
    const rSci = getRange(sci);
    
    document.getElementById('res_multi').innerText = rMulti;
    document.getElementById('perc_multi').innerText = getPercentile(rMulti);
    
    document.getElementById('res_hum').innerText = rHum;
    document.getElementById('perc_hum').innerText = getPercentile(rHum);
    
    document.getElementById('res_sci').innerText = rSci;
    document.getElementById('perc_sci').innerText = getPercentile(rSci);
    document.getElementById('selection-log').innerText = `Used Raw Totals: Quantitative ${qRaw}, Verbal ${vRaw}, English ${eRaw}`;
    document.getElementById('results').style.display = 'block';
}