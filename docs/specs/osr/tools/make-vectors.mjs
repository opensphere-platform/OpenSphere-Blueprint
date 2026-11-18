// OSR 시험 벡터 생성기. 실행할 때마다 일회용 P-256 키를 새로 만든다.
// 개인 키는 파일로 남기지 않는다. 벡터에는 공개 키만 들어간다.
// 사용: node tools/make-vectors.mjs  →  vectors/*.json
import {
  canonicalize, digest, digestHex, sha256hex, generateKey, signEnvelope, readJson, writeJson,
} from './lib.mjs';
import { ASSEMBLY_LIFECYCLE, UI_LIFECYCLE, UI_STATIC_MEDIA_TYPE } from './verify.mjs';

const NOW = '2026-11-18T00:00:00Z';
const PAST = '2026-11-17T00:00:00Z';
const ISSUED = '2026-11-10T00:00:00Z';
const LATER = '2026-12-18T00:00:00Z';
const AUTHORITY = 'osr.opensphere-platform';
const BUILDER = 'https://github.com/opensphere-platform/osr-builder/.github/workflows/release.yml@refs/heads/main';
const REV = 'a'.repeat(40);
const fake = (label) => digest({ fixture: label });
const clone = (x) => structuredClone(x);

// ---------- 일회용 키 ----------
const K = Object.fromEntries(['anchor', 'release', 'uiOnly', 'revoked', 'catalog', 'stranger', 'module', 'wrongAnchor', 'recovery', 'otherRecovery']
  .map((n) => [n, generateKey()]));
const trustAnchor = { keyId: 'osr-anchor-test', publicKeyJwk: K.anchor.publicKeyJwk };

const profiles = [readJson('profiles/provider.stackgres-pg.json'), readJson('profiles/assembly.definition.json'), readJson('profiles/ui.console-static.json')];
const [pgProfile, asmProfile] = profiles;

// ---------- 검증 맥락 snapshot ----------
const LOCK = ['hiss.storage', 'provider.postgres', 'provider.samba-ad', 'engine.mail'].map((module) => ({
  module, compatibilityVersion: '1.2.0', bundleDigest: fake(`bundle:${module}`), generation: 3,
}));
function baseSnapshot() {
  return {
    schema: 'opensphere.osr-context/v1',
    authority: AUTHORITY, issuedAt: ISSUED, expiresAt: LATER,
    trustGeneration: 7, policyRevision: 'pol-2026-11-18.1', backboneContract: '1.4.0',
    keys: [
      { keyId: 'release-test', purpose: 'release', scope: { classes: ['hiss', 'provider', 'engine', 'assembly'] }, publicKeyJwk: K.release.publicKeyJwk, addedAtGeneration: 5 },
      { keyId: 'release-ui-test', purpose: 'release', scope: { classes: ['ui'] }, publicKeyJwk: K.uiOnly.publicKeyJwk, addedAtGeneration: 5 },
      { keyId: 'release-revoked-test', purpose: 'release', scope: { classes: ['provider'] }, publicKeyJwk: K.revoked.publicKeyJwk, addedAtGeneration: 2, revokedAtGeneration: 6 },
      { keyId: 'catalog-test', purpose: 'catalog', scope: { channels: ['stable', 'candidate'] }, publicKeyJwk: K.catalog.publicKeyJwk, addedAtGeneration: 5 },
    ],
    profiles: profiles.map((p) => ({ id: p.id, version: p.version, fingerprint: digest(p) })),
    policies: {
      provider: { allowedCapabilities: ['db.instance.manage', 'db.backup.manage', 'db.connection.issue', 'storage.claim.bind'], allowedEffects: ['none', 'read-cost', 'mutation', 'destructive'] },
      assembly: { allowedCapabilities: ['osr.definition.read'], allowedEffects: ['none', 'read-cost'] },
      ui: { allowedCapabilities: ['console.ui.serve', 'console.ui.read', 'console.ui.public'], allowedEffects: ['none', 'read-cost'] },
    },
    trustedBuilders: [BUILDER],
    dependencyLock: LOCK,
    channelSequences: [{ authority: AUTHORITY, channel: 'stable', sequence: 40, digest: fake('catalog:stable:40') }],
  };
}
const signCtx = (payload, key = K.anchor, keyId = trustAnchor.keyId) => signEnvelope(payload, keyId, key.privateKey);
const CONTEXT = signCtx(baseSnapshot());

// ---------- 모듈 fixture ----------
function command(moduleId, verb, kind, effect, extra = {}) {
  const mutation = effect === 'mutation' || effect === 'destructive';
  return {
    id: `${moduleId}.${verb}`, description: `${moduleId} ${verb} 명령(시험 fixture)`, kind, mutation,
    arguments: { type: 'object', properties: {}, additionalProperties: false },
    scope: moduleId.startsWith('assembly.') ? 'definition' : 'installation',
    idempotency: mutation ? 'request-id' : 'none',
    requiredPermissions: [moduleId.startsWith('assembly.') ? 'osr.definition.read' : 'db.instance.manage'],
    output: { type: 'object' }, effect,
    ...(mutation ? { statusCommand: `${moduleId}.status`, review: { reason: `${verb}은 설치본 상태를 바꾸므로 Execution Core 승인을 거친다.` } } : {}),
    ...extra,
  };
}
function manual(moduleId, plane, types) {
  return {
    schema: 'opensphere.manual-bundle/v1', module: moduleId,
    documents: types.map((t) => {
      const content = `# ${moduleId} ${t}\n시험 fixture 문서.`;
      return {
        sourceId: `manual:${moduleId}:${t}`, version: '26.1118.0900.1', sourcePath: `docs/${t}.md`, documentType: t,
        authorityTier: 2, audience: ['operator'], plane, module: moduleId, tags: [t],
        checksum: 'sha256:' + sha256hex(content), content,
      };
    }),
  };
}
function knowledge(moduleId, repo) {
  return {
    schema: 'opensphere.knowledge-bundle/v1', module: moduleId,
    documents: ['overview', 'operations'].map((t) => {
      const content = `${moduleId} ${t} 요약(시험 fixture).`;
      return {
        id: `knowledge:${moduleId}:${t}`, module: moduleId, kind: 'ReleaseDocumentation', repository: repo,
        path: `docs/${t}.md`, sourceRevision: REV, sha256: sha256hex(content), license: 'Apache-2.0', language: 'ko',
        content, source: { part: 'manual', digest: 'sha256:' + '0'.repeat(64) }, // 생성 때 manual digest로 채운다
      };
    }),
  };
}
const contributions = (withDefinition, withStatic) => ({
  manual: { enabled: true, artifact: 'manual' }, commands: { enabled: true, artifact: 'commands' },
  oci: { enabled: true }, knowledge: { enabled: true, artifact: 'knowledge' },
  ...(withDefinition ? { definition: { enabled: true, artifact: 'definition' } } : {}),
  ...(withStatic ? { static: { enabled: true, artifact: 'static' } } : {}),
});

