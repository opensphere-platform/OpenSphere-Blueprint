# OpenSphere Registry(OSR) 규격 초안 v0.2 — 모듈 멤버십 · GHCR 발행 · 확장 설치

**상태:** 명세 초안이다. 결정 대장(D-번호)에 오르기 전까지 결정이 아니며 구현 승인도 아니다. §15의 결정 후보는 모두 `제안`이다.
**작성:** 2026-11-17 v0.1 · 2026-11-18 v0.2 · Claude(설계 검토 AI)
**2026-11-18 보정:** v0.2 재검토의 확정 항목 A~D와 문구 보정을 반영했다(§17.2). 계약은 [OSR 계약 · 시험 벡터](osr/README.md)에 있다.
**v0.2에서 바뀐 것:** 2026-11-17 Jupiter의 계획 검토(§17)를 반영했다. 권한은 발행자 선언이 아니라 교집합으로 정한다. 클래스별 설치 profile을 나눴고 어셈블리는 실행하지 않는다. 서명 evidence를 OCI referrer로 분리했다. 판정은 평가 맥락에 묶인다. 회수 정책을 세분했다. 독립 복구 경로를 넣었다. 기존 인벤토리 이관 단위를 바로잡았다.
**상위 기준:** [Backbone 설계](../backbone/DESIGN.md), [네 면 구조](../overview/FOUR-PLANES.md), [용어 대응표](../overview/GLOSSARY.md), [결정 대장](../architecture/OPENSPHERE-LAYER-BASELINE-v0.2.md)(D-79, D-82, D-86), [테넌트·어셈블리 구성 명세](TENANT-ASSEMBLY-SPEC-v0.1.md), [어셈블리 카탈로그](ASSEMBLY-CATALOG-v0.1.md)
**구현 계획:** [OSR · 4종 인프라 종합 구현 계획서 v0.2](OSR-IMPLEMENTATION-PLAN-v0.2.md)
**근거:** Backbone 저장소(main `6eb014e`)와 이전 세대 아카이브. 출처는 §16에 모았다.

**이 문서가 답하는 질문:**
- Backbone 밖의 레이어와 그 제품(Provider, 엔진, 어셈블리 등)을 Backbone이 어떻게 관리하는가.
- 모듈은 OSR에 무엇을 등록해야 OpenSphere의 멤버가 되는가. 형식적 멤버와 실질적 멤버는 어떻게 다른가.
- 매뉴얼, OS Shell 명령, OCI 산출물, RAG 등록의 규격은 무엇인가.
- GHCR 발행에서 OpenSphere가 확장(설치)되기까지의 흐름은 무엇인가. OSR이 멈췄을 때 복구는 어떻게 하는가.
- 지금 Backbone은 이 기여를 받을 준비가 되어 있는가(부록 A).

---

## 1. 결론 요약

1. **OSR은 Backbone 안의 모듈 원장이다.** Backbone 밖 모든 OpenSphere 모듈의 정체, 릴리스, 기여(매뉴얼 · 명령 · OCI · 지식), 판정, 설치본 관측을 기록한다. 설치나 실행은 하지 않는다. 승인 · 실행 · 멱등 · outbox는 기존 Execution Core가, 적용은 공개 Setup이 한다.
2. **OSR 등록이 멤버십의 입구다.** 등록하지 않은 모듈은 OpenSphere가 설치하지도 발견하지도 않는다. 등록 자체는 검증 통과가 아니다.
3. **멤버는 두 단계다.**
   - **형식적 멤버:** 릴리스가 서명 · digest · 디스크립터, 클래스에 맞는 필수 기여 네 가지(매뉴얼 · OS Shell 명령 · OCI 산출물 · RAG 등록)의 계약, 권한 요청 · 의존 · 호환을 모두 오프라인으로 통과한 상태.
   - **실질적 멤버:** 설치본에서 그 기여가 클래스에 맞는 방식으로 동작함을 확인한 상태.
4. **등록 ≠ 설치 ≠ 활성화 ≠ 권한.** 발행자가 디스크립터에 적은 kind · 권한은 **요청**이다. 유효 권한은 플랫폼이 허용한 capability ∩ 호출자의 현재 권한 ∩ 대상 · 설치본 scope ∩ Owner의 최종 검사로 정한다(§7.2). 서명이 맞아도 발행자에게 관리 권한이 생기지 않는다.
5. **판정은 평가 맥락에 묶인다.** 같은 릴리스도 평가 시각 · 정책 revision · 신뢰 세대가 다르면 판정이 달라질 수 있다. 판정 행은 그 맥락을 함께 기록한다. pass 행 자체는 권한 증명이 아니다.
6. **설치 방식은 클래스마다 다르다.** Provider · 엔진은 승인된 materializer profile이 워크로드 · 저장 · 연결을 구성한다. 어셈블리는 실행하지 않는 정의다. HISS와 고권한 모듈은 허용 자원 · 동작 · 범위를 고정한 profile로만 들어온다(§4, §11).
7. **발행은 GHCR, 진입은 채널 카탈로그다.** 서명 evidence는 OCI referrer로 분리해 digest 자기 참조를 만들지 않는다(§10).
8. **OSR이 멈춰도 설치 · 복구는 독립적으로 남는다.** 검증된 offline bundle · 기존 설치 기록 · 독립 복구 자격으로 원래 설치를 복구할 수 있어야 한다. bootstrap · 신뢰 키 등록 · OSR 자체 복구는 정상 모듈 승인 경로 밖에 둔다(§12).

## 2. 위치와 경계

```text
                ┌──────────── Backbone(관리 제어면) ─────────────┐
 GHCR ──발견──▶ │ OSR(모듈 원장) ──계획──▶ Execution Core(승인·의도) │
 (발행)         │   │                         │                    │
                │   └─ 카탈로그 · 판정        ▼                    │
                │              제한 실행부 → 공개 Setup(적용)        │
                └──────────────────────────┬──────────────────────┘
                                           ▼
            HISS 구성요소 · Fabric(배포 지원 · 공유 서비스 Provider · 엔진) · 어셈블리 정의
                                           ▼ (영역에서 Claim · 인도)
                         Governance · Workspace · 고객 영역 제품
```

