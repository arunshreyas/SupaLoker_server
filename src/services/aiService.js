const axios = require('axios');

const ONE_SHOT_PROMPT = `Extract this document into EXACT JSON:
{
  "docType": "",
  "safeFields": {
    "name": "",
    "gender": "",
    "issueDate": "",
    "expiryDate": ""
  },
  "sensitiveFields": {
    "idNumber": "",
    "dob": "",
    "address": ""
  },
  "fullText": ""
}
Document:
{{DOCUMENT_TEXT}}
Rules:
- If missing, return empty string.
- Output MUST be valid JSON only.`;

function ruleExtract(text) {
  const t = (text || '').replace(/\r/g, '');
  const pick = (re) => {
    const m = t.match(re);
    return m ? (m[1] || m[0] || '').toString().trim() : '';
  };
  // Very lightweight heuristics; adjust as needed
  const name = pick(/name\s*[:\-]\s*([A-Z][A-Za-z\s]{2,})/i) || pick(/awarded to\s+([A-Z][A-Za-z\s]{2,})/i);
  const gender = pick(/gender\s*[:\-]\s*(male|female|m|f)/i).toUpperCase();
  const issueDate = pick(/issue\s*date\s*[:\-]\s*([0-9]{4}[-\/][0-9]{2}[-\/][0-9]{2}|[0-9]{2}[-\/][0-9]{2}[-\/][0-9]{4})/i);
  const expiryDate = pick(/expir(y|ation)\s*date\s*[:\-]\s*([0-9]{4}[-\/][0-9]{2}[-\/][0-9]{2}|[0-9]{2}[-\/][0-9]{2}[-\/][0-9]{4})/i);
  const idNumber = pick(/(id|license|pan|aadhaar|passport)\s*(no|number)?\s*[:\-]\s*([A-Z0-9\-]{4,})/i);
  const dob = pick(/(dob|date\s*of\s*birth)\s*[:\-]\s*([0-9]{4}[-\/][0-9]{2}[-\/][0-9]{2}|[0-9]{2}[-\/][0-9]{2}[-\/][0-9]{4})/i);
  const address = pick(/address\s*[:\-]\s*([\s\S]{10,120})/i);
  return {
    docType: pick(/(certificate|id\s*card|passport|license)/i) || 'Document',
    safeFields: { name: name || '', gender: gender || '', issueDate: issueDate || '', expiryDate: (expiryDate || '').replace(/^expir(y|ation)\s*date\s*[:\-]\s*/i,'') },
    sensitiveFields: { idNumber: idNumber || '', dob: (dob || '').replace(/^(dob|date\s*of\s*birth)\s*[:\-]\s*/i,'') , address: address || '' },
    fullText: t,
  };
}

async function extractStructuredData(text) {
  if ((process.env.EXTRACTOR_MODE || '').toLowerCase() === 'rule') {
    return ruleExtract(text || '');
  }
  const apiKey = process.env.OPENROUTER_API_KEY;
  const model = process.env.OPENROUTER_MODEL || 'openrouter/auto';
  if (!apiKey) throw new Error('OPENROUTER_API_KEY not set');
  const prompt = ONE_SHOT_PROMPT.replace('{{DOCUMENT_TEXT}}', text.slice(0, 15000));
  const requestBody = {
    model,
    messages: [
      { role: 'system', content: 'You are a precise JSON extractor.' },
      { role: 'user', content: prompt }
    ],
    temperature: 0.1,
  };

  const headers = {
    'Authorization': `Bearer ${apiKey}`,
    'HTTP-Referer': 'https://github.com/arunshreyas/supalocker',
    'X-Title': 'SupaLocker Backend',
    'Content-Type': 'application/json',
  };

  const shouldRetry = (err) => {
    const status = err?.response?.status;
    return status === 429 || status === 502 || status === 503 || status === 504 || !status; // network
  };

  const sleep = (ms) => new Promise(r => setTimeout(r, ms));

  let resp;
  let attempt = 0;
  const maxAttempts = 3;
  const baseDelay = 1000;
  while (attempt < maxAttempts) {
    attempt += 1;
    try {
      resp = await axios.post('https://openrouter.ai/api/v1/chat/completions', requestBody, { headers, timeout: 60000 });
      break;
    } catch (err) {
      if (attempt >= maxAttempts || !shouldRetry(err)) throw err;
      const delay = baseDelay * Math.pow(2, attempt - 1);
      await sleep(delay);
    }
  }

  const content = resp.data?.choices?.[0]?.message?.content || '';
  let json;
  try {
    json = JSON.parse(content);
  } catch (e) {
    throw new Error('LLM did not return valid JSON');
  }
  // Ensure required keys
  return {
    docType: json.docType || '',
    safeFields: json.safeFields || {},
    sensitiveFields: json.sensitiveFields || {},
    fullText: json.fullText || text,
  };
}

module.exports = { extractStructuredData };
