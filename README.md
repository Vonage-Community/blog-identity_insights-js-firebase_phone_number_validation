# Phone Validator — Firebase + Vonage

A real-time phone number validation web app powered by **Firebase Cloud Functions** and the **Vonage Identity Insights API**. Users can enter a phone number (with country code picker), and get instant feedback on format validity, carrier, and network type.

## How it works

```
Browser (Firebase Hosting)
    └── calls Firebase Callable Function (validatePhone)
            └── calls Vonage Identity Insights API
                    └── returns format, carrier, and network data
```

1. The frontend (`functions/public/index.html`) is served via **Firebase Hosting**.
2. When the user clicks **Validate**, the page calls the `validatePhone` Firebase Callable Function.
3. The Cloud Function calls the **Vonage Identity Insights API** with the phone number and returns:
   - Format validity
   - International format
   - Country code
   - Current & original carrier name
   - Network type (mobile, landline, etc.)

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | HTML + Tailwind CSS (CDN) |
| Hosting | Firebase Hosting |
| Backend | Firebase Cloud Functions v2 (Node 24, ESM) |
| Phone API | Vonage Identity Insights (`@vonage/identity-insights`) |
| Secrets | Firebase Secret Manager (`VONAGE_APPLICATION_ID`, `VONAGE_PRIVATE_KEY`) |

---

## Project Structure

```
phone-validator-firebase/
├── firebase.json              # Firebase config (hosting + functions)
├── functions/
│   ├── index.js               # Cloud Function — validatePhone
│   ├── package.json
│   └── public/
│       └── index.html         # Frontend UI (served by Firebase Hosting)
└── working-code.js            # Reference / scratch copy of index.js
```

---

## Local Development

### Prerequisites

- [Firebase CLI](https://firebase.google.com/docs/cli) — `npm install -g firebase-tools`
- Node.js 24+
- A Vonage account with an application that has the **Number Insight** product enabled

### 1. Clone & install

```bash
git clone <repo-url>
cd phone-validator-firebase/functions
npm install
```

### 2. Set secrets (one-time)

```bash
firebase secrets:set VONAGE_APPLICATION_ID
firebase secrets:set VONAGE_PRIVATE_KEY
```

> The private key value should be the full PEM string (with or without literal `\n` — the function normalises it automatically).

### 3. Run the emulator

```bash
firebase emulators:start
```

The app will be available at `http://localhost:5000`.

### 4. Deploy

```bash
firebase deploy
```

Or deploy only the function / hosting separately:

```bash
firebase deploy --only functions
firebase deploy --only hosting
```

---

## API Reference

### `validatePhone` (Firebase Callable)

**Request payload**

```json
{ "phone": "447700900000" }
```

The function accepts:
- A pre-formatted E.164 number (digits only, no `+`)
- A raw local number — the frontend prepends the selected country dial code and strips the leading zero

**Response**

```json
{
  "valid": true,
  "country": "GB",
  "formattedNumber": "+44 7700 900000",
  "currentCarrierName": "Vodafone",
  "originalCarrierName": "Vodafone",
  "networkType": "mobile"
}
```

---

## Environment / Secrets

| Secret | Description |
|---|---|
| `VONAGE_APPLICATION_ID` | Vonage Application UUID |
| `VONAGE_PRIVATE_KEY` | RSA private key for the Vonage application (PEM format) |

Secrets are managed via **Firebase Secret Manager** and injected at runtime, they are never bundled into the function source.
