// OSR 참조 검증기 — 계약 단위 fixture 검사용. Backbone 구현이 아니다.
// 각 함수는 { result: 'pass' | 'reject' | 'replay', code?, step?, detail?, output? }를 돌려준다.
import {
  canonicalize, CanonicalError, digest, digestHex, isDigest, same, verifyEnvelope, validateAgainst, within, ms,
} from './lib.mjs';

class Reject extends Error {
  constructor(code, step, detail) { super(code); Object.assign(this, { code, step, detail }); }
}
const fail = (code, step, detail = '') => { throw new Reject(code, step, detail); };
const guard = (fn) => (input) => {
  try { return fn(input); } catch (e) {
    if (e instanceof Reject) return { result: 'reject', code: e.code, step: e.step, detail: e.detail };
    throw e;
  }
};

export const CLASSES = ['core', 'hiss', 'delivery', 'provider', 'engine', 'runtime', 'assembly', 'ui', 'product'];
export const REPO_RE = new RegExp(`^ghcr\\.io/opensphere-platform/opensphere-(${CLASSES.join('|')})-([a-z][a-z0-9-]{1,40})$`);
const EXEC_LIFECYCLE = ['install', 'update', 'rollback', 'retire'];
export const ASSEMBLY_LIFECYCLE = { register: 'osr.assembly.register', update: 'osr.assembly.update', retire: 'osr.assembly.retire' };
// ui: 실행하지 않는 정적 화면 모듈. 생명주기는 OSR 고정 명령이고 Console(osr.ui-host)이 승인된 digest의 파일만 내려준다.
export const UI_LIFECYCLE = { install: 'osr.ui.install', update: 'osr.ui.update', rollback: 'osr.ui.rollback', retire: 'osr.ui.retire' };
export const UI_STATIC_MEDIA_TYPE = 'application/vnd.opensphere.ui-static.v1.tar';
export const UI_STATIC_MAX_BYTES = 64 * 1024 * 1024;
export const UI_PUBLIC_CAPABILITY = 'console.ui.public';
export const STANDARD_VERBS = { exec: ['status', 'inspect', 'plan', 'apply', 'verify', 'operation', 'rollback', 'retire'], assembly: ['status', 'inspect', 'verify'], ui: ['status', 'inspect', 'verify'] };
export const MANUAL_TYPES = { exec: ['overview', 'install', 'operations', 'troubleshooting', 'commands'], assembly: ['overview', 'composition', 'operations', 'troubleshooting', 'commands'], ui: ['overview', 'operations', 'troubleshooting', 'commands'] };
export const OWNER_BINDING = { exec: 'module-owner', assembly: 'osr.definition-owner', ui: 'osr.ui-host' };
const MUTATING_KINDS = ['apply', 'cancel', 'compensate'];
const isAssembly = (cls) => cls === 'assembly';
const isUi = (cls) => cls === 'ui';
const shape = (cls) => (isAssembly(cls) ? 'assembly' : isUi(cls) ? 'ui' : 'exec');
// JSON이 아닌 layer(불투명)는 등록 때 바이트를 보지 않는다. 서명된 인덱스의 digest·크기로만 묶인다.
const isOpaque = (entry) => !String(entry.mediaType || '').endsWith('+json');

// ---------- 0단계: 검증 맥락 snapshot ----------
function checkContext(input) {
  const env = input.context;
  const anchor = input.trustAnchor;
  const envErr = validateAgainst('signed-envelope', env);
  if (envErr.length) fail('ContextSnapshotInvalid', 0, envErr.join('; '));
  const errs = validateAgainst('validation-context-snapshot', env.payload);
  if (errs.length) fail('ContextSnapshotInvalid', 0, errs.join('; '));
  if (env.signature.keyId !== anchor.keyId || !verifyEnvelope(env, anchor.publicKeyJwk)) fail('ContextSnapshotInvalid', 0, 'trust anchor 서명 불일치');
  const now = ms(input.evaluationTime);
  if (!within(now, env.payload.issuedAt, env.payload.expiresAt)) fail('ContextSnapshotExpired', 0, `${env.payload.expiresAt} 만료`);
  return env.payload;
}

const caretOk = (range, v) => {
  const [a, b] = [range.slice(1).split('.').map(Number), v.split('.').map(Number)];
  if (a[0] !== b[0]) return false;
  for (let i = 1; i < 3; i++) { if (b[i] > a[i]) return true; if (b[i] < a[i]) return false; }
  return true;
};

