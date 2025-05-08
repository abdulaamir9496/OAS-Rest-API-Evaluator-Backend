const mongoose = require('mongoose');

const MONGODB_URI = 'mongodb+srv://abdulaamir9496:OsfxERW7F0l9RKh3@oas-rest-api-evaluator.ywi8do4.mongodb.net/api-evaluator';

// Connect to MongoDB
const connectDB = async () => {
    try {
        await mongoose.connect(MONGODB_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        console.log('MongoDB connected successfully');
    } catch (error) {
        console.error('MongoDB connection error:', error.message);
        process.exit(1); // Exit process with failure
    }
};

module.exports = connectDB;