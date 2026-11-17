# OSR · 4종 인프라 종합 구현 계획서 v0.1

> **대체됨(2026-11-18):** 이 판은 [v0.2](OSR-IMPLEMENTATION-PLAN-v0.2.md)로 대체됐다. 2026-11-17 계획 검토를 반영한 v0.2를 기준으로 읽는다. 이 문서는 기록으로 남긴다.

**상태:** 구현 계획 초안이다. 결정 대장에 오른 결정도, 구현 승인도 아니다. 착수 전에 §12의 선결 결정이 필요하다.
**작성:** 2026-11-17 · Claude(설계 검토 AI)
**상위 문서:** [OpenSphere Registry(OSR) 규격 v0.1](OPENSPHERE-REGISTRY-OSR-v0.1.md)(이하 "규격"), 특히 부록 A(Backbone 준비도 점검)
**대상 저장소:** OpenSphere-Backbone(Gitea, main `f04476e` 기준). 구현은 Backbone 규칙대로 분리 브랜치 → Gitea PR → 필수 CI(`source-check`) → main 병합 순서로 하고, 운영 반영은 공개 Setup 릴리스로만 한다.

**이 문서가 답하는 질문:**
- OSR과 그것을 받치는 4종 인프라(매뉴얼 · OS Shell 명령 · OCI · 지식)를 Backbone 어디에 어떻게 만드는가.
- 어떤 순서로, 어떤 PR 단위로, 무엇을 완료 기준으로 만드는가.
- 지금 Backbone의 제약(고정 카탈로그 · 정책 digest · Setup 전용 설치 · 저장 관문)과 어떻게 맞추는가.

---

## 1. 목표와 범위

**목표:** 외부 모듈 하나(첫 실증: `provider.postgres`)가 GHCR에 규격대로 발행되면, Backbone이 그것을 OSR에 등록 · 검증해 형식적 멤버로 만들고, 승인된 설치를 거쳐 실질적 멤버로 판정할 수 있게 한다. 이 경로가 모듈마다 새 코드를 쓰지 않고 데이터로 동작해야 한다.

| 범위 안 | 범위 밖(후속) |
|---|---|
| OSR 원장 · 판정 · API · Console 화면 · OS CLI | 영역의 Claim · 어셈블리 구성 화면(회사 관리 콘솔) |
| I1 매뉴얼 원장과 설치 때 수집 | 서드파티 조직 발행(OSR-G) |
| I2 명령 레지스트리와 owner 전달 게이트웨이 | 의미 검색(pgvector) 활성화 — 스키마만 준비 |
| I3 OCI 발행 · 서명 · 검증 툴체인과 채널 카탈로그 | candidate · stable 승격 자동화(단계 6에서 수동 1회) |
| I4 지식 원장과 설치 때 수집 | Governance 배분 연동 |
| 일반 설치 명령 `apply-module`과 실질 판정 | 기존 모듈별 Setup 명령의 완전 폐기(단계 6에서 흡수 시작) |

## 2. 목표 구조

```text
 모듈 저장소(Gitea)                         GHCR
   └─ 모듈 발행 워크플로(I3 툴체인) ──────▶ opensphere-<class>-<slug>
        이미지 · 서명 봉투 · 명령 계약 · 매뉴얼 · 지식 · SBOM · 출처      │
                                                                         │ 채널 카탈로그(서명)
 ┌────────────────────────── Backbone ──────────────────────────────┐  │
 │  OS CLI / Console / R2D2                                          │  │
 │        │ (읽기)                       (쓰기: Core 승인)            │  │
 │        ▼                                    ▼                     │  │
 │  Nexus ── 고정 OSR 액션 ──▶ OSR 서비스(backend/server/src/osr*) ◀─┼──┘
 │                              │  I3 OCI 검증기 · 신뢰 키
 │                              │  I2 명령 레지스트리 · owner 전달
 │                              │  I1 매뉴얼 수집기   I4 지식 수집기
 │                              ▼
 │                      관리 PG: osr 스키마(원장 · 판정 · 설치본 · 기여)
 │                              │
 │  Execution Core(승인 · 의도 · 멱등) ──▶ Setup `apply-module` ──▶ 설치본
 └────────────────────────────────────────────────────────────────────┘
```

**자리 배치(Backbone 저장소 기준, 제안)**

