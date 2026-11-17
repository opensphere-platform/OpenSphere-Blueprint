import fs from 'node:fs';
// 스키마 원본. JSON 파일은 이 스크립트가 만든다: node tools/gen-schemas.mjs
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const OUT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../schemas') + '/';
const BASE = 'https://opensphere-platform.github.io/OpenSphere-Blueprint/specs/osr/schemas/';
const CLASSES = ['core', 'hiss', 'delivery', 'provider', 'engine', 'runtime', 'assembly', 'ui', 'product'];
const P = {
  digest: '^sha256:[0-9a-f]{64}$',
  time: '^\\d{4}-\\d{2}-\\d{2}T\\d{2}:\\d{2}:\\d{2}Z$',
  moduleId: `^(${CLASSES.join('|')})\\.[a-z][a-z0-9-]{1,40}$`,
  commandId: `^(${CLASSES.join('|')}|osr)\\.[a-z][a-z0-9-]{1,40}(\\.[a-z][a-z0-9-]*)+$`,
  profileId: '^[a-z]+\\.[a-z0-9-]+$',
  semver: '^\\d+\\.\\d+\\.\\d+$',
  caret: '^\\^\\d+\\.\\d+\\.\\d+$',
  release: '^\\d{2}\\.\\d{3,4}\\.\\d{4}\\.\\d+$',
  keyId: '^[a-z0-9][a-z0-9.-]{2,63}$',
  repo: `^ghcr\\.io/opensphere-platform/opensphere-(${CLASSES.join('|')})-[a-z][a-z0-9-]{1,40}$`,
};
const s = (pattern) => ({ type: 'string', pattern });
const str = { type: 'string', minLength: 1 };
const obj = (required, properties, extra = {}) => ({ type: 'object', required, properties, additionalProperties: false, ...extra });
const arr = (items, extra = {}) => ({ type: 'array', items, ...extra });
const common = {
  digest: s(P.digest), time: s(P.time), moduleId: s(P.moduleId), jwk: obj(['kty', 'crv', 'x', 'y'], {
    kty: { const: 'EC' }, crv: { const: 'P-256' }, x: s('^[A-Za-z0-9_-]{43}$'), y: s('^[A-Za-z0-9_-]{43}$'),
  }),
};
function schema(name, title, description, body, defs = {}) {
  const usedDefs = { ...common, ...defs };
  return { $schema: 'https://json-schema.org/draft/2020-12/schema', $id: BASE + name + '.schema.json', title, description, ...body, $defs: usedDefs };
}
const R = (n) => ({ $ref: `#/$defs/${n}` });
const all = {};

all['signed-envelope'] = schema('signed-envelope', 'OSR 서명 봉투',
  '서명 대상은 payload의 canonical JSON(RFC 8785) UTF-8 바이트다. 서명값은 ECDSA P-256/SHA-256, IEEE P1363(r||s 64바이트)을 base64url로 적는다.',
  obj(['payload', 'signature'], {
    payload: { type: 'object' },
    signature: obj(['alg', 'keyId', 'value'], { alg: { const: 'ES256-P1363' }, keyId: s(P.keyId), value: s('^[A-Za-z0-9_-]{86}$') }),
  }));

