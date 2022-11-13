const fs = require('fs');
const { parse } = require('csv-parse');
require('dotenv').config();

const db = require('./db'); 

async function addData (dataCategory) {
    try {
        const sql = fs.readFileSync(`data/database/setup-${dataCategory}.sql`).toString();

        await db.query(sql)
        console.log("Setup complete.")

        const boroughData = await db.query("SELECT id, borough_name FROM borough ORDER BY id")
        const boroughs = {}
        boroughData.rows.forEach(borough => boroughs[borough.borough_name] = borough.id)
        
        fs.readFile(`data/data-cleaning/converted_data/${dataCategory}_data.csv`, (err, data) => {
            parse(data, {columns:false, trim:true}, async (err, rows) => {
                rowData = rows.slice(1)

                for (const [i, row] of rows.slice(1).entries()) {
                    const boroughId = boroughs[row[0]]
                    // console.log(`${dataCategory} row:`, i)

                    if (dataCategory === "ethnicity") {
                        await db.query("INSERT INTO ethnicity_data (borough_id, white, asian, black, other, total_population) VALUES ($1, $2, $3, $4, $5, $6)", [boroughId, row[1], row[2], row[3], row[4], row[5]])
                    } else if (dataCategory === 'religion') {
                        await db.query("INSERT INTO religion_data (borough_id, christian, buddhist, hindu, jewish, muslim, sikh, other_religion, no_religion, total) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)", [boroughId, row[1], row[2], row[3], row[4], row[5], row[6], row[7], row[8], row[9]])
                    } else if (dataCategory === 'wellbeing') {
                        await db.query("INSERT INTO wellbeing_data (borough_id, life_satisfaction, worthwhile, happiness, anxiety, inverted_anxiety, wellbeing) VALUES ($1, $2, $3, $4, $5, $6, $7)", [boroughId, row[1], row[2], row[3], row[4], row[5], row[6]])
                    } else if (dataCategory === 'rent') {
                        await db.query("INSERT INTO rental_data (borough_id, period_start_date, period_end_date, property_type, rent_median, rent_mean) VALUES ($1, $2, $3, $4, NULLIF($5, '')::real, NULLIF($6, '')::real)", [boroughId, row[3], row[4], row[5], row[2], row[1]])
                    } else if (dataCategory === 'crime') {
                        await db.query("INSERT INTO crime_data (borough_id, period, offence_category, offence_count) VALUES ($1, $2, $3, $4)", [boroughId, row[2], row[1], row[3]])
                    } else if (dataCategory === 'sex') {
                        await db.query("INSERT INTO sex_data (borough_id, total_people, males, females, m:100f) VALUES ($1, $2, $3, $4, $5)", [boroughId, row[1], row[2], row[3], row[4]])
                    } else if (dataCategory === 'age') {
                        await db.query("INSERT INTO age_data (borough_id, 0-9, 10-17, 18-26, 27-35, 36-44, 45-53, 54-62, 63-71, 72-80, 81+) VALUES ($1, $2, $3, $4, $5, $6, $7, $8 ,$9, $10, $11)", [boroughId, row[1],row[2], row[3], row[4], row[5], row[6], row[7], row[8], row[9], row[10]])
                    } 
                }
            })
        })
    } catch (err) {
        console.error(err)
    }
}

addData(process.argv[2])