| 구성 | 위치 |
|---|---|
| OSR 서비스(Rust) | `backend/server/src/osr.rs`(원장 · 판정), `osr_oci.rs`(I3 검증기), `osr_commands.rs`(I2), `osr_manual.rs`(I1), `osr_knowledge.rs`(I4) |
| DB 마이그레이션 | `infra/osr/001-ledger.sql`, `002-contributions.sql`, `003-installations.sql`, 역할 · grant 분리 |
| 계약 스키마 | `infra/contracts/osr/*.schema.json`(디스크립터 · 서명 봉투 · 채널 카탈로그 · 기여 4종) + 시험 벡터 |
| 발행 툴체인 | `scripts/osr/module-release.mjs`, `scripts/osr/channel-catalog.mjs`, 모듈 저장소용 재사용 워크플로 `.gitea/workflows/osr-module-publish.yaml` |
| OS CLI | `cli/cmd/os/osr.go`, `oci.go`, `manual.go`(물려받은 `shell_commands.go` · `module_update.go` 재사용) |
| Setup | `setup/src/apply-module.mjs`(일반 설치), `registry-reader.mjs` 확장 |
| Console | OSR 메뉴(카탈로그 · 릴리스 · 판정 · 설치본 · 신뢰 키 · 회수), 매뉴얼 보기 — Carbon v12 기준 |
| 시험 | `backend/server` 단위 시험, `tests/osr/`(계약 벡터 · 격리 native fixture · live) |

## 3. 핵심 설계 결정

### 3.1 고정 액션 + 데이터 레코드 — 정책 digest 충돌 해소

부록 A에서 확인한 가장 큰 걸림돌은 카탈로그 · 정책 digest가 Console · Core 바이너리에 함께 박혀 있다는 점이다. 모듈마다 액션을 더하면 매번 두 바이너리를 다시 빌드해야 한다.

**해법:** OSR은 **고정된 소수의 액션**만 카탈로그에 더한다. 모듈의 명령 · 매뉴얼 · 지식은 액션이 아니라 **OSR 데이터 레코드**다.

| 고정 액션(한 번만 추가) | kind | 경로 |
|---|---|---|
| `osr.modules.list`, `osr.module.get`, `osr.release.get`, `osr.verdicts.list`, `osr.installations.list` | query | 읽기 직행 |
| `osr.manual.read`, `osr.knowledge.search` | query | 읽기 직행 |
| `osr.commands.list` | query | 현재 설치의 모듈 명령과 `reviewRevision` |
| `osr.command.execute` | command | 명령 레코드로 권한 판단 → read는 owner 직행, apply 계열은 Core 승인 |
| `osr.release.register`, `osr.release.verify`, `osr.module.plan`, `osr.module.revoke` | command | Core 운영 의도 · 승인 |

이렇게 하면 정책 digest는 OSR 액션을 넣을 때 **한 번** 바뀌고, 그 뒤 모듈이 늘어도 바뀌지 않는다. 모듈 명령의 허용 여부는 정책 상수가 아니라 OSR 명령 레코드(kind · requiredPermissions · 설치본 상태)와 Core 승인이 정한다. Nexus의 사전 감사 · 예산 · 현재 권한 확인은 `osr.command.execute`에 그대로 걸린다.

### 3.2 `core` 레코드와 외부 모듈의 분리

- Backbone 자체 구성요소(지금 카탈로그의 12모듈, 인벤토리 후보 26개)는 OSR에 `class=core`로 **읽기 전용 이관**한다. 출처는 계속 소스 상수이고, OSR은 그 digest와 판 정보를 기록만 한다.
- 외부 모듈은 등록 · 검증 · 설치 · 회수가 모두 OSR 데이터로 움직인다.
- Nexus 인벤토리의 member · partial 판정은 그대로 두고, OSR 형식 판정과 대응표만 둔다(규격 §8.2).

### 3.3 설치는 Setup, 판단은 Core

- OSR은 설치하지 않는다. `osr.module.plan`이 계획과 검토 revision을 만들고, Execution Core가 승인을 받는다.
- 실제 적용은 공개 Setup의 `apply-module`이 승인 영수증과 digest를 받아서 한다. Backbone 규칙(설치 · 확장은 공개 Setup CLI로만)을 지킨다.
- 결과 불명은 `Unknown`이다. 같은 요청 영수증을 확인하기 전에 재시도하지 않는다.

### 3.4 owner 전달 신원

