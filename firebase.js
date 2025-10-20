import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { readFileSync } from 'fs';
import { Timestamp } from 'firebase-admin/firestore';

// Lecture du fichier JSON
const serviceAccount = JSON.parse(readFileSync(new URL('./credential.json', import.meta.url), 'utf8'));

// Initialisation de Firebase Admin
initializeApp({
    credential: cert(serviceAccount)
});

const db = getFirestore();

export { db, Timestamp};
