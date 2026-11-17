# OSR · 4종 인프라 종합 구현 계획서 v0.2

**상태:** 구현 계획 초안이다. 결정 대장에 오른 결정도, 구현 승인도 아니다. 착수 전에 §0의 선행 조건과 §12의 선결 결정이 필요하다.
**작성:** 2026-11-17 v0.1 · 2026-11-18 v0.2 · Claude(설계 검토 AI)
**2026-11-18 보정:** v0.2 재검토의 확정 항목 A~D와 문구 보정을 반영했다. 단계 1의 산출물은 [OSR 계약 · 시험 벡터](osr/README.md)다.
**v0.2에서 바뀐 것:** 2026-11-17 Jupiter의 계획 검토를 반영했다(§14). 단계 순서를 검토 권장 순서로 다시 짰고, M2~M5의 순환 의존을 끊었다. 권한 · 인계 · 서명 · 클래스별 설치 · 독립 복구 계약을 고쳤다. 기존 목록의 이관 단위와 착수 기준을 바로잡았다.
**상위 문서:** [OpenSphere Registry(OSR) 규격 v0.2](OPENSPHERE-REGISTRY-OSR-v0.2.md)(이하 "규격")
**대상 저장소:** OpenSphere-Backbone(Gitea). 분리 브랜치 → Gitea PR → 필수 CI(`source-check`, 의존성 정책 포함) → main 병합. 운영 반영은 공개 Setup 릴리스로만.

---

## 0. 착수 기준과 선행 조건

- **기준 소스:** Backbone main `6eb014e`(Console22 반영). v0.1의 `f04476e`는 작성 시점 기준이었다.
- **의존성 정책(선행 조건):** 지금 chrono 한시 예외(`governance/dependency-exceptions/chrono-20261117.json`)는 범위가 "Console UI delivery only"이고 2026-11-24까지다. 그동안 `backend/**` · `infra/**` · `cli/**` 등은 지문으로 동결돼 있다. **OSR 개발은 이 예외를 상속하지 못한다.** backend · infra · cli를 바꾸는 단계는 다음 중 하나가 있어야 시작한다.
  - chrono 의존성 해소(대체 또는 패치)와 동결 해제
  - OSR 범위에 대한 별도의 명시 결정
- **그 전에 할 수 있는 일:** 단계 1(계약 정리)은 Blueprint의 계약 · 시험 벡터로만 한다. Backbone 동결 범위를 건드리지 않는다.
- **다른 PR의 필수 CI 실패:** OSR PR은 다른 PR의 실패를 덮거나 우회하지 않는다. 착수 시점 main의 필수 CI 상태를 먼저 확인한다.

## 1. 목표와 범위

**목표:** 첫 모듈 `provider.postgres` 하나로 다음 수직 경로를 실증한다. 발행 → 형식 판정 → 승인 → 공개 Setup 설치 → 기여 사용 → 실질 판정 → 회수 · 복구. 이 경로가 모듈마다 새 코드를 쓰지 않고 데이터와 승인된 profile로 동작해야 한다. 실행하지 않는 어셈블리 하나도 계약 단계부터 함께 다룬다.

| 범위 안 | 범위 밖(후속) |
|---|---|
| OSR 원장 · 판정 · 읽기 API · OS CLI | 영역의 Claim · 어셈블리 구성 화면(회사 관리 콘솔) |
| 4종 기여(매뉴얼 · 명령 · OCI · 지식)의 계약 · 오프라인 검증 · 수집 · 사용 | 서드파티 조직 발행(OSR-G) |
| Provider 1종 profile, 어셈블리 정의 등록 | 의미 검색 · vector DDL(OSR-F) |
| Core OSR 승인 범위 adapter, 제한 실행부, `apply-module` | 범용 재판정 scheduler |
| 회수 · 재개 · 독립 복구 실증 | 기존 고정 명령의 전면 흡수(단계 6에서 profile별로) |

## 2. 목표 구조