- **OSR이 관리하는 것:** Backbone 밖 레이어의 공급 모듈과 그 수명주기. 영역의 업무 판단 · 자격 · 데이터 소유권은 가져오지 않는다. 테넌트 구성과 Governance 배분(D-82)은 각자의 판단이다. HISS의 소유권은 D-86을 따른다.
- **OSR에 `core`로 기록하는 것:** Backbone 자신의 구성요소. 버전 · digest를 기록하지만 OSR로 설치하지 않는다.
- **기존 목록의 이관 단위(바로잡음):**
  - 서버 모듈 카탈로그(`contracts.rs`)의 12개는 **모듈**이다. `core` 모듈 레코드로 옮긴다.
  - Nexus 인벤토리 38행(공통 10 · 부분 14 · 후보 12 · 계약만 2)은 모듈이 아니라 **액션 · 경로 행**이다. 모듈 레코드가 아니라 그 모듈에 연결된 operation 레코드로 옮긴다.
  - 기존 `member` 표시는 OSR 형식적 멤버가 아니다. 서명 · 기여 검증 전까지 OSR에서는 **미판정**으로 둔다.
- **OS CLI:** `os registry` · `os catalog`는 지금 `/console-api/modules` 읽기다. OSR 읽기 API로 바꾼다.

## 3. 용어

| 용어 | 뜻 |
|---|---|
| 모듈 | OSR에 등록되는 독립 배포 단위. 하나의 정체(ID)와 소유자를 가진다 |
| 클래스 | 모듈의 종류(§4). 필수 기여 형식 · 설치 profile · 판정 증거가 클래스마다 다르다 |
| 릴리스 | 모듈의 불변 판. 번들 digest로 식별한다 |
| 기여 | 모듈이 OpenSphere에 내놓는 것. 매뉴얼, OS Shell 명령, OCI 산출물, 지식(RAG), UI, 이벤트, 관측, Provider 선언 |
| materializer profile | 클래스와 권한 범위별로 Backbone이 승인해 둔 설치 방식. 모듈은 profile을 고를 뿐 설치 방식을 정의하지 않는다 |
| 평가 맥락 | 판정 시각, 정책 revision, 신뢰 세대, Backbone 계약 판의 묶음 |
| 형식적 멤버 | 릴리스가 평가 맥락에서 §9 오프라인 검증을 통과한 상태 |
| 실질적 멤버 | 설치본이 §9 설치본 검증을 통과한 상태 |
| 설치본 | 한 OpenSphere 설치(설치 ID) 안에 실제로 놓인 모듈 릴리스 |
| 채널 카탈로그 | 채널별로 (모듈 → 릴리스 번들 digest)를 가리키는 서명된 목록 |

## 4. 모듈 클래스와 설치 profile

| 클래스 | 예 | 설치 형태 | 판정 증거 |
|---|---|---|---|
| `core` | Console, Core, Nexus, Swallow, Magpie, R2D2 | OSR로 설치하지 않음 | 기록 · 매뉴얼 · 지식 |
| `hiss` | ingress-nginx, cert-manager, 관측 바닥, 외부 Ceph 연결 | 고권한 profile(아래). 새 특권 profile은 별도 검토 | 클래스별 실검증(canary) |
| `delivery` | Argo CD, Crossplane | 승인된 materializer profile | 설치 · 복구 · 버전 확인 |
| `provider` | PostgreSQL, OpenSearch, Samba AD, Keycloak, KubeVirt | 승인된 materializer profile이 워크로드 · 저장 · 연결 · 실검증을 구성. 상태 저장 엔진을 Deployment 하나로 표현하지 않는다. profile 하나는 적용 방식 하나만 갖는다(예: `provider.stackgres-pg`는 StackGres만) | Provider 선언 · 실검증 · 공급 단위 확인 |
| `engine` | Stalwart, Mattermost, GitLab, Odoo | 승인된 materializer profile | 의존 Claim 충족 · 실검증 |
| `runtime` | Temporal, 이벤트 채널, 모델 게이트웨이 | 승인된 materializer profile | 사용 면 경계 확인 |
| `assembly` | `mail`, `chat` 어셈블리 정의 | **실행하지 않음.** 서명된 정의 · 의존 · 리소스 유형을 OCI artifact로 전달하고 등록만 한다. 실행 Pod나 가짜 실행 이미지를 요구하지 않는다 | 정의 검증 · 의존 모듈의 실질 상태 · 구성 가능성 |
| `ui` | subShell, 화면 plugin | 셸 profile | 화면 · 탐색 기여 확인 |
| `product` | Governance, Workspace 구성 제품 | 영역 인도 계약 | 인도 영수증 |

**고권한 profile(HISS 등):** 닫힌 profile 이름만으로 충분하지 않다. profile마다 다음을 고정한다.
- 허용 resource · verb · namespace 범위
- host 접근(hostPath · hostNetwork · privileged) 여부
- exec · Secret 읽기 · RBAC escalate · bind 허용 여부
- NetworkPolicy · admission 설정을 바꿀 수 있는 범위

profile에 없는 권한을 요청하면 형식 판정에서 거절한다. 새 profile을 더하는 것은 OSR 데이터가 아니라 Backbone 검토 대상이다.

**기여 네 가지는 모든 클래스에 있되 형식이 다르다.** 예를 들어 어셈블리의 "명령"은 정의 조회 · 구성 가능성 확인 같은 읽기 명령이다. 지원하지 않는 항목을 `enabled:false`와 사유로 표시할 수는 있지만, 사유만으로 자동 합격시키지 않는다. 클래스 규칙이 허용하는 항목만 생략할 수 있다.

## 5. 식별자와 저장소 이름

