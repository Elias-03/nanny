# Firebase Project Setup Guide

This guide will walk you through setting up a new Firebase project for your application.

## Step 1: Create a New Firebase Project

1. Go to the [Firebase Console](https://console.firebase.google.com/)
2. Click "Add project"
3. Enter a project name (e.g., "clems-nanny-service")
4. Choose whether to enable Google Analytics (recommended)
5. Accept the terms and click "Create project"
6. Wait for the project to be created, then click "Continue"

## Step 2: Set Up Firestore Database

1. In the Firebase Console, select your new project
2. In the left sidebar, click "Firestore Database"
3. Click "Create database"
4. Choose "Start in production mode" (recommended) or "Start in test mode" (easier for development)
5. Select a location closest to your users
6. Click "Enable"

## Step 3: Set Up Firebase Storage

1. In the left sidebar, click "Storage"
2. Click "Get started"
3. Choose "Start in production mode" or "Start in test mode"
4. Select a location closest to your users
5. Click "Done"

## Step 4: Set Up Firebase Authentication

1. In the left sidebar, click "Authentication"
2. Click "Get started"
3. In the "Sign-in method" tab, enable "Anonymous" authentication
4. Click "Save"

## Step 5: Get Your Firebase Configuration

1. In the left sidebar, click "Project settings" (the gear icon)
2. Scroll down to the "Your apps" section
3. If you don't have a web app yet, click the web icon (</>) to add one
4. Enter a nickname for your app (e.g., "clems-nanny-web")
5. (Optional) Check "Also set up Firebase Hosting"
6. Click "Register app"
7. Copy the Firebase configuration object (the `firebaseConfig` object)
8. Paste this configuration into your `firebase-config.js` file

## Step 6: Apply CORS Configuration

Follow the instructions in the `apply-cors.md` file to apply the CORS configuration to your Firebase Storage bucket.

## Step 7: Update Security Rules

### Firestore Rules

1. In the Firebase Console, go to "Firestore Database"
2. Click the "Rules" tab
3. Update the rules to allow read/write access:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if true;  // For development only! Restrict this in production
    }
  }
}
```

4. Click "Publish"

### Storage Rules

1. In the Firebase Console, go to "Storage"
2. Click the "Rules" tab
3. Update the rules to allow read/write access:

```
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /{allPaths=**} {
      allow read, write: if true;  // For development only! Restrict this in production
    }
  }
}
```

4. Click "Publish"

## Step 8: Test Your Application

After completing all the steps above, your application should be able to connect to Firebase and use Firestore and Storage without errors.

## Important Security Note

The security rules provided in this guide are for development purposes only. They allow anyone to read and write to your Firestore database and Storage bucket. Before deploying your application to production, you should update these rules to restrict access based on authentication and other security requirements.
