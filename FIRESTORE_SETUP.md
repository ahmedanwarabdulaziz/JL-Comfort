# Firestore Security Rules Setup

## Issue
You're getting "Missing or insufficient permissions" errors when trying to create, update, or delete categories/foam types.

## Solution
You need to update your Firestore security rules in Firebase Console.

## Steps to Fix:

1. **Go to Firebase Console**
   - Visit: https://console.firebase.google.com/
   - Select your project: `jl-comfort`

2. **Navigate to Firestore Database**
   - Click on "Firestore Database" in the left sidebar
   - Click on the "Rules" tab at the top

3. **Update the Rules**
   - Replace the existing rules with the rules from `firestore.rules` file
   - Or copy and paste the rules below:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Helper function to check if user is authenticated
    function isAuthenticated() {
      return request.auth != null;
    }
    
    // Products collection rules
    match /products/{productId} {
      allow read: if true; // Anyone can read products
      allow create, update, delete: if isAuthenticated(); // Only authenticated users can modify
    }
    
    // Categories collection rules
    match /categories/{categoryId} {
      allow read: if true; // Anyone can read categories
      allow update, delete: if isAuthenticated(); // Only authenticated users can modify
    }
    
    // Foam collection rules
    match /foam/{foamId} {
      allow read: if true; // Anyone can read foam types
      allow create, update, delete: if isAuthenticated(); // Only authenticated users can modify
    }
  }
}
```

4. **Publish the Rules**
   - Click "Publish" button
   - Wait for the rules to deploy (usually takes a few seconds)

## What These Rules Do:

- **Read Access**: Anyone (including unauthenticated users) can read from `products`, `categories`, and `foam` collections
- **Write Access**: Only authenticated users (logged in admins) can create, update, or delete documents

## Testing:

After updating the rules:
1. Make sure you're logged in as admin (`a@a.com`)
2. Try creating a category again
3. The permission errors should be resolved

## For Development (Less Secure - Use Only for Testing):

If you want to allow all operations during development (NOT recommended for production), you can use:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if true;
    }
  }
}
```

⚠️ **Warning**: The above rule allows anyone to read/write to your database. Only use this for testing!