```text
 모듈 저장소(Gitea) ── 발행 툴체인 ──▶ GHCR
                                        번들(index: 실행 manifest · 디스크립터 · 기여 artifact)
                                        referrer(subject=번들): 서명 evidence · SBOM · 출처
                                        채널 카탈로그(sequence · 만료 · 서명)
 ┌──────────────────────────────── Backbone ────────────────────────────────┐
 │ OS CLI / Console / R2D2(읽기)                                             │
 │      │ 읽기            │ 명령(osr.command.execute)                         │
 │      ▼                 ▼                                                   │
 │  Nexus(회원 · 위임 · 사전 감사 · 예산) ──▶ OSR 서비스                        │
 │                          ├ 오프라인 검증기(기여 4종 · capability · 의존)   │
 │                          ├ 명령 레지스트리 · 유효 권한 계산               │
 │                          ├ 매뉴얼 · 지식 수집기                           │
 │                          └ osr 스키마(원장 · 판정+평가 맥락 · 설치본 관측) │
 │  Execution Core ── OSR 승인 범위(adapter) ── 승인 · 멱등 · outbox          │
 │        │ 승인 영수증                                                       │
 │        ▼                                                                   │
 │  제한 실행부 ── 공개 Setup `apply-module`(profile별 materializer) ──▶ 설치본 │
 └────────────────────────────────────────────────────────────────────────────┘
 독립 복구: offline bundle + 기존 설치 기록 + 독립 복구 자격 → Setup (OSR · Core 없이)
```

**자리 배치(Backbone 저장소, 제안)**

| 구성 | 위치 |
|---|---|
| OSR 서비스(Rust) | `backend/server/src/osr.rs`(원장 · 판정), `osr_verify.rs`(오프라인 검증기), `osr_commands.rs`(명령 · 유효 권한), `osr_ingest.rs`(매뉴얼 · 지식 수집) |
| Core adapter | `backend/server/src/approval.rs`에 `osr` 승인 범위, `execution.rs`에 OSR 작업 shape |
| DB | `infra/osr/001-ledger.sql`(원장 · 판정), `002-installations.sql`(설치본 관측), `003-contributions.sql`(명령 · 매뉴얼 · 지식) |
| 계약 · 벡터 | 단계 1은 Blueprint, 동결 해제 후 `infra/contracts/osr/`로 옮김 |
| 발행 툴체인 | `scripts/osr/`(번들 · referrer · 채널 카탈로그), 모듈 저장소용 재사용 워크플로 |
| OS CLI | `cli/cmd/os/osr.go`, `oci.go`, `manual.go`(물려받은 `shell_commands.go` 재사용) |
| Setup | `setup/src/apply-module.mjs`, profile 정의 `setup/src/profiles/`, `registry-reader.mjs` 확장 |
| Console | OSR 화면(Carbon v12, Carbon 전환 병합 뒤) |
| 시험 | 단위 · 계약 벡터 · 격리 native fixture · `tests/osr/` live |

## 3. 핵심 설계

### 3.1 고정 dispatch 계약 + 모듈 정책 레코드

- 카탈로그에는 고정 OSR 액션만 넣는다(목록 · 조회 · 판정 · 설치본 · 매뉴얼 · 지식 · 명령 목록 · `osr.command.execute` · 등록 · 계획 · 회수).
- **정책 digest가 한 번 바뀐다는 것은 이 고정 dispatch 계약에만 해당한다.** 모듈별 허용 capability · review 정책은 OSR 정책 레코드로 두고 **revision을 따로 추적**한다. 새 권한 종류(새 profile, 새 capability)가 생기면 Backbone 검토와 바이너리 · 정책 변경이 다시 필요할 수 있다.
- **유효 권한** = 플랫폼 허용 capability(모듈 · profile 정책 레코드) ∩ 호출자 현재 권한 · 위임 범위 ∩ 대상 · 설치본 scope ∩ Owner 최종 검사. 발행자의 kind · `requiredPermissions` 선언은 요청이다.
- **예산:** kind 이름이 아니라 명령의 `effect`와 profile이 정한 비용 등급으로 나눈다. canary 검증 · 원장 조정은 짧은 조회 예산에 넣지 않는다.

### 3.2 `core` 레코드 이관(바로잡음)

- 서버 카탈로그 12모듈 → `core` **모듈** 레코드.
- Nexus 인벤토리 38행(공통 10 · 부분 14 · 후보 12 · 계약만 2) → 해당 모듈에 연결된 **operation** 레코드.
- 기존 `member` 표시는 OSR에서 **미판정**이다. 서명 · 기여 검증 없이 형식적 멤버로 올리지 않는다.

### 3.3 Core 승인 adapter

