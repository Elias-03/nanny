# Applying CORS Configuration to Firebase Storage

Follow these steps to apply the CORS configuration to your Firebase Storage bucket:

## Prerequisites

1. Install the Firebase CLI if you haven't already:
```
npm install -g firebase-tools
```

2. Log in to Firebase:
```
firebase login
```

## Apply CORS Configuration

Run the following command, replacing `YOUR_PROJECT_ID` with your new Firebase project ID:

```
firebase storage:cors update --project=YOUR_PROJECT_ID cors.json
```

## Verify CORS Configuration

After applying the CORS configuration, you can verify it by running:

```
firebase storage:cors get --project=YOUR_PROJECT_ID
```

This should display the CORS configuration you just applied.

## Troubleshooting

If you encounter any issues, make sure:

1. You're logged in to the correct Firebase account
2. You have the necessary permissions for the project
3. The project ID is correct
4. The cors.json file is in the correct format
