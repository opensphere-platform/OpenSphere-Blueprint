# OpenSphere Registry(OSR) 규격 초안 v0.1 — 모듈 멤버십 · GHCR 발행 · 확장 설치

**상태:** 명세 초안이다. 결정 대장(D-번호)에 오르기 전까지 결정이 아니며 구현 승인도 아니다. §14의 결정 후보는 모두 `제안`이다.
**작성:** 2026-11-17 · Claude(설계 검토 AI)
**상위 기준:** [Backbone 설계](../backbone/DESIGN.md), [네 면 구조](../overview/FOUR-PLANES.md), [용어 대응표](../overview/GLOSSARY.md), [결정 대장](../architecture/OPENSPHERE-LAYER-BASELINE-v0.2.md)(D-79, D-82, D-86), [테넌트·어셈블리 구성 명세](TENANT-ASSEMBLY-SPEC-v0.1.md), [어셈블리 카탈로그](ASSEMBLY-CATALOG-v0.1.md)
**근거:** 현재 Backbone 저장소(main `f04476e`)와 이전 세대 아카이브를 조사했다. 출처는 §15에 모았다.

**이 문서가 답하는 질문:**
- Backbone 밖의 레이어와 그 제품(Provider, 엔진, 어셈블리 등)을 Backbone이 어떻게 관리하는가.
- 모듈은 OSR에 무엇을 등록해야 OpenSphere의 멤버가 되는가. 형식적 멤버와 실질적 멤버는 어떻게 다른가.
- 매뉴얼, OS Shell 명령, OCI 산출물, RAG 등록의 규격은 무엇인가.
- GHCR 발행에서 OpenSphere가 확장(설치)되기까지의 흐름은 무엇인가.
- 지금 Backbone은 이 기여를 받을 준비가 되어 있는가(부록 A).

---

## 1. 결론 요약

1. **OSR은 Backbone 안의 모듈 원장이다.** Backbone 밖에 있는 모든 OpenSphere 모듈의 정체, 릴리스, 기여(매뉴얼 · 명령 · OCI · 지식), 멤버 상태를 기록한다. 설치나 실행은 하지 않는다. 설치는 Execution Core 승인과 Setup 실행부가 한다.
2. **OSR 등록이 멤버십의 입구다.** 등록하지 않은 모듈은 OpenSphere가 설치하지도 발견하지도 않는다.
3. **멤버는 두 단계다.**
   - **형식적 멤버:** 서명된 디스크립터와 필수 기여 네 가지(매뉴얼 · OS Shell 명령 · OCI 산출물 · RAG 등록)를 선언하고, 산출물 해시와 서명이 맞는 상태. 릴리스 단위로 판정한다. 카탈로그에 보이고 설치 계획을 세울 수 있다.
   - **실질적 멤버:** 실제 설치본에서 그 기여가 동작함을 확인한 상태. 매뉴얼이 수집되고, 명령이 OS Shell에서 발견되고 응답하고, 실행 digest와 건강이 맞고, 지식이 검색되고, 감사가 남는다. 설치본 단위로 판정한다.
4. **등록 ≠ 설치 ≠ 활성화 ≠ 권한.** 형식적 멤버가 됐다고 설치되거나 권한이 생기지 않는다. 지금 Backbone의 원칙(카탈로그 descriptor는 실행 권한이 아니다)을 그대로 따른다.
5. **발행은 GHCR, 진입은 채널 카탈로그다.** 모듈은 `ghcr.io/opensphere-platform/opensphere-<class>-<slug>`에 불변 버전 태그와 채널 태그로 발행한다. 채널마다 (모듈, 채널) → digest 하나를 가리키는 서명된 채널 카탈로그를 둔다.
6. **확장 설치는 모듈마다 손으로 쓴 Setup 명령이 아니라 하나의 일반 경로로 한다.** OSR 계획 → Execution Core 승인 → 공개 Setup의 일반 모듈 설치 명령 → 검증 → 실질적 멤버 판정. 지금 Backbone은 모듈마다 고정 프로필 명령(`apply-native-modules` 등)을 쓴다.

## 2. 위치와 경계

```text
                ┌──────────── Backbone(관리 제어면) ─────────────┐
 GHCR ──발견──▶ │ OSR(모듈 원장) ──계획──▶ Execution Core(승인·의도) │
 (발행)         │   │                         │                    │
                │   └─ 카탈로그 · 멤버 상태    ▼                    │
                │              Setup 실행부(고정 산출물 적용)       │
                └──────────────────────────┬──────────────────────┘
                                           ▼
            HISS 구성요소 · Fabric(배포 지원 · 공유 서비스 Provider · 엔진) · 어셈블리 정의
                                           ▼ (영역에서 Claim · 인도)
                         Governance · Workspace · 고객 영역 제품
```

- **OSR이 관리하는 것:** Backbone 밖 레이어의 모듈. HISS 구성요소, 배포 지원(Argo CD · Crossplane), 공유 서비스 Provider, 업무 엔진, 런타임, 어셈블리 정의, UI 모듈, Governance · Workspace 제품.
- **OSR에 "core"로만 기록하는 것:** Backbone 자신의 구성요소(Console, Core, Nexus, Swallow, Magpie, R2D2 등). 버전과 digest를 기록하지만 OSR로 설치하지 않는다. Backbone 자체는 fresh-install 전용 Setup의 대상이다.
- **OSR이 하지 않는 것:**
  - 영역 안의 Claim · Binding · 어셈블리 구성을 대신하지 않는다. 테넌트 구성(D-82)과 Governance 배분은 각자의 판단이다. OSR은 그들이 고를 수 있는 공급 목록을 제공한다.
  - 공급 면만 다룬다. 영역의 자격 · 키 · 업무 데이터는 보지 않는다(D-29, 네 면 구조의 인도 지점).