// ---------- 형식 판정 1~9단계 ----------
export const verifyRelease = guard((input) => {
  const ctx = checkContext(input);
  const now = ms(input.evaluationTime);
  const r = input.release;

  // 1. 저장소 이름
  const m = REPO_RE.exec(r.repository);
  if (!m) fail('RepositoryNameInvalid', 1, r.repository);
  const [, cls, slug] = m;

  // 2. 번들 digest(인덱스 재계산)
  if (!isDigest(r.bundleDigest) || digest(r.index) !== r.bundleDigest) fail('InvalidDigest', 2, '번들 digest 재계산 불일치');
  const entries = Object.fromEntries(r.index.manifests.map((e) => [e.annotations?.['io.opensphere.part'], e.digest]));
  const opaque = Object.fromEntries(r.index.manifests.filter(isOpaque).map((e) => [e.annotations?.['io.opensphere.part'], e]));

  // 3. 서명 — 신뢰 키는 검증 맥락에서만 찾는다. 번들이 가져온 키는 보지 않는다.
  const sig = r.referrers?.signature;
  if (validateAgainst('signed-envelope', sig).length) fail('SignatureInvalid', 3, '서명 봉투 형식');
  const key = ctx.keys.find((k) => k.keyId === sig.signature.keyId);
  if (!key) fail('UnknownTrustKey', 3, sig.signature.keyId);
  if (key.revokedAtGeneration != null && key.revokedAtGeneration <= ctx.trustGeneration) fail('TrustGenerationStale', 3, `${key.keyId} 회수(세대 ${key.revokedAtGeneration})`);
  if (key.purpose !== 'release' || !key.scope.classes?.includes(cls)) fail('KeyScopeViolation', 3, `${key.keyId} 범위 밖: ${cls}`);
  if (!verifyEnvelope(sig, key.publicKeyJwk)) fail('SignatureInvalid', 3, '서명값 불일치');
  const sp = sig.payload;
  const spErr = validateAgainst('release-signature-payload', sp);
  if (spErr.length) fail('SignatureInvalid', 3, spErr.join('; '));
  if (sp.keyId !== key.keyId || sp.subject.repository !== r.repository || sp.subject.bundleDigest !== r.bundleDigest) fail('SignatureInvalid', 3, '서명 subject 불일치');

  // 4. 서명 만료
  if (!within(now, sp.issuedAt, sp.expiresAt)) fail('SignatureExpired', 4, `${sp.expiresAt}`);

  // 5. 디스크립터 — 무결성 확인 뒤 클래스 규칙, 스키마, 좌표
  const dDigest = entries.descriptor;
  const d = dDigest && r.blobs[dDigest];
  if (!d) fail('DescriptorInvalid', 5, 'descriptor artifact 없음');
  if (digest(d) !== dDigest) fail('ArtifactDigestMismatch', 5, 'descriptor');
  const lc = Object.keys(d.lifecycle || {}).sort();
  // 불투명 layer는 ui 클래스의 정적 화면 묶음(static) 하나만 허용한다.
  for (const [name, e] of Object.entries(opaque)) {
    if (!isUi(cls) || name !== 'static' || e.mediaType !== UI_STATIC_MEDIA_TYPE) fail('ClassRuleViolation', 5, `JSON이 아닌 layer는 ui의 static만 허용: ${name}`);
  }
  if (isUi(cls)) {
    if (d.runtime || d.storage) fail('ClassRuleViolation', 5, 'ui는 runtime·storage를 선언하지 않는다');
    if (!d.profile || !d.ui) fail('ClassRuleViolation', 5, 'ui는 profile과 ui 선언 필수');
    if (!same(d.lifecycle, UI_LIFECYCLE)) fail('ClassRuleViolation', 5, 'ui lifecycle은 OSR 고정 명령 install·update·rollback·retire');
    if (!opaque.static || !entries['static-index'] || d.contributions?.static?.artifact !== 'static') fail('ClassRuleViolation', 5, 'ui 정적 화면 묶음(static)과 목록(static-index) 필요');
  } else if (isAssembly(cls)) {
    if (d.runtime || d.storage) fail('ClassRuleViolation', 5, 'assembly는 runtime·storage를 선언하지 않는다');
    if (!same(d.lifecycle, ASSEMBLY_LIFECYCLE)) fail('ClassRuleViolation', 5, 'assembly lifecycle은 OSR 고정 명령 register·update·retire');
    if (!entries.definition || d.contributions?.definition?.artifact !== 'definition') fail('ClassRuleViolation', 5, 'assembly 정의 artifact 필요');
  } else {
    if (!d.runtime) fail('ClassRuleViolation', 5, `${cls}는 runtime 필수`);
    if (!d.profile) fail('ClassRuleViolation', 5, `${cls}는 profile 필수`);
    if (!same(lc, [...EXEC_LIFECYCLE].sort())) fail('ClassRuleViolation', 5, 'lifecycle은 install·update·rollback·retire');
  }
  const dErr = validateAgainst('module-descriptor', d);
  if (dErr.length) fail('DescriptorInvalid', 5, dErr.join('; '));
  if (d.id !== `${cls}.${slug}` || d.class !== cls || sp.module.id !== d.id || sp.module.version !== d.version) fail('ReleaseCoordinatesMismatch', 5, `저장소 ${r.repository}·서명 ${sp.module.id}·디스크립터 ${d.id}`);

  // 6. 기여 · 실행 artifact digest, 서명 목록, SBOM·출처(서명 payload에 digest가 있어야만 수용)
  const parts = {};
  for (const [name, dg] of Object.entries(entries)) {
    if (opaque[name]) { parts[name] = { digest: dg, opaque: true }; continue; }
    const blob = r.blobs[dg];
    if (blob === undefined || digest(blob) !== dg) fail('ArtifactDigestMismatch', 6, name);
    parts[name] = { digest: dg, content: blob };
  }
  const indexParts = Object.entries(parts).map(([part, v]) => ({ part, digest: v.digest })).sort((a, b) => a.part.localeCompare(b.part));
  const signedParts = [...sp.artifacts].sort((a, b) => a.part.localeCompare(b.part));
  if (sp.descriptorDigest !== dDigest || !same(indexParts, signedParts)) fail('ArtifactDigestMismatch', 6, '서명한 artifact 목록과 인덱스 불일치');
  const { sbom, provenance } = r.referrers;
  if (!sbom || !provenance) fail('SupplyChainEvidenceMissing', 6, 'SBOM·출처 referrer 없음');
  if (digest(sbom) !== sp.evidence.sbom) fail('SupplyChainEvidenceMismatch', 6, 'SBOM digest가 서명 payload와 다름');
  if (digest(provenance) !== sp.evidence.provenance) fail('SupplyChainEvidenceMismatch', 6, '출처 digest가 서명 payload와 다름');
  for (const [name, st, type] of [['SBOM', sbom, 'https://spdx.dev/Document/v2.3'], ['출처', provenance, 'https://slsa.dev/provenance/v1']]) {
    const e = validateAgainst('supply-chain-statement', st);
    if (e.length || st.predicateType !== type) fail('SupplyChainEvidenceMismatch', 6, `${name} 형식: ${e.join('; ')}`);
    if (st.subject[0].digest.sha256 !== digestHex(r.bundleDigest) || st.subject[0].name !== r.repository) fail('SupplyChainSubjectMismatch', 6, `${name} subject가 이 번들이 아님`);
  }
  const builder = provenance.predicate.runDetails.builder.id;
  if (!ctx.trustedBuilders.includes(builder)) fail('ProvenanceBuilderUntrusted', 6, builder);

  // 7. 기여 네 가지(클래스별 형식): 매뉴얼
  const manualPart = parts[d.contributions.manual.artifact];
  if (!manualPart || manualPart.opaque || validateAgainst('manual-bundle', manualPart.content).length) fail('ManualMissing', 7, '매뉴얼 artifact 없음 또는 형식 오류');
  const types = new Set(manualPart.content.documents.map((x) => x.documentType));
  const missingDocs = MANUAL_TYPES[shape(cls)].filter((t) => !types.has(t));
  if (missingDocs.length) fail('ManualMissing', 7, `필수 문서 없음: ${missingDocs.join(', ')}`);

  // 7. 명령 계약과 effect(계속)
  const cmdPart = parts[d.contributions.commands.artifact];
  const cmdErr = cmdPart && !cmdPart.opaque ? validateAgainst('owner-commands', cmdPart.content) : ['명령 artifact 없음'];
  if (cmdErr.length) fail('CommandContractInvalid', 7, cmdErr.join('; '));
  const cc = cmdPart.content;
  if (cc.module !== d.id) fail('CommandContractInvalid', 7, '명령 계약 모듈 불일치');
  if (cc.ownerBinding !== OWNER_BINDING[shape(cls)]) fail('CommandContractInvalid', 7, 'ownerBinding이 클래스와 맞지 않음');
  const ids = new Set(cc.commands.map((c) => c.id));
  if (ids.size !== cc.commands.length) fail('CommandContractInvalid', 7, '명령 ID 중복');
  for (const c of cc.commands) if (!c.id.startsWith(d.id + '.')) fail('CommandContractInvalid', 7, `ID 접두어: ${c.id}`);
  const missingStd = STANDARD_VERBS[shape(cls)].filter((v) => !ids.has(`${d.id}.${v}`));
  if (missingStd.length) fail('StandardCommandMissing', 7, missingStd.join(', '));
  if (shape(cls) === 'exec') for (const ref of Object.values(d.lifecycle)) if (!ids.has(ref)) fail('CommandContractInvalid', 7, `lifecycle 명령 없음: ${ref}`);
  for (const c of cc.commands) if (c.statusCommand && !ids.has(c.statusCommand)) fail('CommandContractInvalid', 7, `statusCommand 없음: ${c.statusCommand}`);
  const policy = ctx.policies[cls];
  if (!policy) fail('CapabilityNotAllowed', 7, `클래스 정책 없음: ${cls}`);
  for (const c of cc.commands) {
    const mutating = c.effect === 'mutation' || c.effect === 'destructive';
    if (mutating !== c.mutation || (mutating && !MUTATING_KINDS.includes(c.kind))) fail('EffectPolicyViolation', 7, `${c.id}: kind ${c.kind}·mutation ${c.mutation}·effect ${c.effect} 불일치`);
    if (!policy.allowedEffects.includes(c.effect)) fail('EffectPolicyViolation', 7, `${c.id}: 정책이 허용하지 않는 effect ${c.effect}`);
  }

  // 7. 지식(계속)
  const kPart = parts[d.contributions.knowledge.artifact];
  if (!kPart || kPart.opaque || validateAgainst('knowledge-bundle', kPart.content).length) fail('KnowledgeProvenanceInvalid', 7, '지식 artifact 없음 또는 형식 오류');
  for (const doc of kPart.content.documents) {
    if (doc.module !== d.id || kPart.content.module !== d.id) fail('KnowledgeProvenanceInvalid', 7, `${doc.id}: 다른 모듈 범위`);
    const src = parts[doc.source.part];
    if (!src || src.digest !== doc.source.digest) fail('KnowledgeProvenanceInvalid', 7, `${doc.id}: 출처 artifact digest 불일치`);
    if (doc.sourceRevision !== d.supplyChain.sourceRevision) fail('KnowledgeProvenanceInvalid', 7, `${doc.id}: sourceRevision 불일치`);
  }

  // 7. 정적 화면 목록(ui만, 계속): 목록이 서명된 layer를 가리키고 진입 파일을 포함해야 한다.
  if (isUi(cls)) {
    const idx = parts['static-index'];
    const sErr = idx && !idx.opaque ? validateAgainst('ui-static-index', idx.content) : ['정적 화면 목록 없음'];
    if (sErr.length) fail('UiStaticInvalid', 7, sErr.join('; '));
    const si = idx.content;
    if (si.module !== d.id || si.entry !== d.ui.entry) fail('UiStaticInvalid', 7, '목록의 모듈·진입 파일이 디스크립터와 다름');
    if (si.archive.digest !== entries.static || si.archive.size !== opaque.static.size) fail('UiStaticInvalid', 7, '목록의 archive가 서명된 static layer와 다름');
    const paths = new Set(si.files.map((f) => f.path));
    if (paths.size !== si.files.length) fail('UiStaticInvalid', 7, '파일 경로 중복');
    const entryFile = si.files.find((f) => f.path === si.entry);
    if (!entryFile || entryFile.contentType !== 'text/html; charset=utf-8') fail('UiStaticInvalid', 7, `진입 파일 없음 또는 HTML 아님: ${si.entry}`);
    if (si.files.reduce((a, f) => a + f.size, 0) > UI_STATIC_MAX_BYTES) fail('UiStaticInvalid', 7, '파일 크기 합이 한도를 넘음');
  }

  // 8. profile 존재 · capability 요청이 profile 허용 안
  const profileId = d.profile ?? (isAssembly(cls) ? 'assembly.definition' : undefined);
  const entry = ctx.profiles.find((p) => p.id === profileId);
  if (!entry) fail('ProfileUnknown', 8, `${profileId}는 검증 맥락에 없는 profile`);
  const profile = (input.profiles || []).find((p) => p.id === entry.id && p.version === entry.version);
  if (!profile || digest(profile) !== entry.fingerprint) fail('ProfileUnknown', 8, `${profileId} 문서가 지문과 다름`);
  if (profile.class !== cls || !profile.appliesTo.includes(d.id)) fail('ProfileUnknown', 8, `${profileId}는 ${d.id}에 적용할 수 없음`);
  for (const cap of d.capabilityRequests) {
    if (!policy.allowedCapabilities.includes(cap) || !profile.capabilities.includes(cap)) fail('CapabilityNotAllowed', 8, cap);
  }
  for (const c of cc.commands) if (!profile.allowedEffects.includes(c.effect)) fail('EffectPolicyViolation', 8, `${c.id}: profile이 허용하지 않는 effect ${c.effect}`);
  // 로그인 없이 보이는 화면은 선언만으로 되지 않는다. 정책·profile이 허용한 capability로 요청해야 한다.
  if (isUi(cls) && d.ui.access === 'public' && !d.capabilityRequests.includes(UI_PUBLIC_CAPABILITY)) fail('CapabilityNotAllowed', 8, `public 화면은 ${UI_PUBLIC_CAPABILITY} 필요`);

  // 9. 의존 범위 · Backbone 호환
  if (!caretOk(d.backboneCompat, ctx.backboneContract)) fail('BackboneIncompatible', 9, `Backbone 계약 ${ctx.backboneContract}는 ${d.backboneCompat} 밖`);
  for (const dep of d.dependencies) {
    const lock = ctx.dependencyLock.find((l) => l.module === dep.module);
    if (!lock) { if (dep.kind === 'required') fail('DependencyUnresolved', 9, `${dep.module} 잠금 없음`); else continue; }
    if (!caretOk(dep.range, lock.compatibilityVersion)) fail('DependencyUnresolved', 9, `${dep.module} ${lock.compatibilityVersion}는 ${dep.range} 밖`);
  }

  const verdict = {
    schema: 'opensphere.osr-verdict/v1', module: d.id, version: d.version, bundleDigest: r.bundleDigest,
    level: 'formal', result: 'pass',
    context: { snapshotDigest: digest(ctx), trustGeneration: ctx.trustGeneration, policyRevision: ctx.policyRevision, profileFingerprint: entry.fingerprint },
    evaluatedAt: input.evaluationTime,
  };
  const vErr = validateAgainst('verdict', verdict);
  if (vErr.length) throw new Error('참조 검증기 내부 오류: ' + vErr.join('; '));
  return { result: 'pass', output: { verdict } };
});