- 모듈 owner 엔드포인트는 Backbone만 부를 수 있다. 네트워크 정책으로 Backbone → 모듈 경로만 연다.
- 요청마다 Backbone이 짧은(60초) **owner admission 토큰**을 서명해 붙인다. 내용은 설치 ID, 모듈 ID, 명령 ID, requestId, reviewRevision, actor(서버가 정한 값), 만료다. 모듈은 OSR이 배포한 공개키로 검증한다.
- 호출자 body의 actor · plane은 믿지 않는다(Backbone 기존 원칙).

## 4. 데이터 모델 (`osr` 스키마, 제안)

| 테이블 | 핵심 열 | 불변 조건 |
|---|---|---|
| `osr.modules` | `id`(PK, `<class>.<slug>`), `class`, `owner`, `display_name`, `aliases[]`, `reserved`, `created_at`, `retired_at` | ID 재사용 금지. 퇴역해도 행 보존 |
| `osr.releases` | `digest`(PK), `module_id`, `version`, `compatibility_version`, `channel`, `descriptor`(jsonb), `envelope`(jsonb), `source_revision`, `registered_at` | 같은 digest 행은 바꾸지 않음. (module, version) 유일 |
| `osr.release_artifacts` | `release_digest`, `type`(commands · manual · knowledge · sbom · provenance · runtime), `digest`, `media_type`, `size` | 디스크립터 해시와 일치해야 삽입 |
| `osr.trust_keys` | `key_id`, `module_id`, `algorithm`, `public_key`, `state`(active · revoked), `added_by`, `revoked_at` | 등록 · 회수는 독립 운영자 경로만. Console 쓰기 금지 |
| `osr.verdicts` | `id`, `release_digest`, `installation_id`(nullable), `level`(formal · substantive), `result`(pass · reject · unknown), `codes[]`, `contract_fingerprint`, `evidence`(jsonb), `decided_at` | 추가만(append-only). 지우지 않음 |
| `osr.channel_pointers` | `module_id`, `channel`, `release_digest`, `catalog_digest`, `updated_at` | (module, channel)당 digest 하나 |
| `osr.installations` | `installation_id`, `module_id`, `release_digest`, `state`(installing · verifying · substantive · degraded · suspended · retiring · retired · failed · unknown), `operation_id`(Core), `generation` | 상태 변경은 Core 영수증과 연결 |
| `osr.revocations` | `release_digest` 또는 `key_id`, `reason`, `decided_by`, `decided_at` | 회수는 신규 설치만 막음 |
| `osr.audit` | 모든 등록 · 판정 · 수집 · 회수 이벤트 | Core 감사와 상관 ID 공유 |
| `osr.manual_documents` | `module_id`, `release_digest`, `doc_id`, `document_type`, `authority_tier`, `audience`, `checksum`, `content` | (release, doc_id) 유일. 수집 영수증과 연결 |
| `osr.command_contracts` · `osr.commands` | 계약 digest, 명령별 `id`, `kind`, `mutation`, `arguments_schema`, `required_permissions`, `status_command` | 명령 ID 접두어 = 모듈 ID |
| `osr.knowledge_documents` | `module_id`, `release_digest`, `doc_id`, `kind`, `repository`, `path`, `source_revision`, `sha256`, `license`, `content`, `embedding vector(…)`(nullable, 후속) | 모듈 범위 격리. 다른 모듈 행 덮어쓰기 금지 |
| `osr.ingestion_receipts` | `installation_id`, `type`(manual · knowledge · commands), `count`, `digest`, `result` | 실질 판정 근거 |

**역할:** `osr_migrator`(DDL 소유), `osr_runtime`(읽기 + 판정 · 수집 삽입, 트러스트 키 쓰기 없음), `osr_keyops`(신뢰 키 등록 · 회수, 독립 운영자 경로 전용). 기존 서비스 DB 분리 원칙대로 Core 스키마에 직접 접근하지 않는다.

## 5. 4종 인프라 상세

### 5.1 I3 OCI — 발행 · 서명 · 검증 (가장 먼저)

다른 세 인프라의 입력이 모두 OCI 산출물에서 오므로 가장 먼저 만든다.

