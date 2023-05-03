const express = require('express');
const { Emissions } = require('./schemas/ghg-emissions');

// Create the router for the emissions API
function createEmissionsRouter() {
    const router = express.Router();

    // Endpoint for inserting data into the database
    router.post('/', async (req, res) => {
        const { country, year, value, parameter } = req.body;

        try {
            // Create a new emissions record
            const emissions = new Emissions({ country, year, value, parameter });
            // Save the record to the database
            await emissions.save();
            res.sendStatus(201);
        } catch (error) {
            console.error(error);
            res.sendStatus(500);
        }
    });

    // Endpoint for reading data from the database
    router.get('/', async (req, res) => {
        const { start_year, end_year, parameter, country_name } = req.query;

        try {
            // Build the query object
            const query = {};
            if (start_year) query.year = { $gte: start_year };
            if (end_year) query.year = { ...query.year, $lte: end_year };
            if (parameter) query.parameter = parameter;
            if (country_name) query.country = country_name;

            // Find the emissions data that matches the query
            const emissionsData = await Emissions.find(query);
            res.json(emissionsData);
        } catch (error) {
            console.error(error);
            res.sendStatus(500);
        }
    });

    return router;
}

module.exports = { createEmissionsRouter };