const PG = 'provider.postgres';
const PG_REPO_SRC = 'https://github.com/opensphere-platform/opensphere-provider-postgres';
const postgresParts = () => ({
  descriptor: {
    schema: 'opensphere.module/v1', id: PG, class: 'provider', displayName: 'PostgreSQL', owner: 'opensphere-platform/fabric',
    description: 'StackGres로 PostgreSQL 클러스터를 공급하는 Provider', version: '26.1118.0900.1', compatibilityVersion: '1.2.0',
    plane: 'fabric-shared', backboneCompat: '^1.0.0',
    dependencies: [{ module: 'hiss.storage', range: '^1.0.0', kind: 'required' }],
    profile: 'provider.stackgres-pg',
    capabilityRequests: ['db.instance.manage', 'db.backup.manage', 'db.connection.issue', 'storage.claim.bind'],
    runtime: {
      images: [{ name: 'postgres', digest: fake('image:postgres-16') }],
      health: { path: '/healthz' }, ready: { path: '/readyz' }, resources: { cpu: '1', memory: '2Gi' },
      securityContext: { runAsNonRoot: true, readOnlyRootFilesystem: true },
    },
    storage: { profile: 'foundation.block-rwo' },
    contributions: contributions(false),
    supplyChain: { sourceRepository: PG_REPO_SRC, sourceRevision: REV, buildAuthority: 'opensphere-platform/osr-builder' },
    lifecycle: { install: `${PG}.apply`, update: `${PG}.apply`, rollback: `${PG}.rollback`, retire: `${PG}.retire` },
  },
  manual: manual(PG, 'fabric-shared', ['overview', 'install', 'operations', 'troubleshooting', 'commands']),
  commands: {
    schema: 'opensphere.owner-commands/v4', module: PG, ownerBinding: 'module-owner',
    commands: [
      command(PG, 'status', 'read', 'none'), command(PG, 'inspect', 'read', 'none'), command(PG, 'plan', 'plan', 'read-cost'),
      command(PG, 'apply', 'apply', 'mutation'), command(PG, 'verify', 'verify', 'read-cost'), command(PG, 'operation', 'discover', 'none'),
      command(PG, 'rollback', 'compensate', 'mutation'), command(PG, 'retire', 'apply', 'destructive'),
    ],
  },
  knowledge: knowledge(PG, PG_REPO_SRC),
});

const MAIL = 'assembly.mail';
const MAIL_REPO_SRC = 'https://github.com/opensphere-platform/opensphere-assembly-mail';
const mailDefinition = () => ({
  schema: 'opensphere.assembly-definition/v1', module: MAIL,
  members: [
    { module: 'provider.postgres', role: '메일 메타데이터 저장', required: true },
    { module: 'provider.samba-ad', role: '사용자 디렉터리', required: true },
    { module: 'engine.mail', role: '메일 송수신 엔진', required: true },
  ],
  resourceTypes: ['MailDomain', 'Mailbox'],
  composition: { claims: [{ member: 'provider.postgres', claim: 'Database' }, { member: 'provider.samba-ad', claim: 'DirectoryOU' }] },
});
const mailParts = () => ({
  descriptor: {
    schema: 'opensphere.module/v1', id: MAIL, class: 'assembly', displayName: '메일 어셈블리', owner: 'opensphere-platform/catalog',
    description: '메일 서비스를 구성하는 실행하지 않는 정의', version: '26.1118.0900.1', compatibilityVersion: '1.0.0',
    plane: 'catalog', backboneCompat: '^1.0.0',
    dependencies: mailDefinition().members.map((m) => ({ module: m.module, range: '^1.0.0', kind: 'required' })),
    profile: 'assembly.definition',
    capabilityRequests: ['osr.definition.read'],
    contributions: contributions(true),
    supplyChain: { sourceRepository: MAIL_REPO_SRC, sourceRevision: REV, buildAuthority: 'opensphere-platform/osr-builder' },
    lifecycle: { ...ASSEMBLY_LIFECYCLE },
  },
  manual: manual(MAIL, 'catalog', ['overview', 'composition', 'operations', 'troubleshooting', 'commands']),
  commands: {
    schema: 'opensphere.owner-commands/v4', module: MAIL, ownerBinding: 'osr.definition-owner',
    commands: [command(MAIL, 'status', 'read', 'none'), command(MAIL, 'inspect', 'read', 'none'), command(MAIL, 'verify', 'verify', 'read-cost')],
  },
  knowledge: knowledge(MAIL, MAIL_REPO_SRC),
  definition: mailDefinition(),
});

