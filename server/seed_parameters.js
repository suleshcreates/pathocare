const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Error: Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function seedParameters() {
    console.log('--- Seeding Comprehensive Test Parameters ---');

    console.log('Fetching ALL tests...');
    const { data: allTests, error: allError } = await supabase
        .from('lab_tests')
        .select('test_id, test_name');

    if (allError) {
        console.error('Error fetching all tests:', allError);
        return;
    }

    // Define parameters for various tests
    // Using loose matching keywords
    const testDefinitions = [
        {
            keywords: ['CBC', 'Hemogram', 'Blood Count'],
            parameters: [
                { name: 'Hemoglobin (Hb)', unit: 'g/dL', type: 'NUMERIC', min: 0, max: 25, norm_min: 13.5, norm_max: 17.5 },
                { name: 'Total RBC Count', unit: 'million/µL', type: 'NUMERIC', min: 0, max: 10, norm_min: 4.5, norm_max: 5.9 },
                { name: 'WBC Count', unit: '/µL', type: 'NUMERIC', min: 0, max: 50000, norm_min: 4500, norm_max: 11000 },
                { name: 'Platelet Count', unit: '/µL', type: 'NUMERIC', min: 0, max: 1000000, norm_min: 150000, norm_max: 450000 },
                { name: 'PCV / Hematocrit', unit: '%', type: 'NUMERIC', min: 0, max: 100, norm_min: 41, norm_max: 50 },
            ]
        },
        {
            keywords: ['Thyroid', 'T3', 'T4', 'TSH'],
            parameters: [
                { name: 'Total T3', unit: 'ng/dL', type: 'NUMERIC', min: 0, max: 500, norm_min: 80, norm_max: 200 },
                { name: 'Total T4', unit: 'µg/dL', type: 'NUMERIC', min: 0, max: 25, norm_min: 5.1, norm_max: 14.1 },
                { name: 'TSH', unit: 'µIU/mL', type: 'NUMERIC', min: 0, max: 20, norm_min: 0.4, norm_max: 4.0 },
            ]
        },
        {
            keywords: ['Lipid', 'Cholesterol'],
            parameters: [
                { name: 'Total Cholesterol', unit: 'mg/dL', type: 'NUMERIC', min: 0, max: 500, norm_min: 125, norm_max: 200 },
                { name: 'Triglycerides', unit: 'mg/dL', type: 'NUMERIC', min: 0, max: 1000, norm_min: 0, norm_max: 150 },
                { name: 'HDL Cholesterol', unit: 'mg/dL', type: 'NUMERIC', min: 0, max: 100, norm_min: 40, norm_max: 60 },
                { name: 'LDL Cholesterol', unit: 'mg/dL', type: 'NUMERIC', min: 0, max: 300, norm_min: 0, norm_max: 100 },
                { name: 'VLDL', unit: 'mg/dL', type: 'NUMERIC', min: 0, max: 100, norm_min: 2, norm_max: 30 },
            ]
        },
        {
            keywords: ['Liver', 'LFT', 'Hepatic'],
            parameters: [
                { name: 'Total Bilirubin', unit: 'mg/dL', type: 'NUMERIC', min: 0, max: 20, norm_min: 0.1, norm_max: 1.2 },
                { name: 'Direct Bilirubin', unit: 'mg/dL', type: 'NUMERIC', min: 0, max: 10, norm_min: 0, norm_max: 0.3 },
                { name: 'SGOT (AST)', unit: 'U/L', type: 'NUMERIC', min: 0, max: 500, norm_min: 5, norm_max: 40 },
                { name: 'SGPT (ALT)', unit: 'U/L', type: 'NUMERIC', min: 0, max: 500, norm_min: 7, norm_max: 56 },
                { name: 'Alkaline Phosphatase', unit: 'U/L', type: 'NUMERIC', min: 0, max: 500, norm_min: 44, norm_max: 147 },
                { name: 'Total Protein', unit: 'g/dL', type: 'NUMERIC', min: 0, max: 15, norm_min: 6.0, norm_max: 8.3 },
                { name: 'Albumin', unit: 'g/dL', type: 'NUMERIC', min: 0, max: 10, norm_min: 3.5, norm_max: 5.5 },
            ]
        },
        {
            keywords: ['Kidney', 'KFT', 'Renal', 'Urea', 'Creatinine'],
            parameters: [
                { name: 'Blood Urea', unit: 'mg/dL', type: 'NUMERIC', min: 0, max: 200, norm_min: 15, norm_max: 45 },
                { name: 'Serum Creatinine', unit: 'mg/dL', type: 'NUMERIC', min: 0, max: 20, norm_min: 0.6, norm_max: 1.2 },
                { name: 'Uric Acid', unit: 'mg/dL', type: 'NUMERIC', min: 0, max: 20, norm_min: 3.5, norm_max: 7.2 },
                { name: 'Sodium', unit: 'mEq/L', type: 'NUMERIC', min: 100, max: 200, norm_min: 135, norm_max: 145 },
                { name: 'Potassium', unit: 'mEq/L', type: 'NUMERIC', min: 1, max: 10, norm_min: 3.5, norm_max: 5.1 },
            ]
        },
        {
            keywords: ['Vitamin D'],
            parameters: [
                { name: '25-OH Vitamin D', unit: 'ng/mL', type: 'NUMERIC', min: 0, max: 200, norm_min: 30, norm_max: 100 },
            ]
        },
        {
            keywords: ['HbA1c', 'Glycosylated'],
            parameters: [
                { name: 'HbA1c', unit: '%', type: 'NUMERIC', min: 0, max: 20, norm_min: 4.0, norm_max: 5.6 },
                { name: 'Estimated Average Glucose', unit: 'mg/dL', type: 'NUMERIC', min: 0, max: 500, norm_min: 90, norm_max: 120 },
            ]
        },
        // Fallback for generic "Blood Test" if no specific match
        {
            keywords: ['Blood test'],
            exact: true,
            parameters: [
                { name: 'Hemoglobin', unit: 'g/dL', type: 'NUMERIC', min: 0, max: 25, norm_min: 12, norm_max: 16 },
                { name: 'RBC Count', unit: 'million/µL', type: 'NUMERIC', min: 0, max: 10, norm_min: 4, norm_max: 6 },
                { name: 'WBC Count', unit: '/µL', type: 'NUMERIC', min: 0, max: 50000, norm_min: 4000, norm_max: 11000 },
            ]
        },
        // Fallback for generic "Urine Test"
        {
            keywords: ['Urine Test'],
            exact: true,
            parameters: [
                { name: 'Color', unit: '', type: 'TEXT', text_options: ['Pale Yellow', 'Yellow', 'Dark Yellow', 'Reddish'] },
                { name: 'Appearance', unit: '', type: 'TEXT', text_options: ['Clear', 'Hazy', 'Cloudy'] },
                { name: 'Glucouse', unit: '', type: 'TEXT', text_options: ['Negative', 'Trace', '1+', '2+', '3+'] },
                { name: 'Protein', unit: '', type: 'TEXT', text_options: ['Negative', 'Trace', '1+', '2+'] },
            ]
        }
    ];

    for (const test of allTests) {
        // Check if existing params
        const { count, error: countError } = await supabase
            .from('test_parameters')
            .select('*', { count: 'exact', head: true })
            .eq('test_id', test.test_id);

        if (countError) {
            console.error(`  Error checking params for ${test.test_name}:`, countError);
            continue;
        }

        if (count > 0) {
            // Already has params
            continue;
        }

        console.log(`Processing empty test: '${test.test_name}' (ID: ${test.test_id})...`);

        // Find matching definition
        let match = null;
        for (const def of testDefinitions) {
            if (def.exact) {
                if (def.keywords.some(k => test.test_name.toLowerCase() === k.toLowerCase())) {
                    match = def;
                    break;
                }
            } else {
                if (def.keywords.some(k => test.test_name.toLowerCase().includes(k.toLowerCase()))) {
                    match = def;
                    break;
                }
            }
        }

        if (!match) {
            console.log(`  No matching parameter definition found for '${test.test_name}'.`);
            continue;
        }

        console.log(`  Match found! Seeding ${match.parameters.length} parameters...`);

        // Insert Parameters
        const paramsToInsert = match.parameters.map((p, index) => ({
            test_id: test.test_id,
            parameter_name: p.name,
            unit: p.unit,
            data_type: p.type,
            normal_min: p.norm_min,
            normal_max: p.norm_max,
            min_value: p.min,
            max_value: p.max,
            text_options: p.text_options, // For TEXT type
            display_order: index + 1
        }));

        const { error: insertError } = await supabase
            .from('test_parameters')
            .insert(paramsToInsert);

        if (insertError) {
            console.error('  Error inserting parameters:', insertError);
        } else {
            console.log(`  Successfully inserted parameters.`);
        }
    }
}

seedParameters().catch(console.error);