// ---------- 어셈블리 실질 판정(10단계 대체)과 판정 재사용 ----------
export const verifyAssemblySubstantive = guard((input) => {
  const ctx = checkContext(input);
  const { registration, definition, members, request, priorVerdict } = input;
  const context = {
    snapshotDigest: digest(ctx), trustGeneration: ctx.trustGeneration, policyRevision: ctx.policyRevision,
    definitionDigest: registration.definitionDigest, definitionGeneration: registration.generation,
  };
  if (request === 'reuse') {
    // 같은 맥락에서만 이전 판정을 다시 쓴다.
    if (!priorVerdict || !same(priorVerdict.context, context)) fail('VerdictContextChanged', 10, '정의 digest·generation 또는 신뢰 맥락이 바뀜 — 재판정 필요');
    return { result: 'pass', output: { verdict: priorVerdict, reused: true } };
  }
  if (validateAgainst('assembly-definition', definition).length) fail('DescriptorInvalid', 10, '정의 형식 오류');
  if (digest(definition) !== registration.definitionDigest || definition.module !== registration.module) fail('DefinitionDigestMismatch', 10, '등록된 정의와 다름');
  for (const mem of definition.members.filter((x) => x.required)) {
    const st = members.find((x) => x.module === mem.module);
    if (!st || st.state !== 'substantive' || st.composable !== true) fail('DependencyNotSubstantive', 10, `${mem.module}: ${st ? st.state : '설치본 없음'}`);
    const lock = ctx.dependencyLock.find((l) => l.module === mem.module);
    if (!lock || lock.bundleDigest !== st.bundleDigest || lock.generation !== st.generation) fail('DependencyBindingMismatch', 10, `${mem.module}: 잠금과 다른 설치본`);
  }
  const verdict = {
    schema: 'opensphere.osr-verdict/v1', module: registration.module, version: registration.version,
    bundleDigest: registration.bundleDigest, level: 'substantive', result: 'pass', context, evaluatedAt: input.evaluationTime,
  };
  const vErr = validateAgainst('verdict', verdict);
  if (vErr.length) throw new Error('참조 검증기 내부 오류: ' + vErr.join('; '));
  return { result: 'pass', output: { verdict } };
});