// ui: 실행하지 않는 정적 화면 모듈. static은 JSON이 아닌 layer라 벡터에는 digest·크기만 싣는다($opaque).
const UI = 'ui.dummy-screens';
const UI_REPO_SRC = 'https://github.com/opensphere-platform/opensphere-ui-dummy-screens';
const UI_FILES = [
  ['index.html', 'text/html; charset=utf-8', '<!doctype html><title>더미 화면</title>'],
  ['main.js', 'text/javascript', 'console.log("dummy")'],
  ['styles.css', 'text/css', 'body{margin:0}'],
  ['assets/logo.svg', 'image/svg+xml', '<svg xmlns="http://www.w3.org/2000/svg"/>'],
];
const UI_ARCHIVE = { mediaType: UI_STATIC_MEDIA_TYPE, digest: fake('ui-static-archive'), size: 4096 };
const uiCmd = (verb, kind, effect) => command(UI, verb, kind, effect, { requiredPermissions: ['console.ui.read'] });
const uiParts = () => ({
  descriptor: {
    schema: 'opensphere.module/v1', id: UI, class: 'ui', displayName: '더미 화면 · 템플릿', owner: 'opensphere-platform/console',
    description: '고정 예시 데이터만 보여 주는 템플릿 화면 묶음(백엔드 호출 없음)', version: '26.1118.0900.1', compatibilityVersion: '1.0.0',
    plane: 'shell', backboneCompat: '^1.0.0', dependencies: [],
    profile: 'ui.console-static',
    capabilityRequests: ['console.ui.serve', 'console.ui.read', 'console.ui.public'],
    ui: { artifact: 'static', index: 'static-index', entry: 'index.html', access: 'public', navigation: [{ label: '더미 화면 · 템플릿', path: '#/' }] },
    contributions: contributions(false, true),
    supplyChain: { sourceRepository: UI_REPO_SRC, sourceRevision: REV, buildAuthority: 'opensphere-platform/osr-builder' },
    lifecycle: { ...UI_LIFECYCLE },
  },
  manual: manual(UI, 'shell', ['overview', 'operations', 'troubleshooting', 'commands']),
  commands: {
    schema: 'opensphere.owner-commands/v4', module: UI, ownerBinding: 'osr.ui-host',
    commands: [uiCmd('status', 'read', 'none'), uiCmd('inspect', 'read', 'none'), uiCmd('verify', 'verify', 'read-cost')],
  },
  knowledge: knowledge(UI, UI_REPO_SRC),
  'static-index': {
    schema: 'opensphere.ui-static-index/v1', module: UI, entry: 'index.html',
    archive: { part: 'static', mediaType: UI_ARCHIVE.mediaType, digest: UI_ARCHIVE.digest, size: UI_ARCHIVE.size },
    files: UI_FILES.map(([path, contentType, content]) => ({ path, sha256: sha256hex(content), size: Buffer.byteLength(content), contentType })),
  },
  static: { $opaque: { ...UI_ARCHIVE } },
});

// ---------- 릴리스 조립 ----------
const SIGNERS = {
  release: ['release-test', K.release], uiOnly: ['release-ui-test', K.uiOnly], revoked: ['release-revoked-test', K.revoked],
  stranger: ['release-stranger-test', K.stranger], module: ['module-supplied-test', K.module],
};
function buildRelease(makeParts, h = {}) {
  const parts = makeParts();
  h.parts?.(parts);
  if (parts.knowledge && parts.manual) for (const doc of parts.knowledge.documents) doc.source.digest = digest(parts.manual);
  h.afterKnowledge?.(parts);
  const d = parts.descriptor;
  const repository = h.repository ?? `ghcr.io/opensphere-platform/opensphere-${d.class}-${d.id.split('.')[1]}`;
  const names = Object.keys(parts);
  // $opaque: JSON이 아닌 layer. 인덱스에 digest·크기만 올리고 blob은 싣지 않는다.
  const partDigest = (n) => parts[n].$opaque?.digest ?? digest(parts[n]);
  const index = {
    schemaVersion: 2, mediaType: 'application/vnd.oci.image.index.v1+json', artifactType: 'application/vnd.opensphere.module.v1+json',
    manifests: names.map((n) => (parts[n].$opaque
      ? { mediaType: parts[n].$opaque.mediaType, digest: parts[n].$opaque.digest, size: parts[n].$opaque.size, annotations: { 'io.opensphere.part': n } }
      : { mediaType: `application/vnd.opensphere.${n}.v1+json`, digest: digest(parts[n]), annotations: { 'io.opensphere.part': n } })),
  };
  const blobs = Object.fromEntries(names.filter((n) => !parts[n].$opaque).map((n) => [digest(parts[n]), parts[n]]));
  const bundleDigest = digest(index);
  const subject = [{ name: repository, digest: { sha256: digestHex(bundleDigest) } }];
  const sbom = {
    _type: 'https://in-toto.io/Statement/v1', subject: clone(subject), predicateType: 'https://spdx.dev/Document/v2.3',
    predicate: { spdxVersion: 'SPDX-2.3', name: `${d.id}-${d.version}`, packages: [{ name: d.id, versionInfo: d.version }] },
  };
  const provenance = {
    _type: 'https://in-toto.io/Statement/v1', subject: clone(subject), predicateType: 'https://slsa.dev/provenance/v1',
    predicate: {
      buildDefinition: { buildType: 'https://opensphere-platform.github.io/osr-builder/v1', externalParameters: { repository: d.supplyChain.sourceRepository, revision: REV } },
      runDetails: { builder: { id: BUILDER } },
    },
  };
  h.sbom?.(sbom); h.provenance?.(provenance);
  const [keyId, key] = SIGNERS[h.signer ?? 'release'];
  const payload = {
    schema: 'opensphere.release-signature/v1', subject: { repository, bundleDigest },
    module: { id: d.id, class: d.class, version: d.version }, descriptorDigest: digest(parts.descriptor),
    artifacts: names.map((n) => ({ part: n, digest: partDigest(n) })),
    evidence: { sbom: digest(sbom), provenance: digest(provenance) },
    keyId, issuedAt: ISSUED, expiresAt: LATER,
  };
  h.payload?.(payload);
  const release = { repository, bundleDigest, index, blobs, referrers: { signature: signEnvelope(payload, keyId, key.privateKey), sbom, provenance } };
  h.after?.(release);
  return release;
}
const releaseVector = (id, title, expect, makeParts, h = {}, ctx = CONTEXT) => ({
  id, kind: 'release', title, evaluationTime: NOW,
  input: { evaluationTime: NOW, trustAnchor, context: ctx, profiles, release: buildRelease(makeParts, h) },
  expect,
});
const pass = { result: 'pass' };
const rej = (code, step) => ({ result: 'reject', code, step });
const blobOf = (rel, part) => rel.blobs[rel.index.manifests.find((m) => m.annotations['io.opensphere.part'] === part).digest];

