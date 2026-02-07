# Base44 App


This app was created automatically by Base44.
It's a Vite+React app that communicates with the Base44 API.

## Running the app

```bash
npm install
npm run dev
```

## Building the app

```bash
npm run build
```

## Google onboarding config

Create a `.env` file based on `.env.example`.

```bash
cp .env.example .env
```

Required keys for Google login + cliente onboarding:

- `VITE_GOOGLE_CLIENT_ID`: Google OAuth Client ID (GIS).
- `VITE_GOOGLE_AUTH_ENDPOINT`: Backend endpoint to validate Google token and create/login user.
- `VITE_CLIENTE_CREATE_ENDPOINT`: Endpoint to create cliente profile after Google signup.
- `VITE_WELCOME_EMAIL_ENDPOINT`: Optional endpoint to send welcome email after cliente profile creation.

For more information and support, please contact Base44 support at app@base44.com.
