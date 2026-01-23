/**
 * Script to create admin user in Firebase Auth
 * Run with: node scripts/setup-admin-user.js
 */

const admin = require('firebase-admin');
const serviceAccount = require('../jl-comfort-firebase-adminsdk-fbsvc-0010276dc8.json');

// Initialize Firebase Admin
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

async function createAdminUser() {
  const email = 'a@a.com';
  const password = '5550555';

  try {
    // Check if user already exists
    let userRecord;
    try {
      userRecord = await admin.auth().getUserByEmail(email);
      console.log('User already exists:', userRecord.uid);
      
      // Update password if user exists
      await admin.auth().updateUser(userRecord.uid, {
        password: password,
      });
      console.log('Password updated successfully');
    } catch (error) {
      if (error.code === 'auth/user-not-found') {
        // Create new user
        userRecord = await admin.auth().createUser({
          email: email,
          password: password,
          emailVerified: true,
        });
        console.log('Admin user created successfully:', userRecord.uid);
      } else {
        throw error;
      }
    }

    // Set custom claims for admin role (optional, for future use)
    await admin.auth().setCustomUserClaims(userRecord.uid, {
      admin: true,
    });
    console.log('Admin claims set successfully');

    console.log('\n✅ Admin user setup complete!');
    console.log(`Email: ${email}`);
    console.log(`Password: ${password}`);
    console.log(`UID: ${userRecord.uid}`);
  } catch (error) {
    console.error('Error setting up admin user:', error);
    process.exit(1);
  } finally {
    // Clean up
    admin.app().delete();
  }
}

createAdminUser();
