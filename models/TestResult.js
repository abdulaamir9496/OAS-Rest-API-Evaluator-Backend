import mongoose from 'mongoose';

const endpointSchema = new mongoose.Schema({
  path: String,
  method: String,
  operationId: String,
  summary: String,
  description: String,
  parameters: [mongoose.Schema.Types.Mixed],
  requestBodySchema: mongoose.Schema.Types.Mixed,
  responses: mongoose.Schema.Types.Mixed
});

const testResultSchema = new mongoose.Schema({
  endpoint: endpointSchema,
  status: Number,
  statusText: String,
  headers: mongoose.Schema.Types.Mixed,
  data: mongoose.Schema.Types.Mixed,
  requestBody: mongoose.Schema.Types.Mixed,
  timestamp: { type: Date, default: Date.now },
  project: {
    type: String,
    default: 'API Evaluator'
  },
  specTitle: String,
  specVersion: String,
  duration: Number,  // Response time in milliseconds
  success: {
    type: Boolean,
    default: function() {
      return this.status >= 200 && this.status < 300;
    }
  }
}, {
  timestamps: true,  // Adds createdAt and updatedAt
  strict: false      // Allows for flexible schema
});

// Index for faster queries
testResultSchema.index({ timestamp: -1 });
testResultSchema.index({ 'endpoint.path': 1, 'endpoint.method': 1 });
testResultSchema.index({ success: 1 });

// Virtual for calculating response time (if duration is present)
testResultSchema.virtual('responseTime').get(function() {
  return this.duration ? `${this.duration}ms` : 'N/A';
});

// Method to get summary of a test result
testResultSchema.methods.getSummary = function() {
  return {
    id: this._id,
    endpoint: `${this.endpoint.method.toUpperCase()} ${this.endpoint.path}`,
    status: this.status,
    success: this.success,
    timestamp: this.timestamp
  };
};

export const TestResult = mongoose.model('TestResult', testResultSchema);


// import mongoose from 'mongoose';

// const endpointSchema = new mongoose.Schema({
//   path: String,
//   method: String,
//   operationId: String,
//   summary: String,
//   parameters: [mongoose.Schema.Types.Mixed],
//   requestBodySchema: mongoose.Schema.Types.Mixed,
//   responses: mongoose.Schema.Types.Mixed
// });

// const testResultSchema = new mongoose.Schema({
//   endpoint: endpointSchema,
//   status: Number,
//   statusText: String,
//   headers: mongoose.Schema.Types.Mixed,
//   data: mongoose.Schema.Types.Mixed,
//   requestBody: mongoose.Schema.Types.Mixed,
//   timestamp: { type: Date, default: Date.now }
// });

// export const TestResult = mongoose.model('TestResult', testResultSchema);