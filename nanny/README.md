# Nanny Service Application

This is a web application for a nanny service, allowing users to browse available nannies and administrators to manage the nanny database.

## Setup Instructions

### Prerequisites

- Node.js and npm (for Firebase CLI)
- A web server (e.g., Live Server extension for VS Code)

### Firebase Setup

1. Follow the instructions in `firebase-setup.md` to create a new Firebase project.
2. Update the Firebase configuration in `firebase-config.js` with your project's configuration.
3. Follow the instructions in `apply-cors.md` to apply the CORS configuration to your Firebase Storage bucket.

### Running the Application

1. Start a local web server (e.g., using Live Server in VS Code).
2. Open the application in your browser.
3. The application will automatically connect to Firebase if it's properly configured.
4. If Firebase is unavailable, the application will switch to offline mode with mock data.

## Features

### User Features

- Browse available nannies
- Filter nannies by various criteria
- View nanny details
- Contact the service about a specific nanny

### Admin Features

- Add new nannies
- Edit existing nannies
- Delete nannies
- Upload nanny photos

## Troubleshooting

### Firebase Connection Issues

If you're experiencing issues with Firebase connectivity:

1. Check the browser console for error messages.
2. Verify that your Firebase project is active and properly configured.
3. Make sure the Firebase configuration in `firebase-config.js` is correct.
4. Check that CORS is properly configured for Firebase Storage.

### CORS Issues

If you're experiencing CORS issues with Firebase Storage:

1. Make sure you've applied the CORS configuration as described in `apply-cors.md`.
2. Verify that the origin in the CORS configuration matches your local development server (e.g., `http://127.0.0.1:5501`).
3. If you're still experiencing issues, try using a different port for your local development server.

## Development Notes

- The application is designed to work in offline mode if Firebase is unavailable.
- Mock data is used when in offline mode.
- Images are stored as data URLs when Firebase Storage is unavailable.

## Security Notes

- The current security rules allow anyone to read and write to the Firestore database and Storage bucket.
- Before deploying to production, update the security rules to restrict access based on authentication and other security requirements.