- **모듈 ID:** `<class>.<slug>`. 예: `provider.postgres`, `hiss.ingress-nginx`, `assembly.mail`. slug는 `^[a-z][a-z0-9-]{1,40}$`.
- ID는 영구다. 지운 ID는 다시 쓰지 않는다. 이름을 바꿀 때는 별칭을 남긴다. 예약 ID는 다른 모듈이 쓸 수 없다.
- **GHCR 저장소:** `ghcr.io/opensphere-platform/opensphere-<class>-<slug>`.
- **명령 ID 접두어:** 모듈 ID. 기존 명령(`foundation.provider-modules.*`, `platform-support.argocd.*`, `cluster-manager.hiss.*`)은 별칭으로 한 판 이상 함께 받는다(D-79).

## 6. 모듈 디스크립터 `opensphere.module/v1`

릴리스마다 하나다. 번들의 config 또는 전용 artifact로 싣는다(§10). 인덱스 주석에 서명 결과를 넣지 않는다.

| 필드 | 필수 | 내용 |
|---|---|---|
| `schema` | 필수 | `opensphere.module/v1` |
| `id`, `class`, `displayName`, `owner`, `description` | 필수 | §4 · §5 |
| `version` | 필수 | `YY.MDD.HHMM.BUILD`. BUILD 재사용 금지 |
| `compatibilityVersion` | 필수 | SemVer |
| `plane` | 필수 | `hiss` · `fabric-delivery` · `fabric-shared` · `fabric-engine` · `fabric-runtime` · `catalog` · `shell` · `employee-area` · `customer-area` |
| `backboneCompat` | 필수 | 요구하는 Backbone 계약 범위 |
| `dependencies` | 필수(빈 목록 가능) | `[{module, range, kind: required|optional, claims?}]` |
| `profile` | 실행 클래스 필수 | 고를 materializer profile ID(§4) |
| `capabilityRequests` | 필수 | 요청하는 capability 목록. **요청일 뿐 부여가 아니다** |
| `runtime` | 실행 클래스 필수 | 이미지 digest, health · ready 경로, 자원, securityContext. 설치 형태는 profile이 정한다 |
| `storage` | 상태가 있으면 필수 | Foundation 저장 프로필 참조 |
| `contributions` | 필수 | §7. 클래스 규칙이 허용하는 생략만 `enabled:false` + 사유 |
| `supplyChain` | 필수 | `{sourceRepository, sourceRevision(40자), buildAuthority}`. SBOM · 출처는 referrer로(§10) |
| `lifecycle` | 필수(클래스별) | 실행 클래스: 설치 · 갱신 · 롤백 · 퇴역 명령 ID. `assembly`: 등록 · 갱신 · 퇴역만(실행 롤백 없음) |

## 7. 필수 기여 네 가지와 기타 기여

### 7.1 매뉴얼 `opensphere.manual-bundle/v1`

- 문서 메타데이터: `sourceId`, `version`, `sourcePath`, `documentType`, `authorityTier(0~4)`, `audience`, `plane`, `module`, `tags`, `checksum`, `content`.
- 필수 문서 유형: `overview`, `install`, `operations`, `troubleshooting`, `commands`. 어셈블리는 `install` 대신 `composition`(구성 조건 · 의존)을 둔다.
- 설치 때 매뉴얼 원장에 수집한다. 문서 ID `manual:<module-id>:<slug>`.
- 매뉴얼은 근거이지 실행 권한이 아니다. 명령 예시는 같은 릴리스 명령 계약의 ID만 가리킬 수 있다.

### 7.2 OS Shell 명령 `opensphere.owner-commands/v4`

- 명령 필드: `id`, `description`, `kind`, `mutation`, `arguments`, `scope`, `idempotency`, `requiredPermissions`, `output`, `statusCommand`, `review`, `effect`(none · read-cost · mutation · destructive).
- **유효 권한(바뀐 부분):** 명령 실행 허용은 다음 교집합이다.
  1. 플랫폼이 이 모듈 · profile에 허용한 capability(OSR 정책 레코드, 판(revision)으로 추적)
  2. 호출자의 현재 권한과 위임 범위(서버가 정함)
  3. 대상 · 설치본 scope(설치 ID · 네임스페이스 · 상태)
  4. Owner의 최종 검사

  발행 명세가 쓰기를 `read`로 적거나 더 넓은 권한을 요구해도 승인 우회나 권한 상승이 되지 않는다. 판단은 선언된 kind가 아니라 profile의 capability와 `effect`로 한다. `effect`도 제출된 값을 그대로 믿지 않는다. profile · capability 정책과 kind로 정합성을 확인하고, 맞지 않으면 형식 판정에서 거절한다(`EffectPolicyViolation`).
- **예산과 승인:** kind 이름만 보고 같은 짧은 조회 예산을 주지 않는다. canary 검증 · 원장 조정 같은 비싼 read · verify는 효과 · 비용에 따라 따로 제한한다. mutation · destructive는 Execution Core 승인 경로로 간다. 저위험 검증까지 사람 승인을 일괄로 걸지는 않는다. 실행 원장 기록과 사람의 보호 승인은 다른 것이다.
- **표준 명령:** `status`, `inspect`, `plan`, `apply`, `verify`, `operation`, `rollback`, `retire`. 어셈블리는 `status` · `inspect` · `verify`(구성 가능성)만 필수다.
- **모듈 쪽 의무:** Backbone 경유 요청만 받는다. 오래된 `reviewRevision`은 409, 같은 `requestId`에 다른 인자는 거절, 결과는 `outcome`(Observed · Accepted · Running · Configured · Verified · Failed · Unknown · Cancelled).
- 크기 한도: 256 KiB, 명령 256개.

### 7.3 OCI 산출물과 OCI 명령

- 산출물 종류와 digest를 구별한다(§10): 번들 digest, 플랫폼별 실행 manifest digest, 디스크립터 · 기여 artifact digest, 서명 evidence digest.
- **OCI 명령(OS CLI):** `os oci inspect <module>@<digest>`, `os oci verify <module>@<digest>`, `os oci pull <module>@<digest> --artifact <type>`, `os osr register <module>@<digest>`. "OCI 명령"을 이렇게 해석했다(결정 후보 OSR-A).

### 7.4 RAG 등록 `opensphere.knowledge-bundle/v1`

