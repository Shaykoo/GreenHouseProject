const express = require('express');
const basicAuth = require('express-basic-auth');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cacheManager = require('cache-manager');
const redisStore = require('cache-manager-redis-store');

const GhgEmissions = require('./schemas/ghg-emissions');

// Connect to the MongoDB database
mongoose.connect('mongodb://localhost/ghg-emissions', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
});

// Create a cache manager instance using Redis as the store
const cache = cacheManager.caching({
    store: redisStore,
    host: 'localhost',
    port: 6379,
    ttl: 60, // Set a TTL of 60 seconds for cached items
});

// Define the Basic authentication credentials
const auth = {
    users: {
        'admin': 'password'
    },
    challenge: true,
    realm: 'Greenhouse_Project Authentication'
};


// Create an Express application
const app = express();

// Use bodyParser middleware to parse request bodies
app.use(bodyParser.json());

// Import the GHG emissions schema
const ghgEmissionsSchema = require('./schemas/ghg-emissions');

// Create a route for inserting data into the GHG emissions table
app.post('/ghg-emissions', basicAuth(auth), async (req, res) => {
    try {
        // Check if the request body is valid
        const { error } = ghgEmissionsSchema.validate(req.body);
        if (error) {
            throw new Error(error);
        }

        // Insert the data into the database
        const data = await cache.wrap(`ghg-emissions:${req.body.country}:${req.body.year}:${req.body.parameter}`, async () => {
            const result = await GhgEmissions.create(req.body);
            return result;
        });

        res.json(data);
    } catch (err) {
        console.error(err);
        res.status(500).send(err.message);
    }
});

// Create a route for reading data from the GHG emissions table
app.get('/ghg-emissions', basicAuth(auth), async (req, res) => {
    try {
        // Construct the query based on the query parameters
        const query = {};
        if (req.query.start_year) {
            query.year = { $gte: req.query.start_year };
        }
        if (req.query.end_year) {
            query.year = { ...query.year, $lte: req.query.end_year };
        }
        if (req.query.parameter) {
            query.parameter = req.query.parameter;
        }
        if (req.query.country_name) {
            query.country = req.query.country_name;
        }

        // Check if the result is cached
        const cacheKey = `ghg-emissions:${JSON.stringify(query)}`;
        const cachedResult = await cache.get(cacheKey);
        if (cachedResult) {
            console.log(`Result for query ${JSON.stringify(query)} found in cache`);
            return res.json(cachedResult);
        }

        // Read the data from the database
        const data = await GhgEmissions.find(query);

        // Cache the result
        await cache.set(cacheKey, data);

        res.json(data);
    } catch (err) {
        console.error(err);
        res.status(500).send(err.message);
    }
});

// Start the server
app.listen(3000, () => {
    console.log('Server started on port 3000');
});