// ---------- 채널 카탈로그 ----------
function catalogCheck(ctx, env, state, now) {
  if (validateAgainst('signed-envelope', env).length || validateAgainst('channel-catalog', env.payload).length) fail('CatalogSignatureInvalid', 'catalog', '카탈로그 형식');
  const c = env.payload;
  const key = ctx.keys.find((k) => k.keyId === env.signature.keyId);
  if (!key) fail('UnknownTrustKey', 'catalog', env.signature.keyId);
  if (key.revokedAtGeneration != null && key.revokedAtGeneration <= ctx.trustGeneration) fail('TrustGenerationStale', 'catalog', key.keyId);
  if (key.purpose !== 'catalog' || !key.scope.channels?.includes(c.channel) || c.authority !== ctx.authority) fail('CatalogScopeViolation', 'catalog', `${key.keyId}·${c.authority}·${c.channel}`);
  if (!verifyEnvelope(env, key.publicKeyJwk)) fail('CatalogSignatureInvalid', 'catalog', '서명값 불일치');
  if (!within(now, c.issuedAt, c.expiresAt)) fail('CatalogExpired', 'catalog', c.expiresAt);
  const k = (x) => x.authority === c.authority && x.channel === c.channel;
  const marks = [...ctx.channelSequences.filter(k), ...(state?.lastAccepted || []).filter(k)];
  const top = marks.reduce((a, b) => (!a || b.sequence > a.sequence ? b : a), null);
  const d = digest(c);
  if (top && c.sequence < top.sequence) fail('CatalogReplay', 'catalog', `${c.sequence} < ${top.sequence}`);
  if (top && c.sequence === top.sequence && d !== top.digest) fail('CatalogEquivocation', 'catalog', `sequence ${c.sequence}에 다른 digest`);
  return { authority: c.authority, channel: c.channel, sequence: c.sequence, digest: d, unchanged: !!top && c.sequence === top.sequence };
}