all['validation-context-snapshot'] = schema('validation-context-snapshot', '검증 맥락 snapshot',
  '형식 판정(1~9단계)의 신뢰 입력. OSR 신뢰 운영 경로가 trust anchor 키로 서명한다(signed-envelope의 payload). 모듈이 제공한 키·정책은 여기에 들어올 수 없다.',
  obj(['schema', 'authority', 'issuedAt', 'expiresAt', 'trustGeneration', 'policyRevision', 'backboneContract', 'keys', 'profiles', 'policies', 'trustedBuilders', 'dependencyLock', 'channelSequences'], {
    schema: { const: 'opensphere.osr-context/v1' },
    authority: s('^[a-z][a-z0-9.-]{2,63}$'),
    issuedAt: R('time'), expiresAt: R('time'),
    trustGeneration: { type: 'integer', minimum: 1 },
    policyRevision: s('^[a-z0-9][a-z0-9.-]{2,63}$'),
    backboneContract: s(P.semver),
    keys: arr(R('trustKey'), { minItems: 1 }),
    profiles: arr(obj(['id', 'version', 'fingerprint'], { id: s(P.profileId), version: s(P.semver), fingerprint: R('digest') }), { minItems: 1 }),
    policies: { type: 'object', minProperties: 1, additionalProperties: R('classPolicy') },
    trustedBuilders: arr(str, { minItems: 1, uniqueItems: true }),
    dependencyLock: arr(obj(['module', 'compatibilityVersion', 'bundleDigest', 'generation'], {
      module: R('moduleId'), compatibilityVersion: s(P.semver), bundleDigest: R('digest'), generation: { type: 'integer', minimum: 1 },
    })),
    channelSequences: arr(obj(['authority', 'channel', 'sequence', 'digest'], {
      authority: str, channel: str, sequence: { type: 'integer', minimum: 0 }, digest: R('digest'),
    })),
  }),
  {
    trustKey: obj(['keyId', 'purpose', 'scope', 'publicKeyJwk', 'addedAtGeneration'], {
      keyId: s(P.keyId),
      purpose: { enum: ['release', 'catalog'] },
      scope: obj([], { classes: arr({ enum: CLASSES }, { minItems: 1, uniqueItems: true }), channels: arr(str, { minItems: 1, uniqueItems: true }) }, { minProperties: 1 }),
      publicKeyJwk: R('jwk'),
      addedAtGeneration: { type: 'integer', minimum: 1 },
      revokedAtGeneration: { type: 'integer', minimum: 1 },
    }),
    classPolicy: obj(['allowedCapabilities', 'allowedEffects'], {
      allowedCapabilities: arr(str, { uniqueItems: true }),
      allowedEffects: arr({ enum: ['none', 'read-cost', 'mutation', 'destructive'] }, { uniqueItems: true }),
    }),
  });

const contribution = obj(['enabled'], { enabled: { type: 'boolean' }, artifact: s('^[a-z][a-z0-9-]*$'), reason: { type: 'string', minLength: 8, maxLength: 500 } });
all['module-descriptor'] = schema('module-descriptor', '모듈 디스크립터 opensphere.module/v1',
  '릴리스마다 하나. 클래스 규칙: 실행 클래스는 profile·runtime·설치형 lifecycle(install·update·rollback·retire)이 필수다. assembly는 runtime·storage가 없고 lifecycle은 OSR 고정 명령(register·update·retire)이다. 참조 검증기는 클래스 규칙을 이 스키마보다 먼저 검사해 ClassRuleViolation으로 보고한다.',
  {
    ...obj(['schema', 'id', 'class', 'displayName', 'owner', 'description', 'version', 'compatibilityVersion', 'plane', 'backboneCompat', 'dependencies', 'capabilityRequests', 'contributions', 'supplyChain', 'lifecycle'], {
      schema: { const: 'opensphere.module/v1' },
      id: R('moduleId'), class: { enum: CLASSES },
      displayName: str, owner: str, description: str,
      version: s(P.release), compatibilityVersion: s(P.semver),
      plane: { enum: ['hiss', 'fabric-delivery', 'fabric-shared', 'fabric-engine', 'fabric-runtime', 'catalog', 'shell', 'employee-area', 'customer-area'] },
      backboneCompat: s(P.caret),
      dependencies: arr(obj(['module', 'range', 'kind'], { module: R('moduleId'), range: s(P.caret), kind: { enum: ['required', 'optional'] }, claims: arr(str) })),
      profile: s(P.profileId),
      capabilityRequests: arr(str, { uniqueItems: true }),
      runtime: obj(['images', 'health', 'ready', 'securityContext'], {
        images: arr(obj(['name', 'digest'], { name: str, digest: R('digest') }), { minItems: 1 }),
        health: obj(['path'], { path: s('^/') }), ready: obj(['path'], { path: s('^/') }),
        resources: obj([], { cpu: str, memory: str }),
        securityContext: obj(['runAsNonRoot'], { runAsNonRoot: { const: true }, readOnlyRootFilesystem: { type: 'boolean' } }),
      }),
      storage: obj(['profile'], { profile: str }),
      contributions: obj(['manual', 'commands', 'oci', 'knowledge'], { manual: contribution, commands: contribution, oci: contribution, knowledge: contribution, definition: contribution }),
      supplyChain: obj(['sourceRepository', 'sourceRevision', 'buildAuthority'], { sourceRepository: s('^https://github\\.com/opensphere-platform/'), sourceRevision: s('^[0-9a-f]{40}$'), buildAuthority: str }),
      lifecycle: { type: 'object', minProperties: 3, additionalProperties: s(P.commandId) },
    }),
    allOf: [{
      if: { properties: { class: { const: 'assembly' } } },
      then: { not: { anyOf: [{ required: ['runtime'] }, { required: ['storage'] }] }, properties: { lifecycle: obj(['register', 'update', 'retire'], { register: { const: 'osr.assembly.register' }, update: { const: 'osr.assembly.update' }, retire: { const: 'osr.assembly.retire' } }), contributions: { required: ['definition'] } } },
      else: { required: ['profile', 'runtime'], properties: { lifecycle: obj(['install', 'update', 'rollback', 'retire'], { install: s(P.commandId), update: s(P.commandId), rollback: s(P.commandId), retire: s(P.commandId) }) } },
    }],
  });

