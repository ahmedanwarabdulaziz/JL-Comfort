# Firebase Authentication Troubleshooting Guide

If you're experiencing 400 errors when trying to sign in, follow these steps:

## Common Error: 400 Bad Request from Firebase

This error typically indicates one of the following issues:

### 1. Check Environment Variables

Make sure your `.env.local` file contains valid Firebase credentials:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_actual_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project-id.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project-id.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
```

**Important**: 
- Replace placeholder values with actual values from Firebase Console
- Restart your development server after changing `.env.local`
- Environment variables must start with `NEXT_PUBLIC_` to be accessible in the browser

### 2. Verify Firebase Authentication is Enabled

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Navigate to **Authentication** → **Sign-in method**
4. Ensure **Email/Password** provider is enabled
5. Click on Email/Password and verify it's enabled

### 3. Check API Key Restrictions

If your API key has restrictions:

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Navigate to **APIs & Services** → **Credentials**
3. Find your Firebase API key
4. Check if there are any restrictions:
   - **Application restrictions**: Should allow your domain (localhost:3000 for development)
   - **API restrictions**: Should include Firebase Authentication API

### 4. Verify Authorized Domains

1. Go to Firebase Console → **Authentication** → **Settings**
2. Scroll to **Authorized domains**
3. Ensure `localhost` is in the list (it should be by default)
4. For production, add your domain

### 5. Check User Account Status

If you're using the setup script (`scripts/setup-admin-user.js`):

1. Verify the user was created successfully:
   ```bash
   node scripts/setup-admin-user.js
   ```

2. Default credentials (from setup script):
   - Email: `a@a.com`
   - Password: `5550555`

3. If the user doesn't exist, create it manually in Firebase Console:
   - Go to **Authentication** → **Users**
   - Click **Add user**
   - Enter email and password

### 6. Check Browser Console

Open browser DevTools (F12) and check:
- Network tab: Look for failed requests to `identitytoolkit.googleapis.com`
- Console tab: Check for specific error codes

Common error codes:
- `auth/invalid-api-key`: API key is wrong or restricted
- `auth/unauthorized-domain`: Domain not authorized
- `auth/user-not-found`: User doesn't exist
- `auth/wrong-password`: Incorrect password
- `auth/invalid-credential`: Invalid email/password combination

### 7. Verify Firebase Project Configuration

1. Go to Firebase Console → **Project Settings** → **General**
2. Scroll to **Your apps** section
3. Find your web app (or create one if it doesn't exist)
4. Copy the configuration values exactly as shown
5. Update your `.env.local` file

### 8. Restart Development Server

After making changes to `.env.local`:
```bash
# Stop the server (Ctrl+C)
# Then restart
npm run dev
# or
pnpm dev
```

### 9. Clear Browser Cache

Sometimes cached credentials cause issues:
- Clear browser cache and cookies
- Try in an incognito/private window
- Or use a different browser

### 10. Check Firebase Admin SDK Configuration

If you're using the admin setup script, verify:
- The service account JSON file exists: `jl-comfort-firebase-adminsdk-fbsvc-0010276dc8.json`
- The file has correct permissions
- The service account has proper roles in Firebase

## Testing Firebase Connection

You can test if Firebase is properly configured by checking the browser console:

1. Open your app in the browser
2. Open DevTools (F12)
3. Go to Console tab
4. Type: `firebase` (if Firebase is loaded, you'll see the object)
5. Check Network tab for successful connections to Firebase

## Still Having Issues?

1. **Double-check all environment variables** - One typo can cause authentication to fail
2. **Verify Firebase project is active** - Check Firebase Console to ensure project is not suspended
3. **Check Firebase status** - Visit [Firebase Status Page](https://status.firebase.google.com/)
4. **Review Firebase logs** - Check Firebase Console → **Authentication** → **Users** for any error messages

## Quick Checklist

- [ ] `.env.local` file exists and has correct values
- [ ] Development server restarted after changing `.env.local`
- [ ] Email/Password provider enabled in Firebase Console
- [ ] User account exists in Firebase Authentication
- [ ] API key has no restrictions or restrictions allow your domain
- [ ] Browser cache cleared
- [ ] No typos in environment variable names (case-sensitive!)