// ---------- 릴리스 벡터(provider.postgres) ----------
const release = [
  releaseVector('R01', 'provider.postgres 정상 릴리스는 형식 판정을 통과한다', pass, postgresParts),
  releaseVector('R02', 'opensphere-platform 밖 저장소는 거절', rej('RepositoryNameInvalid', 1), postgresParts, { repository: 'ghcr.io/someone/opensphere-provider-postgres' }),
  releaseVector('R03', '번들 digest 형식 오류는 거절', rej('InvalidDigest', 2), postgresParts, { after: (r) => { r.bundleDigest = 'sha256:abc'; } }),
  releaseVector('R04', '검증 맥락에 없는 키의 서명은 거절', rej('UnknownTrustKey', 3), postgresParts, { signer: 'stranger' }),
  releaseVector('R05', 'ui 클래스 전용 키로 provider에 서명하면 거절', rej('KeyScopeViolation', 3), postgresParts, { signer: 'uiOnly' }),
  releaseVector('R06', '서명값 변조는 거절', rej('SignatureInvalid', 3), postgresParts, {
    after: (r) => { const v = r.referrers.signature.signature.value; r.referrers.signature.signature.value = (v[0] === 'A' ? 'B' : 'A') + v.slice(1); },
  }),
  releaseVector('R07', '서명 유효기간이 지나면 거절', rej('SignatureExpired', 4), postgresParts, { payload: (p) => { p.expiresAt = PAST; } }),
  releaseVector('R08', '현재 신뢰 세대에서 회수된 키는 거절', rej('TrustGenerationStale', 3), postgresParts, { signer: 'revoked' }),
  releaseVector('R09', 'runtime 없는 provider는 클래스 규칙 위반', rej('ClassRuleViolation', 5), postgresParts, { parts: (p) => { delete p.descriptor.runtime; } }),
  releaseVector('R10', '서명 뒤 기여 artifact 내용이 바뀌면 거절', rej('ArtifactDigestMismatch', 6), postgresParts, {
    after: (r) => { blobOf(r, 'manual').documents[0].content += '\n변조'; },
  }),
  releaseVector('R11', '서명 뒤 SBOM을 바꿔 끼우면 거절(같은 subject여도)', rej('SupplyChainEvidenceMismatch', 6), postgresParts, {
    after: (r) => { r.referrers.sbom = clone(r.referrers.sbom); r.referrers.sbom.predicate.packages.push({ name: 'injected', versionInfo: '0' }); },
  }),
  releaseVector('R12', '신뢰 builder가 아닌 출처는 서명돼 있어도 거절', rej('ProvenanceBuilderUntrusted', 6), postgresParts, {
    provenance: (p) => { p.predicate.runDetails.builder.id = 'https://github.com/someone/fork/.github/workflows/release.yml@refs/heads/main'; },
  }),
  releaseVector('R13', '다른 번들을 가리키는 SBOM은 서명돼 있어도 거절', rej('SupplyChainSubjectMismatch', 6), postgresParts, {
    sbom: (s) => { s.subject[0].digest.sha256 = '1'.repeat(64); },
  }),
  releaseVector('R14', 'install 문서가 없는 매뉴얼은 거절', rej('ManualMissing', 7), postgresParts, {
    parts: (p) => { p.manual.documents = p.manual.documents.filter((x) => x.documentType !== 'install'); },
  }),
  releaseVector('R15', 'effect 필드가 없는 명령 계약은 거절', rej('CommandContractInvalid', 7), postgresParts, { parts: (p) => { delete p.commands.commands[0].effect; } }),
  releaseVector('R16', '표준 명령 verify가 없으면 거절', rej('StandardCommandMissing', 7), postgresParts, {
    parts: (p) => { p.commands.commands = p.commands.commands.filter((c) => !c.id.endsWith('.verify')); },
  }),
  releaseVector('R17', 'read 명령이 effect를 mutation으로 적으면 거절(제출 effect를 믿지 않음)', rej('EffectPolicyViolation', 7), postgresParts, {
    parts: (p) => { p.commands.commands[0].effect = 'mutation'; },
  }),
  releaseVector('R18', '지식 문서의 출처 digest가 같은 릴리스 artifact와 다르면 거절', rej('KnowledgeProvenanceInvalid', 7), postgresParts, {
    afterKnowledge: (p) => { p.knowledge.documents[0].source.digest = fake('other-manual'); },
  }),
  releaseVector('R19', '정책에 없는 capability 요청은 거절', rej('CapabilityNotAllowed', 8), postgresParts, { parts: (p) => { p.descriptor.capabilityRequests.push('cluster.rbac.admin'); } }),
  releaseVector('R20', '검증 맥락에 없는 profile(statefulset-pg)은 거절', rej('ProfileUnknown', 8), postgresParts, { parts: (p) => { p.descriptor.profile = 'provider.statefulset-pg'; } }),
  releaseVector('R21', '잠금에 없는 필수 의존은 거절', rej('DependencyUnresolved', 9), postgresParts, {
    parts: (p) => { p.descriptor.dependencies.push({ module: 'provider.unknown', range: '^1.0.0', kind: 'required' }); },
  }),
  releaseVector('R22', '번들이 자기 공개 키를 함께 실어도 그 키는 신뢰하지 않는다', rej('UnknownTrustKey', 3), postgresParts, {
    signer: 'module',
    parts: (p) => { p.keys = { keyId: 'module-supplied-test', purpose: 'release', publicKeyJwk: K.module.publicKeyJwk }; },
  }),
  releaseVector('R23', 'trust anchor가 아닌 키로 서명한 검증 맥락은 거절', rej('ContextSnapshotInvalid', 0), postgresParts, {}, signCtx(baseSnapshot(), K.wrongAnchor)),
  releaseVector('R24', '만료된 검증 맥락은 거절', rej('ContextSnapshotExpired', 0), postgresParts, {}, signCtx({ ...baseSnapshot(), expiresAt: PAST })),
  releaseVector('R26', '요구하는 Backbone 계약 범위 밖이면 거절', rej('BackboneIncompatible', 9), postgresParts, { parts: (p) => { p.descriptor.backboneCompat = '^2.0.0'; } }),
  releaseVector('R27', '저장소 이름과 디스크립터 ID가 다르면 거절', rej('ReleaseCoordinatesMismatch', 5), postgresParts, { repository: 'ghcr.io/opensphere-platform/opensphere-provider-mysql' }),
  releaseVector('R28', 'SBOM referrer가 없으면 거절', rej('SupplyChainEvidenceMissing', 6), postgresParts, { after: (r) => { delete r.referrers.sbom; } }),
  releaseVector('R25', '의존 모듈 판이 range 밖이면 거절', rej('DependencyUnresolved', 9), postgresParts, {
    parts: (p) => { p.descriptor.dependencies[0].range = '^2.0.0'; },
  }),
];

