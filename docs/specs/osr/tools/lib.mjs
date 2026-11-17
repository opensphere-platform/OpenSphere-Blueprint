// OSR 계약 참조 도구 — 공통 함수
// canonical JSON(RFC 8785 JCS, 정수만), digest, P-256 서명, JSON Schema 부분 검증기.
// 의존 패키지 없이 Node 20+ 표준 라이브러리만 쓴다.
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const OSR_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

// ---------- canonical JSON ----------
export class CanonicalError extends Error {}

export function canonicalize(v) {
  if (v === null) return 'null';
  switch (typeof v) {
    case 'boolean': return v ? 'true' : 'false';
    case 'number':
      if (!Number.isSafeInteger(v)) throw new CanonicalError(`정수가 아닌 수 또는 안전 범위 밖 정수: ${v}`);
      return String(v === 0 ? 0 : v); // -0 → 0
    case 'string':
      if (/[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?<![\uD800-\uDBFF])[\uDC00-\uDFFF]/.test(v)) throw new CanonicalError('짝 없는 surrogate');
      return JSON.stringify(v);
    case 'object': {
      if (Array.isArray(v)) return '[' + v.map(canonicalize).join(',') + ']';
      const keys = Object.keys(v).sort(); // UTF-16 code unit 순서 = JCS 규칙
      return '{' + keys.map((k) => {
        if (v[k] === undefined) throw new CanonicalError(`undefined 값: ${k}`);
        return canonicalize(k) + ':' + canonicalize(v[k]);
      }).join(',') + '}';
    }
    default: throw new CanonicalError(`표현할 수 없는 값: ${typeof v}`);
  }
}

export const DIGEST_RE = /^sha256:[0-9a-f]{64}$/;
export const isDigest = (s) => typeof s === 'string' && DIGEST_RE.test(s);
export const sha256hex = (buf) => crypto.createHash('sha256').update(buf).digest('hex');
export const digest = (v) => 'sha256:' + sha256hex(Buffer.from(canonicalize(v), 'utf8'));
export const digestHex = (d) => d.slice('sha256:'.length);
export const same = (a, b) => canonicalize(a) === canonicalize(b);

// ---------- 서명: ECDSA P-256 / SHA-256, IEEE P1363(r||s 64바이트), base64url ----------
export const SIG_ALG = 'ES256-P1363';

export function generateKey() {
  const { privateKey, publicKey } = crypto.generateKeyPairSync('ec', { namedCurve: 'P-256' });
  return { privateKey, publicKeyJwk: publicKey.export({ format: 'jwk' }) };
}

export function signEnvelope(payload, keyId, privateKey) {
  const data = Buffer.from(canonicalize(payload), 'utf8');
  const value = crypto.sign('sha256', data, { key: privateKey, dsaEncoding: 'ieee-p1363' }).toString('base64url');
  return { payload, signature: { alg: SIG_ALG, keyId, value } };
}

export function verifyEnvelope(env, publicKeyJwk) {
  try {
    if (!env || !env.signature || env.signature.alg !== SIG_ALG) return false;
    const key = crypto.createPublicKey({ key: publicKeyJwk, format: 'jwk' });
    const sig = Buffer.from(env.signature.value, 'base64url');
    if (sig.length !== 64) return false;
    const data = Buffer.from(canonicalize(env.payload), 'utf8');
    return crypto.verify('sha256', data, { key, dsaEncoding: 'ieee-p1363' }, sig);
  } catch { return false; }
}

// ---------- 시각 ----------
export const TIME_RE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/;
export const ms = (t) => Date.parse(t);
export const within = (now, from, to) => ms(from) <= now && now < ms(to);

// ---------- JSON Schema 부분 검증기 ----------
// 지원 키워드(이 밖의 키워드는 SUPPORTED 검사에서 오류): 스키마는 draft 2020-12로 작성하되 아래 부분만 쓴다.
export const SUPPORTED = new Set([
  '$schema', '$id', '$ref', '$defs', '$comment', 'title', 'description',
  'type', 'const', 'enum', 'required', 'properties', 'additionalProperties',
  'items', 'minItems', 'maxItems', 'uniqueItems', 'minLength', 'maxLength', 'pattern',
  'minimum', 'maximum', 'minProperties', 'allOf', 'anyOf', 'oneOf', 'not', 'if', 'then', 'else',
]);

export function unsupportedKeywords(schema, p = '#', out = []) {
  if (Array.isArray(schema)) { schema.forEach((s, i) => unsupportedKeywords(s, `${p}/${i}`, out)); return out; }
  if (!schema || typeof schema !== 'object') return out;
  for (const [k, v] of Object.entries(schema)) {
    if (!SUPPORTED.has(k)) out.push(`${p}/${k}`);
    if (k === 'properties' || k === '$defs') for (const [n, s] of Object.entries(v)) unsupportedKeywords(s, `${p}/${k}/${n}`, out);
    else if (['items', 'additionalProperties', 'not', 'if', 'then', 'else'].includes(k) && typeof v === 'object') unsupportedKeywords(v, `${p}/${k}`, out);
    else if (['allOf', 'anyOf', 'oneOf'].includes(k)) unsupportedKeywords(v, `${p}/${k}`, out);
  }
  return out;
}

