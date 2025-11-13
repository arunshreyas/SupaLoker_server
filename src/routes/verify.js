const express = require('express');
const router = express.Router();
const { verifyVC } = require('../services/vcService');
const Credential = require('../models/Credential');

router.post('/verify', async (req, res) => {
  try {
    const { vc, cid } = req.body || {};
    if (!vc || !cid) return res.status(400).json({ message: 'vc and cid required' });

    const decoded = verifyVC(vc);
    if (decoded.sub !== cid) return res.status(400).json({ message: 'VC subject does not match CID' });

    const cred = await Credential.findOne({ cid }).lean();
    if (!cred) return res.status(404).json({ message: 'credential not found' });
    if (cred.revoked) return res.status(400).json({ message: 'credential revoked' });

    return res.json({ valid: true, decoded });
  } catch (e) {
    return res.status(400).json({ valid: false, message: 'verification failed', error: e.message });
  }
});

module.exports = router;