- 지금 Core 승인 범위는 `execution` · `trial` · `release`뿐이다. OSR 작업은 이 범위 중 하나를 그대로 부를 수 없다.
- `osr` 승인 범위를 계약으로 더한다. 승인 대상은 다음을 묶은 설치 계획이다: 번들 digest, **공개 Setup 산출물의 이름 · 판 · digest**, **materializer profile의 ID · 판 · 지문**, **해석된 의존 모듈의 번들 digest · 설치 generation**, **정규화한 실행 계획(생성할 자원 · 권한 · 저장 binding)의 digest**, 승인 당시 정책 revision · 신뢰 세대, 대상(설치 ID · 네임스페이스 · fence). 실행 영수증은 같은 값을 돌려주고, 실행 시 대상 fence를 다시 검사한다. 승인한 바이트 · 권한과 실행한 바이트 · 권한이 다르면 거절한다. 독립 CLI 서명 · 90초 challenge 같은 기존 보호를 그대로 쓴다.
- 등록 · 오프라인 검증처럼 대상에 효과가 없는 작업은 실행 원장에 기록하지만 사람 보호 승인을 걸지 않는다.

### 3.4 명령 인계 신뢰

- **읽기 · 저위험 검증:** OSR 서비스가 Owner로 바로 넘긴다. 인계 증명에 issuer · audience, 설치 ID, 모듈 ID · 번들 digest · 설치 generation, 명령 ID와 인자 hash, 서버가 정한 actor · 위임 범위, requestId, 만료(짧게)를 묶어 서명한다. Owner가 이 값을 검증한다.
- **쓰기(mutation · destructive):** Core 승인 · 실행 증거를 재사용한다. 위 값에 operationId · 승인된 계획 revision · 멱등 키 · 대상 revision/fence를 더한다. Console이 혼자 발급할 수 있는 토큰 하나로 쓰기를 허가하지 않는다.
- **거절 규칙:** 만료 · 회수된 키 세대 · 재전송(같은 requestId, 다른 인자) · 오래된 reviewRevision(409).
- **네트워크 제한은 보조 통제다.** Backbone → 모듈 관리 명령 endpoint만 열고, 사용자 데이터 endpoint와 혼동하지 않는다.
- **키:** 모듈 배포 서명 키(OSR 신뢰 키), 사람 승인 키(Core), 인계 서명(Core 실행 증거 재사용)을 목적 · 운영 권한으로 구별한다. 새 키 체계마다 새 서비스를 만들지 않는다.

### 3.5 클래스별 materializer profile

| 클래스 | 첫 profile | 내용 |
|---|---|---|
| `provider` | `provider.stackgres-pg` | `provider.postgres` 전용. **StackGres SGCluster 하나로 고정**(StatefulSet 직접 생성 없음). 저장 binding · 연결 Secret 참조 · 실검증 · NetworkPolicy를 profile이 정한다. Deployment 하나로 단순화하지 않는다 |
| `assembly` | `assembly.definition` | 워크로드 없음. 정의 artifact 등록, 의존 모듈 실질 상태 확인, 구성 가능성 판정 |
| `hiss` | (단계 6) | 고권한. resource · verb · scope · host 접근 · exec · Secret · RBAC escalation · NetworkPolicy 범위를 고정한 뒤 별도 검토 |

profile 정의는 OSR 데이터가 아니라 Backbone 소스(Setup)에 있고 검토 대상이다. 모듈은 profile을 고르기만 한다.

### 3.6 OSR 원장과 Core 투영

- OSR은 모듈 · 릴리스 · 기여 · 판정 · 설치본 관측을 소유한다. 실행 · 승인 · 멱등 · outbox는 Core가 소유한다.
- 두 DB에 원자적으로 동시에 쓴다고 가정하지 않는다. OSR 설치본 행은 operationId · generation을 들고, Core 최종 영수증을 읽어 투영을 맞춘다. 어긋나면 `Unknown`으로 두고 영수증을 기다린다.
- 판정 pass 행은 권한 증명이 아니다. 실행 때마다 유효 권한을 다시 계산한다.

## 4. 데이터 모델 (`osr` 스키마, 제안)

