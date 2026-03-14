const admin = require('firebase-admin');

// IMPORTANT: You MUST have your Firebase service account key downloaded as a JSON file.
// Provide the path to your service account key file below or via the GOOGLE_APPLICATION_CREDENTIALS environment variable.
// Example: export GOOGLE_APPLICATION_CREDENTIALS="/path/to/your/service-account-file.json"

const serviceAccountPath = process.env.GOOGLE_APPLICATION_CREDENTIALS || './serviceAccountKey.json';

try {
  const serviceAccount = require(serviceAccountPath);
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
} catch (error) {
  console.error("Error initializing Firebase Admin SDK. Make sure your serviceAccountKey.json exists and is valid.");
  console.error("Error details:", error.message);
  process.exit(1);
}

// The UID you want to grant the admin claim to.
// You can pass this as an argument, e.g., node setAdminClaim.js "rLxGIo4WVzVfF43UIPRqXV4tAjs2"
const uid = process.argv[2] || "rLxGIo4WVzVfF43UIPRqXV4tAjs2";

async function setAdminClaim(userId) {
  try {
    // Set the custom user claim
    await admin.auth().setCustomUserClaims(userId, { admin: true });

    // Verify the claim was set correctly
    const userRecord = await admin.auth().getUser(userId);
    if (userRecord.customClaims && userRecord.customClaims.admin === true) {
       console.log(`Success! The custom claim 'admin: true' has been set for user: ${userId}`);
    } else {
       console.error(`Failed to verify the claim was set for user: ${userId}`);
    }
  } catch (error) {
    console.error(`Error setting admin custom claim for user ${userId}:`, error);
  } finally {
    process.exit(0);
  }
}

setAdminClaim(uid);