// ---------- 정적 화면 모듈 벡터(ui.dummy-screens) ----------
const UIS = { signer: 'uiOnly' };
const ui = [
  releaseVector('U01', '실행물 없는 ui.dummy-screens 정적 화면 모듈은 형식 판정을 통과한다', pass, uiParts, UIS),
  releaseVector('U02', 'ui가 실행 이미지를 요구하면 거절', rej('ClassRuleViolation', 5), uiParts, {
    ...UIS, parts: (p) => { p.descriptor.runtime = { images: [{ name: 'web', digest: fake('image:web') }], health: { path: '/h' }, ready: { path: '/r' }, securityContext: { runAsNonRoot: true } }; },
  }),
  releaseVector('U03', '정적 화면 묶음(static layer)이 없는 ui는 거절', rej('ClassRuleViolation', 5), uiParts, { ...UIS, parts: (p) => { delete p.static; } }),
  releaseVector('U04', 'ui lifecycle을 모듈 자기 명령으로 바꾸면 거절(OSR 고정 명령만)', rej('ClassRuleViolation', 5), uiParts, {
    ...UIS, parts: (p) => { p.descriptor.lifecycle.install = `${UI}.apply`; },
  }),
  releaseVector('U05', '목록이 서명된 static layer와 다른 archive를 가리키면 거절', rej('UiStaticInvalid', 7), uiParts, {
    ...UIS, parts: (p) => { p['static-index'].archive.digest = fake('other-archive'); },
  }),
  releaseVector('U06', '진입 파일이 목록에 없으면 거절', rej('UiStaticInvalid', 7), uiParts, {
    ...UIS, parts: (p) => { p['static-index'].files = p['static-index'].files.filter((f) => f.path !== 'index.html'); },
  }),
  releaseVector('U07', '상위 경로(../)를 담은 목록은 거절', rej('UiStaticInvalid', 7), uiParts, {
    ...UIS, parts: (p) => { p['static-index'].files[1].path = '../outside.js'; },
  }),
  releaseVector('U08', '같은 경로가 두 번 나오는 목록은 거절', rej('UiStaticInvalid', 7), uiParts, {
    ...UIS, parts: (p) => { p['static-index'].files.push({ ...p['static-index'].files[1] }); },
  }),
  releaseVector('U09', 'public 화면인데 console.ui.public을 요청하지 않으면 거절', rej('CapabilityNotAllowed', 8), uiParts, {
    ...UIS, parts: (p) => { p.descriptor.capabilityRequests = ['console.ui.serve', 'console.ui.read']; },
  }),
  releaseVector('U10', 'ui 명령이 상태를 바꾸는 effect를 선언하면 거절', rej('EffectPolicyViolation', 7), uiParts, {
    ...UIS, parts: (p) => { p.commands.commands.push(command(UI, 'apply', 'apply', 'mutation', { requiredPermissions: ['console.ui.read'] })); },
  }),
  releaseVector('U11', 'ui 범위가 없는 릴리스 키로 서명한 ui는 거절', rej('KeyScopeViolation', 3), uiParts, { signer: 'release' }),
  releaseVector('U12', 'provider 번들에 JSON이 아닌 layer를 끼우면 거절', rej('ClassRuleViolation', 5), postgresParts, {
    parts: (p) => { p.payload = { $opaque: { mediaType: 'application/octet-stream', digest: fake('opaque-payload'), size: 10 } }; },
  }),
  releaseVector('U13', 'ownerBinding이 osr.ui-host가 아닌 ui 명령 계약은 거절', rej('CommandContractInvalid', 7), uiParts, {
    ...UIS, parts: (p) => { p.commands.ownerBinding = 'module-owner'; },
  }),
];

// ---------- 어셈블리 벡터(assembly.mail) ----------
const mailRelease = buildRelease(mailParts);
const regBase = () => ({
  module: MAIL, version: '26.1118.0900.1', bundleDigest: mailRelease.bundleDigest,
  definitionDigest: digest(mailDefinition()), generation: 1,
});
const membersOk = () => LOCK.filter((l) => l.module !== 'hiss.storage').map((l) => ({ module: l.module, state: 'substantive', composable: true, bundleDigest: l.bundleDigest, generation: l.generation }));
const asmInput = (extra) => ({ evaluationTime: NOW, trustAnchor, context: CONTEXT, definition: mailDefinition(), registration: regBase(), members: membersOk(), request: 'evaluate', ...extra });
const priorVerdict = {
  schema: 'opensphere.osr-verdict/v1', module: MAIL, version: '26.1118.0900.1', bundleDigest: mailRelease.bundleDigest,
  level: 'substantive', result: 'pass',
  context: { snapshotDigest: digest(CONTEXT.payload), trustGeneration: 7, policyRevision: 'pol-2026-11-18.1', definitionDigest: digest(mailDefinition()), definitionGeneration: 1 },
  evaluatedAt: '2026-11-17T12:00:00Z',
};
const changedDefinition = () => { const d = mailDefinition(); d.resourceTypes.push('MailAlias'); return d; };
const assembly = [
  releaseVector('A01', 'runtime·PVC 없는 assembly.mail은 형식 판정을 통과한다', pass, mailParts),
  releaseVector('A02', '어셈블리가 실행 이미지를 요구하면 거절', rej('ClassRuleViolation', 5), mailParts, {
    parts: (p) => { p.descriptor.runtime = { images: [{ name: 'placeholder', digest: fake('image:placeholder') }], health: { path: '/h' }, ready: { path: '/r' }, securityContext: { runAsNonRoot: true } }; },
  }),
  releaseVector('A03', 'composition 문서가 없는 어셈블리 매뉴얼은 거절', rej('ManualMissing', 7), mailParts, {
    parts: (p) => { p.manual.documents = p.manual.documents.filter((x) => x.documentType !== 'composition'); },
  }),
  { id: 'A04', kind: 'assembly-substantive', title: '멤버가 모두 실질 상태면 어셈블리는 구성 가능(실질 판정 통과)', evaluationTime: NOW, input: asmInput({}), expect: { result: 'pass', step: 10 } },
  {
    id: 'A05', kind: 'assembly-substantive', title: '필수 멤버(engine.mail)가 실질 상태가 아니면 구성 불가', evaluationTime: NOW,
    input: asmInput({ members: membersOk().map((m) => (m.module === 'engine.mail' ? { ...m, state: 'formal', composable: false } : m)) }),
    expect: rej('DependencyNotSubstantive', 10),
  },
  {
    id: 'A06', kind: 'assembly-substantive', title: '정의가 바뀌면(generation 2) 이전 판정을 다시 쓰지 않는다', evaluationTime: NOW,
    input: asmInput({ request: 'reuse', priorVerdict, definition: changedDefinition(), registration: { ...regBase(), definitionDigest: digest(changedDefinition()), generation: 2 } }),
    expect: rej('VerdictContextChanged', 10),
  },
  { id: 'A07', kind: 'assembly-substantive', title: '정의·맥락이 같으면 이전 판정을 다시 쓸 수 있다', evaluationTime: NOW, input: asmInput({ request: 'reuse', priorVerdict }), expect: { result: 'pass', step: 10 } },
];