| 테이블 | 핵심 열 | 불변 조건 |
|---|---|---|
| `osr.modules` | `id`, `class`, `owner`, `display_name`, `aliases[]`, `reserved`, `retired_at` | ID 재사용 금지 |
| `osr.releases` | `bundle_digest`(PK), `module_id`, `version`, `compatibility_version`, `descriptor`, `source_revision`, `registered_at` | 행 불변. (module, version) 유일 |
| `osr.artifacts` | `bundle_digest`, `type`, `digest`, `media_type`, `size` | 디스크립터 digest와 일치 |
| `osr.signatures` | `bundle_digest`, `referrer_digest`, `key_id`, `trust_generation`, `expires_at` | 재서명은 행 추가. 릴리스 행은 그대로 |
| `osr.trust_keys` | `key_id`, `module_id`, `algorithm`, `public_key`, `state`, `generation` | 독립 운영자 경로만 쓰기 |
| `osr.policies` | `module_id`, `profile`, `allowed_capabilities`, `revision` | 모듈 정책 revision 추적(§3.1) |
| `osr.verdicts` | `bundle_digest`, `installation_id`, `level`, `result`, `codes[]`, `evaluated_at`, `policy_revision`, `trust_generation`, `contract_version` | 추가만. 평가 맥락 필수 |
| `osr.channel_catalogs` | `channel`, `sequence`, `digest`, `issued_at`, `expires_at` | sequence 단조 증가, 낮은 값 거절 |
| `osr.installations` | `installation_id`, `module_id`, `bundle_digest`, `state`, `operation_id`, `generation`, `storage_binding` | 상태는 Core 영수증 투영 |
| `osr.revocations` | 대상(번들 · 키), 사유, 결정자 | §8.3 회수 정책 |
| `osr.operations` | 인벤토리 이관 행(액션 · 경로) ↔ `module_id` | 모듈과 분리 |
| `osr.commands` | 번들 · 명령 ID · kind · effect · 인자 스키마 · 요청 권한 | ID 접두어 = 모듈 ID |
| `osr.manual_documents` · `osr.knowledge_documents` | 모듈 · 번들 · 문서 ID · 메타데이터 · 체크섬 · 원문 | 모듈 범위 격리. **vector 열 없음** |
| `osr.ingestion_receipts` | 설치본 · 종류 · 수 · digest · 결과 | 실질 판정 근거 |
| `osr.audit` | 모든 이벤트 | Core 감사와 상관 ID |

역할: `osr_migrator`(DDL), `osr_runtime`(읽기 · 판정 · 수집 삽입, 신뢰 키 · 정책 쓰기 없음), `osr_keyops`(신뢰 키 · 정책, 독립 운영자 경로).

## 5. 단계별 계획

검토 권장 순서를 따른다. 각 단계의 완료 기준은 "실제로 무엇이 동작하는가"로 적는다.

### 단계 1 — 계약 정리(Backbone 동결 범위 밖)

| 산출물 | 내용 |
|---|---|
| 계약 스키마 | 디스크립터, 번들 구조, referrer 서명 payload(SBOM · 출처 digest 포함), 검증 맥락 snapshot, 채널 카탈로그(authority × 채널 sequence), 기여 4종(클래스별 형식), 명령 `effect`, 유효 권한 계산 규칙, 설치 계획(Setup · profile · 의존 · 실행 계획 binding), 실행 영수증, 어셈블리 정의 |
| canonicalization | 서명 대상 bytes 규칙(예: RFC 8785) |
| 시험 벡터 | `provider.postgres` 정상 번들 + 변조 변형(서명 · digest · 만료 · 저장소 · 키 범위 · 신뢰 세대 · capability 초과 · 기여 누락), `assembly.mail` 정상 · 거절 정의, 채널 카탈로그 재생 |
| profile 초안 | `provider.stackgres-pg`, `assembly.definition` |
| **완료 기준** | 결정 기록(§12) 승인. 벡터의 기대 판정 · 사유 코드 고정. 원장 · API 배포는 필요 없음 |
| **진행(2026-11-18)** | [OSR 계약 · 시험 벡터](osr/README.md): 스키마 16개, canonicalization 규칙, profile 초안 2개, 참조 검증기, 벡터 74개(canonical 7 · 릴리스 28 · 어셈블리 7 · 카탈로그 8 · 실행 9 · 복구 7 · 권한 8). §12 결정 승인은 남음 |

### 단계 2 — 오프라인 형식 검증과 최소 읽기 원장

선행: §0 의존성 정책 해소.