| 구분 | 내용 |
|---|---|
| 발행 툴체인 | `scripts/osr/module-release.mjs`: buildx로 실행 이미지 빌드 → 기여 산출물(명령 계약 · 매뉴얼 · 지식)을 OCI artifact로 묶음 → SBOM(SPDX) · 출처(SLSA) 생성 → 디스크립터와 해석 정보로 서명 봉투 생성 → 인덱스에 주석으로 부착 → 버전 태그 push → 채널 태그 이동 |
| 서명 | P-256(OSR-D). 서명 키는 발행 운영자의 보호 저장소에만 둔다. 재사용 워크플로는 키를 직접 받지 않고 서명 요청을 보호된 서명 단계로 넘긴다 |
| 버전 · 원장 | 기존 `YY.MDD.HHMM.BUILD` 원장을 모듈 패키지까지 확장. BUILD 재사용 금지, 태그 덮어쓰기 금지 |
| 채널 카탈로그 | `scripts/osr/channel-catalog.mjs`가 채널별 `opensphere.module-channel/v1`을 만들고 서명. 공개 위치에 게시(기존 Setup 채널 카탈로그와 같은 방식) |
| 검증기 | `osr_oci.rs`: GHCR 읽기(`read:packages` 자격), 인덱스 · 주석 파싱, 서명 검증, 만료, 산출물 해시, 저장소 이름 규칙. 규격 §9의 1~6단계와 사유 코드 |
| Setup | `registry-reader.mjs`의 저장소 정규식을 `opensphere-(backbone|<class>)-<slug>`로 넓히고, HEAD 확인에 더해 인덱스 · 서명 검증을 OSR과 같은 규칙으로 수행 |
| OS CLI | `os oci inspect / verify / pull`, `os osr register` |
| 시험 | 정상 릴리스 1개와 변조 변형(서명 · 해시 · 만료 · 저장소 이름 · 키 범위)마다 기대 사유 코드를 내는 시험 벡터. Rust · Node · Go가 같은 벡터로 같은 판정을 내야 함 |

### 5.2 I2 OS Shell 명령 — 레지스트리와 owner 전달

| 구분 | 내용 |
|---|---|
| 수신 · 검증 | 릴리스의 명령 계약(owner-commands v4)을 파싱 · 검증. ID 접두어 = 모듈 ID, kind · mutation 규칙, 표준 명령 8개, 크기 한도(256 KiB · 256개) |
| 저장 | `osr.command_contracts` · `osr.commands`. 설치본이 실질적 멤버가 되기 전에는 발견 목록에 "미활성"으로만 표시 |
| 발견 | `osr.commands.list`: core 명령 + 설치본의 모듈 명령 + 명령별 `reviewRevision`(실행 digest · 계약 digest · 설치 generation의 해시). `os shell commands`가 이 결과를 쓴다 |
| 실행 | `os shell execute` → Nexus `osr.command.execute` → 명령 레코드로 권한 판단 → read · discover · verify는 owner 직행(감사 · 예산 적용), apply · cancel · compensate는 Core 운영 의도 · 승인 → dispatcher가 owner에 전달 → `outcome` 수집 |
| owner 전달 | §3.4 admission 토큰, `POST {command, arguments, requestId, reviewRevision}`, 오래된 revision 409, 응답 유실은 `Unknown` |
| CLI | Backbone 모드의 501 분기를 `osr.commands.list` · `osr.command.execute` 연결로 교체. 물려받은 `shell_commands.go`의 `reviewRevision` 처리 재사용 |
| 시험 | 가짜 owner 서버로 read 직행 · apply 승인 경로 · 오래된 revision 409 · 응답 유실 Unknown · 권한 없는 명령 거절 · 회수된 릴리스 명령 거절 |

### 5.3 I1 매뉴얼 — 원장과 설치 때 수집

| 구분 | 내용 |
|---|---|
| 수신 · 검증 | 매뉴얼 묶음(`opensphere.manual-bundle/v1`): 문서 메타데이터 · 체크섬 · 필수 문서 유형(overview · install · operations · troubleshooting · commands). 명령 예시는 같은 릴리스 명령 계약의 ID만 허용 |
| 저장 | `osr.manual_documents`. 문서 ID `manual:<module-id>:<slug>` |
| 수집 시점 | `apply-module`이 설치 후 OSR에 수집 요청 → 수집 영수증(`osr.ingestion_receipts`) |
| 노출 | `osr.manual.read`(목록 · 본문), Console 매뉴얼 보기, `os manual list / read` |
| `commands` 문서 | 명령 계약에서 자동 생성해 수동 작성과 어긋나지 않게 함 |
| 시험 | 필수 문서 누락 · 체크섬 불일치 · 존재하지 않는 명령 예시 → 각각 `ManualMissing` 등 사유 코드 |

