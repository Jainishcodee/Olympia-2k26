const { initializeApp, cert } = require('firebase-admin/app');
const { getAuth } = require('firebase-admin/auth');

const serviceAccount = require('./service-account.json');

initializeApp({
  credential: cert(serviceAccount)
});

const uid = 'k5uVVluH5GfsrNaSsi4xIjQ5OBA2';

getAuth()
  .setCustomUserClaims(uid, { admin: true })
  .then(() => {
    console.log(`Successfully set admin claim for user: ${uid}`);
    process.exit(0);
  })
  .catch((error) => {
    console.error('Error setting custom claims:', error);
    process.exit(1);
  });