- 문서 필드: `id`, `module`, `kind`, `repository`, `path`, `sourceRevision`, `sha256`, `license`, `language`, `content`.
- 설치 때 지식 원장에 모듈 범위로 수집한다. 읽기 전용이다. 다른 모듈 범위를 덮어쓰지 않는다.
- **지식은 명령 · 정책 · 에이전트 Memory가 아니다.** 서명된 문서라도 근거일 뿐이다. 검색 결과에는 모듈 · 설치본 범위, 현재 판인지 · 회수됐는지, `evidenceKind=ReleaseDocumentation`, `runtimeState=NotObserved`를 표시한다.
- 비밀값 · 내부 주소 패턴 검사로 거른다. **패턴 검사로 프롬프트 주입 방지를 보장하지 않는다.** 소비자(R2D2 등)가 근거와 지시를 구분해야 한다.
- 의미 검색은 후속 결정이다(OSR-F). 초기 원장에는 원문 · 출처 · 체크섬 · 검색 계약만 두고 vector 열은 두지 않는다.

### 7.5 그 밖의 기여

| 기여 | 필수 여부 | 내용 |
|---|---|---|
| 건강 · 관측 | 실행 클래스 필수 | health · ready, 메트릭 이름, 감사 이벤트 종류 |
| 이벤트 | 선택 | 발행 · 구독 계약(Swallow 고정 구독자 원칙) |
| UI | `ui` 필수 | 화면 · 탐색 기여, 셸 호환, 에셋 해시 |
| Provider 선언 | `provider` 필수 | 나눠 주는 단위, Claim 스키마, scope |
| 스킬 | 선택 | 같은 릴리스 명령만 참조(최대 16개) |

## 8. 멤버 상태

### 8.1 상태 기계

```text
 (릴리스 단위)
 후보 ──등록 요청──▶ 오프라인 검증 ──통과──▶ 형식적 멤버 ──회수──▶ 회수됨
                         └──실패──▶ 거절(사유 코드)
 (평가 맥락이 바뀌면 다시 오프라인 검증)

 (설치본 단위)
 형식적 멤버 ──설치 승인──▶ 설치 중 ──▶ 설치본 검증(검증 capability만) ──통과──▶ 실질적 멤버 ⇄ 저하
                                     └──실패──▶ 설치 실패 · Unknown
 실질적 멤버 ──정지──▶ 정지됨 ──재개──▶ 실질적 멤버
 실질적 멤버 ──퇴역──▶ 퇴역 중 ──▶ 퇴역됨
```

- **검증 중 설치본의 명령:** 실질 판정에 필요한 `status` · `inspect` · `verify`만 해당 작업에 한정된 **검증 capability**로 실행한다. 일반 업무 실행 권한은 실질적 멤버가 된 뒤에 연다. 실질 판정이 명령에 의존하고 명령이 실질 판정에 의존하는 순환을 이렇게 끊는다.

### 8.2 판정 기준

| 상태 | 필요한 증거 | 할 수 있는 일 |
|---|---|---|
| 후보 | 디스크립터 제출, ID 예약 | 카탈로그에 "후보" |
| 형식적 멤버 | §9 오프라인 검증 1~9단계 | 카탈로그 표시, 설치 계획 |
| 실질적 멤버 | §9 설치본 검증 10~12단계 | 운영 대상, 영역 Claim 공급(provider), 구성 가능(assembly) |
| 저하 | 건강 · 검증 실패, 계약 지문 변경 후 재판정 대기 | 신규 Claim · 새 변경 막음. 관측 · 진단 · 안전 복구는 허용 |
| 정지 | 운영자 결정 또는 보안 동결 | 새 변경 차단. 관측 · 진단 허용 |
| Unknown | 응답 유실 · 결과 불명 | 같은 요청 영수증 확인 전 재시도 금지. 관측만 |
| 회수 | 키 회수, 릴리스 철회, 공급망 문제 | 아래 회수 정책 |
| 퇴역 | 퇴역 명령 완료 영수증 | 카탈로그에서 내려감. ID 보존 |

### 8.3 회수 정책(세분)

| 대상 | 회수된 릴리스 · 키에서 |
|---|---|
| 신규 설치 | 금지 |
| 새 변경(apply 계열) | 금지. 단, 회수되지 않은 릴리스로의 갱신 · 롤백은 허용 |
| 현재 서비스 | 자동 중단 · 삭제하지 않음. "회수된 릴리스 사용 중" 경고 |
| 관측 · 진단(read · verify) | 허용 |
| 안전 복구 · 퇴역 | 신뢰된 Backbone 실행부가 검증된 profile의 제한 작업으로만 허용. 회수된 모듈이 제공한 명령은 실행하지 않는다 |

### 8.4 재판정

- 설치본의 계약 · 구성 · 의존 · 신뢰 세대가 바뀌면 실질 판정을 다시 한다. 그 사이 설치본은 저하다.
- 초기에는 설치 · 갱신 직후, 계약 지문 변경 시, 운영자 요청 시에만 재판정한다. 범용 scheduler는 두지 않는다.
- 기존 상태와의 대응: Nexus 인벤토리의 `member`는 OSR 형식적 멤버가 아니다(§2). 아카이브 CONSTITUTION-0003의 `planned → packaged → registered → activated`는 후보 → 형식적 멤버 → 실질적 멤버로 이어진다.

## 9. 검증 순서와 거절 사유

모든 판정 행은 평가 맥락(시각 · 정책 revision · 신뢰 세대 · Backbone 계약 판)을 함께 기록한다. **같은 평가 맥락이면 같은 결과**여야 하고, 맥락이 다르면 결과가 달라질 수 있다.

