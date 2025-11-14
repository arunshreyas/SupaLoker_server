const mongoose = require('mongoose');

const CredentialSchema = new mongoose.Schema({
  ownerDID: { type: String, required: true, index: true },
  cid: { type: String, required: true, unique: true },
  docType: { type: String, required: true },
  safeFields: { type: Object, required: true },
  encryptedFields: { type: String, required: true },
  vc: { type: String, required: true },
  originalCid: { type: String },
  revoked: { type: Boolean, default: false },
}, { timestamps: true });

module.exports = mongoose.model('Credential', CredentialSchema);
