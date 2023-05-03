const mongoose = require('mongoose');
const { Schema } = mongoose;

// Define the schema for the emissions data
const emissionsSchema = new Schema({
    country: { type: String, required: true },
    year: { type: String, required: true },
    value: { type: Number, required: true },
    parameter: { type: String, enum: ['CO2', 'NO2', 'SO2'], required: true },
});

// Create the emissions model
const Emissions = mongoose.model('Emissions', emissionsSchema);

module.exports = { Emissions };
