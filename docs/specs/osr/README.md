# OSR 계약 · 시험 벡터 (단계 1)

**상태:** 계약 초안. 2026-11-18. [OSR 구현 계획서 v0.2](../OSR-IMPLEMENTATION-PLAN-v0.2.md) 단계 1의 산출물이다.
**상위 기준:** [OSR 규격 v0.2](../OPENSPHERE-REGISTRY-OSR-v0.2.md)

**범위:**
- 이 폴더는 Blueprint 안의 **계약 단위 fixture**다. Backbone 구현 · 원장 · API가 아니고, 실제 설치 검사도 아니다.
- 동결 해제 후 Backbone `infra/contracts/osr/`로 옮긴다(계획서 §2).
- 참조 검증기는 판정 규칙을 실행 가능한 형태로 고정하려는 것이다. 운영에 쓰지 않는다.

## 1. 구성

| 위치 | 내용 |
|---|---|
| [CANONICALIZATION.md](CANONICALIZATION.md) | canonical JSON(RFC 8785, 정수만), digest, ECDSA P-256 IEEE-P1363 서명, 시각 규칙 |
| [schemas/](schemas/) | JSON Schema(draft 2020-12 부분집합) 16개. 원본은 [tools/gen-schemas.mjs](tools/gen-schemas.mjs) |
| [profiles/](profiles/) | materializer profile 초안 2개: `provider.stackgres-pg`, `assembly.definition` |
| [tools/](tools/) | 참조 검증기 · 벡터 생성기 · 자체 검사. 의존 패키지 없이 Node 20+ |
| [vectors/](vectors/) | 정상 · 거절 시험 벡터 7묶음, 74개 |

### 1.1 스키마

| 스키마 | 내용 | 규격 |
|---|---|---|
| [module-descriptor](schemas/module-descriptor.schema.json) | `opensphere.module/v1`. 클래스 규칙(실행 클래스 vs assembly) | §6 |
| [manual-bundle](schemas/manual-bundle.schema.json) · [owner-commands](schemas/owner-commands.schema.json) · [knowledge-bundle](schemas/knowledge-bundle.schema.json) | 기여 4종 중 매뉴얼 · 명령(v4 + `effect`) · 지식 | §7 |
| [assembly-definition](schemas/assembly-definition.schema.json) | 실행하지 않는 정의. 멤버 · 리소스 유형 · Claim | §4 · §9 |
| [signed-envelope](schemas/signed-envelope.schema.json) | 모든 서명 대상의 봉투 | §10 |
| [release-signature-payload](schemas/release-signature-payload.schema.json) | 릴리스 서명. **SBOM · 출처 digest 포함**(재검토 B) | §10 |
| [supply-chain-statement](schemas/supply-chain-statement.schema.json) | SBOM(SPDX) · 출처(SLSA v1)의 in-toto Statement | §10 |
| [validation-context-snapshot](schemas/validation-context-snapshot.schema.json) | 형식 판정의 독립 신뢰 입력(재검토 C) | §9 |
| [channel-catalog](schemas/channel-catalog.schema.json) | authority × 채널 sequence, 만료(재검토 C) | §10 |
| [materializer-profile](schemas/materializer-profile.schema.json) | 클래스별 설치 형태. 지문 = canonical digest | §4 · §11 |
| [install-plan](schemas/install-plan.schema.json) | 승인 대상. Setup 산출물 · profile 판/지문 · 의존 digest/generation · 실행 계획 digest · 정책 revision · fence(재검토 A) | 계획서 §3.3 |
| [execution-receipt](schemas/execution-receipt.schema.json) | 제한 실행부 영수증 | 계획서 §3.5 |
| [verdict](schemas/verdict.schema.json) | 판정 영수증. 평가 맥락 포함 | §9 |
| [installation-record](schemas/installation-record.schema.json) · [recovery-request](schemas/recovery-request.schema.json) | 독립 복구의 기준 기록과 복구 요청 | §12 |

