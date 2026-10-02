const { initializeApp, cert } = require('firebase-admin/app');
const { getAuth } = require('firebase-admin/auth');

const serviceAccount = require('./service-account.json');

initializeApp({
  credential: cert(serviceAccount)
});

const email = process.argv[2] || 'jainish@olympia.com';

getAuth()
  .getUserByEmail(email)
  .then((user) => {
    return getAuth().setCustomUserClaims(user.uid, { admin: true }).then(() => {
      console.log(`✅ Successfully set admin claim for user: ${email} (${user.uid})`);
      process.exit(0);
    });
  })
  .catch((error) => {
    console.error('❌ Error setting custom claims:', error.message);
    process.exit(1);
  });
