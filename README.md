# Water Bill Manager

Apartment water meter billing and tracking app built with Expo + React Native + Firebase.

## Features

- **Flat Management** — add/edit/delete flats with resident info, WhatsApp number, meter reading, rate per unit, and fixed charge.
- **Bill Generation** — input new meter reading, adjust units (+/-), review calculated bill, and save to Firestore.
- **WhatsApp Dispatch** — one-tap send formatted bill via WhatsApp deep link (free, no API needed).
- **Billing History** — browse all past bills filtered by month with totals.
- **Dashboard** — overview of total flats, billed/pending counts, monthly revenue, and recent bills.
- **Cloud Sync** — Firebase Auth + Firestore keeps data safe across devices.

## Bill Formula

```
Units Consumed = New Reading - Previous Reading
Total Units    = Units Consumed + Adjustment
Total Bill     = (Total Units × Multiplier) + Offset
```

## Getting Started

1. Follow [FIREBASE_SETUP.md](./FIREBASE_SETUP.md) to create your Firebase project
2. Paste your config into `src/firebase/config.ts`
3. Install dependencies:
   ```bash
   npm install
   ```
4. Run:
   ```bash
   npx expo start
   ```

## Project Structure

```
src/
  firebase/       Firebase config + Firestore CRUD
  context/        AuthContext, DataContext (flats + billing)
  navigation/     Auth stack, bottom tabs
  screens/        Login, Signup, Home, Flats, Billing, History
  components/     AddFlatModal, ConfirmDialog, FilterPills
  theme/          Shared colors
  types/          TypeScript types
  utils/          Currency formatting helpers
```