all['release-signature-payload'] = schema('release-signature-payload', '릴리스 서명 payload',
  'OCI referrer(서명)의 signed-envelope payload. 수용할 SBOM·출처 evidence의 digest를 서명 대상에 포함한다. 서명 payload에 digest가 없는 SBOM·출처는 같은 subject를 가리켜도 받아들이지 않는다.',
  obj(['schema', 'subject', 'module', 'descriptorDigest', 'artifacts', 'evidence', 'keyId', 'issuedAt', 'expiresAt'], {
    schema: { const: 'opensphere.release-signature/v1' },
    subject: obj(['repository', 'bundleDigest'], { repository: s(P.repo), bundleDigest: R('digest') }),
    module: obj(['id', 'class', 'version'], { id: R('moduleId'), class: { enum: CLASSES }, version: s(P.release) }),
    descriptorDigest: R('digest'),
    artifacts: arr(obj(['part', 'digest'], { part: s('^[a-z][a-z0-9-]*$'), digest: R('digest') }), { minItems: 1, uniqueItems: true }),
    evidence: obj(['sbom', 'provenance'], { sbom: R('digest'), provenance: R('digest') }),
    keyId: s(P.keyId), issuedAt: R('time'), expiresAt: R('time'),
  }));

all['supply-chain-statement'] = schema('supply-chain-statement', 'SBOM·출처 진술(in-toto Statement v1)',
  'SBOM(SPDX)과 출처(SLSA provenance v1)를 담는 OCI referrer. subject[0].digest.sha256은 번들 digest의 hex여야 한다. 출처의 builder.id는 검증 맥락의 trustedBuilders에 있어야 한다.',
  {
    ...obj(['_type', 'subject', 'predicateType', 'predicate'], {
      _type: { const: 'https://in-toto.io/Statement/v1' },
      subject: arr(obj(['name', 'digest'], { name: s(P.repo), digest: obj(['sha256'], { sha256: s('^[0-9a-f]{64}$') }) }), { minItems: 1, maxItems: 1 }),
      predicateType: { enum: ['https://spdx.dev/Document/v2.3', 'https://slsa.dev/provenance/v1'] },
      predicate: { type: 'object' },
    }),
    allOf: [{
      if: { properties: { predicateType: { const: 'https://slsa.dev/provenance/v1' } } },
      then: { properties: { predicate: { type: 'object', required: ['buildDefinition', 'runDetails'], properties: { runDetails: { type: 'object', required: ['builder'], properties: { builder: { type: 'object', required: ['id'], properties: { id: str } } } } } } } },
      else: { properties: { predicate: { type: 'object', required: ['spdxVersion', 'name', 'packages'], properties: { spdxVersion: { const: 'SPDX-2.3' } } } } },
    }],
  });

