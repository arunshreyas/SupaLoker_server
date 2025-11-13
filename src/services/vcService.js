const jwt = require('jsonwebtoken');

function issueVC({ issuerDid, holderDid, cid, claims }) {
  const secret = process.env.ISSUER_JWT_SECRET;
  if (!secret) throw new Error('ISSUER_JWT_SECRET not set');
  const payload = {
    iss: issuerDid,
    sub: cid,
    holder: holderDid,
    claims,
  };
  const token = jwt.sign(payload, secret, { algorithm: 'HS256', expiresIn: '30d' });
  return token;
}

function verifyVC(token) {
  const secret = process.env.ISSUER_JWT_SECRET;
  if (!secret) throw new Error('ISSUER_JWT_SECRET not set');
  return jwt.verify(token, secret, { algorithms: ['HS256'] });
}

module.exports = { issueVC, verifyVC };