## 2. 실행

```bash
node docs/specs/osr/tools/check-vectors.mjs
```

- 결과: 스키마 키워드가 지원 부분집합인지, profile 형식, 벡터마다 참조 검증기 결과 = 기대 결과(결과 · 사유 코드 · 단계 · canonical bytes · 승인 경로)를 확인한다. 하나라도 어긋나면 종료 코드 1이다.
- 계약을 바꿨을 때만 다시 만든다.

```bash
node docs/specs/osr/tools/gen-schemas.mjs && node docs/specs/osr/tools/make-vectors.mjs
```

- 벡터 생성기는 실행할 때마다 **일회용 P-256 키**를 새로 만든다. 개인 키는 파일로 남기지 않고 벡터에는 공개 키만 들어간다. 그래서 재생성하면 서명 · digest 값이 바뀐다. 판정 · 사유 코드는 그대로다. canonical 벡터는 키가 없어 바뀌지 않는다.
- 벡터 파일의 `shared`(trust anchor · 검증 맥락 · profile)가 공통 입력이다. 실행 입력은 `{ ...shared, ...vector.input }`이다.

## 3. 판정 흐름과 사유 코드

### 3.1 형식 판정(규격 §9 0~9단계, `release`)

| 단계 | 검사 | 사유 코드 | 벡터 |
|---|---|---|---|
| 0 | 검증 맥락 snapshot이 trust anchor 서명 · 유효기간 안 | `ContextSnapshotInvalid`, `ContextSnapshotExpired` | R23, R24 |
| 1 | 저장소 이름 | `RepositoryNameInvalid` | R02 |
| 2 | 번들 digest 재계산 | `InvalidDigest` | R03 |
| 3 | 서명 키가 snapshot에 있음 · 회수 안 됨 · 용도/클래스 범위 · 서명값 · subject | `UnknownTrustKey`, `TrustGenerationStale`, `KeyScopeViolation`, `SignatureInvalid` | R04, R08, R05, R06, R22 |
| 4 | 서명 만료 | `SignatureExpired` | R07 |
| 5 | 디스크립터 무결성 · 클래스 규칙 · 스키마 · 저장소/서명/디스크립터 좌표 | `ArtifactDigestMismatch`, `ClassRuleViolation`, `DescriptorInvalid`, `ReleaseCoordinatesMismatch` | R09, A02, R27 |
| 6 | 기여 artifact digest · 서명 목록 · SBOM/출처가 서명 payload digest와 같음 · subject · 신뢰 builder | `ArtifactDigestMismatch`, `SupplyChainEvidenceMissing`, `SupplyChainEvidenceMismatch`, `SupplyChainSubjectMismatch`, `ProvenanceBuilderUntrusted` | R10, R28, R11, R13, R12 |
| 7 | 매뉴얼 필수 문서 · 명령 계약 · 표준 명령 · kind/mutation/effect 정합 · 지식 출처 | `ManualMissing`, `CommandContractInvalid`, `StandardCommandMissing`, `EffectPolicyViolation`, `KnowledgeProvenanceInvalid` | R14, A03, R15, R16, R17, R18 |
| 8 | profile이 snapshot에 있고 지문 일치 · capability 요청이 정책 ∩ profile 안 · effect가 profile 허용 안 | `ProfileUnknown`, `CapabilityNotAllowed`, `EffectPolicyViolation` | R20, R19 |
| 9 | Backbone 계약 범위 · 의존 잠금과 범위 | `BackboneIncompatible`, `DependencyUnresolved` | R26, R21, R25 |

정상: R01(`provider.postgres`), A01(`assembly.mail`, runtime · PVC 없음).

### 3.2 그 밖의 판정

