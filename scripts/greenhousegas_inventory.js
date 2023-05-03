const fs = require('fs');
const parse = require('csv-parse');
const request = require('request');

// Read the CSV file
fs.readFile('greenhouse_gas_inventory_data.csv', 'utf8', (err, fileData) => {
    if (err) {
        console.error(err);
        return;
    }

    // Parse the CSV data
    parse(fileData, { columns: true, skip_empty_lines: true }, (err, rows) => {
        if (err) {
            console.error(err);
            return;
        }

        // Insert each row into the database using the endpoint
        rows.forEach(row => {
            request.post({
                url: 'http://localhost:3000/ghg-emissions',
                json: true,
                body: row
            }, (err, res, body) => {
                if (err) {
                    console.error(err);
                    return;
                }
                console.log(`Inserted row: ${JSON.stringify(row)}`);
            });
        });
    });
});