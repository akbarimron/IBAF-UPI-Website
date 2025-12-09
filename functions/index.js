/**
 * Cloud Functions for IBAF Website
 * 
 * Functions:
 * 1. onUserDeleted - Automatically delete user from Authentication when Firestore document is deleted
 * 2. deleteUserFromAuth - Manual deletion (callable from admin dashboard)
 */

const functions = require('firebase-functions');
const admin = require('firebase-admin');

admin.initializeApp();

/**
 * RECOMMENDED: Automatic Trigger
 * 
 * This function automatically runs when a user document is deleted from Firestore.
 * It will delete the user from Firebase Authentication as well.
 * 
 * No need to call this manually - it triggers automatically!
 */
exports.onUserDeleted = functions.firestore
  .document('users/{userId}')
  .onDelete(async (snap, context) => {
    const userId = context.params.userId;
    const userData = snap.data();
    
    console.log(`Triggering auto-delete for user: ${userId} (${userData.email || 'no email'})`);
    
    try {
      // Delete user from Firebase Authentication
      await admin.auth().deleteUser(userId);
      console.log(`✅ Successfully deleted user ${userId} from Authentication`);
      
      return {
        success: true,
        message: `User ${userId} deleted from Authentication`,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error(`❌ Error deleting user ${userId} from Authentication:`, error);
      
      // If user doesn't exist in Auth (already deleted), that's okay
      if (error.code === 'auth/user-not-found') {
        console.log(`ℹ️ User ${userId} already deleted from Authentication`);
        return {
          success: true,
          message: 'User already deleted from Authentication',
          timestamp: new Date().toISOString()
        };
      }
      
      // Log error but don't throw - we don't want to fail the Firestore deletion
      return {
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  });

/**
 * OPTIONAL: Manual Callable Function
 * 
 * This function can be called manually from the admin dashboard.
 * Use this if you want explicit control over when to delete from Authentication.
 */
exports.deleteUserFromAuth = functions.https.onCall(async (data, context) => {
  // Verify that the user is authenticated
  if (!context.auth) {
    throw new functions.https.HttpsError(
      'unauthenticated',
      'User must be authenticated to delete users.'
    );
  }

  const callerUid = context.auth.uid;
  
  try {
    // Check if caller is admin
    const callerDoc = await admin.firestore().collection('users').doc(callerUid).get();
    
    if (!callerDoc.exists || callerDoc.data().role !== 'admin') {
      throw new functions.https.HttpsError(
        'permission-denied',
        'Only admins can delete users. Your role: ' + (callerDoc.exists ? callerDoc.data().role : 'none')
      );
    }

    const { userId } = data;

    if (!userId) {
      throw new functions.https.HttpsError(
        'invalid-argument',
        'User ID is required.'
      );
    }

    // Get user info before deletion for logging
    let userEmail = 'unknown';
    try {
      const userRecord = await admin.auth().getUser(userId);
      userEmail = userRecord.email || 'no-email';
    } catch (err) {
      console.log('Could not fetch user info:', err.message);
    }

    // Delete user from Firebase Authentication
    await admin.auth().deleteUser(userId);
    
    console.log(`✅ Admin ${callerUid} deleted user ${userId} (${userEmail}) from Authentication`);
    
    return { 
      success: true, 
      message: `User ${userEmail} deleted from Authentication successfully`,
      deletedBy: callerUid,
      deletedAt: new Date().toISOString()
    };
  } catch (error) {
    console.error('Error in deleteUserFromAuth:', error);
    
    // If user doesn't exist in Auth, that's okay
    if (error.code === 'auth/user-not-found') {
      return { 
        success: true, 
        message: 'User already deleted from Authentication',
        note: 'User was not found in Authentication system'
      };
    }
    
    // Re-throw HttpsError as-is
    if (error instanceof functions.https.HttpsError) {
      throw error;
    }
    
    // Wrap other errors
    throw new functions.https.HttpsError(
      'internal',
      'Failed to delete user from Authentication: ' + error.message
    );
  }
});

/**
 * BONUS: Clean up orphaned Authentication users
 * 
 * This function can be called to find and delete users that exist in Authentication
 * but not in Firestore (orphaned accounts).
 * 
 * Usage: Call this manually or schedule it to run periodically
 */
exports.cleanupOrphanedAuthUsers = functions.https.onCall(async (data, context) => {
  // Verify admin
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Must be authenticated');
  }

  const callerUid = context.auth.uid;
  const callerDoc = await admin.firestore().collection('users').doc(callerUid).get();
  
  if (!callerDoc.exists || callerDoc.data().role !== 'admin') {
    throw new functions.https.HttpsError('permission-denied', 'Admin only');
  }

  try {
    const deleted = [];
    const errors = [];
    
    // List all users from Authentication
    const listUsersResult = await admin.auth().listUsers();
    
    // Check each user
    for (const userRecord of listUsersResult.users) {
      const userId = userRecord.uid;
      
      // Check if user exists in Firestore
      const userDoc = await admin.firestore().collection('users').doc(userId).get();
      
      if (!userDoc.exists) {
        // User exists in Auth but not in Firestore - orphaned account
        try {
          await admin.auth().deleteUser(userId);
          deleted.push({
            uid: userId,
            email: userRecord.email || 'no-email'
          });
          console.log(`🧹 Cleaned up orphaned user: ${userId}`);
        } catch (err) {
          errors.push({
            uid: userId,
            error: err.message
          });
        }
      }
    }
    
    return {
      success: true,
      deletedCount: deleted.length,
      deleted: deleted,
      errors: errors,
      message: `Cleaned up ${deleted.length} orphaned Authentication accounts`
    };
  } catch (error) {
    throw new functions.https.HttpsError('internal', error.message);
  }
});
