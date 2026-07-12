# Firebase Setup Guide

## 1. Create a Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click **Add project** → name it (e.g. `water-bill-manager`)
3. Disable Google Analytics (optional, saves free-tier reads)
4. Click **Create project**

## 2. Enable Authentication

1. In the Firebase console → **Authentication** → **Get started**
2. Enable **Email/Password** sign-in method
3. Click **Save**

## 3. Create Firestore Database

1. Go to **Firestore Database** → **Create database**
2. Choose **Start in test mode** (we'll add rules below)
3. Pick the closest region → **Enable**

## 4. Register a Web App

1. In Project Settings (gear icon) → **General** → scroll to **Your apps**
2. Click the **Web** icon (`</>`)
3. Name it `water-bill-web` → **Register app**
4. Copy the `firebaseConfig` object
5. Paste it into `src/firebase/config.ts`, replacing the placeholder values

## 5. Firestore Security Rules

Go to **Firestore Database** → **Rules** and paste:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Only authenticated users can read/write their own data
    match /flats/{flatId} {
      allow read, write: if request.auth != null
                         && resource == null
                            ? request.auth.uid == request.resource.data.userId
                            : request.auth.uid == resource.data.userId;
      allow create: if request.auth != null
                    && request.auth.uid == request.resource.data.userId;
    }

    match /billingHistory/{billId} {
      allow read, write: if request.auth != null
                         && resource == null
                            ? request.auth.uid == request.resource.data.userId
                            : request.auth.uid == resource.data.userId;
      allow create: if request.auth != null
                    && request.auth.uid == request.resource.data.userId;
    }
  }
}
```

Click **Publish**.

## 6. Firestore Indexes (if needed)

If you see a Firestore "index required" error in the console, click the link in the error message — it takes you directly to the index creation page. Click **Create index** and wait ~2 minutes.

## 7. Building the Android APK

1. Install EAS CLI: `npm install -g eas-cli`
2. Log in: `eas login`
3. Configure: `eas build:configure`
4. Add a preview profile to `eas.json`:
   ```json
   {
     "build": {
       "preview": {
         "android": {
           "buildType": "apk"
         }
       }
     }
   }
   ```
5. Build: `eas build -p android --profile preview`
