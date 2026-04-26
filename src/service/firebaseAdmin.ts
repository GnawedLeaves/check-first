import admin from "firebase-admin";

// Create the config object
const firebaseConfig = {
  project_id: process.env.FIREBASE_PROJECT_ID,
  private_key: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
  client_email: process.env.FIREBASE_CLIENT_EMAIL,
};

// Check if variables are missing
if (!firebaseConfig.project_id) {
  console.error("❌ CLUCK! Firebase Project ID is missing from process.env.");
  console.log("Current env keys:", Object.keys(process.env));
}

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(firebaseConfig as any),
  });
}

export const db = admin.firestore();
export { admin };