| 단계 | 구분 | 검사 | 실패 사유 코드 |
|---|---|---|---|
| 0 | 오프라인 | 검증 맥락 snapshot이 trust anchor 서명 · 유효기간 안 | `ContextSnapshotInvalid`, `ContextSnapshotExpired` |
| 1 | 오프라인 | 저장소 이름 규칙 | `RepositoryNameInvalid` |
| 2 | 오프라인 | 번들 digest · 요청 참조 일치 | `InvalidDigest`, `ReleaseCoordinatesMismatch` |
| 3 | 오프라인 | 서명 evidence(referrer)가 현재 신뢰 세대의 이 모듈 키로 맞음 | `UnknownTrustKey`, `KeyScopeViolation`, `SignatureInvalid`, `TrustGenerationStale` |
| 4 | 오프라인 | 서명 evidence 만료 | `SignatureExpired` |
| 5 | 오프라인 | 디스크립터 스키마 · ID 예약 · 클래스 규칙 · 저장소/서명/디스크립터 좌표 | `DescriptorInvalid`, `DuplicateID`, `ReservedID`, `ClassRuleViolation`, `ReleaseCoordinatesMismatch` |
| 6 | 오프라인 | 기여 · 실행 artifact digest가 디스크립터 · 서명과 같음, SBOM · 출처가 서명 payload digest · 이 번들 subject · 신뢰 builder와 맞음 | `ArtifactDigestMismatch`, `SupplyChainEvidenceMissing`, `SupplyChainEvidenceMismatch`, `SupplyChainSubjectMismatch`, `ProvenanceBuilderUntrusted` |
| 7 | 오프라인 | 기여 네 가지 계약(클래스별 형식), 명령 kind · mutation · effect 정합 | `ManualMissing`, `CommandContractInvalid`, `StandardCommandMissing`, `EffectPolicyViolation`, `KnowledgeProvenanceInvalid` |
| 8 | 오프라인 | capability 요청이 정책 · profile 허용 안 · profile 존재와 지문 · effect가 profile 허용 안 | `CapabilityNotAllowed`, `ProfileUnknown`, `EffectPolicyViolation` |
| 9 | 오프라인 | 의존 범위 · Backbone 호환 | `DependencyUnresolved`, `BackboneIncompatible` |
| 10 | 설치본 | 실행 digest · 건강 · 저장 binding. 어셈블리는 정의 digest · generation과 멤버 실질 상태 | `RuntimeDigestMismatch`, `HealthCheckFailed`; 어셈블리 `DefinitionDigestMismatch`, `DependencyNotSubstantive`, `DependencyBindingMismatch`, `VerdictContextChanged` |
| 11 | 설치본 | 검증 capability로 `status` · `inspect` 응답, 매뉴얼 · 지식 수집 영수증 | `CommandUnreachable`, `IngestionFailed` |
| 12 | 설치본 | 클래스별 `verify`(어셈블리는 구성 가능성)와 감사 기록 | `VerificationFailed`, `AuditMissing` |

- 1~9단계의 입력은 **릴리스 자료 + 독립적으로 신뢰한 검증 맥락 snapshot**이다. snapshot은 OSR 신뢰 운영 경로가 서명하며 신뢰 키 · 신뢰 세대 · 정책 revision · profile 지문 · dependency lock · 채널 sequence 기준을 담는다. 실행 중인 설치본은 필요 없지만, 모듈이 자기 신뢰 키나 허용 정책을 스스로 제공해 합격할 수는 없다. 판정 영수증은 snapshot digest를 기록한다(`ContextSnapshotInvalid`, `ContextSnapshotExpired`).
- 10~12단계는 공개 Setup으로 실제 설치한 설치본이 있어야 한다(실질). **어셈블리**는 10단계를 실행 digest · 건강 · 저장 대신 등록된 정의 digest · 정의 generation과 의존 모듈의 실질 상태로 판정한다. 워크로드가 없다고 무조건 합격하거나 영원히 판정 불가가 되지 않는다. 정의가 바뀌면 재판정한다.
- 계약 단위 fixture 검사와 실제 설치 검사는 구분해 보고한다. 0~9단계와 어셈블리 10단계 대체 판정, 채널 카탈로그 · 실행 바인딩 · 독립 복구 · 유효 권한의 사유 코드와 시험 벡터는 [OSR 계약 · 시험 벡터](osr/README.md)에 있다.
- 실패는 사유 코드와 함께 남기고 지우지 않는다. 응답 유실은 `Unknown`이다.

## 10. GHCR 발행 규격

- **저장소:** `ghcr.io/opensphere-platform/opensphere-<class>-<slug>`. 비공개면 `read:packages` 읽기 자격(아카이브 `registry-auth/v1`).
- **번들 구조(바뀐 부분):** 서명 결과를 서명 대상 안에 넣지 않는다.

```text
 모듈 번들(OCI image index, 번들 digest = 릴리스 ID)
   ├─ 플랫폼별 실행 manifest(실행 클래스만)
   ├─ 디스크립터 artifact
   └─ 기여 artifact(명령 계약 · 매뉴얼 · 지식 · 어셈블리 정의 등)
 referrer(subject = 번들 digest) ── 번들과 별도
   ├─ 서명 evidence(번들 digest · 디스크립터 digest · 기여 digest를 서명)
   ├─ SBOM(SPDX)
   └─ 출처 증명(SLSA)
```

  - 서명 대상은 번들 digest, 그 안의 디스크립터 · 기여 digest, 그리고 **수용할 SBOM · 출처 evidence의 digest**다. SBOM · 출처 referrer는 이 서명 payload에 digest가 있어야만 받아들인다. 같은 subject를 가리킨다는 사실만으로 신뢰하지 않는다. 출처의 builder는 snapshot의 신뢰 builder 목록에 있어야 한다(`SupplyChainEvidenceMismatch`, `SupplyChainSubjectMismatch`, `ProvenanceBuilderUntrusted`). 서명 evidence는 OCI 1.1 `subject`로 번들을 가리키는 referrer다. 번들 bytes는 바뀌지 않으므로 digest가 고정된다.
  - 디스크립터 · 서명 대상은 정해진 canonicalization(예: RFC 8785 JSON)으로 bytes를 만든다. Rust · Node · Go가 같은 벡터로 같은 bytes와 판정을 내야 한다.
  - 기존 ORAS 같은 검증된 OCI 도구로 artifact · referrer를 다룬다.
