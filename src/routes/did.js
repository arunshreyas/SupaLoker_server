const express = require('express');
const router = express.Router();
const nacl = require('tweetnacl');
const _bs58 = require('bs58');
const bs58 = _bs58.default || _bs58; // support ESM default export
const DID = require('../models/DID');

function didFromEd25519Public(rawPub) {
  const prefix = Buffer.from([0xED, 0x01]);
  const multicodec = Buffer.concat([prefix, Buffer.from(rawPub)]);
  const mb = 'z' + bs58.encode(multicodec);
  return `did:key:${mb}`;
}

router.post('/generate', async (req, res) => {
  try {
    const kp = nacl.sign.keyPair();
    const did = didFromEd25519Public(kp.publicKey);
    return res.json({ did, publicKeyEd25519: Buffer.from(kp.publicKey).toString('base64') });
  } catch (e) {
    return res.status(500).json({ message: 'failed to generate', error: e.message });
  }
});

router.post('/register', async (req, res) => {
  try {
    const { did, publicKeyEd25519 } = req.body || {};
    if (!did || !publicKeyEd25519) return res.status(400).json({ message: 'did and publicKeyEd25519 required' });
    await DID.findOneAndUpdate({ did }, { did, publicKeyEd25519 }, { upsert: true });
    return res.json({ ok: true });
  } catch (e) {
    return res.status(500).json({ message: 'failed to register', error: e.message });
  }
});

router.get('/:did', async (req, res) => {
  const doc = await DID.findOne({ did: req.params.did });
  if (!doc) return res.status(404).json({ message: 'not found' });
  return res.json(doc);
});

module.exports = router;