- **기존 구성과의 관계:**
  - 지금 서버에 컴파일된 모듈 카탈로그(`contracts.rs`의 12모듈 · 10액션)와 Nexus 인벤토리(member · partial · candidate · contract_only)는 OSR의 "core" 레코드와 형식 판정의 출발점이 된다.
  - OS CLI의 `os registry` · `os catalog`는 지금 `/console-api/modules`를 읽기만 한다. OSR 읽기 API로 바꾼다.

## 3. 용어

| 용어 | 뜻 |
|---|---|
| 모듈 | OSR에 등록되는 독립 배포 단위. 하나의 정체(ID)와 소유자를 가진다 |
| 클래스 | 모듈의 종류(§4). 필수 기여와 설치 경로가 클래스마다 다르다 |
| 릴리스 | 모듈의 불변 판. 버전 · digest · 서명 · 기여 산출물 해시를 묶는다 |
| 기여 | 모듈이 OpenSphere에 내놓는 것. 매뉴얼, OS Shell 명령, OCI 산출물, 지식(RAG), UI, 이벤트, 관측, Provider 선언 |
| 형식적 멤버 | 릴리스가 OSR 검증을 통과한 상태(§8) |
| 실질적 멤버 | 설치본에서 기여의 동작이 확인된 상태(§8) |
| 설치본 | 한 OpenSphere 설치(설치 ID) 안에 실제로 놓인 모듈 릴리스 |
| 채널 카탈로그 | 채널별로 (모듈 → 릴리스 digest)를 가리키는 서명된 목록 |

## 4. 모듈 클래스

| 클래스 | 예 | 놓이는 곳 | 필수 기여 차이 |
|---|---|---|---|
| `core` | Console, Core, Nexus, Swallow, Magpie, R2D2 | Backbone | OSR로 설치하지 않음. 기록 · 매뉴얼 · 지식만 |
| `hiss` | ingress-nginx, cert-manager, metrics-server, 관측 바닥, 외부 Ceph 연결 | HISS | 실검증(canary) 명령 필수 |
| `delivery` | Argo CD, Crossplane | Fabric 배포 지원 | 설치 · 복구 · 버전 명령 |
| `provider` | PostgreSQL, OpenSearch, Samba AD, Keycloak, KubeVirt | Fabric 공유 서비스 | Provider 선언(나눠 주는 단위 · Claim 스키마 · scope) 필수 |
| `engine` | Stalwart, Mattermost, GitLab, Odoo | Fabric 업무 엔진 | 의존 Claim 선언 필수 |
| `runtime` | Temporal, 이벤트 채널, 모델 게이트웨이 | Fabric 런타임 | 사용 면 경계 선언 |
| `assembly` | `mail`, `chat` 어셈블리 정의 | 카탈로그(실행 없음) | 이미지 없음. 정의 · 리소스 유형 · 의존 모듈만 |
| `ui` | subShell, 화면 plugin | 접근 지점 셸 | 화면 · 탐색 기여, 셸 호환 범위 |
| `product` | Governance, Workspace 구성 제품 | 사원 영역 | 영역 인도 계약 |

## 5. 식별자와 저장소 이름

- **모듈 ID:** `<class>.<slug>`. 예: `provider.postgres`, `hiss.ingress-nginx`, `engine.stalwart`, `assembly.mail`. slug는 `^[a-z][a-z0-9-]{1,40}$`이다.
- ID는 영구다. 지운 ID는 다시 쓰지 않는다. 이름을 바꿀 때는 별칭(alias)을 남긴다.
- 예약 ID(Backbone 구성요소 이름 등)는 다른 모듈이 쓸 수 없다.
- **GHCR 저장소:** `ghcr.io/opensphere-platform/opensphere-<class>-<slug>`. 예: `opensphere-provider-postgres`. 아카이브의 `opensphere-provider-<id>` 규칙을 클래스 전체로 넓힌 것이다.
- **명령 ID 접두어:** 모듈 ID와 같다. 예: `provider.postgres.instance.create`. 기존 명령(`foundation.provider-modules.*`, `platform-support.argocd.*`, `cluster-manager.hiss.*`)은 별칭으로 한 판 이상 함께 받는다(D-79의 구 식별자 원칙).

## 6. 모듈 디스크립터 `opensphere.module/v1`

릴리스마다 하나다. OCI 이미지 인덱스의 주석(annotation)으로 싣고 서명한다(§10). 아카이브 SDK의 `ModulePackageV1`과 CONSTITUTION-0003 §4를 이어받는다.

| 필드 | 필수 | 내용 |
|---|---|---|
| `schema` | 필수 | `opensphere.module/v1` |
| `id`, `class`, `displayName`, `owner`, `description` | 필수 | §4 · §5 |
| `version` | 필수 | `YY.MDD.HHMM.BUILD`(Backbone 발행 원장 형식). 한 번 쓴 BUILD는 다시 쓰지 않는다 |
| `compatibilityVersion` | 필수 | SemVer. 계약 호환 판단용 |
| `plane` | 필수 | `hiss` · `fabric-delivery` · `fabric-shared` · `fabric-engine` · `fabric-runtime` · `catalog` · `shell` · `employee-area` · `customer-area` |
| `backboneCompat` | 필수 | 이 릴리스가 요구하는 Backbone 계약 범위. 예: `backbone.osr/v1`, `backbone.setup/v1` |
| `dependencies` | 필수(빈 목록 가능) | `[{module, range, kind: required|optional, claims?}]` |
| `permissionProfile` | 필수 | 닫힌 목록에서 고른다. 아래 참고 |
| `runtime` | 이미지가 있으면 필수 | `{images:[{name, digest}], port, healthPath:"/healthz", readyPath:"/api/commands/ready", serviceAccount, resources, securityContext:{runAsNonRoot:true, readOnlyRootFilesystem:true}}` |
| `storage` | 상태가 있으면 필수 | Foundation 저장 프로필 참조 `[{dataClass, profileRef, retention}]`. 최초 선택은 한 번만이다 |
| `contributions` | 필수 | §7의 네 필수 기여와 선택 기여. 지원하지 않는 기여는 `enabled:false`와 사유를 적는다 |
| `supplyChain` | 필수 | `{sourceRepository, sourceRevision(40자), buildAuthority, sbom, provenance}` |
| `lifecycle` | 필수 | 설치 · 갱신 · 롤백 · 퇴역 때 쓰는 명령 ID(§7.2의 표준 명령) |