// ---------- 채널 카탈로그 벡터 ----------
const catalogPayload = (over = {}) => ({
  schema: 'opensphere.channel-catalog/v1', authority: AUTHORITY, channel: 'stable', sequence: 42, issuedAt: ISSUED, expiresAt: LATER,
  entries: [{ module: PG, version: '26.1118.0900.1', bundleDigest: release[0].input.release.bundleDigest }], ...over,
});
const signCatalog = (p, key = K.catalog, keyId = 'catalog-test') => signEnvelope(p, keyId, key.privateKey);
const seq41 = catalogPayload({ sequence: 41, entries: [] });
const STATE = { lastAccepted: [{ authority: AUTHORITY, channel: 'stable', sequence: 41, digest: digest(seq41) }] };
const catVector = (id, title, expect, catalog, state = STATE) => ({
  id, kind: 'catalog', title, evaluationTime: NOW, input: { evaluationTime: NOW, trustAnchor, context: CONTEXT, state, catalog }, expect,
});
const tampered = signCatalog(catalogPayload());
tampered.payload = catalogPayload({ entries: [] });
const catalog = [
  catVector('C01', 'sequence 42 카탈로그를 받아들이고 새 기준으로 저장한다', pass, signCatalog(catalogPayload())),
  catVector('C02', '마지막 수용값(41)보다 낮은 sequence는 재생으로 거절', rej('CatalogReplay', 'catalog'), signCatalog(catalogPayload({ sequence: 39 }))),
  catVector('C03', '같은 sequence(41)에 다른 digest는 equivocation으로 거절', rej('CatalogEquivocation', 'catalog'), signCatalog(catalogPayload({ sequence: 41 }))),
  catVector('C04', '만료된 카탈로그는 거절', rej('CatalogExpired', 'catalog'), signCatalog(catalogPayload({ expiresAt: PAST }))),
  catVector('C05', '서명 뒤 내용이 바뀐 카탈로그는 거절', rej('CatalogSignatureInvalid', 'catalog'), tampered),
  catVector('C06', '릴리스 키로 서명한 카탈로그는 범위 위반', rej('CatalogScopeViolation', 'catalog'), signCatalog(catalogPayload(), K.release, 'release-test')),
  catVector('C07', '같은 sequence·같은 digest 재수신은 변화 없이 수용', pass, signCatalog(seq41)),
  catVector('C08', '재시작 뒤 영속 기준이 없어도 snapshot 기준(40)보다 낮으면 거절', rej('CatalogReplay', 'catalog'), signCatalog(catalogPayload({ sequence: 38 })), { lastAccepted: [] }),
];

// ---------- 제한 실행부 벡터 ----------
const SETUP = { name: 'opensphere-setup', version: '26.1118.0800.1', digest: fake('setup:26.1118.0800.1') };
const execPlan = () => ({
  resources: [
    { apiVersion: 'stackgres.io/v1', kind: 'SGCluster', name: 'pg-main', namespace: 'osr-provider-postgres' },
    { apiVersion: 'stackgres.io/v1', kind: 'SGInstanceProfile', name: 'pg-size-s', namespace: 'osr-provider-postgres' },
  ],
  rbac: clone(pgProfile.rbac),
  storage: [{ claim: 'pg-main-data', profile: 'foundation.block-rwo', size: '50Gi' }],
});
function plan(over = {}) {
  const p = {
    schema: 'opensphere.osr-install-plan/v1', installationId: 'inst-provider-postgres-01', planRevision: 1,
    module: { id: PG, version: '26.1118.0900.1' }, bundleDigest: release[0].input.release.bundleDigest,
    setupArtifact: clone(SETUP), profile: { id: pgProfile.id, version: pgProfile.version, fingerprint: digest(pgProfile) },
    dependencies: [{ module: 'hiss.storage', bundleDigest: LOCK[0].bundleDigest, generation: 3 }],
    executionPlan: execPlan(), executionPlanDigest: '', policyRevision: 'pol-2026-11-18.1', trustGeneration: 7,
    target: { namespace: 'osr-provider-postgres', fence: 12 }, ...over,
  };
  p.executionPlanDigest = digest(p.executionPlan);
  return p;
}
const APPROVED = plan();
const APPROVAL = { schema: 'opensphere.osr-approval-binding/v1', scope: 'osr', planDigest: digest(APPROVED), decision: 'approved', approvedAt: '2026-11-17T23:00:00Z' };
const receiptFor = (p) => ({
  schema: 'opensphere.osr-execution-receipt/v1', installationId: p.installationId, planRevision: p.planRevision, planDigest: digest(p),
  bundleDigest: p.bundleDigest, setupArtifactDigest: p.setupArtifact.digest, profileFingerprint: p.profile.fingerprint,
  executionPlanDigest: p.executionPlanDigest, fence: p.target.fence, outcome: 'Accepted', executedAt: '2026-11-17T23:30:00Z',
});
const execVector = (id, title, expect, request, extra = {}) => ({
  id, kind: 'execution', title, evaluationTime: NOW,
  input: { evaluationTime: NOW, trustAnchor, context: CONTEXT, approvedPlan: APPROVED, approval: APPROVAL, request, receipts: [], currentFence: 12, ...extra },
  expect,
});
const widerPlan = () => { const e = execPlan(); e.rbac.push({ apiGroups: ['rbac.authorization.k8s.io'], resources: ['clusterroles'], verbs: ['create'] }); return plan({ executionPlan: e }); };
const execution = [
  execVector('E01', '승인한 계획 그대로면 실행을 받아들이고 영수증을 낸다', pass, plan()),
  execVector('E02', 'profile 지문이 승인과 다르면 거절', rej('ProfileFingerprintMismatch', 'execute'), plan({ profile: { id: pgProfile.id, version: pgProfile.version, fingerprint: fake('profile:tampered') } })),
  execVector('E03', '의존 모듈 generation이 승인과 다르면 거절', rej('DependencyBindingMismatch', 'execute'), plan({ dependencies: [{ module: 'hiss.storage', bundleDigest: LOCK[0].bundleDigest, generation: 4 }] })),
  execVector('E04', '실행 계획의 RBAC이 넓어지면(digest를 다시 계산해도) 거절', rej('ExecutionPlanMismatch', 'execute'), widerPlan()),
  execVector('E05', 'Setup 산출물 digest가 승인과 다르면 거절', rej('SetupArtifactMismatch', 'execute'), plan({ setupArtifact: { ...SETUP, digest: fake('setup:other') } })),
  execVector('E06', '이미 실행한 같은 계획의 재요청은 기존 영수증을 돌려준다', { result: 'replay' }, plan(), { receipts: [receiptFor(APPROVED)] }),
  execVector('E07', '같은 planRevision에 다른 계획은 멱등 충돌', rej('IdempotencyConflict', 'execute'), widerPlan(), { receipts: [receiptFor(APPROVED)] }),
  execVector('E08', '승인 뒤 대상 fence가 바뀌면 거절', rej('TargetFenceStale', 'execute'), plan(), { currentFence: 13 }),
  execVector('E09', '승인 뒤 정책 revision이 바뀌면 거절', rej('PolicyRevisionChanged', 'execute'), plan(), { context: signCtx({ ...baseSnapshot(), policyRevision: 'pol-2026-11-18.2' }) }),
];