all['channel-catalog'] = schema('channel-catalog', '채널 카탈로그',
  'signed-envelope payload. catalog 용도 키로 서명한다. sequence는 catalog authority × 채널별 단조 증가이며 마지막 수용값을 영속 저장한다. 낮은 sequence는 CatalogReplay, 같은 sequence의 다른 digest는 CatalogEquivocation.',
  obj(['schema', 'authority', 'channel', 'sequence', 'issuedAt', 'expiresAt', 'entries'], {
    schema: { const: 'opensphere.channel-catalog/v1' },
    authority: str, channel: s('^[a-z][a-z0-9-]{1,31}$'), sequence: { type: 'integer', minimum: 1 },
    issuedAt: R('time'), expiresAt: R('time'),
    entries: arr(obj(['module', 'version', 'bundleDigest'], { module: R('moduleId'), version: s(P.release), bundleDigest: R('digest') }), { uniqueItems: true }),
  }));

const commandSchema = {
  ...obj(['id', 'description', 'kind', 'mutation', 'arguments', 'scope', 'idempotency', 'requiredPermissions', 'output', 'effect'], {
    id: s(P.commandId), description: { type: 'string', minLength: 8, maxLength: 500 },
    kind: { enum: ['read', 'discover', 'plan', 'apply', 'watch', 'verify', 'cancel', 'compensate'] },
    mutation: { type: 'boolean' },
    arguments: { type: 'object', required: ['type'], properties: { type: { const: 'object' } } },
    scope: { enum: ['module', 'installation', 'definition'] },
    idempotency: { enum: ['none', 'request-id'] },
    requiredPermissions: arr(str, { uniqueItems: true }),
    output: { type: 'object', required: ['type'] },
    statusCommand: s(P.commandId),
    review: obj(['reason'], { reason: { type: 'string', minLength: 8, maxLength: 500 } }),
    effect: { enum: ['none', 'read-cost', 'mutation', 'destructive'] },
  }),
  allOf: [{
    if: { properties: { mutation: { const: true } } },
    then: { required: ['statusCommand', 'review'], properties: { idempotency: { const: 'request-id' } } },
  }],
};
all['owner-commands'] = schema('owner-commands', 'OS Shell 명령 계약 opensphere.owner-commands/v4 + effect',
  '아카이브 owner-commands v4 필드에 effect를 더했다. 스키마는 구조만 본다. kind·mutation·effect의 정합(mutation은 apply·cancel·compensate만, mutation이면 effect는 mutation·destructive, 아니면 none·read-cost)과 정책·profile 허용 여부는 검증기가 다시 계산해 EffectPolicyViolation으로 거절한다. 제출한 effect를 믿지 않는다. assembly는 ownerBinding이 osr.definition-owner여야 한다(어셈블리 Pod가 아닌 정의 관리 고정 담당자).',
  {
    ...obj(['schema', 'module', 'ownerBinding', 'commands'], {
      schema: { const: 'opensphere.owner-commands/v4' },
      module: R('moduleId'),
      ownerBinding: { enum: ['module-owner', 'osr.definition-owner'] },
      commands: arr(R('command'), { minItems: 1, maxItems: 256 }),
    }),
  }, { command: commandSchema });