**권한 프로필(닫힌 목록):** `none`, `read-cluster-metadata`, `namespace-owner`, `provider-operator`, `hiss-component`, `ui-only`. 프로필에 없는 권한은 OSR이 거절한다. 실제 RBAC은 설치 계획에서 Backbone이 생성하고, 모듈이 가져온 RBAC을 그대로 적용하지 않는다.

## 7. 필수 기여 네 가지와 기타 기여

### 7.1 매뉴얼 `opensphere.manual-bundle/v1`

- 모듈 릴리스에 매뉴얼 묶음을 싣는다(OCI 산출물, §10). 아카이브의 `manual-seed.opensphere.io/v1alpha1`을 이어받는다.
- **문서 메타데이터:** `sourceId`, `version`, `sourcePath`, `documentType`, `authorityTier(0~4)`, `audience`, `plane`, `module`, `tags`, `checksum`, `content`.
- **필수 문서 유형:** `overview`(무엇을 공급하는가), `install`(선행 조건 · 설치 · 갱신 · 롤백), `operations`(일상 운영 · 관측), `troubleshooting`(실패 · 결과 불명 처리), `commands`(명령 참조 — §7.2 계약에서 생성).
- 설치 때 Backbone의 매뉴얼 원장에 수집한다(install-time). 문서 ID는 `manual:<module-id>:<slug>`이다.
- 매뉴얼 내용은 근거이지 실행 권한이 아니다. 매뉴얼의 명령 예시는 §7.2 계약에 있는 명령만 가리킬 수 있다.

### 7.2 OS Shell 명령 `opensphere.owner-commands/v4`

- 아카이브의 owner-commands v4 형식을 잇는다. 명령마다 `id`, `description`, `kind`, `mutation`, `arguments`, `scope`, `idempotency`, `requiredPermissions`, `output`, `statusCommand`, `review`를 둔다.
- **kind:** `read`, `discover`, `plan`, `apply`, `watch`, `verify`, `cancel`, `compensate`. 상태를 바꾸는 것은 `apply` · `cancel` · `compensate`뿐이고, 이들은 `requestId` 멱등과 `reviewRevision`이 필수다.
- **모든 모듈의 표준 명령(최소 집합):**

| 명령 | kind | 뜻 |
|---|---|---|
| `<id>.status` | read | 건강 · 판 · 설치 상태 |
| `<id>.inspect` | read | 설정 · 의존 · 기여 상태 |
| `<id>.plan` | plan | 설치 · 갱신 · 롤백 계획과 검토 revision |
| `<id>.apply` | apply | 검토한 계획 실행 |
| `<id>.verify` | verify | 실검증(클래스별) |
| `<id>.operation` | read | 접수한 작업의 단계와 결과 |
| `<id>.rollback` | apply | 앞 릴리스로 되돌리기 |
| `<id>.retire` | apply | 퇴역(신규 쓰기 차단 → 회수 → 보존 → 삭제) |

- **모듈 쪽 의무:** `POST` 명령 봉투 `{command, arguments, requestId, reviewRevision}`를 Backbone 경유 헤더로만 받는다. 오래된 `reviewRevision`은 409로 거절한다. `GET /api/commands/ready`를 둔다. 결과는 `outcome`(Observed, Accepted, Running, Configured, Verified, Failed, Unknown, Cancelled)으로 돌려준다.
- **Backbone 쪽 의무:** OS Shell · Console · R2D2가 같은 계약으로 명령을 발견한다. 쓰기 명령은 Nexus와 Execution Core 승인을 거친다. 명령이 계약에 있다는 것만으로 에이전트 도구나 권한이 생기지 않는다.
- 크기 한도: 256 KiB, 명령 256개. 넘으면 하위 모듈로 나눈다.

### 7.3 OCI 산출물과 OCI 명령

- **OCI 산출물:** 한 릴리스는 하나의 OCI 이미지 인덱스다. 안에 실행 이미지(플랫폼별)와 함께 다음 산출물을 둔다.

| 산출물 | 미디어 타입(초안) | 필수 |
|---|---|---|
| 실행 이미지 | OCI image manifest | 이미지가 있는 클래스 |
| 디스크립터 서명 봉투 | `application/vnd.opensphere.module-release.v1+json` | 필수 |
| 명령 계약 | `application/vnd.opensphere.owner-commands.v4+json` | 필수 |
| 매뉴얼 묶음 | `application/vnd.opensphere.manual-bundle.v1+tar` | 필수 |
| 지식 묶음 | `application/vnd.opensphere.knowledge-bundle.v1+tar` | 필수 |
| SBOM | SPDX JSON | edge 권장, stable 필수 |
| 출처 증명 | SLSA provenance | edge 권장, stable 필수 |

- **OCI 명령(Backbone OS CLI):** 모듈 릴리스를 다루는 읽기 · 검증 명령이다. 모두 digest로 가리킨다.

| 명령 | 뜻 |
|---|---|
| `os oci inspect <module>@<digest>` | 인덱스 · 산출물 · 주석 표시 |
| `os oci verify <module>@<digest>` | 서명 · 해시 · SBOM · 출처 검증(§9의 1~6단계) |
| `os oci pull <module>@<digest> --artifact <type>` | 매뉴얼 · 지식 · 명령 계약 산출물 받기 |
| `os osr register <module>@<digest>` | OSR에 릴리스 등록 요청(형식 판정 시작) |

  "OCI 명령"을 이렇게 해석했다. 다른 뜻이면 결정 후보 OSR-A에서 바로잡는다.

### 7.4 RAG 등록 `opensphere.knowledge-bundle/v1`

