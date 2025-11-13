# SupaLocker Backend

Decentralized credential vault inspired by DigiLocker using DID + VC + IPFS + encryption + user sovereignty.

## Features
- DID generation and registry (did:key)
- PDF upload + LLM extraction (OpenRouter)
- Hybrid crypto: AES-256-GCM + X25519 (NaCl box)
- Encrypted payload to IPFS (web3.storage)
- VC issuance (JWT HS256)
- MongoDB storage with revocation, selective disclosure, verification

## Routes
- POST /did/generate
- POST /did/register
- GET /did/:did
- POST /upload (multipart: ownerDID, file)
- GET /credentials/:did
- GET /credential/:cid
- POST /credential/:cid/revoke
- POST /share
- POST /verify

## Setup (Local)
1. Copy .env.example to .env and fill values
2. Install deps
   ```
   npm install
   ```
3. Start Mongo and API with Docker Compose
   ```
   docker compose up --build
   ```
   Or run locally with a Mongo URI in .env and:
   ```
   npm run dev
   ```

## Environment
- PORT: 4000
- DATABASE_URI: mongodb URI
- OPENROUTER_API_KEY: OpenRouter key
- OPENROUTER_MODEL: openrouter/auto
- WEB3_STORAGE_TOKEN: web3.storage token
- ISSUER_DID: issuer DID string
- ISSUER_JWT_SECRET: secret for HS256 signing
- MAX_UPLOAD_MB: default 25
- CORS_ORIGIN: * or your domain

## Notes
- Server stores only public keys for DIDs.
- Sensitive data is encrypted client-intent via server using recipient DID.
- Share route creates a derived VC with selected safe fields.
- Verify route checks signature, CID existence, and revocation.
# SupaLoker_server