all['manual-bundle'] = schema('manual-bundle', '매뉴얼 opensphere.manual-bundle/v1',
  '필수 문서 유형: overview·install·operations·troubleshooting·commands. assembly는 install 대신 composition. 문서 ID는 manual:<module-id>:<slug>.',
  obj(['schema', 'module', 'documents'], {
    schema: { const: 'opensphere.manual-bundle/v1' },
    module: R('moduleId'),
    documents: arr(obj(['sourceId', 'version', 'sourcePath', 'documentType', 'authorityTier', 'audience', 'plane', 'module', 'tags', 'checksum', 'content'], {
      sourceId: s('^manual:[a-z]+\\.[a-z0-9-]+:[a-z0-9-]+$'), version: s(P.release), sourcePath: str,
      documentType: { enum: ['overview', 'install', 'composition', 'operations', 'troubleshooting', 'commands', 'reference'] },
      authorityTier: { type: 'integer', minimum: 0, maximum: 4 }, audience: arr(str, { minItems: 1 }), plane: str, module: R('moduleId'),
      tags: arr(str), checksum: R('digest'), content: str,
    }), { minItems: 1 }),
  }));

all['knowledge-bundle'] = schema('knowledge-bundle', 'RAG 등록 opensphere.knowledge-bundle/v1',
  '지식은 명령·정책·Memory가 아니다. source.part·source.digest는 같은 릴리스의 기여 artifact를 가리켜야 한다(KnowledgeProvenanceInvalid).',
  obj(['schema', 'module', 'documents'], {
    schema: { const: 'opensphere.knowledge-bundle/v1' },
    module: R('moduleId'),
    documents: arr(obj(['id', 'module', 'kind', 'repository', 'path', 'sourceRevision', 'sha256', 'license', 'language', 'content', 'source'], {
      id: s('^knowledge:[a-z]+\\.[a-z0-9-]+:[a-z0-9-]+$'), module: R('moduleId'), kind: { enum: ['ReleaseDocumentation'] },
      repository: s('^https://github\\.com/opensphere-platform/'), path: str, sourceRevision: s('^[0-9a-f]{40}$'),
      sha256: s('^[0-9a-f]{64}$'), license: str, language: s('^[a-z]{2}(-[A-Z]{2})?$'), content: str,
      source: obj(['part', 'digest'], { part: s('^[a-z][a-z0-9-]*$'), digest: R('digest') }),
    }), { minItems: 1 }),
  }));

all['assembly-definition'] = schema('assembly-definition', '어셈블리 정의',
  '실행하지 않는 정의. 구성 멤버와 리소스 유형만 담는다. 실질 판정(10단계 대체)은 등록된 정의 digest·generation과 멤버 모듈의 실질 상태·구성 가능성으로 한다.',
  obj(['schema', 'module', 'members', 'resourceTypes', 'composition'], {
    schema: { const: 'opensphere.assembly-definition/v1' },
    module: s('^assembly\\.[a-z][a-z0-9-]{1,40}$'),
    members: arr(obj(['module', 'role', 'required'], { module: R('moduleId'), role: str, required: { type: 'boolean' } }), { minItems: 1, uniqueItems: true }),
    resourceTypes: arr(str, { uniqueItems: true }),
    composition: obj(['claims'], { claims: arr(obj(['member', 'claim'], { member: R('moduleId'), claim: str })) }),
  }));