- **태그:** 버전 태그 `YY.MDD.HHMM.BUILD`는 불변이다. 채널 태그 `edge` · `candidate` · `stable`은 포인터다. 설치는 digest로만 한다.
- **서명 수명과 재서명:**
  - 릴리스(번들 digest)는 불변이고, 서명 evidence는 만료(최대 90일)가 있다.
  - 같은 릴리스에 새 서명 evidence를 referrer로 더해 재서명한다. 릴리스 행은 바뀌지 않는다.
  - 키 회수 시 그 키의 evidence는 무효다. 신뢰 세대(trust generation)는 키 등록 · 회수 때마다 올라간다.
- **채널 카탈로그 `opensphere.module-channel/v1`:** `{channel, sequence, issuedAt, expiresAt, entries:[{module, version, bundleDigest, compatibilityVersion}]}`를 서명한다. `sequence`는 **catalog authority × 채널별로** 단조 증가하며, 마지막으로 받아들인 값을 영속 저장해 재시작 · 복원 뒤에도 기준이 남는다. 더 낮은 sequence, 같은 sequence의 다른 digest, 만료, 범위 밖 authority는 거절한다(`CatalogReplay`, `CatalogEquivocation`, `CatalogExpired`, `CatalogScopeViolation`). (모듈, 채널)마다 digest는 하나다.
- **만료와 복구:** 채널 카탈로그나 서명 evidence가 만료되면 **새 설치는 거절**한다. **원래 설치의 독립 복구**는 별도 복구 자격 · 설치 기록에 고정된 번들 digest · offline 자료로만 허용한다(§12). `ignore-expiry` 같은 무시 옵션이나 sequence 초기화는 두지 않는다.
- **채널별 추가 조건:** 기존 Backbone 필수 CI(`source-check`, 의존성 정책 포함)는 모든 채널에 그대로 적용한다. 아래는 **그 위에 얹는 조건**이다.

| 채널 | 빌드 주체 | 서명 evidence | SBOM · 출처 | 취약점 · 라이선스 추가 검사 | 승격 |
|---|---|---|---|---|---|
| edge | Gitea Actions 수용 main | 필수 | 필수(생성은 자동) | 기존 필수 CI 범위 | — |
| candidate | 위와 같음 | 필수 | 필수 | 추가 검사 필수 | edge에서 승격 |
| stable | 재빌드 없음 | 필수 | 필수 | 필수 + 승격 승인 | candidate에서 승격 |

- 발행 성공은 설치 승인이 아니다.

## 11. 확장(설치) 흐름

```text
 ① 발행      Gitea PR → 필수 CI → 수용 main → GHCR 번들 + referrer(서명 · SBOM · 출처) → 채널 카탈로그
 ② 발견      OSR이 채널 카탈로그를 읽거나 `os osr register` → §9 1~9단계 → 형식적 멤버
 ③ 계획      `osr.module.plan`: 의존 해석 · profile · 저장 binding · HISS 인도 · 생성할 RBAC → 계획 revision
 ④ 승인      Execution Core의 OSR 승인 범위(adapter): 계획 · 산출물 · 대상 · revision을 묶는다
 ⑤ 실행      제한 실행부가 승인 영수증을 받아 공개 Setup `apply-module`을 실행한다
 ⑥ 검증      §9 10~12단계(검증 capability만) → 실질적 멤버. 매뉴얼 · 지식 · 명령 수집
 ⑦ 공급      provider · engine은 공급 풀에, assembly는 구성 가능 목록에. 영역 결정은 영역이 한다(D-82)
```

- **Setup을 실행하는 주체:** Execution Core가 승인 영수증을 넘기는 **제한 실행부**다. 관리자 CLI나 일반 소스 Runner가 아니다. 제한 실행부는 그 설치 범위의 적용 자격만 받고, 적용 결과를 영수증으로 돌려준다. 일반 소스 Runner에 운영 kubeconfig를 주지 않는다.
- **클래스별 적용:** profile이 렌더링을 정한다. RBAC은 profile의 고정 규칙으로 Backbone이 생성하고, 모듈이 가져온 RBAC은 쓰지 않는다. 어셈블리는 적용할 워크로드가 없고 정의 등록과 구성 가능성 판정만 한다.
- **Backbone 설치 원칙:** 설치 지문 · writer lock 보존, 같은 작업 재개는 무변경 종료 가능, 결과 불명에 자동 재실행 · 잠금 해제 · 하향 마이그레이션 없음, 이미지 롤백과 데이터 복원은 따로 판단, 회수와 파괴적 퇴역은 구별.
- **저장:** Foundation 저장 프로필 선택 · 검증 · 활성화 관문. 최초 선택은 한 번만.

## 12. 독립 복구와 순환 의존 밖의 경로

- 정상 설치는 OSR · Auth · Core를 쓴다. 그러나 이것을 **복구의 필수 의존성으로 만들지 않는다.**
- **독립 복구:** 검증된 offline bundle(번들 · referrer · 채널 카탈로그 사본), 기존 설치 기록, 독립 복구 자격으로 원래 설치를 OSR 없이 복구할 수 있어야 한다. 복구 대상은 설치 기록에 고정된 번들 digest와 같아야 하고, 복구 자격이 없거나 digest가 다르면 중단한다(`RecoveryBundleMismatch`, `RecoveryCredentialMissing`). 만료 무시 옵션은 없다(`RecoveryOverrideNotSupported`).
- **정상 승인 경로 밖에 두는 것:** 초기 bootstrap, 신뢰 키 등록 · 회수, 관리 신원 복구, OSR 자체 복구.
- **기존 고정 명령 흡수:** 기능별 adapter로 시작한다. 과거 operation · UID · spec · migration · issuer 증거와 같은 작업 무변경 재개를 보존한다. 새 이미지 적용과 옛 작업 재개 호환은 별개의 수용 기준이다.

## 13. Backbone 안의 OSR 구성 (`제안`)

