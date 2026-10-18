// Centralized environment access.
export const env = {
  port: Number(process.env.PORT ?? 3000),
  devSecret: process.env.DEV_SECRET,
  firebaseServiceAccountPath: process.env.FIREBASE_SERVICE_ACCOUNT_PATH ?? './serviceAccount.json',
};

export default env;