all['materializer-profile'] = schema('materializer-profile', 'materializer profile',
  '클래스별 설치 형태. profile 하나는 적용 방식 하나만 갖는다. 지문(fingerprint)은 이 문서의 canonical digest이며 검증 맥락과 설치 계획에 묶인다. RBAC은 profile의 고정 규칙으로 Backbone이 생성하고 모듈이 가져온 RBAC은 쓰지 않는다.',
  obj(['schema', 'id', 'version', 'class', 'appliesTo', 'mechanism', 'capabilities', 'allowedEffects', 'resources', 'forbiddenResources', 'rbac', 'storage', 'verification', 'restrictedOperations'], {
    schema: { const: 'opensphere.materializer-profile/v1' },
    id: s(P.profileId), version: s(P.semver), class: { enum: CLASSES },
    appliesTo: arr(R('moduleId'), { minItems: 1, uniqueItems: true }),
    mechanism: { enum: ['stackgres', 'definition-only'] },
    capabilities: arr(str, { uniqueItems: true }),
    allowedEffects: arr({ enum: ['none', 'read-cost', 'mutation', 'destructive'] }, { uniqueItems: true }),
    resources: arr(obj(['apiVersion', 'kind', 'max'], { apiVersion: str, kind: str, max: { type: 'integer', minimum: 1 } })),
    forbiddenResources: arr(obj(['apiVersion', 'kind'], { apiVersion: str, kind: str })),
    rbac: arr(obj(['apiGroups', 'resources', 'verbs'], { apiGroups: arr({ type: 'string' }), resources: arr(str, { minItems: 1 }), verbs: arr({ enum: ['get', 'list', 'watch', 'create', 'update', 'patch', 'delete'] }, { minItems: 1 }) })),
    storage: obj(['mode'], { mode: { enum: ['none', 'foundation-profile'] }, allowedProfiles: arr(str) }),
    verification: arr(obj(['id', 'description'], { id: str, description: str })),
    restrictedOperations: arr({ enum: ['recover', 'retire', 'suspend'] }, { uniqueItems: true }),
  }));

const execPlan = obj(['resources', 'rbac', 'storage'], {
  resources: arr(obj(['apiVersion', 'kind', 'name', 'namespace'], { apiVersion: str, kind: str, name: str, namespace: str })),
  rbac: arr(obj(['apiGroups', 'resources', 'verbs'], { apiGroups: arr({ type: 'string' }), resources: arr(str), verbs: arr(str) })),
  storage: arr(obj(['claim', 'profile', 'size'], { claim: str, profile: str, size: str })),
});
all['install-plan'] = schema('install-plan', '설치 계획(승인 대상)',
  'Core osr 승인이 묶는 대상. 승인한 바이트·권한과 실행한 바이트·권한이 다르면 실행부가 거절한다. executionPlanDigest = digest(executionPlan). planDigest = digest(설치 계획 전체).',
  obj(['schema', 'installationId', 'planRevision', 'module', 'bundleDigest', 'setupArtifact', 'profile', 'dependencies', 'executionPlan', 'executionPlanDigest', 'policyRevision', 'trustGeneration', 'target'], {
    schema: { const: 'opensphere.osr-install-plan/v1' },
    installationId: s('^inst-[a-z0-9-]{4,60}$'), planRevision: { type: 'integer', minimum: 1 },
    module: obj(['id', 'version'], { id: R('moduleId'), version: s(P.release) }),
    bundleDigest: R('digest'),
    setupArtifact: obj(['name', 'version', 'digest'], { name: str, version: str, digest: R('digest') }),
    profile: obj(['id', 'version', 'fingerprint'], { id: s(P.profileId), version: s(P.semver), fingerprint: R('digest') }),
    dependencies: arr(obj(['module', 'bundleDigest', 'generation'], { module: R('moduleId'), bundleDigest: R('digest'), generation: { type: 'integer', minimum: 1 } })),
    executionPlan: R('executionPlan'), executionPlanDigest: R('digest'),
    policyRevision: str, trustGeneration: { type: 'integer', minimum: 1 },
    target: obj(['namespace', 'fence'], { namespace: s('^[a-z0-9]([-a-z0-9]*[a-z0-9])?$'), fence: { type: 'integer', minimum: 1 } }),
  }),
  {
    executionPlan: execPlan,
    approval: obj(['schema', 'scope', 'planDigest', 'decision', 'approvedAt'], {
      schema: { const: 'opensphere.osr-approval-binding/v1' }, scope: { const: 'osr' }, planDigest: R('digest'),
      decision: { enum: ['approved', 'rejected'] }, approvedAt: R('time'),
    }),
  });

