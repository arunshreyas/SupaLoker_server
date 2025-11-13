const express = require('express');
const Credential = require('../models/Credential');
const { issueVC } = require('../services/vcService');

const router = express.Router();

router.get('/credentials/:did', async (req, res) => {
  const items = await Credential.find({ ownerDID: req.params.did }).lean();
  return res.json(items);
});

router.get('/credential/:cid', async (req, res) => {
  const item = await Credential.findOne({ cid: req.params.cid }).lean();
  if (!item) return res.status(404).json({ message: 'not found' });
  return res.json(item);
});

router.post('/credential/:cid/revoke', async (req, res) => {
  const updated = await Credential.findOneAndUpdate({ cid: req.params.cid }, { revoked: true }, { new: true }).lean();
  if (!updated) return res.status(404).json({ message: 'not found' });
  return res.json({ ok: true, credential: updated });
});

router.post('/share', async (req, res) => {
  try {
    const { cid, fields, ownerDID } = req.body || {};
    if (!cid || !Array.isArray(fields) || !ownerDID) return res.status(400).json({ message: 'cid, fields[], ownerDID required' });
    const cred = await Credential.findOne({ cid, ownerDID }).lean();
    if (!cred) return res.status(404).json({ message: 'credential not found' });

    const selected = {};
    for (const f of fields) {
      if (Object.prototype.hasOwnProperty.call(cred.safeFields, f)) selected[f] = cred.safeFields[f];
    }

    const issuerDid = process.env.ISSUER_DID || 'did:example:issuer';
    const derived = issueVC({ issuerDid, holderDid: ownerDID, cid, claims: selected });
    return res.json({ derivedVC: derived, claims: selected });
  } catch (e) {
    return res.status(500).json({ message: 'share failed', error: e.message });
  }
});

module.exports = router;