- 모듈의 지식 문서를 묶음으로 싣는다. 매뉴얼과 겹쳐도 되지만 목적이 다르다. 매뉴얼은 사람이 읽고, 지식은 R2D2와 검색이 근거로 쓴다.
- **문서 필드:** `id`, `module`, `kind`(design · contract · runbook · faq · reference), `repository`, `path`, `sourceRevision`, `sha256`, `license`, `language`, `content`. Backbone 지식 팩의 출처 필드를 따른다.
- **수집:** 설치 때 Backbone 지식 원장에 모듈 범위로 넣는다. 읽기 전용이다. 다른 모듈 범위를 덮어쓰지 않는다.
- **출처 표시:** 결과에 `evidenceKind=ReleaseDocumentation`, `runtimeState=NotObserved`를 붙인다. 실제 관측(명령 결과)과 섞지 않는다.
- 의미 검색(임베딩)은 선택이다. 지금 Backbone 지식은 bounded 검색이며 의미 기반 RAG가 아니다. 임베딩을 켜는 것은 별도 결정이다.
- 비밀값 · 내부 주소 · 개인 정보는 싣지 않는다. 검증 단계에서 패턴 검사로 거른다.

### 7.5 그 밖의 기여

| 기여 | 필수 여부 | 내용 |
|---|---|---|
| 건강 · 관측 | 이미지 클래스 필수 | `/healthz`, readiness, 메트릭 이름 목록, 감사 이벤트 종류 |
| 이벤트 | 선택 | 발행 · 구독 이벤트 계약(Swallow 고정 구독자 원칙) |
| UI | `ui` 클래스 필수 | 화면 · 탐색 기여, 셸 호환 범위, 에셋 해시 |
| Provider 선언 | `provider` 클래스 필수 | 나눠 주는 단위, Claim 스키마, scope(targets · dataAccess · executionEffects) |
| 스킬 | 선택 | 같은 릴리스의 명령만 참조하는 스킬 묶음(최대 16개) |

## 8. 멤버 상태

### 8.1 상태 기계

```text
 (릴리스 단위)
 후보 ──등록 요청──▶ 검증 중 ──통과──▶ 형식적 멤버 ──철회──▶ 회수됨
                        └──실패──▶ 거절(사유 코드)

 (설치본 단위)
 형식적 멤버 ──설치 승인──▶ 설치 중 ──▶ 검증 중 ──통과──▶ 실질적 멤버 ⇄ 저하
                                      └──실패──▶ 설치 실패(결과 불명은 Unknown)
 실질적 멤버 ──정지──▶ 정지됨 ──재개──▶ 실질적 멤버
 실질적 멤버 ──퇴역──▶ 퇴역 중 ──▶ 퇴역됨
```

### 8.2 판정 기준

| 상태 | 필요한 증거 | 할 수 있는 일 |
|---|---|---|
| 후보 | 디스크립터 제출, ID 예약 | 카탈로그에 "후보"로 보임 |
| 형식적 멤버 | §9 검증 1~8단계 통과: 서명 · digest · 디스크립터 · 필수 기여 네 가지의 존재와 해시 · 권한 프로필 · 의존 해석 | 카탈로그에 보임. 설치 계획 가능 |
| 실질적 멤버 | 설치본에서 §9 검증 9~10단계 통과: 실행 digest 일치, 건강 통과, 매뉴얼 수집(문서 수 · 체크섬), 명령 발견과 `status` · `inspect` 실제 응답, 지식 수집과 검색 확인, 감사 이벤트 기록, 클래스별 `verify` 통과 | 운영 대상. 영역 Claim 공급 가능(provider) |
| 저하 | 실질적 멤버였으나 건강 · 검증 실패 | 신규 Claim · 확장 막음. 기존 사용 유지 |
| 정지 | 운영자 결정 또는 보안 동결 | 신규 쓰기 차단 |
| 회수 | 키 회수, 릴리스 철회, 공급망 문제 | 신규 설치 금지. 설치본은 "회수된 릴리스 사용 중"으로 표시 |
| 퇴역 | 퇴역 명령 완료 영수증 | 카탈로그에서 내려감. ID는 영구 보존 |

- **기존 상태와의 대응:** Nexus 인벤토리의 `candidate`는 후보, `partial`은 검증 중, `member`는 형식적 멤버에 가깝다. 아카이브 CONSTITUTION-0003의 `planned → packaged → registered → activated`는 후보 → 형식적 멤버 → 실질적 멤버로 이어진다.
- **실질 판정은 설치본마다 따로 한다.** 같은 릴리스가 한 설치에서 실질적 멤버여도 다른 설치에서는 형식적 멤버일 수 있다.
- 검증 성공은 그 시점의 계약 지문에 묶인다. 릴리스 · 설정 · 의존 판이 바뀌면 실질 판정을 다시 한다(HISS 실검증과 같은 원칙).

## 9. 검증 순서와 거절 사유

| 단계 | 검사 | 실패 사유 코드 |
|---|---|---|
| 1 | 저장소 이름이 `opensphere-<class>-<slug>` 규칙과 맞는가 | `RepositoryNameInvalid` |
| 2 | digest가 정확하고 요청 참조와 같은 저장소인가 | `InvalidDigest`, `ReleaseCoordinatesMismatch` |
| 3 | 디스크립터 서명이 신뢰 키로 맞고, 그 키가 이 모듈의 키인가 | `UnknownTrustKey`, `KeyScopeViolation`, `SignatureInvalid` |
| 4 | 서명 봉투가 만료되지 않았는가(최대 90일) | `ModuleReleaseExpired` |
| 5 | 디스크립터 스키마 · 필수 필드 · ID 예약 | `DescriptorInvalid`, `DuplicateID`, `ReservedID` |
| 6 | 산출물(명령 · 매뉴얼 · 지식 · SBOM · 출처) 해시가 디스크립터와 같은가 | `ArtifactDigestMismatch`, `SupplyChainEvidenceMissing` |
| 7 | 필수 기여 네 가지가 있고 계약이 맞는가 | `ManualMissing`, `CommandContractInvalid`, `KnowledgeProvenanceInvalid`, `StandardCommandMissing` |
| 8 | 권한 프로필 · 의존 범위 · Backbone 호환 범위 | `PermissionProfileViolation`, `DependencyUnresolved`, `BackboneIncompatible` |
| 9 | (설치본) 실행 digest · 건강 · 명령 응답 · 매뉴얼 · 지식 수집 | `RuntimeDigestMismatch`, `HealthCheckFailed`, `CommandUnreachable`, `IngestionFailed` |
| 10 | (설치본) 클래스별 `verify` 실검증과 감사 기록 | `VerificationFailed`, `AuditMissing` |