### 5.4 I4 지식(RAG) — 원장과 설치 때 수집

| 구분 | 내용 |
|---|---|
| 수신 · 검증 | 지식 묶음(`opensphere.knowledge-bundle/v1`): 출처 필드(repository · path · sourceRevision · sha256) · 라이선스 · 크기 한도 · 비밀값 · 내부 주소 패턴 검사 |
| 저장 | `osr.knowledge_documents`(모듈 범위). 기존 바이너리 고정 팩은 `core` 범위로 그대로 둠 |
| 수집 시점 | 매뉴얼과 같은 `apply-module` 후 단계 |
| 노출 | 기존 지식 API · MCP(`opensphere_knowledge`)의 검색 대상을 "고정 팩 + PG 모듈 문서"로 넓힘. 결과에 `module`, `evidenceKind=ReleaseDocumentation`, `runtimeState=NotObserved` 표시 |
| 의미 검색 | `embedding` 열만 준비. 켜는 것은 별도 결정(OSR-F). 켤 때 임베딩 모델 호출은 Magpie(관리 영역 모델) 경로를 쓰고 사원 영역 모델과 섞지 않음 |
| 시험 | 출처 누락 · 해시 불일치 · 비밀값 패턴 · 다른 모듈 범위 덮어쓰기 시도 → 거절. 검색 결과에 출처 표시 확인 |

## 6. 일반 설치 경로 `apply-module`

| 단계 | 내용 |
|---|---|
| 입력 | `--module <id> --digest <sha256> --operation <Core 작업 ID>`(승인 영수증) |
| 검증 | OSR 형식 판정 통과 · 회수 아님 · 승인 영수증의 계획 revision과 digest 일치 |
| 렌더링 | 디스크립터에서 Deployment · Service · NetworkPolicy · ServiceAccount 생성. RBAC은 `permissionProfile`로 Backbone이 생성하고 모듈이 가져온 RBAC은 쓰지 않음 |
| 저장 관문 | 상태가 있으면 Foundation 저장 프로필 선택 · 검증 · 활성화 관문(최초 선택은 한 번) |
| 적용 | server-side apply, 고정 field manager. 설치 지문 · writer lock 보존. 같은 작업 재개는 무변경 종료 가능 |
| 확인 | 건강 · readiness, 실행 digest 일치 |
| 수집 | 명령 · 매뉴얼 · 지식 수집 요청 → 영수증 |
| 판정 | 클래스별 `<id>.verify` 실행 → 실질 판정 기록 |
| 롤백 · 퇴역 | 같은 명령의 `--rollback-to <digest>`, `--retire`. 이미지 롤백과 데이터 복원은 따로 판단 |

기존 모듈별 명령(`apply-native-modules`, `apply-bus-inspection`, `apply-nexus-*`, `admit-*`)은 단계 6에서 `apply-module`의 고정 프로필로 흡수한다. 흡수 전까지 그대로 둔다.

## 7. Console

Carbon v12 기준으로 만든다(Backbone Console Carbon 전환 브랜치가 main에 병합된 뒤).

| 화면 | 내용 |
|---|---|
| OSR · 카탈로그 | 모듈 목록(클래스 · 멤버 상태 · 최신 릴리스 · 채널) |
| 모듈 상세 | 릴리스별 기여 4종 상태, 판정 이력과 사유 코드, 설치본 |
| 릴리스 상세 | 디스크립터, 산출물 해시, 서명 · 출처 · SBOM 표시 |
| 설치본 | 상태 기계, Core 작업 연결, 수집 영수증 |
| 신뢰 키 | 읽기 전용(쓰기는 독립 운영자 경로) |
| 매뉴얼 | 모듈별 매뉴얼 보기 |

버튼 노출은 권한 · 승인이 아니다(Backbone 원칙). 등록 · 계획 · 회수 버튼은 Core 승인 흐름으로 이어지고, 신뢰 키 쓰기는 Console에 두지 않는다.

## 8. 보안 · 권한 경계