| 구성 | 내용 |
|---|---|
| OSR 원장 | 관리 PG의 `osr` 스키마. 모듈 · 릴리스 · artifact · 판정(평가 맥락 포함) · 설치본 관측 · 회수 · 감사 |
| Core와의 관계 | OSR은 모듈 · 릴리스 · 기여 · 설치 관측을 소유한다. 실행 · 승인 · 멱등 · outbox는 Core를 재사용한다. 두 DB의 원자적 동시 기록을 가정하지 않고 operationId · generation · 최종 영수증으로 투영을 맞춘다 |
| 키 체계 | 모듈 배포 서명 키(OSR 신뢰 키), 사람 승인 키(Core), 명령 인계 신뢰(Core 실행 증거 재사용) 셋을 목적과 운영 권한으로 구별한다. 새 키 체계마다 새 서비스를 만들지 않고 기존 검증 경로를 먼저 재사용한다 |
| 읽기 API · Console · R2D2 | 같은 읽기 응답. 신뢰 키 쓰기는 Console에 없다. R2D2는 읽기 · 지식 검색만 |

## 14. 이행 단계

구체적인 계획(PR 단위 · 완료 기준)은 [구현 계획서 v0.2](OSR-IMPLEMENTATION-PLAN-v0.2.md)에 있다. 순서는 계약 정리 → 형식 검증과 최소 읽기 원장 → 최소 설치본 원장과 승인 계획 → 한 모듈 수직 실증 → 실패 · 회수 · 재개 · 복구 → 외연 확장이다.

## 15. 결정 후보 (모두 `제안`)

| 후보 | 결정할 내용 | 권고안 |
|---|---|---|
| OSR-A | "OCI 명령"의 뜻 | 릴리스를 digest로 검사 · 검증 · 받는 OS CLI 명령 |
| OSR-B | 모듈 ID 체계 | `<class>.<slug>` |
| OSR-C | 버전 형식 | `YY.MDD.HHMM.BUILD` + SemVer `compatibilityVersion` |
| OSR-D | 서명 방식 | P-256 서명 evidence를 OCI referrer로, canonicalization 고정 |
| OSR-E | 매뉴얼 · 지식 수집 시점 | 설치 때 |
| OSR-F | 지식 저장 · 의미 검색 | PG 모듈 범위 원장, 의미 검색 · vector는 후속 migration |
| OSR-G | 외부(서드파티) 모듈 | v1은 `opensphere-platform` 발행만 |
| OSR-H | 설치 실행 경로 | Core 승인 → 제한 실행부 → 공개 Setup `apply-module` |
| OSR-I | 재판정 시점 | 설치 · 갱신 직후, 계약 지문 변경, 운영자 요청 |
| OSR-J | 표준 명령 | §7.2의 8개(어셈블리 3개) |
| OSR-K | 유효 권한 모델 | §7.2의 교집합, 모듈 정책 revision 추적 |
| OSR-L | 고권한 profile | §4의 고정 항목, 새 profile은 Backbone 검토 |
| OSR-M | 회수 정책 | §8.3 |

## 16. 근거

**현재 Backbone(main `6eb014e`)**
- 모듈 카탈로그 `backend/server/src/contracts.rs`(12모듈 · 10액션), 정책 `policy.rs`, 인벤토리 `bus_inventory.rs` · `bus_inventory_candidates.json`(부분 14 · 후보 12, 공통 10 · 계약만 2와 합쳐 38행).
- Core 승인 범위 `approval.rs`의 `review_shape`: `execution` · `trial` · `release`.
- OS CLI `cli/cmd/os/backbone.go`(Backbone 모드 501 분기).
- 발행: `.gitea/workflows/publish-images.yaml`, `scripts/step3/publish-images.mjs`(의존성 정책 범위 검사 포함), `governance/VERSION-AND-RELEASE-POLICY.md`, `releases/channels/edge.json`.
- 의존성 예외: `governance/dependency-exceptions/chrono-20261117.json`(범위 Console UI 전달, 11-24 만료, backend · infra · cli 등 지문 동결).
- 설치: `setup/src/channels.mjs`, `registry-reader.mjs`, `docs/setup/NATIVE-MODULES.md`.
- 지식: `docs/r2d2/knowledge/README.md`, `scripts/r2d2/knowledge/build-pack.py`, `knowledge.rs`.

**이전 세대 아카이브** — v0.1 §15와 같다. C_REG(`OpenSphere-console/backend/registry/`), CONSTITUTION-0001~0005, `ModulePackageV1`, `UIPluginPackage` · `UIPluginRegistration` CRD, owner-commands v2~v4, 매뉴얼 시드 · OSAA 데이터 모델 · module-context, Foundation child catalog, `registry-auth/v1`.

