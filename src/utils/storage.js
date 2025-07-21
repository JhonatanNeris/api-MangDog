// src/utils/storage.js
import { Storage } from '@google-cloud/storage';

const projectId = process.env.CLOUD_STORAGE_PROJECT_ID
const privateKey = process.env.CLOUD_STORAGE_PRIVATE_KEY
const clientEmail = process.env.CLOUD_STORAGE_CLIENT_EMAIL

if (!privateKey || !clientEmail || !projectId) {
    throw new Error('Variáveis de ambiente do Google Cloud Storage não estão definidas corretamente.');
}

const storage = new Storage({
    credentials: {
        client_email: clientEmail,
        private_key: privateKey.replace(/\\n/g, '\n'),
    },
    projectId: projectId,
});

const bucketName = 'sistema-bruto'; // ex: produtos-seusistema

const bucket = storage.bucket(bucketName);

export { bucket };