// ---------- 새 설치 · 독립 복구 벡터 ----------
const pgRel = release[0].input.release;
const record = {
  schema: 'opensphere.osr-installation-record/v1', installationId: 'inst-provider-postgres-01', module: PG, bundleDigest: pgRel.bundleDigest,
  profileFingerprint: digest(pgProfile), recoveryKey: { keyId: 'recovery-inst-01-test', publicKeyJwk: K.recovery.publicKeyJwk }, pinnedAt: '2026-11-17T23:30:00Z',
};
const expiredCatalog = signCatalog(catalogPayload({ sequence: 43, expiresAt: PAST }));
const expiredSignature = signEnvelope({ ...pgRel.referrers.signature.payload, expiresAt: PAST }, 'release-test', K.release.privateKey); // offline 사본: 이미 만료된 서명
const offline = (over = {}) => ({ index: pgRel.index, bundleDigest: pgRel.bundleDigest, catalog: expiredCatalog, signature: expiredSignature, ...over });
const credential = (key = K.recovery, keyId = 'recovery-inst-01-test', over = {}) => signEnvelope({
  schema: 'opensphere.osr-recovery-request/v1', installationId: record.installationId, bundleDigest: pgRel.bundleDigest, action: 'recover', requestedAt: NOW, ...over,
}, keyId, key.privateKey);
const otherIndex = clone(pgRel.index); otherIndex.manifests.reverse();
const recVector = (id, title, expect, input) => ({ id, kind: 'recovery', title, evaluationTime: NOW, input: { evaluationTime: NOW, ...input }, expect });
const recovery = [
  recVector('V01', '카탈로그가 만료되면 새 설치는 거절', rej('CatalogExpired', 'catalog'), {
    mode: 'new-install', trustAnchor, context: CONTEXT, state: STATE, environment: { osrAvailable: true, coreAvailable: true }, offline: offline(),
  }),
  recVector('V02', 'OSR·Core가 없고 카탈로그·서명이 만료돼도 원래 설치의 독립 복구는 허용', pass, {
    mode: 'recovery', environment: { osrAvailable: false, coreAvailable: false }, installRecord: record, credential: credential(), offline: offline(), options: {},
  }),
  recVector('V03', '설치 기록과 다른 번들로는 복구하지 않는다', rej('RecoveryBundleMismatch', 'recover'), {
    mode: 'recovery', environment: { osrAvailable: false, coreAvailable: false }, installRecord: record, credential: credential(),
    offline: offline({ index: otherIndex, bundleDigest: digest(otherIndex) }), options: {},
  }),
  recVector('V04', '복구 자격 없이는 복구하지 않는다', rej('RecoveryCredentialMissing', 'recover'), {
    mode: 'recovery', environment: { osrAvailable: false, coreAvailable: false }, installRecord: record, offline: offline(), options: {},
  }),
  recVector('V05', '만료 무시 옵션은 계약에 없다', rej('RecoveryOverrideNotSupported', 'recover'), {
    mode: 'recovery', environment: { osrAvailable: false, coreAvailable: false }, installRecord: record, credential: credential(), offline: offline(), options: { ignoreExpiry: true },
  }),
  recVector('V06', '설치 기록에 없는 키로 서명한 복구 자격은 거절', rej('RecoveryCredentialInvalid', 'recover'), {
    mode: 'recovery', environment: { osrAvailable: false, coreAvailable: false }, installRecord: record, credential: credential(K.otherRecovery, 'recovery-inst-01-test'), offline: offline(), options: {},
  }),
  recVector('V07', '오래전에 서명한 복구 요청(1시간 창 밖)은 다시 쓸 수 없다', rej('RecoveryCredentialInvalid', 'recover'), {
    mode: 'recovery', environment: { osrAvailable: false, coreAvailable: false }, installRecord: record, credential: credential(K.recovery, 'recovery-inst-01-test', { requestedAt: '2026-11-17T20:00:00Z' }), offline: offline(), options: {},
  }),
];