**외부 규격**
- [OCI Image Manifest — subject · artifact](https://github.com/opencontainers/image-spec/blob/main/manifest.md)
- [ORAS — manifest annotation · attach](https://oras.land/docs/how_to_guides/manifest_annotations/)

## 17. 검토 반영

2026-11-17 Jupiter의 "OSR 확장 구현 계획 검토"(Blueprint `532bd55` 대상)를 반영했다.

| 검토 항목 | 반영 위치 |
|---|---|
| A. 고정 액션은 동적 명령의 권한 정책을 대신하지 않음 | §1 · §7.2 · OSR-K |
| B. admission 토큰 발급 주체 · 최종 검증 | §11 · §13(키 체계), 구현 계획서 §3.4 |
| C. Provider와 어셈블리를 같은 설치 형태로 다룰 수 없음 | §4 · §6 · §11 · OSR-L |
| D. M2~M5 순환 의존 | §8.1 검증 capability, §9 오프라인/설치본 구분 |
| E. OCI digest와 서명 · 재서명 | §10 번들 구조 · 서명 수명 · 채널 카탈로그 sequence |
| F. OSR 장애 시 독립 복구 | §1 · §12 |
| 기존 목록 이관 단위 | §2 |
| 회수 정책 | §8.3 |
| OSR 원장과 Core | §13 |
| 재검증 상태 | §8.4 |
| 지식과 Memory | §7.4 |
| 의미 검색 DDL | §7.4 · OSR-F |
| 채널 최소 검사 | §10 |
| 착수 기준 | 머리말 · §16, 구현 계획서 §0 |

### 17.2 v0.2 재검토(2026-11-18) 반영

| 재검토 항목 | 반영 |
|---|---|
| A. 승인 산출물을 profile 이름보다 구체적으로 | 구현 계획서 §3.3 · §3.5, [계약](osr/README.md)의 설치 계획 · 실행 영수증 |
| B. SBOM · 출처를 서명 증거에 결합 | §10, 계약의 서명 payload |
| C. 오프라인 검증의 신뢰 입력 · 만료 시 복구 | §9 · §10 · §12, 계약의 검증 맥락 snapshot · 채널 카탈로그 |
| D. 어셈블리 필드 · 판정 정합 | §6 `lifecycle`, §9 10단계, 계약의 어셈블리 정의 |
| 문구: `effect` 검증 | §7.2 |
| 문구: 회수 시 안전 복구 · 퇴역 | §8.3 |
| 문구: 권한 회수 · 위임 만료 | 구현 계획서 단계 5 |

## 부록 A. Backbone 준비도 점검 — 필수 기여 네 가지

**기준:** 2026-11-17에 Backbone main `f04476e`를 점검했고, 2026-11-18에 main `6eb014e`에서 관련 경로를 다시 확인했다. 그 사이 관련 경로의 변화는 발행 스크립트에 의존성 정책 검사가 더해진 것뿐이고, 아래 판정은 그대로다.

**결론:** 네 가지 모두 아직 받을 수 없다. 외부 모듈이 제출할 입구와 원장이 없고, 카탈로그 · 지식 · 설치 대상이 소스에 고정돼 있다.

| 기여 | 받는 입구 | 검증 | 저장 | 쓰는 쪽 | 판정 |
|---|---|---|---|---|---|
| 매뉴얼 | 없음 | 없음 | 없음 | 없음 | 처음부터 만들어야 함 |
| OS Shell 명령 | 없음 | 없음 | 없음 | 카탈로그 읽기만 | 부품만. 모듈 명령 실행 경로 없음 |
| OCI 산출물 · 명령 | 없음 | digest 존재 확인만 | 없음 | Backbone 구성요소만 | 부품만. 서명 · SBOM · 모듈 저장소 미지원 |
| RAG 등록 | 없음 | 빌드 때만 | 바이너리에 고정 | R2D2 읽기 | 부품만. 설치 때 수집 불가 |

### A.1 매뉴얼

- **지금:** 매뉴얼 원장 · 테이블 · API · 화면이 없다. 소스의 "manual"은 다른 뜻(Magpie 수동 모델 등록, Swallow 마이그레이션 이름, Setup 수동 절차 문구)이다.
- **부족한 것:** 묶음 수신 · 검증, PG 매뉴얼 원장, 설치 때 수집, Console 화면, 명령 예시 확인.
- **다시 쓸 것:** 아카이브의 `manual-seed.opensphere.io/v1alpha1`, OSAA 매뉴얼 데이터 모델.

### A.2 OS Shell 명령

- **지금:** 서버 command 액션은 `synthetic.echo` 하나다. Backbone 모드 OS CLI는 `os shell commands`(카탈로그 읽기) 외에 501이다. 정책은 plane별 고정 허용 목록이고, Core 승인 범위는 `execution` · `trial` · `release`뿐이다.
- **부족한 것:** 명령 계약 수신 · 검증, 명령 원장, owner 전달, Core의 OSR 승인 범위 adapter, 모듈 capability 정책 레코드, 표준 명령 확인.
- **다시 쓸 것:** 이전 CLI의 `shell_commands.go` · `module_update.go` · `module_rollback.go` · `extension_installation.go`, Nexus 사전 감사 · 예산 · 현재 권한 확인, Core 승인 · 멱등 · outbox.

### A.3 OCI 산출물과 OCI 명령

- **지금:** 발행에 서명 · SBOM · 출처가 없다(6eb014e에서 의존성 정책 검사만 추가). Setup `registry-reader.mjs`는 `opensphere-backbone-*` 저장소만 허용하고 manifest 존재만 본다. 채널 포인터는 Backbone 구성요소 8개 고정이다. `os oci` · `os osr`가 없다.
- **부족한 것:** 모듈 저장소 허용, referrer 서명 evidence 생성 · 검증, 신뢰 키 · 신뢰 세대, canonicalization 벡터, 모듈 채널 카탈로그(sequence), `os oci` · `os osr register`, SBOM · 출처 생성, `apply-module`.
- **다시 쓸 것:** 불변 버전 원장, OCI 라벨, 영향받은 구성요소만 발행, Setup digest 고정 적용 · 설치 지문 · writer lock · 재개, `read:packages` 전용 자격 검사.

### A.4 RAG 등록

- **지금:** 지식 팩은 문서 12개(Backbone 11 · Source-Catalog 1)이고 빌드 때 바이너리에 들어간다. 수집 API가 없다. pgvector는 PG 이미지에 있지만 지식에 쓰지 않는다.
- **부족한 것:** 묶음 수신 · 검증, PG 모듈 범위 원장, 설치 때 수집 · 영수증, 범위 격리, 출처 · 회수 표시.
- **다시 쓸 것:** 팩의 출처 필드와 `bundleDigest`, 읽기 전용 MCP(`opensphere_knowledge`), 기억 레코드의 출처 필드.

### A.5 공통으로 먼저 필요한 것

1. OSR 원장(모듈 · 릴리스 · 판정 · 설치본 · 회수).
2. 고정 dispatch 계약과 동적 레코드 · 모듈 정책 revision의 분리.
3. 클래스별 profile과 제한 실행부를 통한 일반 설치 경로.
4. 모듈 신뢰 키 · 신뢰 세대.
5. **OSR 개발 범위의 의존성 정책 해소.** 지금 chrono 한시 예외는 Console UI 전달 범위뿐이고 backend · infra · cli는 동결돼 있다. OSR 개발은 이 예외를 상속하지 못한다.