- 1~8단계는 릴리스만 보면 판정할 수 있다(형식). 9~10단계는 설치본이 있어야 한다(실질).
- 실패는 사유 코드와 함께 기록하고 지우지 않는다. 같은 릴리스를 고치지 않고 다시 판정해도 결과가 같아야 한다.
- 응답 유실은 `Unknown`이다. 같은 요청 영수증을 확인하기 전에 새 요청으로 재시도하지 않는다.

## 10. GHCR 발행 규격

- **저장소:** `ghcr.io/opensphere-platform/opensphere-<class>-<slug>`. 비공개 패키지면 설치 쪽에 `read:packages` 읽기 자격이 필요하다(아카이브 `registry-auth/v1`).
- **태그:**
  - 버전 태그 `YY.MDD.HHMM.BUILD`: 불변이다. 덮어쓰지 않는다. BUILD 번호는 보호된 발행 원장이 발급하고 다시 쓰지 않는다.
  - 채널 태그 `edge` · `candidate` · `stable`: 움직이는 포인터다. 설치는 채널 태그가 아니라 digest로만 한다.
- **주석(annotation)과 라벨:** `org.opencontainers.image.source` · `revision` · `version`, `io.opensphere.module.id`, `io.opensphere.module.class`, `io.opensphere.release.channel`, `io.opensphere.module.descriptor`(디스크립터 digest).
- **서명 봉투:** `opensphere.module-release-envelope/v1`. 디스크립터와 해석 정보(`requestedRef`, `resolvedDigest`, `artifactVersion`, `compatibilityVersion`, `buildAuthority`, `revision`, `signatureIdentity`, `evidenceRefs`)를 서명한다. 유효 기간은 최대 90일이다.
- **채널별 공급망 요건:**

| 채널 | 빌드 주체 | 서명 | SBOM · 출처 | 취약점 · 라이선스 검사 |
|---|---|---|---|---|
| edge | Gitea Actions 수용 main | 필수 | 권장 | 권장 |
| candidate | Gitea Actions 수용 main | 필수 | 필수 | 필수 |
| stable | candidate에서 승격(재빌드 없음) | 필수 | 필수 | 필수 + 승격 승인 |

- **채널 카탈로그 `opensphere.module-channel/v1`:** 채널마다 하나다. `{channel, issuedAt, entries:[{module, version, digest, compatibilityVersion, descriptorDigest}]}`를 서명한다. (모듈, 채널)마다 digest는 하나다. 지금 Backbone의 `releases/channels/edge.json`(구성요소 채널 포인터)을 모듈 전체로 넓힌 것이다.
- 발행 성공은 설치 승인이 아니다. 채널 카탈로그에 올라도 `deployment:not_authorized`가 기본이다.

## 11. 확장(설치) 흐름

```text
 ① 발행      Gitea PR → 필수 CI → 수용 main → GHCR(버전 태그 · 서명 · 산출물) → 채널 카탈로그
 ② 발견      OSR이 채널 카탈로그를 읽거나 `os osr register`로 등록 요청 → §9 1~8단계 → 형식적 멤버
 ③ 계획      `<id>.plan` 또는 OSR 계획: 의존 해석(의존 모듈 · 저장 프로필 · HISS 인도: 네임스페이스 · StorageClass ·
             IngressClass · ClusterIssuer), 생성할 RBAC, 영향 범위 → 검토 revision
 ④ 승인      Execution Core 운영 의도 + 보호 승인(독립 CLI 서명). 보호 대상이 아니면 운영자 확인
 ⑤ 실행      공개 Setup의 일반 모듈 명령이 digest 고정 산출물을 적용한다. 설치 · 갱신 · 롤백 · 퇴역이 같은 경로
 ⑥ 검증      §9 9~10단계 → 실질적 멤버. 매뉴얼 · 지식 수집, 명령 발견
 ⑦ 공급      provider · engine은 공급 풀에 오른다. 영역의 Claim · 어셈블리 구성은 영역이 결정한다(D-82)
```

- **일반 모듈 명령(제안):** `opensphere-setup apply-module --module <id> --digest <sha256> --plan <reviewRevision>`. 지금처럼 모듈마다 고정 프로필 명령(`apply-native-modules`, `apply-bus-inspection` 등)을 새로 쓰지 않는다. 기존 명령은 이 명령의 프로필로 흡수한다.
- **Backbone 설치 원칙을 지킨다.**
  - 원래 클러스터 · 설치 · 릴리스 · 설정 지문과 writer lock을 보존한다.
  - 같은 작업 재개는 기존 상태를 검증하고 무변경으로 끝날 수 있다.
  - 결과 불명 작업에 자동 재실행 · 잠금 해제 · 하향 마이그레이션을 하지 않는다.
  - 이미지 롤백과 데이터 · 역할 복원은 따로 판단한다.
