const crypto = require('crypto');
const nacl = require('tweetnacl');
const ed2curve = require('ed2curve');

function aesGcmEncrypt(plaintextObj) {
  const key = crypto.randomBytes(32); // AES-256
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  const plaintext = Buffer.from(JSON.stringify(plaintextObj), 'utf8');
  const ciphertext = Buffer.concat([cipher.update(plaintext), cipher.final()]);
  const tag = cipher.getAuthTag();
  return { key, iv, ciphertext, tag };
}

function aesGcmDecrypt(key, iv, tag, ciphertext) {
  const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
  decipher.setAuthTag(tag);
  const plaintext = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
  return JSON.parse(plaintext.toString('utf8'));
}

function wrapKeyWithRecipientX25519(aesKey, recipientEd25519Raw) {
  const recipientCurve25519 = ed2curve.convertPublicKey(recipientEd25519Raw);
  if (!recipientCurve25519) throw new Error('Failed to convert Ed25519 -> X25519');
  const eph = nacl.box.keyPair();
  const nonce = crypto.randomBytes(24);
  const boxed = nacl.box(new Uint8Array(aesKey), new Uint8Array(nonce), new Uint8Array(recipientCurve25519), eph.secretKey);
  return {
    ephemeralPublicKey: Buffer.from(eph.publicKey).toString('base64'),
    nonce: Buffer.from(nonce).toString('base64'),
    ciphertext: Buffer.from(boxed).toString('base64'),
  };
}

module.exports = {
  aesGcmEncrypt,
  aesGcmDecrypt,
  wrapKeyWithRecipientX25519,
};