export const verifyCatalog = guard((input) => {
  const ctx = checkContext(input);
  const accepted = catalogCheck(ctx, input.catalog, input.state, ms(input.evaluationTime));
  return { result: 'pass', output: { accepted } };
});

// ---------- 제한 실행부: 승인 바인딩 ----------
export const verifyExecution = guard((input) => {
  const ctx = checkContext(input);
  const { approvedPlan, approval, request, receipts = [], currentFence } = input;
  for (const [n, p] of [['승인 계획', approvedPlan], ['실행 요청', request]]) {
    const e = validateAgainst('install-plan', p);
    if (e.length) fail('PlanInvalid', 'execute', `${n}: ${e.join('; ')}`);
  }
  if (validateAgainst('install-plan', approval, 'approval').length || approval.decision !== 'approved' || approval.planDigest !== digest(approvedPlan)) fail('ApprovalBindingInvalid', 'execute', '승인 기록이 계획에 묶이지 않음');
  const reqDigest = digest(request);
  const prior = receipts.find((x) => x.installationId === request.installationId && x.planRevision === request.planRevision);
  if (prior) {
    if (prior.planDigest === reqDigest) return { result: 'replay', output: { receipt: prior } };
    fail('IdempotencyConflict', 'execute', `planRevision ${request.planRevision}에 다른 계획`);
  }
  if (request.executionPlanDigest !== digest(request.executionPlan)) fail('ExecutionPlanMismatch', 'execute', 'executionPlanDigest 재계산 불일치');
  if (!same(request.setupArtifact, approvedPlan.setupArtifact)) fail('SetupArtifactMismatch', 'execute', '승인한 Setup 산출물과 다름');
  if (!same(request.profile, approvedPlan.profile)) fail('ProfileFingerprintMismatch', 'execute', '승인한 profile 판·지문과 다름');
  const ctxProfile = ctx.profiles.find((p) => p.id === request.profile.id);
  if (!ctxProfile || ctxProfile.version !== request.profile.version || ctxProfile.fingerprint !== request.profile.fingerprint) fail('ProfileFingerprintMismatch', 'execute', '현재 검증 맥락의 profile과 다름');
  if (!same(request.dependencies, approvedPlan.dependencies)) fail('DependencyBindingMismatch', 'execute', '승인한 의존 digest·generation과 다름');
  if (request.executionPlanDigest !== approvedPlan.executionPlanDigest) fail('ExecutionPlanMismatch', 'execute', '승인한 실행 계획(자원·권한·저장)과 다름');
  if (reqDigest !== approval.planDigest) fail('PlanNotApproved', 'execute', '그 밖의 필드가 승인 계획과 다름');
  if (request.policyRevision !== ctx.policyRevision || request.trustGeneration !== ctx.trustGeneration) fail('PolicyRevisionChanged', 'execute', '승인 이후 정책 revision·신뢰 세대가 바뀜');
  if (currentFence !== request.target.fence) fail('TargetFenceStale', 'execute', `fence ${request.target.fence} ≠ 현재 ${currentFence}`);
  const receipt = {
    schema: 'opensphere.osr-execution-receipt/v1', installationId: request.installationId, planRevision: request.planRevision,
    planDigest: reqDigest, bundleDigest: request.bundleDigest, setupArtifactDigest: request.setupArtifact.digest,
    profileFingerprint: request.profile.fingerprint, executionPlanDigest: request.executionPlanDigest,
    fence: currentFence, outcome: 'Accepted', executedAt: input.evaluationTime,
  };
  const rErr = validateAgainst('execution-receipt', receipt);
  if (rErr.length) throw new Error('참조 검증기 내부 오류: ' + rErr.join('; '));
  return { result: 'pass', output: { receipt } };
});