const typeOf = (v) => v === null ? 'null' : Array.isArray(v) ? 'array' : Number.isInteger(v) ? 'integer' : typeof v;

export function validate(schema, data, root = schema, p = '$') {
  if (schema === true) return [];
  if (schema === false) return [`${p}: 허용되지 않음`];
  const errs = [];
  if (schema.$ref) {
    const m = /^#\/\$defs\/(.+)$/.exec(schema.$ref);
    if (!m || !root.$defs?.[m[1]]) return [`${p}: 해석할 수 없는 $ref ${schema.$ref}`];
    errs.push(...validate(root.$defs[m[1]], data, root, p));
  }
  const t = typeOf(data);
  if (schema.type) {
    const types = [].concat(schema.type);
    const ok = types.some((x) => x === t || (x === 'number' && t === 'integer'));
    if (!ok) return [...errs, `${p}: 형식 ${types.join('|')} 필요, ${t}`];
  }
  if ('const' in schema && !same(schema.const, data)) errs.push(`${p}: 값은 ${JSON.stringify(schema.const)}`);
  if (schema.enum && !schema.enum.some((e) => same(e, data))) errs.push(`${p}: 허용 값 ${JSON.stringify(schema.enum)}`);
  if (t === 'string') {
    if (schema.minLength != null && [...data].length < schema.minLength) errs.push(`${p}: 길이 ≥ ${schema.minLength}`);
    if (schema.maxLength != null && [...data].length > schema.maxLength) errs.push(`${p}: 길이 ≤ ${schema.maxLength}`);
    if (schema.pattern && !new RegExp(schema.pattern, 'u').test(data)) errs.push(`${p}: 형식 /${schema.pattern}/ 불일치`);
  }
  if (t === 'integer') {
    if (schema.minimum != null && data < schema.minimum) errs.push(`${p}: ≥ ${schema.minimum}`);
    if (schema.maximum != null && data > schema.maximum) errs.push(`${p}: ≤ ${schema.maximum}`);
  }
  if (t === 'array') {
    if (schema.minItems != null && data.length < schema.minItems) errs.push(`${p}: 항목 ≥ ${schema.minItems}`);
    if (schema.maxItems != null && data.length > schema.maxItems) errs.push(`${p}: 항목 ≤ ${schema.maxItems}`);
    if (schema.uniqueItems && new Set(data.map(canonicalize)).size !== data.length) errs.push(`${p}: 중복 항목`);
    if (schema.items) data.forEach((x, i) => errs.push(...validate(schema.items, x, root, `${p}[${i}]`)));
  }
  if (t === 'object') {
    if (schema.minProperties != null && Object.keys(data).length < schema.minProperties) errs.push(`${p}: 속성 ≥ ${schema.minProperties}`);
    for (const r of schema.required || []) if (!(r in data)) errs.push(`${p}: 필수 속성 ${r} 없음`);
    const props = schema.properties || {};
    for (const [k, v] of Object.entries(data)) {
      if (k in props) errs.push(...validate(props[k], v, root, `${p}.${k}`));
      else if (schema.additionalProperties === false) errs.push(`${p}: 알 수 없는 속성 ${k}`);
      else if (typeof schema.additionalProperties === 'object') errs.push(...validate(schema.additionalProperties, v, root, `${p}.${k}`));
    }
  }
  for (const s of schema.allOf || []) errs.push(...validate(s, data, root, p));
  if (schema.anyOf && !schema.anyOf.some((s) => validate(s, data, root, p).length === 0)) errs.push(`${p}: anyOf 불충족`);
  if (schema.oneOf && schema.oneOf.filter((s) => validate(s, data, root, p).length === 0).length !== 1) errs.push(`${p}: oneOf 정확히 하나 불충족`);
  if (schema.not && validate(schema.not, data, root, p).length === 0) errs.push(`${p}: not 조건 위반`);
  if (schema.if) {
    const branch = validate(schema.if, data, root, p).length === 0 ? schema.then : schema.else;
    if (branch) errs.push(...validate(branch, data, root, p));
  }
  return errs;
}

const schemaCache = new Map();
export function loadSchema(name) {
  if (!schemaCache.has(name)) schemaCache.set(name, JSON.parse(fs.readFileSync(path.join(OSR_DIR, 'schemas', `${name}.schema.json`), 'utf8')));
  return schemaCache.get(name);
}
export function validateAgainst(name, data, defName) {
  const root = loadSchema(name);
  return validate(defName ? { $ref: `#/$defs/${defName}` } : root, data, root);
}
export const readJson = (rel) => JSON.parse(fs.readFileSync(path.join(OSR_DIR, rel), 'utf8'));
export function writeJson(rel, obj) {
  fs.writeFileSync(path.join(OSR_DIR, rel), JSON.stringify(obj, null, 2) + '\n');
}
