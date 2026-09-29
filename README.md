# OLYMPIA 2K26

OLYMPIA 2K26 is an interactive sports arena and live scoring platform. This application provides real-time match tracking, dynamic scoring visualization, and interactive features for fans.

## Tech Stack

- **Frontend:** React, TypeScript, Vite
- **Styling:** Tailwind CSS (v4)
- **Routing:** React Router v6
- **Backend/Database:** Firebase (Auth, Firestore, Storage)
- **State/Context:** React Context API

## Prerequisites

- Node.js 18 or higher
- Firebase CLI installed (`npm install -g firebase-tools`)
- A Firebase project

## Quick Start

1. **Clone and Install**
   ```bash
   git clone <repository-url>
   cd olympia-2k26
   npm install
   ```

2. **Firebase Project Setup**
   - Create a new project in the [Firebase Console](https://console.firebase.google.com/)
   - Register a Web App in the project settings to get your configuration

3. **Enable Auth**
   - Go to Authentication > Sign-in method
   - Enable "Email/Password"
   - Enable "Anonymous"

4. **Create Firestore Database**
   - Go to Firestore Database
   - Click "Create database"
   - Start in Production mode

5. **Create Storage Bucket**
   - Go to Storage
   - Click "Get started"
   - Start in Production mode

6. **Environment Variables**
   Copy the example environment file and fill in your Firebase credentials:
   ```bash
   cp .env.example .env
   ```
   Add your Firebase configuration details to `.env`.

7. **Deploy Firestore Rules**
   ```bash
   firebase deploy --only firestore:rules
   ```

8. **Deploy Storage Rules**
   ```bash
   firebase deploy --only storage
   ```

9. **Deploy Indexes**
   ```bash
   firebase deploy --only firestore:indexes
   ```

10. **Install and Deploy Cloud Functions**
    ```bash
    cd functions
    npm install
    npm run build
    firebase deploy --only functions
    cd ..
    ```

11. **Create Initial Admin**
    Use the `setupInitialAdmin` function (or a local script) to set up your first admin user.

12. **Run Seed Data**
    ```bash
    npm run seed
    ```

13. **Start Dev Server**
    ```bash
    npm run dev
    ```

14. **Deploy to Production**
    ```bash
    npm run build
    firebase deploy --only hosting
    ```

## Environment Variables Reference

| Variable | Description |
|----------|-------------|
| `VITE_FIREBASE_API_KEY` | Firebase API Key |
| `VITE_FIREBASE_AUTH_DOMAIN` | Firebase Auth Domain |
| `VITE_FIREBASE_PROJECT_ID` | Firebase Project ID |
| `VITE_FIREBASE_STORAGE_BUCKET`| Firebase Storage Bucket |
| `VITE_FIREBASE_MESSAGING_SENDER_ID`| Firebase Messaging Sender ID |
| `VITE_FIREBASE_APP_ID` | Firebase App ID |
| `VITE_FIREBASE_MEASUREMENT_ID` | Firebase Measurement ID |

## Project Structure Overview

```text
olympia-2k26/
├── public/              # Static assets
├── src/
│   ├── components/      # Reusable UI components
│   ├── contexts/        # React Context providers (Auth, Firebase, LiveMatch)
│   ├── pages/           # Route pages (Home, AdminDashboard, etc.)
│   ├── App.tsx          # Main application component & routing
│   ├── main.tsx         # Application entry point
│   ├── index.css        # Global styles and Tailwind configuration
│   └── vite-env.d.ts    # Environment typings
└── README.md            # Project documentation
```

## Admin Setup Guide

To access the admin dashboard, a user must have an `admin` role in their Firestore user document.
1. Sign up with an email/password via `/admin/login` or regular login.
2. Manually set the `role` field to `admin` in Firestore for that user document, or use the setup function provided.

## Available Scripts

- `npm run dev` - Starts the development server
- `npm run build` - Builds the app for production
- `npm run preview` - Previews the production build locally
- `npm run lint` - Runs ESLint
- `npm run seed` - Seeds the database with initial sample data

## Contributing

Contributions are welcome. Please ensure your code follows the established coding standards, uses TypeScript strictly, and utilizes Tailwind CSS for styling.
