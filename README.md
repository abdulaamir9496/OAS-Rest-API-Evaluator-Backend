# REST API Evaluator - Setup Instructions

This project allows you to evaluate REST APIs by testing endpoints defined in OpenAPI specifications and storing the results in MongoDB.

## Project Structure

The project consists of two main parts:
1. **Frontend**: React application with TypeScript and Tailwind CSS
2. **Backend**: Express server connecting to MongoDB Atlas

## Backend Setup

1. Create a folder for your backend:
```bash
mkdir api-evaluator-backend
cd api-evaluator-backend
```

2. Initialize the project:
```bash
npm init -y
```

3. Install dependencies:
```bash
npm install express mongoose cors dotenv
npm install --save-dev nodemon
```

4. Create the following files in your backend folder:
   - `db.js`: MongoDB connection setup
   - `models/TestResult.js`: Schema for test results
   - `server.js`: Express server

5. Update your `package.json` to include:
```json
"scripts": {
  "start": "node server.js",
  "dev": "nodemon server.js"
}
```

6. Start the backend server:
```bash
npm run dev
```

## Frontend Setup

Ensure your frontend makes API calls to the backend server at `http://localhost:5000/api`.

1. Update the `testExecutor.ts` file to match the provided code
2. Update the `openApiParser.ts` file
3. Update the `ApiTester.tsx` component

## MongoDB Connection

The connection to MongoDB Atlas is already set up with your connection string:
```
mongodb+srv://<username>:<password>@oas-rest-api-evaluator.ywi8do4.mongodb.net/api-evaluator
```

The backend will:
1. Connect to this database
2. Create a `testresults` collection
3. Store all test execution results

## Security Note

For production, move your MongoDB connection string to a `.env` file and use environment variables:

```javascript
// db.js
const mongoose = require('mongoose');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI;

// ...rest of the file
```

Then create a `.env` file:
```
mongodb+srv://<username>:<password>@oas-rest-api-evaluator.ywi8do4.mongodb.net/api-evaluator
```

Make sure to add `.env` to your `.gitignore` file to avoid exposing credentials.

## Troubleshooting

If you encounter CORS issues:
1. Ensure your backend has the CORS middleware properly configured
2. Check that your MongoDB connection is working
3. Verify the API URL in your frontend matches your backend server address

If you have issues with MongoDB connections:
1. Check your network connectivity
2. Verify MongoDB Atlas IP whitelist settings (add your IP if necessary)
3. Confirm username and password are correct