| 묶음 | 검사 | 사유 코드 |
|---|---|---|
| `assembly` 10단계 대체 | 등록된 정의 digest · generation, 필수 멤버의 실질 상태 · 구성 가능성 · 잠금 일치. 이전 판정 재사용은 맥락이 같을 때만 | `DefinitionDigestMismatch`, `DependencyNotSubstantive`, `DependencyBindingMismatch`, `VerdictContextChanged` |
| `catalog` | catalog 키 · 범위 · 서명 · 만료 · sequence(영속 기준과 snapshot 기준 중 큰 값) | `CatalogScopeViolation`, `CatalogSignatureInvalid`, `CatalogExpired`, `CatalogReplay`, `CatalogEquivocation` |
| `execution` | 승인 바인딩 · 멱등 · Setup/profile/의존/실행 계획 일치 · 정책 revision · fence | `PlanInvalid`, `ApprovalBindingInvalid`, `IdempotencyConflict`, `ExecutionPlanMismatch`, `SetupArtifactMismatch`, `ProfileFingerprintMismatch`, `DependencyBindingMismatch`, `PlanNotApproved`, `PolicyRevisionChanged`, `TargetFenceStale` |
| `recovery` | 새 설치는 유효 카탈로그 필수. 독립 복구는 설치 기록의 복구 키 · 고정 번들 digest · 1시간 요청 창만 신뢰. 우회 옵션 없음 | `CatalogExpired`, `RecoveryOverrideNotSupported`, `RecoveryCredentialMissing`, `RecoveryCredentialInvalid`, `RecoveryBundleMismatch` |
| `permission` | capability(정책 ∩ profile ∩ 요청) ∩ 호출자 권한 · 위임 ∩ 대상 scope ∩ Owner 검사. 쓰기는 Execution Core 승인 경로 | `CapabilityNotGranted`, `CallerPermissionMissing`, `DelegationExpired`, `ScopeMismatch`, `OwnerDenied` |
| `canonical` | canonical bytes · digest 고정, 소수 · 큰 정수 거절 | `CanonicalizationError` |

## 4. v0.2 재검토(2026-11-18) 확정 항목과의 대응

| 항목 | 계약 | 벡터 |
|---|---|---|
| A. 승인 산출물 바인딩 | install-plan · execution-receipt | E01~E09 |
| B. SBOM · 출처를 서명 증거에 결합 | release-signature-payload `evidence` | R11, R12, R13, R28 |
| C. 오프라인 신뢰 입력 · 채널 sequence · 만료와 복구 | validation-context-snapshot · channel-catalog · installation-record · recovery-request | R22~R24, C01~C08, V01~V07 |
| D. 어셈블리 필드 · 판정 정합 | module-descriptor 클래스 규칙 · assembly-definition · owner-commands `ownerBinding` | A01~A07 |

## 5. 한계와 단계 2로 넘기는 것

- **번들 digest:** 벡터의 번들 digest는 OCI index를 JSON으로 둔 대체값이다([CANONICALIZATION.md §2.1](CANONICALIZATION.md)). 실제 index 바이트 · manifest · referrer API 검사는 단계 2다.
- **명령 계약:** owner-commands는 아카이브 v4 필드 이름을 따랐다. 인자 · 출력 스키마의 세부(입출력 스키마 해시, 크기 한도 256 KiB)는 단계 2 parser에서 맞춘다.
- **스키마 검증기:** 참조 도구의 JSON Schema 검증기는 [tools/lib.mjs](tools/lib.mjs)의 부분집합이다. 다른 언어 구현은 표준 draft 2020-12 검증기로 같은 결과를 내야 한다.
- **중복 키:** JSON 중복 키 거절은 수신부 파서의 일이다. 참조 도구는 파싱된 객체를 다룬다.
- **실제 설치(10~12단계):** 실행 클래스의 10~12단계와 매뉴얼 · 지식 수집 영수증은 공개 Setup으로 실제 설치한 뒤 검사한다. 이 폴더에는 없다.
- **결정 대기:** 계획서 §12의 OSR-K(유효 권한), OSR-L(고권한 profile), OSR-H(제한 실행부 경로)가 승인되면 이 계약을 고정한다.