| PR | 내용 |
|---|---|
| 2-1 | `infra/osr/001-ledger.sql`(modules · releases · artifacts · signatures · trust_keys · policies · verdicts · channel_catalogs · revocations · operations · audit) · 역할 3종. 격리 fixture 시험 |
| 2-2 | `osr_verify.rs`: 규격 §9 **1~9단계 전체**(기여 4종 계약 · capability · 의존 · 호환 포함). 세 언어(Rust · Node · Go) 벡터 일치 |
| 2-3 | 발행 툴체인 `scripts/osr/`: 번들 · referrer · SBOM · 출처 · 채널 카탈로그. 기존 발행 원장 · OCI 도구 재사용. 기존 필수 CI 위에 채널 조건을 얹음 |
| 2-4 | `core` 모듈 12개 · operation 38행 이관(미판정 표시). 읽기 API · 고정 query 액션. 카탈로그 · 정책 digest 정합 시험 갱신(약화 금지) |
| 2-5 | OS CLI `os osr list / get`, `os oci inspect / verify / pull`, `os osr register` |
| **완료 기준** | `provider.postgres` edge 번들이 GHCR에 발행되고, 오프라인 검증으로 형식적 멤버가 된다. 변조 벡터 전부가 기대 사유 코드로 거절된다. 검증되지 않은 이관 자료는 미판정으로 보인다 |

### 단계 3 — 최소 설치본 원장과 승인 계획

| PR | 내용 |
|---|---|
| 3-1 | `infra/osr/002-installations.sql` 최소형(설치본 · operationId · generation · storage_binding · 상태) |
| 3-2 | Core `osr` 승인 범위 adapter(§3.3). 계획 · 산출물 · 대상 · revision 묶음 |
| 3-3 | `osr.module.plan`: 의존 · profile · 저장 binding(Foundation 관문) · 대상 fence → 계획 revision |
| 3-4 | 제한 실행부 계약: 승인 영수증 입력 → Setup 실행 → 적용 영수증 반환. 설치 범위 자격만 받음 |
| **완료 기준** | 격리 시험 설치에서 계획 → 승인 → 제한 실행부 호출까지 영수증으로 이어진다(Setup은 아직 무변경 시험 모드여도 됨). 저장 선택 · 활성화 원칙이 그대로다 |

### 단계 4 — 한 모듈 수직 실증(`provider.postgres`)

| PR | 내용 |
|---|---|
| 4-1 | `setup/src/apply-module.mjs` + `provider.stackgres-pg` profile. 공개 Setup 릴리스로 발행 |
| 4-2 | `003-contributions.sql` 명령 부분 + `osr_commands.rs`: 명령 레지스트리, 유효 권한 계산, 인계 증명, 검증 capability |
| 4-3 | 매뉴얼 · 지식 수집(`osr_ingest.rs`), 지식 API · MCP 검색 범위 확장(출처 · 회수 표시) |
| 4-4 | 실질 판정(§9 10~12단계) |
| **완료 기준** | 운영 RKE2의 **격리 시험 네임스페이스**에서 공개 Setup으로 `provider.postgres`가 설치된다. 검증 capability로 `status` · `inspect` · `verify`가 응답하고, 매뉴얼 · 지식 수집 영수증이 생기고, 실질적 멤버가 된다. 운영 기본 PG를 대체하거나 실사용 데이터를 복제하지 않는다. 수동 설치 · 임의 권한 부여로 순환을 숨기지 않는다 |

### 단계 5 — 실패 · 회수 · 재개 · 복구

| 시험 | 기대 |
|---|---|
| 응답 유실 | `Unknown`, 같은 영수증 확인 전 재시도 없음 |
| 권한 회수 · 위임 만료 | 신규 인계와 아직 확정되지 않은 효과의 최종 검사에서 거절. 이미 확정된 효과를 자동 취소 · 롤백하지 않음 |
| 의존 · 설정 변경 | 저하 → 재판정 |
| 재시작 · 같은 작업 재개 | 무변경 종료 가능 |
| 릴리스 · 키 회수 | §8.3대로 신규 설치 · 새 변경 금지, 관측 · 진단 · 안전 복구 허용 |
| 안전한 퇴역 | 신규 쓰기 차단 → 회수 → 보존 → 승인된 삭제, 부분 완료 재개 |
| 기존 고정 작업 재개 | 기존 `apply-*` 명령의 과거 작업이 새 경로와 무관하게 재개 |
| **OSR 중단 시 복구** | OSR · Core 없이 offline bundle · 기존 설치 기록 · 독립 복구 자격으로 원래 설치 복구 |
| **완료 기준** | 위 시험이 영수증으로 남고, 회수 훈련 1회와 OSR 중단 복구 훈련 1회가 통과 |

