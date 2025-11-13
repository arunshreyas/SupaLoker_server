const mongoose = require('mongoose');

const DIDSchema = new mongoose.Schema({
  did: { type: String, required: true, unique: true, index: true },
  publicKeyEd25519: { type: String, required: true },
  publicKeyX25519: { type: String, required: false },
}, { timestamps: true });

module.exports = mongoose.model('DID', DIDSchema);
