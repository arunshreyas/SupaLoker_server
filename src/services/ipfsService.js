const axios = require('axios');
const { Web3Storage, File } = require('web3.storage');

async function storeWithPinata(json) {
  const jwt = process.env.PINATA_JWT;
  if (!jwt) throw new Error('PINATA_JWT not set');
  const resp = await axios.post(
    'https://api.pinata.cloud/pinning/pinJSONToIPFS',
    {
      pinataOptions: { cidVersion: 1 },
      pinataMetadata: { name: 'supalocker-credential.json' },
      pinataContent: json,
    },
    {
      headers: {
        Authorization: `Bearer ${jwt}`,
        'Content-Type': 'application/json',
      },
      timeout: 30000,
    }
  );
  const cid = resp.data?.IpfsHash;
  if (!cid) throw new Error('Pinata did not return IpfsHash');
  return cid;
}

function getWeb3Client() {
  const token = process.env.WEB3_STORAGE_TOKEN;
  if (!token) throw new Error('WEB3_STORAGE_TOKEN not set');
  return new Web3Storage({ token });
}

async function storeWithWeb3(json) {
  const client = getWeb3Client();
  const blob = Buffer.from(JSON.stringify(json), 'utf8');
  const files = [new File([blob], 'credential.json', { type: 'application/json' })];
  const cid = await client.put(files, { wrapWithDirectory: false });
  return cid;
}

async function storeJSON(json) {
  if (process.env.PINATA_JWT) {
    return storeWithPinata(json);
  }
  return storeWithWeb3(json);
}

module.exports = { storeJSON };