### 단계 6 — 외연 확장

| 항목 | 내용 |
|---|---|
| 어셈블리 | `assembly.mail` 정의 등록 → 의존 모듈 실질 상태 → 구성 가능 |
| 추가 Provider · HISS profile | HISS 고권한 profile은 별도 검토 후 |
| 채널 승격 | candidate · stable 1회 |
| 화면 · 발견 · R2D2 | Console OSR 화면 완성, R2D2의 승인된 도구 연결(별도 승인) |
| 기존 명령 흡수 | 검증된 profile별로, 기능별 adapter. 과거 operation · UID · spec · migration · issuer 증거와 무변경 재개 보존 |

**병행:** 단계 4의 명령 · 수집 parser와 저장은 단계 2~3과 병행해 만들 수 있다. 그러나 실질 판정 완료는 단계 3의 설치본 원장과 단계 4의 실제 설치 영수증이 있어야 한다. PR 개수보다 이 의존과 단계별 완료 기준이 중요하다.

## 6. 시험 · 검증 전략

| 층 | 내용 |
|---|---|
| 단위 | 사유 코드마다 시험 1개 이상, 유효 권한 교집합의 각 항 |
| 계약 벡터 | 단계 1 벡터를 Rust · Node · Go가 같은 bytes · 판정으로 |
| fixture | 계약 단위 검사(오프라인 · 기여 parser) — 실설치 검사와 구분해 보고 |
| 격리 native | 별도 PG · 역할로 마이그레이션 · grant |
| live | 운영 RKE2 격리 시험 네임스페이스 · 신원 · 자원. localhost RKE2 복구 금지 |
| 재개 호환 | 새 이미지 적용과 옛 작업 재개 호환을 별개 수용 기준으로 |
| UI | axe 0건, 390px 넘침 없음 |

## 7. 보안 · 권한 경계

- 발행자 선언은 요청이다. 유효 권한은 교집합이다(§3.1).
- 쓰기 인계는 Core 승인 · 실행 증거로만(§3.4).
- 신뢰 키 · 모듈 정책 쓰기는 독립 운영자 경로만. Console 쓰기 없음.
- 지식은 근거일 뿐이고 명령 · 정책 · Memory가 아니다. 패턴 검사는 보조다.
- 일반 소스 Runner에 운영 kubeconfig를 주지 않는다. 제한 실행부는 설치 범위 자격만.
- 공개 Blueprint에 키 · 내부 주소 · 운영 로그를 싣지 않는다.

## 8. 위험과 대응

| 위험 | 대응 |
|---|---|
| 모듈 선언을 통한 권한 상승 | 교집합 · profile 고정 · Owner 최종 검사 |
| Console 발급 토큰으로 보호 쓰기 우회 | 쓰기는 Core 승인 증거로만 |
| 서명 그래프 자기 참조 | referrer 분리 · canonicalization 벡터 |
| 재생 공격(옛 카탈로그 · 서명) | sequence · 만료 · 신뢰 세대 |
| 순환 의존으로 실증을 수동으로 메움 | 검증 capability, 설치본 원장 선행 |
| OSR 장애가 복구를 막음 | 독립 복구 경로, 훈련 1회 필수 |
| 원장 투영 어긋남 | operationId · generation · 영수증, Unknown |
| 기존 고정 작업 재개 파손 | 흡수는 단계 6, 재개 호환 수용 기준 |
| 의존성 동결 | §0 선행 조건 |

## 9. 단계별 의존

```text
 단계 1 ──▶ (§0 동결 해소) ──▶ 단계 2 ──▶ 단계 3 ──▶ 단계 4 ──▶ 단계 5 ──▶ 단계 6
                                 └── 명령 · 수집 parser는 단계 2~3과 병행 가능
```

## 10. 바로 할 일

