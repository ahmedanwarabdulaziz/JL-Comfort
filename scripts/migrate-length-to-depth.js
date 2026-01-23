/**
 * Migration script to change "length" dimension type to "depth" in Firestore
 * Run with: node scripts/migrate-length-to-depth.js
 */

const admin = require('firebase-admin');
const serviceAccount = require('../jl-comfort-firebase-adminsdk-fbsvc-0010276dc8.json');

// Initialize Firebase Admin
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

async function migrateLengthToDepth() {
  try {
    console.log('Starting migration: length -> depth...\n');

    // Get all foam types
    const foamTypesSnapshot = await db.collection('foam').get();
    
    if (foamTypesSnapshot.empty) {
      console.log('No foam types found in database.');
      return;
    }

    let updatedCount = 0;
    let totalDimensionsUpdated = 0;

    // Process each foam type
    for (const doc of foamTypesSnapshot.docs) {
      const foamType = doc.data();
      const dimensions = foamType.dimensions || [];
      
      let hasChanges = false;
      const updatedDimensions = dimensions.map((dim) => {
        if (dim.type === 'length') {
          console.log(`  Found "length" in ${foamType.name || doc.id}: "${dim.name}"`);
          hasChanges = true;
          totalDimensionsUpdated++;
          return { ...dim, type: 'depth' };
        }
        return dim;
      });

      if (hasChanges) {
        await db.collection('foam').doc(doc.id).update({
          dimensions: updatedDimensions,
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        updatedCount++;
        console.log(`✅ Updated foam type: ${foamType.name || doc.id}\n`);
      }
    }

    console.log('\n✅ Migration complete!');
    console.log(`Foam types updated: ${updatedCount}`);
    console.log(`Total dimensions changed: ${totalDimensionsUpdated}`);
    
    if (updatedCount === 0) {
      console.log('\nℹ️  No "length" dimension types found. All dimensions are already using "depth".');
    }
  } catch (error) {
    console.error('Error during migration:', error);
    process.exit(1);
  } finally {
    // Clean up
    admin.app().delete();
  }
}

migrateLengthToDepth();
