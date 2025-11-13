const _bs58 = require('bs58');
const bs58 = _bs58.default || _bs58; // support ESM default export shape

// Extract raw 32-byte Ed25519 public key from did:key:z... (multibase base58btc, multicodec 0xED 0x01)
function ed25519PubFromDidKey(did) {
  if (!did || typeof did !== 'string' || !did.startsWith('did:key:z')) return null;
  const b58 = did.slice('did:key:z'.length);
  const bytes = bs58.decode(b58);
  // Expect 34 bytes: 0xED 0x01 + 32 bytes key
  if (bytes.length === 34 && bytes[0] === 0xED && bytes[1] === 0x01) {
    return bytes.slice(2);
  }
  // Some implementations may have different prefixes; fallback: if 32 bytes, assume raw key
  if (bytes.length === 32) return bytes;
  return null;
}

module.exports = { ed25519PubFromDidKey };
