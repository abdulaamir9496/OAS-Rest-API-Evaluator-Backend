import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { TestResult } from './models/TestResult.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// MongoDB Connection URI with your Atlas connection string as fallback
const MONGODB_URI = process.env.MONGODB_URI || 
  'mongodb+srv://abdulaamir9496:OsfxERW7F0l9RKh3@oas-rest-api-evaluator.ywi8do4.mongodb.net/api-evaluator';

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// MongoDB Connection with improved error handling
mongoose.connect(MONGODB_URI)
  .then(() => console.log('Connected to MongoDB Atlas'))
  .catch(err => {
    console.error('MongoDB connection error:', err);
    console.log('Attempting to reconnect in 5 seconds...');
    // Try to reconnect after 5 seconds
    setTimeout(() => {
      mongoose.connect(MONGODB_URI)
        .then(() => console.log('Connected to MongoDB Atlas on retry'))
        .catch(err => console.error('MongoDB reconnection failed:', err));
    }, 5000);
  });

// MongoDB connection event handlers
mongoose.connection.on('error', err => {
  console.error('MongoDB connection error:', err);
});

mongoose.connection.on('disconnected', () => {
  console.log('MongoDB disconnected. Attempting to reconnect...');
});

// Routes
// Save test results
app.post('/api/test-results', async (req, res) => {
  try {
    const testResult = new TestResult(req.body);
    await testResult.save();
    console.log(`Saved test result for ${req.body.endpoint.method.toUpperCase()} ${req.body.endpoint.path}`);
    res.status(201).json({ 
      success: true, 
      id: testResult._id,
      message: 'Test result saved successfully'
    });
  } catch (error) {
    console.error('Error saving test result:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
});

// Get all test results with pagination
app.get('/api/test-results', async (req, res) => {
  try {
    const { page = 1, limit = 100, method, path, status } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // Build filter object based on query parameters
    const filter = {};
    
    if (method) filter['endpoint.method'] = method.toLowerCase();
    if (path) filter['endpoint.path'] = { $regex: path, $options: 'i' };
    if (status) filter.status = parseInt(status);
    
    const results = await TestResult.find(filter)
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(parseInt(limit));
      
    const total = await TestResult.countDocuments(filter);
    
    res.json({
      results,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Error fetching test results:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get a specific test result by ID
app.get('/api/test-results/:id', async (req, res) => {
  try {
    const result = await TestResult.findById(req.params.id);
    if (!result) {
      return res.status(404).json({ message: 'Test result not found' });
    }
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete a specific test result
app.delete('/api/test-results/:id', async (req, res) => {
  try {
    const result = await TestResult.findByIdAndDelete(req.params.id);
    if (!result) {
      return res.status(404).json({ message: 'Test result not found' });
    }
    res.json({ message: 'Test result deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get statistics about test results
app.get('/api/stats', async (req, res) => {
  try {
    const totalTests = await TestResult.countDocuments();
    const successfulTests = await TestResult.countDocuments({ 
      status: { $gte: 200, $lt: 300 } 
    });
    const failedTests = totalTests - successfulTests;
    
    const methodStats = await TestResult.aggregate([
      { $group: { 
        _id: "$endpoint.method", 
        count: { $sum: 1 },
        successful: { 
          $sum: { 
            $cond: [
              { $and: [
                { $gte: ["$status", 200] },
                { $lt: ["$status", 300] }
              ]},
              1,
              0
            ]
          }
        }
      }},
      { $sort: { count: -1 } }
    ]);
    
    const pathStats = await TestResult.aggregate([
      { $group: { 
        _id: "$endpoint.path", 
        count: { $sum: 1 },
        avgStatus: { $avg: "$status" }
      }},
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);
    
    res.json({
      total: totalTests,
      successful: successfulTests,
      failed: failedTests,
      successRate: totalTests > 0 ? (successfulTests / totalTests) * 100 : 0,
      byMethod: methodStats,
      topPaths: pathStats
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Health check route
app.get('/api/health', (req, res) => {
  const dbStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
  res.json({ 
    status: 'ok',
    db: dbStatus,
    timestamp: new Date().toISOString()
  });
});

// Clear all test results (be careful with this in production!)
app.delete('/api/test-results', async (req, res) => {
  // Add a confirmation step to prevent accidental deletion
  const { confirm } = req.query;
  
  if (confirm !== 'yes') {
    return res.status(400).json({ 
      message: 'Confirmation required. Add ?confirm=yes to the request to confirm deletion.' 
    });
  }
  
  try {
    const result = await TestResult.deleteMany({});
    res.json({ 
      message: `Deleted ${result.deletedCount} test results` 
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Handle 404
app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    message: 'Internal server error', 
    error: process.env.NODE_ENV === 'development' ? err.message : undefined 
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`API URL: http://localhost:${PORT}/api`);
});

// Handle process termination
process.on('SIGINT', async () => {
  await mongoose.connection.close();
  console.log('MongoDB connection closed due to app termination');
  process.exit(0);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.log('Unhandled Promise Rejection:', err);
});


// import express from 'express';
// import cors from 'cors';
// import mongoose from 'mongoose';
// import dotenv from 'dotenv';
// import { TestResult } from './models/TestResult.js';

// dotenv.config();

// const app = express();
// const PORT = process.env.PORT || 5000;

// // Middleware
// app.use(cors());
// app.use(express.json({ limit: '50mb' }));
// app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// // MongoDB Connection
// mongoose.connect(process.env.MONGODB_URI)
//   .then(() => console.log('Connected to MongoDB'))
//   .catch(err => console.error('MongoDB connection error:', err));

// // Routes
// app.post('/api/test-results', async (req, res) => {
//   try {
//     const testResult = new TestResult(req.body);
//     await testResult.save();
//     res.status(201).json(testResult);
//   } catch (error) {
//     res.status(500).json({ error: error.message });
//   }
// });

// app.get('/api/test-results', async (req, res) => {
//   try {
//     const results = await TestResult.find().sort({ timestamp: -1 });
//     res.json(results);
//   } catch (error) {
//     res.status(500).json({ error: error.message });
//   }
// });

// // Health check route
// app.get('/api/health', (req, res) => {
//   res.json({ status: 'ok' });
// });

// app.listen(PORT, () => {
//   console.log(`Server running on port ${PORT}`);
// });