- **저장:** 상태가 있는 모듈은 Foundation 저장 프로필 선택 · 검증 · 활성화 관문을 그대로 거친다. 최초 선택은 한 번만이다.
- **어셈블리:** `assembly` 클래스는 실행 이미지가 없다. 등록되면 테넌트 구성 구역의 어셈블리 카탈로그에 나타나고, 의존 모듈이 모두 실질적 멤버여야 "구성 가능"이 된다.
- **회수와 퇴역:** 회수는 신규 설치를 막고 설치본에 경고만 띄운다. 자동 제거하지 않는다. 퇴역은 `<id>.retire`로 신규 쓰기 차단 → 연결 · 자격 회수 → 보존 · 반출 → 승인된 삭제 순서로 한다. 부분 완료는 영수증으로 재개한다.

## 12. Backbone 안의 OSR 구성 (`제안`)

| 구성 | 내용 |
|---|---|
| OSR 원장 | 관리 PG의 전용 스키마. `osr.modules`, `osr.releases`, `osr.verdicts`(형식 · 실질 판정과 사유), `osr.installations`(설치본), `osr.revocations`, `osr.audit` |
| 읽기 API | `GET /api/v1/osr/modules`, `/osr/modules/{id}`, `/osr/releases/{digest}`. Console · OS CLI · R2D2가 같은 응답을 쓴다 |
| 등록 · 계획 명령 | `osr.register`, `osr.verify`, `osr.plan`, `osr.revoke`. 쓰기는 Nexus와 Core 승인을 거친다 |
| 신뢰 키 | 모듈별 서명 키 목록. 키 등록 · 회수는 독립 운영자 증명으로 한다. Console이 키를 바꿀 수 없다 |
| Console 화면 | "OSR" 메뉴: 모듈 카탈로그, 릴리스, 멤버 상태(형식 · 실질), 거절 사유, 설치본, 회수 |
| R2D2 | OSR 읽기와 지식 검색만. 등록 · 설치 쓰기 도구는 별도 승인 전까지 없다 |

## 13. 이행 단계 (`제안`)

| 단계 | 목표 | 산출물 | 완료 기준 |
|---|---|---|---|
| 0 | 규격 고정 | §14 결정 기록, 디스크립터 · 채널 카탈로그 · 기여 스키마(JSON Schema) | 결정 승인 |
| 1 | OSR 읽기 | OSR 원장 · 읽기 API · Console 화면. 지금 컴파일된 12모듈과 인벤토리 후보 26개를 `core` 레코드로 옮김 | Console · CLI가 같은 OSR 응답을 봄 |
| 2 | 형식적 멤버 | GHCR 발행 표준(서명 봉투 · 산출물 · 채널 카탈로그), `os oci` 명령, §9 1~8단계 판정. 첫 대상: 기존 Provider 1종(PostgreSQL) | 서명 · 해시 · 기여 검증이 통과 · 거절 모두 재현됨 |
| 3 | 실질적 멤버 | 일반 모듈 설치 명령, 매뉴얼 · 지식 수집, 명령 발견, §9 9~10단계 | 격리 네임스페이스에서 설치 → 실질 판정 → 롤백 → 퇴역이 영수증으로 이어짐 |
| 4 | 운영 | 회수 · 저하 감지, candidate · stable 채널, 영역 공급 연결 | 회수 훈련과 승격 1회 실증 |

## 14. 결정 후보 (모두 `제안`)

| 후보 | 결정할 내용 | 권고안 |
|---|---|---|
| OSR-A | "OCI 명령"의 뜻 | 모듈 릴리스를 digest로 검사 · 검증 · 받는 OS CLI 명령(§7.3). 다른 뜻이면 바로잡는다 |
| OSR-B | 모듈 ID 체계 | `<class>.<slug>`. 아카이브 헌법의 `OS-PDNN`은 별칭으로만 |
| OSR-C | 버전 형식 | `YY.MDD.HHMM.BUILD`(Backbone 현행)와 별도 SemVer `compatibilityVersion` |
| OSR-D | 서명 방식 | P-256 서명 봉투(아카이브 실증)로 시작하고, stable은 SLSA 출처 · SPDX SBOM을 함께 요구 |
| OSR-E | 매뉴얼 · 지식 수집 시점 | 설치 때(install-time) 수집. 실행 중 읽기(module-context)는 보조 |
| OSR-F | 지식 저장소 | Backbone 지식 원장에 모듈 범위로. 의미 검색은 별도 결정 |
| OSR-G | 외부(서드파티) 모듈 | v1은 `opensphere-platform` 조직 발행만. 외부 조직은 후속 |
| OSR-H | 설치 실행 경로 | 공개 Setup의 일반 모듈 명령. Gitea · Argo 선언 경로(아카이브 PFSS)는 영역 인스턴스 배포용으로 분리 |
| OSR-I | 실질 판정 주기 | 설치 · 갱신 직후와 계약 지문 변경 시. 주기 재검증은 클래스별 |
| OSR-J | 표준 명령 최소 집합 | §7.2의 8개 |

## 15. 근거

**현재 Backbone(main `f04476e`)**
- 모듈 카탈로그 `backend/server/src/contracts.rs`(`catalogVersion 1.3.0`, 12모듈 · 10액션, `catalogDigest`), 정책 `policy.rs`, 인벤토리 `bus_inventory.rs` · `bus_inventory_candidates.json`(member · partial · candidate · contract_only, 7단계 확인).
- OS CLI `cli/cmd/os/`(`os registry` · `os catalog` · `os shell commands`가 카탈로그 읽기, 이전 CLI의 `RegistryDescriptor` · `ToolManifest` 형식은 출처 참고용).
- 발행: `.gitea/workflows/publish-images.yaml`, `scripts/step3/publish-images.mjs`, `governance/VERSION-AND-RELEASE-POLICY.md`, `releases/channels/edge.json`(구성요소 채널 포인터).
- 설치: `setup/src/channels.mjs`(고정 채널 카탈로그 · 수동 번들 · 선택 잠금), `docs/setup/NATIVE-MODULES.md`(모듈별 고정 프로필 명령).
- 지식: `docs/r2d2/knowledge/README.md`, `scripts/r2d2/knowledge/build-pack.py`(고정 출처 목록), `knowledge.rs`.
- 저장 관문: `docs/foundation/STORAGE-PROFILES.md`, `ADMISSION-IMPLEMENTATION.md`.
- 기능 계약 원칙: OpenSphere 저장소 `policies/GOVERNANCE-AOA-OS-SHELL-PRINCIPLES.md` §7.