// ---------- 새 설치와 독립 복구 ----------
export const RECOVERY_REQUEST_TTL_MS = 60 * 60 * 1000;
const OVERRIDES = ['ignoreExpiry', 'resetSequence', 'skipSignature', 'skipCatalog'];
export const verifyRecovery = guard((input) => {
  const now = ms(input.evaluationTime);
  if (input.mode === 'new-install') {
    // 새 설치는 언제나 현재 신뢰 맥락과 유효한 카탈로그가 필요하다.
    const ctx = checkContext(input);
    catalogCheck(ctx, input.offline.catalog, input.state, now);
    return { result: 'pass', output: { mode: 'new-install' } };
  }
  // 독립 복구: OSR·Core 없이 설치 기록 + 복구 자격 + 고정 번들로만.
  const used = OVERRIDES.filter((o) => input.options?.[o] !== undefined);
  if (used.length) fail('RecoveryOverrideNotSupported', 'recover', used.join(', '));
  const rec = input.installRecord;
  if (validateAgainst('installation-record', rec).length) fail('RecoveryRecordInvalid', 'recover', '설치 기록 형식');
  const cred = input.credential;
  if (!cred) fail('RecoveryCredentialMissing', 'recover', '복구 자격 없음');
  if (validateAgainst('signed-envelope', cred).length || validateAgainst('recovery-request', cred.payload).length) fail('RecoveryCredentialInvalid', 'recover', '복구 요청 형식');
  if (cred.signature.keyId !== rec.recoveryKey.keyId || !verifyEnvelope(cred, rec.recoveryKey.publicKeyJwk)) fail('RecoveryCredentialInvalid', 'recover', '설치 기록의 복구 키로 서명되지 않음');
  if (cred.payload.installationId !== rec.installationId) fail('RecoveryCredentialInvalid', 'recover', '다른 설치본의 복구 자격');
  const age = now - ms(cred.payload.requestedAt);
  if (age < 0 || age > RECOVERY_REQUEST_TTL_MS) fail('RecoveryCredentialInvalid', 'recover', '복구 요청 시각이 허용 창(1시간) 밖 — 재사용 방지');
  const off = input.offline;
  if (digest(off.index) !== off.bundleDigest || off.bundleDigest !== rec.bundleDigest || cred.payload.bundleDigest !== rec.bundleDigest) fail('RecoveryBundleMismatch', 'recover', 'offline 번들이 설치 기록의 고정 digest와 다름');
  const catalogExpired = !within(now, off.catalog.payload.issuedAt, off.catalog.payload.expiresAt);
  const signatureExpired = !within(now, off.signature.payload.issuedAt, off.signature.payload.expiresAt);
  return {
    result: 'pass',
    output: {
      mode: 'recovery', installationId: rec.installationId, bundleDigest: rec.bundleDigest,
      allowedOperations: ['recover'], executor: 'backbone-restricted-executor', profileFingerprint: rec.profileFingerprint,
      expiry: { catalogExpired, signatureExpired, ignored: false, newInstallBlocked: catalogExpired || signatureExpired },
    },
  };
});

