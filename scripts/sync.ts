
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' }); // or just dotenv.config() if you rename to .env

console.log('GOOGLE_SHEETS_ID:', process.env.GOOGLE_SHEETS_ID);
console.log('GOOGLE_SERVICE_ACCOUNT_EMAIL:', process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL);
console.log('GOOGLE_PRIVATE_KEY:', process.env.GOOGLE_PRIVATE_KEY ? 'set' : 'missing');
import { fetchAndSyncQuestions } from '../src/utils/syncQuestions';


fetchAndSyncQuestions()
  .then((count) => {
    console.log(`Synced ${count} questions to data/questions.json`);
    process.exit(0);
  })
  .catch((err) => {
    console.error('Sync failed:', err);
    process.exit(1);
  }); 