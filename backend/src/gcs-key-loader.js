// This file is used to load Google Cloud credentials from an environment variable if present
const fs = require('fs');
const path = require('path');

const keyEnv = process.env.GCP_SERVICE_ACCOUNT_JSON;
const keyPath = path.join(__dirname, '../../gcs-key.json');
const bucketName = process.env.GCS_BUCKET_NAME || 'nkadime-uploads';

// If GCP_SERVICE_ACCOUNT_JSON is set, write it to gcs-key.json (for local dev or production)
if (keyEnv) {
  fs.writeFileSync(keyPath, keyEnv);
} else if (!fs.existsSync(keyPath)) {
  // If the env var is not set and the file does not exist, throw an error
  throw new Error('Google Cloud service account key not found. Set GCP_SERVICE_ACCOUNT_JSON or provide gcs-key.json');
}

module.exports = { keyPath, bucketName };