all['execution-receipt'] = schema('execution-receipt', '제한 실행부 영수증',
  '승인 바인딩 값을 그대로 돌려준다. 같은 installationId·planRevision의 재요청은 같은 planDigest면 기존 영수증, 다르면 IdempotencyConflict.',
  obj(['schema', 'installationId', 'planRevision', 'planDigest', 'bundleDigest', 'setupArtifactDigest', 'profileFingerprint', 'executionPlanDigest', 'fence', 'outcome', 'executedAt'], {
    schema: { const: 'opensphere.osr-execution-receipt/v1' },
    installationId: str, planRevision: { type: 'integer', minimum: 1 }, planDigest: R('digest'), bundleDigest: R('digest'),
    setupArtifactDigest: R('digest'), profileFingerprint: R('digest'), executionPlanDigest: R('digest'),
    fence: { type: 'integer', minimum: 1 },
    outcome: { enum: ['Accepted', 'Running', 'Configured', 'Verified', 'Failed', 'Unknown', 'Cancelled'] },
    executedAt: R('time'),
  }));

all['verdict'] = schema('verdict', '판정 영수증',
  '판정은 평가 맥락에 묶인다. 같은 릴리스라도 맥락(snapshot digest·신뢰 세대·정책 revision·profile 지문, 어셈블리는 정의 digest·generation)이 다르면 재판정한다.',
  obj(['schema', 'module', 'version', 'bundleDigest', 'level', 'result', 'context', 'evaluatedAt'], {
    schema: { const: 'opensphere.osr-verdict/v1' },
    module: R('moduleId'), version: s(P.release), bundleDigest: R('digest'),
    level: { enum: ['formal', 'substantive'] }, result: { enum: ['pass', 'reject'] },
    code: str, step: { type: 'integer', minimum: 0, maximum: 12 },
    context: obj(['snapshotDigest', 'trustGeneration', 'policyRevision'], {
      snapshotDigest: R('digest'), trustGeneration: { type: 'integer', minimum: 1 }, policyRevision: str,
      profileFingerprint: R('digest'), definitionDigest: R('digest'), definitionGeneration: { type: 'integer', minimum: 1 },
    }),
    evaluatedAt: R('time'),
  }));

all['installation-record'] = schema('installation-record', '설치 기록(복구 기준)',
  'Backbone이 설치 때 고정해 두는 기록. 독립 복구는 이 기록의 번들 digest와 복구 키만 신뢰한다.',
  obj(['schema', 'installationId', 'module', 'bundleDigest', 'profileFingerprint', 'recoveryKey', 'pinnedAt'], {
    schema: { const: 'opensphere.osr-installation-record/v1' },
    installationId: str, module: R('moduleId'), bundleDigest: R('digest'), profileFingerprint: R('digest'),
    recoveryKey: obj(['keyId', 'publicKeyJwk'], { keyId: s(P.keyId), publicKeyJwk: R('jwk') }),
    pinnedAt: R('time'),
  }));

all['recovery-request'] = schema('recovery-request', '독립 복구 요청',
  '복구 자격(설치 기록에 고정된 복구 키)으로 서명한 signed-envelope payload. 만료 무시·sequence 초기화 같은 우회 옵션은 계약에 없다.',
  obj(['schema', 'installationId', 'bundleDigest', 'action', 'requestedAt'], {
    schema: { const: 'opensphere.osr-recovery-request/v1' },
    installationId: str, bundleDigest: R('digest'), action: { enum: ['recover'] }, requestedAt: R('time'),
  }));

// 쓰지 않는 공통 정의는 뺀다
for (const [name, sc] of Object.entries(all)) {
  const text = JSON.stringify(sc);
  for (const k of Object.keys(sc.$defs)) if (k in common && !text.includes(`"#/$defs/${k}"`)) delete sc.$defs[k];
  if (!Object.keys(sc.$defs).length) delete sc.$defs;
  fs.writeFileSync(OUT + name + '.schema.json', JSON.stringify(sc, null, 2) + '\n');
}
console.log(Object.keys(all).length, 'schemas');