// ---------- 유효 권한 벡터 ----------
const INSTALLATION = {
  installationId: 'inst-provider-postgres-01', module: PG, class: 'provider', namespace: 'osr-provider-postgres', state: 'substantive',
  profile: { id: pgProfile.id, version: pgProfile.version, fingerprint: digest(pgProfile) },
  capabilityRequests: ['db.instance.manage', 'db.backup.manage', 'db.connection.issue'],
};
const pgCmd = (verb) => postgresParts().commands.commands.find((c) => c.id === `${PG}.${verb}`);
const permVector = (id, title, expect, over = {}) => ({
  id, kind: 'permission', title, evaluationTime: NOW,
  input: {
    evaluationTime: NOW, installation: INSTALLATION, command: pgCmd('status'),
    caller: { subject: 'user:operator-a', permissions: ['db.instance.manage', 'db.backup.manage'] },
    target: { installationId: INSTALLATION.installationId, namespace: INSTALLATION.namespace }, ownerCheck: 'allow', ...over,
  },
  expect,
});
const permission = [
  permVector('P01', '부여된 capability 안의 읽기 명령은 바로 허용', { result: 'pass' }),
  permVector('P02', '쓰기 명령은 허용이어도 Execution Core 승인 경로로 간다', { result: 'pass', route: 'execution-core-approval' }, { command: pgCmd('apply') }),
  permVector('P03', '명령 계약이 더 넓은 권한을 요구해도 부여되지 않는다', rej('CapabilityNotGranted', 'permission'), { command: { ...pgCmd('status'), requiredPermissions: ['cluster.rbac.admin'] } }),
  permVector('P04', '호출자에게 없는 권한은 거절', rej('CallerPermissionMissing', 'permission'), { caller: { subject: 'user:viewer', permissions: [] } }),
  permVector('P05', '만료된 위임은 거절', rej('DelegationExpired', 'permission'), {
    caller: { subject: 'agent:r2d2', permissions: ['db.instance.manage'], delegation: { issuedAt: ISSUED, expiresAt: PAST, installations: [INSTALLATION.installationId] } },
  }),
  permVector('P06', '다른 설치본을 대상으로 하면 거절', rej('ScopeMismatch', 'permission'), { target: { installationId: 'inst-provider-postgres-02', namespace: INSTALLATION.namespace } }),
  permVector('P07', '형식 멤버(실질 아님) 설치본에 쓰기는 거절', rej('ScopeMismatch', 'permission'), { command: pgCmd('apply'), installation: { ...INSTALLATION, state: 'formal' } }),
  permVector('P08', 'Owner 최종 검사가 거절하면 거절', rej('OwnerDenied', 'permission'), { ownerCheck: 'deny' }),
];

// ---------- canonical JSON 벡터(다른 언어 구현이 같은 bytes·digest를 내야 한다) ----------
const canonCases = [
  ['K01', '키는 UTF-16 code unit 순으로 정렬', { b: 1, a: 2, A: 3, 'é': 4, '😀': 5, 'ａ': 6 }],
  ['K02', '중첩 객체·배열 순서 보존', { z: [3, 1, 2], y: { d: null, c: true, b: false } }],
  ['K03', '한글·이스케이프 문자열', { text: '한글 "따옴표" \\ 역슬래시\n줄바꿈\t탭\u0001' }],
  ['K04', '음수·0·안전 범위 경계 정수', { n: [-1, 0, 9007199254740991, -9007199254740991] }],
  ['K05', '빈 객체·빈 배열', { o: {}, a: [] }],
];
const canonical = [
  ...canonCases.map(([id, title, value]) => ({ id, kind: 'canonical', title, evaluationTime: NOW, input: { value }, expect: { result: 'pass', canonical: canonicalize(value), digest: digest(value) } })),
  { id: 'K06', kind: 'canonical', title: '소수는 거절(정수만)', evaluationTime: NOW, input: { value: { size: 1.5 } }, expect: rej('CanonicalizationError', 'canonical') },
  { id: 'K07', kind: 'canonical', title: '안전 범위를 넘는 정수는 거절', evaluationTime: NOW, input: { value: { n: 9007199254740992 } }, expect: rej('CanonicalizationError', 'canonical') },
];

// 벡터마다 같은 신뢰 입력을 반복하지 않도록 파일의 shared로 올린다. 실행 입력 = { ...shared, ...vector.input }.
const SHARED = { trustAnchor, context: CONTEXT, profiles };
const compact = (vectors) => vectors.map((v) => {
  const input = { ...v.input };
  for (const [k, val] of Object.entries(SHARED)) if (k in input && canonicalize(input[k]) === canonicalize(val)) delete input[k];
  return { ...v, input };
});
const header = (group, note) => ({
  schema: 'opensphere.osr-test-vectors/v1', group, generatedBy: 'tools/make-vectors.mjs', evaluationTime: NOW,
  note: `${note} 키는 생성할 때마다 새로 만든 일회용 시험 키이며 어떤 실제 신뢰 경로에도 등록되지 않는다. 실행 입력은 { ...shared, ...vector.input }이다.`,
  shared: SHARED,
});
writeJson('vectors/canonical.json', { schema: 'opensphere.osr-test-vectors/v1', group: 'canonical', generatedBy: 'tools/make-vectors.mjs', evaluationTime: NOW, note: 'canonical JSON bytes와 digest를 고정한다. 키가 없어 재생성해도 바뀌지 않는다.', vectors: canonical });
writeJson('vectors/permission.json', { ...header('permission', '유효 권한 = capability ∩ 호출자 ∩ scope ∩ Owner 검사.'), vectors: compact(permission) });
writeJson('vectors/release.json', { ...header('release', '형식 판정 1~9단계(provider.postgres).'), vectors: compact(release) });
writeJson('vectors/ui.json', { ...header('ui', '실행하지 않는 정적 화면 모듈의 형식 판정(ui.dummy-screens).'), vectors: compact(ui) });
writeJson('vectors/assembly.json', { ...header('assembly', '어셈블리 형식 판정과 10단계 대체 판정(assembly.mail).'), vectors: compact(assembly) });
writeJson('vectors/catalog.json', { ...header('catalog', '채널 카탈로그 sequence·만료·범위.'), vectors: compact(catalog) });
writeJson('vectors/execution.json', { ...header('execution', '제한 실행부의 승인 바인딩·멱등·fence.'), vectors: compact(execution) });
writeJson('vectors/recovery.json', { ...header('recovery', '만료 시 새 설치 거절과 원래 설치의 독립 복구.'), vectors: compact(recovery) });
console.log(`벡터 생성: canonical ${canonical.length}, permission ${permission.length}, release ${release.length}, ui ${ui.length}, assembly ${assembly.length}, catalog ${catalog.length}, execution ${execution.length}, recovery ${recovery.length}`);