**이전 세대 아카이브**
- Registry & Catalog 서비스(`opensphere-registry`, C_REG): `OpenSphere-console/backend/registry/`(`registry.go`, `module_release.go` — 검증 · 거절 사유 코드).
- 헌법: `OpenSphere-Platform-V2/_DOCS_/01-CONSTITUTION/` CONSTITUTION-0001(식별자), 0002(레지스트리), 0003(모듈 멤버십 · 수명주기 · 검증 순서, 비준 v1.1.0), 0005(채널 · 발행, 비준 v2.2.0).
- 모듈 패키지: `OpenSphere-SDK/src/contract/module-package.ts`(`ModulePackageV1`), `OpenSphere-shell-clusterManager/module-package.json`, `ui-shell/ui-shell.manifest.json`, `tools/module-release.mjs`.
- 확장 컨트롤러 CRD: `OpenSphere-console/apps/extension-controller/crds/ui-plugin-crds.yaml`(`UIPluginPackage` · `UIPluginRegistration`), GHCR 발견 `ghcr-module-discovery.mjs`.
- 명령 계약: `OpenSphere-console/packages/contracts/OWNER-COMMANDS.md`, `runtime/owner-commands.cjs`(v2~v4), `docs/module-activation-review.md`(reviewRevision).
- 매뉴얼 · 지식: `docs/MANUAL-OWNERSHIP.md`, `docs/OSAA-MANUAL-KNOWLEDGE-DATA-MODEL.md`, `apps/osaa-gateway/manual-seeds/`, `docs/module-context-contributions.md`, Setup CLI `docs/knowledge-artifact-delivery.md`.
- Foundation Provider: `OpenSphere-shell-foundation/deploy/catalog/foundation-child-packages.json`, `foundation.provider-modules.*` 17개 명령, `OpenSphere-Platform-Support/docs/PFSS-DELIVERY-20261007.md`.
- GHCR 자격: `OpenSphere-Setup-CLI/docs/REGISTRY-AUTH-LIFECYCLE.md`.

**아카이브에서 확인된 모순(이 규격에서 정리한 것)**
- 버전 형식이 헌법(`yyyyMMddHHmm`)과 실제(`YY.MDD.HHMM.BUILD`)가 달랐다 → OSR-C.
- 서명 키 ID가 문서마다 달랐다(`opensphere-plugins-v1` · `-v4` · `opensphere-module-local-v1`) → 모듈별 신뢰 키 목록(§12).
- 헌법은 설치 때 매뉴얼 수집을 요구했지만 실제는 실행 중 읽기만 했다 → OSR-E.
- GHCR 발견이 닫힌 목록 3개 모듈뿐이었다 → 채널 카탈로그(§10).
- "PFSS Provider 표준 v1" 원문은 아카이브에 없다. 이 규격의 `provider` 클래스 요건으로 대신 정의한다.

## 부록 A. Backbone 준비도 점검 — 필수 기여 네 가지 (2026-11-17)

**기준:** Backbone main `f04476e`를 읽기만 하고 점검했다. 운영 설치본은 보지 않았다. 판정은 "외부 모듈이 이 기여를 제출하면 Backbone이 받아서 검증 · 저장 · 사용할 수 있는가"다.

**결론:** 네 가지 모두 아직 받을 수 없다. 외부 모듈이 제출할 입구와 원장이 없고, 카탈로그 · 지식 · 설치 대상이 소스에 고정돼 있다. 무엇을 더하든 Backbone PR과 Console · Core 재빌드가 필요하다. 다시 쓸 수 있는 부품은 있다.

| 기여 | 받는 입구 | 검증 | 저장 | 쓰는 쪽 | 판정 |
|---|---|---|---|---|---|
| 매뉴얼 | 없음 | 없음 | 없음 | 없음 | 처음부터 만들어야 함 |
| OS Shell 명령 | 없음 | 없음 | 없음 | 카탈로그 읽기만 | 부품만. 모듈 명령 실행 경로 없음 |
| OCI 산출물 · 명령 | 없음 | digest 존재 확인만 | 없음 | Backbone 구성요소만 | 부품만. 서명 · SBOM · 모듈 저장소 미지원 |
| RAG 등록 | 없음 | 빌드 때만 | 바이너리에 고정 | R2D2 읽기 | 부품만. 설치 때 수집 불가 |

### A.1 매뉴얼

- **지금:** 매뉴얼 원장 · 테이블 · API · 화면이 없다. 소스의 "manual"은 Magpie의 수동 모델 등록, Swallow 마이그레이션 이름, Setup 수동 절차 문구로 다른 뜻이다. 문서는 저장소 `docs/`의 Markdown뿐이고 설치본으로 들어가지 않는다.
- **부족한 것:** 매뉴얼 묶음 수신 · 검증(메타데이터 · 체크섬 · 필수 문서 유형), 관리 PG 매뉴얼 원장(모듈 · 판 · 문서 · 수집 영수증), 설치 때 수집 단계, Console 매뉴얼 화면, 매뉴얼 속 명령 예시가 명령 계약을 가리키는지 확인하는 검사.
- **다시 쓸 것:** Backbone에는 없다. 아카이브의 `manual-seed.opensphere.io/v1alpha1`과 OSAA 매뉴얼 데이터 모델을 가져온다.

### A.2 OS Shell 명령

- **지금:**
  - 서버 카탈로그(`backend/server/src/contracts.rs`)의 command 액션은 `synthetic.echo` 하나다. 나머지 9개는 query · event다. `bus::command`는 Echo 외에 422를 돌려준다(`bus.rs`).
  - Backbone 모드 OS CLI는 `os shell commands`만 동작하고, 그것도 `/console-api/modules` 읽기다. 다른 명령은 501 `BackboneCommandUnavailable`이다(`cli/cmd/os/backbone.go`).
  - 정책(`policy.rs`)은 plane별 고정 허용 목록이다.