1. **단계 1:** Blueprint에 계약 스키마 · canonicalization · 시험 벡터(`provider.postgres`, `assembly.mail`) · profile 초안 2개를 둔다. Backbone 동결 범위는 건드리지 않는다.
2. **§0 선행 조건 확인:** chrono 해소 일정 또는 OSR 범위 결정.
3. **§12 결정:** 특히 OSR-K(유효 권한), OSR-L(고권한 profile), OSR-H(제한 실행부 경로).

## 11. 산출물 위치 요약

| 단계 | 저장소 | 위치 |
|---|---|---|
| 1 | Blueprint | [`docs/specs/osr/`](osr/README.md)(스키마 · 벡터 · profile 초안) |
| 2~6 | Backbone | §2 자리 배치 |

## 12. 선결 결정

| 결정 | 권고 | 영향 단계 |
|---|---|---|
| OSR-A "OCI 명령" | digest로 검사 · 검증 · 받는 OS CLI 명령 | 2 |
| OSR-B ID 체계 | `<class>.<slug>` | 1 |
| OSR-C 버전 형식 | `YY.MDD.HHMM.BUILD` + SemVer | 1 |
| OSR-D 서명 | P-256 referrer, canonicalization 고정 | 1 |
| OSR-E 수집 시점 | 설치 때 | 4 |
| OSR-F 지식 · 의미 검색 | PG 원장, vector는 후속 migration | 4 |
| OSR-H 설치 경로 | Core 승인 → 제한 실행부 → 공개 Setup | 3 |
| OSR-K 유효 권한 | 교집합 + 모듈 정책 revision | 1 |
| OSR-L 고권한 profile | 고정 항목 + Backbone 검토 | 6 |
| OSR-M 회수 정책 | 규격 §8.3 | 5 |
| 의존성 정책 | chrono 해소 또는 OSR 범위 결정 | 2 |

## 13. v0.1과의 차이

| v0.1 | v0.2 |
|---|---|
| M0~M6, OCI 먼저 → 명령 → 매뉴얼 · 지식 → 설치 | 계약 → 형식 검증 · 읽기 원장 → 설치본 원장 · 승인 → 수직 실증 → 실패 · 복구 → 외연 |
| 정책 digest가 한 번 바뀐다 | 고정 dispatch 계약에만 해당, 모듈 정책 revision 따로 추적 |
| 60초 admission 토큰 | 읽기는 인계 증명, 쓰기는 Core 승인 증거 재사용 |
| 일반 설치가 Deployment · Service 생성 | 클래스별 materializer profile, 어셈블리는 실행 없음 |
| 서명 봉투를 인덱스 주석에 | 서명 evidence는 referrer |
| 같은 릴리스는 같은 판정 | 평가 맥락에 묶인 판정 |
| 회수는 신규 설치만 차단 | 신규 설치 · 새 변경 · 현재 서비스 · 진단 · 복구별 정책 |
| 인벤토리 후보 26개를 core 모듈로 | 12모듈은 모듈, 38행은 operation, member는 미판정 |
| nullable vector 열 | vector DDL은 후속 migration |
| 기준 `f04476e` | 기준 `6eb014e`, chrono 동결 선행 조건 |

## 14. 검토 반영

2026-11-17 Jupiter의 "OSR 확장 구현 계획 검토"를 반영했다.

| 검토 항목 | 반영 |
|---|---|
| A. 고정 액션 ≠ 동적 명령 권한 정책 | §3.1, 규격 §7.2 |
| B. admission 토큰 신뢰 공백 · Setup 호출 주체 | §3.3 · §3.4, 단계 3-4 |
| C. Provider와 어셈블리 | §3.5, 규격 §4 |
| D. M2~M5 순환 의존 | §5 단계 재구성, 검증 capability, §9 |
| E. OCI digest · 서명 · 재서명 | 규격 §10, 단계 1 벡터 |
| F. OSR 장애 시 독립 복구 | 단계 5, 규격 §12 |
| 기존 목록 이관 | §3.2 |
| 회수 정책 | 단계 5, 규격 §8.3 |
| OSR 원장과 Core | §3.6 |
| 재검증 상태 | 규격 §8.4 |
| 지식과 Memory | §7, 규격 §7.4 |
| 의미 검색 DDL | §4(vector 없음) |
| 채널 최소 검사 | 단계 2-3, 규격 §10 |
| 현재 착수 기준 · chrono | §0 |
| 권장 구현 순서 | §5 |
