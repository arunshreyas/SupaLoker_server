const express = require('express');
const multer = require('multer');
const pdfParse = require('pdf-parse');
const DID = require('../models/DID');
const Credential = require('../models/Credential');
const { extractStructuredData } = require('../services/aiService');
const { aesGcmEncrypt, wrapKeyWithRecipientX25519 } = require('../services/cryptoService');
const { storeJSON, storeFile } = require('../services/ipfsService');
const { issueVC } = require('../services/vcService');
const { ed25519PubFromDidKey } = require('../utils/parseDid');

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: (Number(process.env.MAX_UPLOAD_MB || 25)) * 1024 * 1024 } });

router.post('/upload', upload.single('file'), async (req, res) => {
  try {
    const ownerDID = req.body?.ownerDID;
    if (!ownerDID) return res.status(400).json({ message: 'ownerDID required' });
    if (!req.file) return res.status(400).json({ message: 'file is required (pdf)' });
    if (!req.file.mimetype.includes('pdf')) return res.status(400).json({ message: 'file must be a PDF' });

    const pdfText = (await pdfParse(req.file.buffer)).text || '';
    const extracted = await extractStructuredData(pdfText);

    const { key: aesKey, iv, ciphertext, tag } = aesGcmEncrypt(extracted.sensitiveFields || {});

    let recipientEdPubRaw;
    const didDoc = await DID.findOne({ did: ownerDID }).lean();
    if (didDoc?.publicKeyEd25519) {
      recipientEdPubRaw = Buffer.from(didDoc.publicKeyEd25519, 'base64');
    } else {
      recipientEdPubRaw = ed25519PubFromDidKey(ownerDID);
    }
    if (!recipientEdPubRaw) return res.status(400).json({ message: 'Could not resolve owner public key from DID' });

    const envelope = wrapKeyWithRecipientX25519(aesKey, recipientEdPubRaw);

    const encryptedPayload = {
      algorithm: 'AES-256-GCM',
      iv: iv.toString('base64'),
      tag: tag.toString('base64'),
      ciphertext: ciphertext.toString('base64'),
      envelope: { ...envelope, alg: 'x25519-xsalsa20-poly1305' },
    };

    const toStore = {
      docType: extracted.docType || '',
      safeFields: extracted.safeFields || {},
      encryptedFields: encryptedPayload,
      fullText: extracted.fullText || '',
    };

    const cid = await storeJSON(toStore);

    // Store original PDF file separately for download
    const originalCid = await storeFile(req.file.buffer);

    const issuerDid = process.env.ISSUER_DID || 'did:example:issuer';
    const vc = issueVC({ issuerDid, holderDid: ownerDID, cid, claims: extracted.safeFields || {} });

    const saved = await Credential.create({
      ownerDID,
      cid,
      originalCid,
      docType: extracted.docType || '',
      safeFields: extracted.safeFields || {},
      encryptedFields: JSON.stringify(encryptedPayload),
      vc,
    });

    return res.json({ cid, originalCid, vc, docType: saved.docType, safeFields: saved.safeFields });
  } catch (e) {
    console.error('upload error', e);
    return res.status(500).json({ message: 'upload failed', error: e.message });
  }
});

module.exports = router;