- **부족한 것:** owner-commands 계약 수신 · 검증(ID 접두어 · kind · mutation 규칙 · 크기 한도), 명령 원장, 모듈 owner 엔드포인트로의 전달(서버가 정한 actor · `reviewRevision` · 멱등), 쓰기 명령과 Execution Core 승인 연결, 정책 허용 목록에 모듈 명령을 더하는 규칙, 표준 명령 8개 확인.
- **충돌:** 정책 digest가 Console · Core 바이너리에 함께 들어가고 두 digest 일치를 시험이 확인한다(Backbone `AGENTS.md`). 모듈 명령을 동적으로 더하려면 고정 부분(`core`)과 동적 부분(OSR 레코드)의 digest를 나누는 설계가 필요하다.
- **다시 쓸 것:** 이전 CLI에서 물려받은 `cli/cmd/os/shell_commands.go`(`reviewRevision` 전송), `module_update.go`, `module_rollback.go`, `extension_installation.go`. Nexus의 사전 감사 · 예산 · 현재 권한 확인. Core의 승인 · 멱등 · outbox.

### A.3 OCI 산출물과 OCI 명령

- **지금:**
  - 발행(`.gitea/workflows/publish-images.yaml`, `scripts/step3/publish-images.mjs`)에 서명 · SBOM · 출처 증명이 없다. edge 채널만 발행한다.
  - Setup의 GHCR 확인(`setup/src/registry-reader.mjs`)은 manifest 존재를 HEAD로만 본다. 저장소 이름은 `opensphere-platform/opensphere-backbone-[a-z0-9]+`만 허용해서 §5의 `opensphere-<class>-<slug>` 모듈은 거절된다.
  - 채널 포인터(`releases/channels/edge.json`)는 Backbone 구성요소 8개 고정이다. 서버는 GHCR를 조회하지 않는다. OS CLI에 `oci` · `osr` 명령이 없다.
- **부족한 것:** 모듈 저장소 이름 허용, 서명 봉투 생성 · 검증과 모듈별 신뢰 키 목록, 인덱스 안 산출물 해시 검증, 모듈 전체를 담는 채널 카탈로그, `os oci inspect / verify / pull`과 `os osr register`, 발행 파이프라인의 SBOM · 출처 생성, 일반 설치 명령 `apply-module`.
- **다시 쓸 것:** 불변 버전 원장(`YY.MDD.HHMM.BUILD`, BUILD 재사용 금지)과 OCI 라벨, 영향받은 구성요소만 발행, Setup의 digest 고정 적용 · 설치 지문 · writer lock · 같은 작업 재개, `read:packages` 전용 읽기 자격 검사.

### A.4 RAG 등록

- **지금:**
  - 지식 팩(`infra/r2d2/knowledge/pack.json`)은 문서 12개(Backbone 11 · Source-Catalog 1)다. 출처는 `scripts/r2d2/knowledge/build-pack.py`의 `SOURCES`에 하드코딩돼 있고 `include_str!`로 서버 바이너리에 들어간다(`knowledge.rs`).
  - 지식 API는 조회만 있고 수집 API가 없다. 실시간 소스 읽기는 Backbone 저장소 수용 main의 허용 경로로만 한정된다.
  - 관리 PG 이미지에 pgvector가 있지만 지식에 쓰지 않는다. 검색은 bounded 텍스트 검색이다.
- **부족한 것:** 지식 묶음 수신 · 검증(출처 · 해시 · 라이선스 · 비밀값 패턴), PG의 모듈 범위 지식 원장(바이너리 고정 → DB 수집), 설치 때 수집 단계와 영수증, 모듈 범위 격리, 결과 출처 표시(릴리스 문서 vs 실제 관측)의 일관 적용. 의미 검색(pgvector)은 별도 결정(OSR-F).
- **다시 쓸 것:** 팩의 출처 필드(`repository` · `path` · `sha256` · `sourceRevision`)와 `bundleDigest`, 별도 토큰 · plane의 읽기 전용 MCP(`opensphere_knowledge`), 기억 레코드의 출처 필드.

### A.5 공통으로 먼저 필요한 것

1. **OSR 원장.** 모듈 · 릴리스 · 판정 · 설치본 · 회수 테이블과 등록 · 판정 API. 가장 가까운 Nexus 인벤토리(`bus_inventory.rs`)는 소스 고정 `KNOWN` 목록과 비교해 상태를 정하고, 실행 검증을 `unverified`로 고정해 둔다.
2. **고정 카탈로그와 동적 레코드의 분리.** 지금 카탈로그 · 정책은 바이너리 상수라 "등록하면 멤버가 된다"와 맞지 않는다.
3. **일반 설치 경로.** 모듈마다 고정 프로필 명령(`apply-native-modules`, `apply-bus-inspection` 등)을 쓰고 있다. Backbone 규칙상 설치 · 확장은 공개 Setup CLI로만 하므로 `apply-module`은 Setup 릴리스로 나가야 한다.
4. **모듈 신뢰 키 체계.** Core 승인 키를 다시 쓰지 않는다는 원칙이 있으므로 따로 둔다.

### A.6 권하는 순서

§13의 단계에 맞춘다.

1. OSR 원장 · 읽기 API, 지금 고정 카탈로그를 `core` 레코드로 이관(단계 1).
2. OCI 검증 경로: 저장소 정규식 확장, 서명 봉투 · 신뢰 키 · 산출물 해시 검증, `os oci`, 발행 파이프라인 SBOM · 출처(단계 2).
3. 명령 계약 검증과 owner 전달 경로, Core 승인 연결(단계 2~3).
4. 매뉴얼 · 지식의 PG 원장 수집과 일반 설치 명령 `apply-module`(단계 3).

첫 실증 대상은 PostgreSQL Provider 하나다.