// ---------- 유효 권한: capability ∩ 호출자 ∩ scope ∩ Owner 검사 ----------
// 명령 계약이 무엇을 선언했든 부여 근거가 되지 않는다. 쓰기(effect mutation·destructive)는 허용이어도 Execution Core 승인 경로로 보낸다.
export const verifyPermission = guard((input) => {
  const ctx = checkContext(input);
  const now = ms(input.evaluationTime);
  const { installation, command, caller, target, ownerCheck } = input;
  const profileEntry = ctx.profiles.find((p) => p.id === installation.profile.id);
  const profile = (input.profiles || []).find((p) => p.id === installation.profile.id && p.version === installation.profile.version);
  if (!profileEntry || !profile || digest(profile) !== profileEntry.fingerprint || profileEntry.fingerprint !== installation.profile.fingerprint) fail('ProfileFingerprintMismatch', 'permission', '설치본 profile이 현재 검증 맥락과 다름');
  const policy = ctx.policies[installation.class] || { allowedCapabilities: [] };
  // ① 플랫폼이 이 모듈·profile에 허용한 capability
  const granted = installation.capabilityRequests.filter((c) => policy.allowedCapabilities.includes(c) && profile.capabilities.includes(c));
  const beyond = command.requiredPermissions.filter((x) => !granted.includes(x));
  if (beyond.length) fail('CapabilityNotGranted', 'permission', `플랫폼이 부여하지 않은 권한: ${beyond.join(', ')}`);
  // ② 호출자의 현재 권한과 위임 범위
  const lacking = command.requiredPermissions.filter((x) => !caller.permissions.includes(x));
  if (lacking.length) fail('CallerPermissionMissing', 'permission', lacking.join(', '));
  if (caller.delegation) {
    if (!within(now, caller.delegation.issuedAt, caller.delegation.expiresAt)) fail('DelegationExpired', 'permission', caller.delegation.expiresAt);
    if (!caller.delegation.installations.includes(installation.installationId)) fail('ScopeMismatch', 'permission', '위임 범위 밖 설치본');
  }
  // ③ 대상·설치본 scope
  if (target.installationId !== installation.installationId || target.namespace !== installation.namespace) fail('ScopeMismatch', 'permission', '대상이 이 설치본이 아님');
  const writes = command.effect === 'mutation' || command.effect === 'destructive';
  if (writes && installation.state !== 'substantive') fail('ScopeMismatch', 'permission', `쓰기는 실질 상태 설치본만(${installation.state})`);
  // ④ Owner의 최종 검사
  if (ownerCheck !== 'allow') fail('OwnerDenied', 'permission', 'Owner 최종 검사 거절');
  return { result: 'pass', output: { decision: 'allow', route: writes ? 'execution-core-approval' : 'direct', granted } };
});

// ---------- canonical JSON 벡터 ----------
export const verifyCanonical = guard((input) => {
  let text;
  try { text = canonicalize(input.value); } catch (e) { if (e instanceof CanonicalError) fail('CanonicalizationError', 'canonical', e.message); throw e; }
  return { result: 'pass', output: { canonical: text, digest: digest(input.value) } };
});

export const VERIFIERS = {
  permission: verifyPermission,
  canonical: verifyCanonical,
  release: verifyRelease,
  'assembly-substantive': verifyAssemblySubstantive,
  catalog: verifyCatalog,
  execution: verifyExecution,
  recovery: verifyRecovery,
};
// shared: 벡터 파일의 공통 신뢰 입력(trustAnchor·context·profiles). 벡터 input이 같은 키를 주면 그쪽이 우선한다.
export const run = (vector, shared = {}) => VERIFIERS[vector.kind]({ ...shared, ...vector.input });