- 신뢰 키 등록 · 회수는 독립 운영자 증명으로만 한다. Core 승인 키와 다른 키 체계다.
- R2D2는 OSR 읽기와 지식 검색만 한다. 등록 · 설치 쓰기 도구는 별도 승인 전까지 없다.
- 묶음(매뉴얼 · 지식 · 명령)에 비밀값 · 내부 주소 · 개인 정보가 있으면 거절한다.
- owner admission 토큰은 짧게, 명령 · 요청 단위로만 쓴다.
- 모든 등록 · 판정 · 수집 · 회수는 `osr.audit`와 Core 감사에 상관 ID로 남긴다.
- Blueprint(공개)에는 키 · 내부 주소 · 운영 로그를 싣지 않는다.

## 9. 단계별 계획

| 단계 | 목표 | 주요 PR | 완료 기준 | 선행 |
|---|---|---|---|---|
| M0 결정 · 계약 | 선결 결정과 스키마 고정 | ① OSR 계약 스키마 · 시험 벡터(`infra/contracts/osr/`) | §12 결정 기록 승인. 정상 · 변조 벡터 세트 고정 | — |
| M1 OSR 원장 · 읽기 | 원장과 읽기 API | ② `infra/osr/001-ledger.sql` · 역할 ③ `osr.rs` 읽기 · 고정 query 액션(정책 digest 1회 갱신) ④ `core` 이관(12모듈 · 26후보) ⑤ OS CLI `os osr list / get` | Console · CLI가 같은 OSR 응답. Console · Core 카탈로그 digest 일치 시험 통과 | M0 |
| M2 OCI · 형식 판정 | 발행 · 검증 경로 | ⑥ `scripts/osr/module-release.mjs` · 채널 카탈로그 ⑦ `osr_oci.rs` 검증기 · 신뢰 키 테이블 · 키 등록 절차 ⑧ `os oci` · `os osr register` ⑨ Setup `registry-reader` 확장 ⑩ `provider.postgres` 첫 릴리스 발행(edge) | 첫 릴리스가 형식적 멤버. 변조 벡터 전부 기대 사유 코드로 거절. Rust · Node · Go 판정 일치 | M1 |
| M3 명령 인프라 | 명령 레지스트리 · 전달 | ⑪ `002-contributions.sql` 명령 부분 ⑫ `osr_commands.rs` · `osr.commands.list` · `osr.command.execute` ⑬ owner admission 토큰 · 네트워크 정책 ⑭ CLI 501 분기 교체 | 격리 네임스페이스의 `provider.postgres`에서 `status` · `inspect` 직행 응답, `apply` 1건이 Core 승인 경로로 실행, 409 · Unknown 처리 시험 통과 | M2 |
| M4 매뉴얼 · 지식 | 수집과 노출 | ⑮ 매뉴얼 · 지식 테이블 ⑯ `osr_manual.rs` · `osr_knowledge.rs` 수집기 ⑰ 지식 API · MCP 검색 범위 확장 ⑱ `os manual` · Console 매뉴얼 화면 | 설치본 수집 영수증 생성, 매뉴얼 · 지식 검색에 출처 표시, 비밀값 패턴 거절 시험 통과 | M2 (M3와 병행 가능) |
| M5 일반 설치 · 실질 판정 | `apply-module` | ⑲ `003-installations.sql` ⑳ `setup/src/apply-module.mjs` · Setup 릴리스 ㉑ `osr.module.plan` · Core 연결 ㉒ 실질 판정 · 저하 감지 | 운영 RKE2의 격리 시험 네임스페이스에서 설치 → 실질 판정 → 롤백 → 퇴역이 영수증으로 이어짐. 공개 Setup 릴리스로 실행 | M3, M4 |
| M6 운영화 | 회수 · 채널 · 흡수 | ㉓ 회수 · 정지 흐름 ㉔ candidate · stable 승격 1회 ㉕ 기존 모듈별 Setup 명령을 `apply-module` 프로필로 흡수 시작 ㉖ Console OSR 화면 완성 | 회수 훈련 1회, 승격 1회 실증, 흡수한 명령의 회귀 시험 통과 | M5 |

**병행 가능:** M3과 M4는 서로 다른 테이블 · 모듈을 만지므로 병행할 수 있다. Console 화면은 M1부터 읽기 화면을 먼저 붙일 수 있지만, Carbon 전환 병합이 선행이다.

## 10. 시험 · 검증 전략

