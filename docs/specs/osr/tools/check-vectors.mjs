// 시험 벡터 자체 검사: 스키마 키워드 부분집합, profile 형식, 벡터마다 참조 검증기 결과 = 기대 결과.
// 사용: node tools/check-vectors.mjs   (실패하면 종료 코드 1)
import fs from 'node:fs';
import path from 'node:path';
import { OSR_DIR, readJson, unsupportedKeywords, validateAgainst, digest } from './lib.mjs';
import { run } from './verify.mjs';

let failures = 0;
const bad = (msg) => { failures++; console.log('  ✗ ' + msg); };

console.log('스키마');
for (const f of fs.readdirSync(path.join(OSR_DIR, 'schemas')).filter((x) => x.endsWith('.schema.json') && !x.startsWith('._'))) {
  const s = readJson(`schemas/${f}`);
  const u = unsupportedKeywords(s);
  if (u.length) bad(`${f}: 지원하지 않는 키워드 ${u.join(', ')}`); else console.log(`  ✓ ${f}`);
}
console.log('profile');
for (const f of fs.readdirSync(path.join(OSR_DIR, 'profiles')).filter((x) => x.endsWith('.json') && !x.startsWith('._'))) {
  const p = readJson(`profiles/${f}`);
  const e = validateAgainst('materializer-profile', p);
  if (e.length || `${p.id}.json` !== f) bad(`${f}: ${e.join('; ') || '파일 이름 ≠ id'}`); else console.log(`  ✓ ${f}  ${digest(p)}`);
}
const ids = new Set();
for (const group of ['canonical', 'release', 'ui', 'assembly', 'catalog', 'execution', 'recovery', 'permission']) {
  const file = readJson(`vectors/${group}.json`);
  console.log(`벡터 ${group} (${file.vectors.length})`);
  for (const v of file.vectors) {
    if (ids.has(v.id)) bad(`${v.id}: ID 중복`);
    ids.add(v.id);
    const got = run(v, file.shared);
    const okResult = got.result === v.expect.result;
    const okCode = v.expect.code === undefined || got.code === v.expect.code;
    // canonical 벡터는 기대 bytes·digest까지 고정한다(다른 언어 구현이 같은 bytes를 내야 한다).
    const okBytes = v.kind !== 'canonical' || v.expect.result === 'reject' || (got.output?.canonical === v.expect.canonical && got.output?.digest === v.expect.digest);
    const okRoute = v.expect.route === undefined || got.output?.route === v.expect.route;
    const okStep = v.expect.step === undefined || got.step === v.expect.step || (got.result !== 'reject' && v.expect.step === 10);
    if (okResult && okCode && okStep && okBytes && okRoute) console.log(`  ✓ ${v.id} ${got.result}${got.code ? ' ' + got.code : ''} — ${v.title}`);
    else bad(`${v.id} 기대 ${JSON.stringify(v.expect)} / 실제 ${JSON.stringify({ result: got.result, code: got.code, step: got.step, detail: got.detail })}`);
  }
}
console.log(failures ? `\n실패 ${failures}건` : `\n모두 통과(벡터 ${ids.size}개)`);
process.exit(failures ? 1 : 0);