| 층 | 내용 |
|---|---|
| 단위 | Rust(검증기 · 판정 · 수집 · 권한), Go(CLI), Node(발행 · Setup). 각 사유 코드마다 시험 1개 이상 |
| 계약 벡터 | M0의 정상 · 변조 벡터를 세 언어가 같은 결과로 판정 |
| source-check | 새 시험을 필수 CI에 등록. 카탈로그 · 정책 digest 정합 시험을 OSR 액션 포함으로 갱신(약화 금지) |
| 격리 native fixture | 별도 PG · 역할로 마이그레이션 · grant 확인. 운영 PG에 시험 쓰기 금지 |
| live | 운영 RKE2의 격리 시험 네임스페이스 · 신원 · 자원으로만. 삭제된 localhost RKE2를 복구하지 않음 |
| UI | Console OSR 화면의 axe(WCAG 2.1 A/AA) 0건, 390px 가로 넘침 없음 |
| 공급망 | 첫 릴리스의 서명 · SBOM · 출처를 독립적으로 다시 검증 |

## 11. 위험과 대응

| 위험 | 대응 |
|---|---|
| 정책 digest 재빌드 반복 | §3.1 고정 액션 + 데이터 레코드. OSR 액션 추가는 한 번 |
| 원장과 실제 설치본의 어긋남 | 실질 판정을 계약 지문에 묶고, 지문이 바뀌면 재판정. 어긋남은 Console 개요 카드로 표시 |
| 서명 키 유출 | 모듈별 키 범위, 회수 테이블, 서명 봉투 90일 만료 |
| 모듈 owner의 악의적 응답 | owner 응답은 결과 보고일 뿐 승인이 아님. 최종 상태는 Core 영수증과 실제 대상 확인 |
| 묶음을 통한 비밀값 · 프롬프트 주입 | 수집 전 패턴 검사, 지식 결과에 "릴리스 문서" 표시, R2D2는 근거로만 사용 |
| 일반 설치가 기존 모듈 명령을 깨뜨림 | 흡수는 M6에서 프로필 단위로, 회귀 시험 통과 후에만 |
| Carbon 전환과 일정 충돌 | Console 화면은 M1 읽기부터 늦게 붙여도 됨. API · CLI가 먼저 |
| 기존 필수 CI 실패(PG 후보 PR23의 CI86, Backbone 대장 기록) | OSR PR은 다른 PR의 실패를 덮거나 우회하지 않음. 착수 시점 main의 필수 CI 상태를 먼저 확인 |

## 12. 선결 결정 (착수 전 필요)

| 결정 | 내용 | 권고 | 영향 단계 |
|---|---|---|---|
| OSR-A | "OCI 명령"의 뜻 | 릴리스를 digest로 검사 · 검증 · 받는 OS CLI 명령 | M2 |
| OSR-B | 모듈 ID 체계 | `<class>.<slug>` | M0 |
| OSR-C | 버전 형식 | `YY.MDD.HHMM.BUILD` + SemVer `compatibilityVersion` | M0 |
| OSR-D | 서명 방식 | P-256 서명 봉투, stable은 SBOM · 출처 필수 | M2 |
| OSR-E | 매뉴얼 · 지식 수집 시점 | 설치 때 | M4 |
| OSR-F | 지식 저장 · 의미 검색 | PG 모듈 범위 원장, 의미 검색은 후속 | M4 |
| OSR-H | 설치 실행 경로 | 공개 Setup `apply-module` | M5 |
| 신규 | owner admission 토큰 방식 | Backbone 서명 60초 토큰 + 네트워크 정책 | M3 |
| 신규 | 첫 실증 모듈 | `provider.postgres` | M2 |

## 13. 바로 착수할 첫 PR 묶음

1. **M0 ①:** `infra/contracts/osr/`에 디스크립터 · 서명 봉투 · 채널 카탈로그 · 기여 4종 JSON Schema와 정상 · 변조 시험 벡터를 둔다. 코드 변경 없음.
2. **M1 ②:** `infra/osr/001-ledger.sql`(modules · releases · release_artifacts · verdicts · audit)과 역할 3종. 격리 fixture에서 마이그레이션 · grant 시험.
3. **M1 ③④:** `osr.rs` 읽기 API와 고정 query 액션 5개, `core` 레코드 이관. 카탈로그 · 정책 digest 정합 시험 갱신.

이 세 묶음이 병합되면 OSR이 "읽을 수 있는 원장"으로 존재하게 되고, 이후 단계는 그 위에 쌓는다.
