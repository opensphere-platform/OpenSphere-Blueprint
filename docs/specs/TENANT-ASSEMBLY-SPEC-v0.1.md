# 테넌트·어셈블리 구성 명세 v0.1

**상태:** 초안. 결정 대장(D-번호)에 반영되지 않은 명세 후보다. 구현 승인이 아니다.
**작성:** 2026-11-17 · Claude(설계 검토 AI), 사용자 요구 반영
**상위 기준:**
- [네 면 구조](../overview/FOUR-PLANES.md): Backbone · Fabric · Governance · Workspace
- OpenSphere 기준선 v0.2([OPENSPHERE-LAYER-BASELINE-v0.2.md](../architecture/OPENSPHERE-LAYER-BASELINE-v0.2.md)): B-1~B-4, D-14, D-30~D-33, D-54, D-57, D-58
- O-2 PFSS 경계([OPENSPHERE-PFSS-BOUNDARY-O2-v0.1.md](../architecture/OPENSPHERE-PFSS-BOUNDARY-O2-v0.1.md)): Plan → Claim → Instance → Binding

**짝 문서:**
- [테넌트 내부 통신 규칙](TENANT-COMMUNICATION-RULES-v0.1.md)
- [Governance 참고 아키텍처](GOVERNANCE-REFERENCE-ARCHITECTURE-v0.1.md)

---

## 1. 왜 필요한가

PostgreSQL, Samba AD DC, OpenSearch, Stalwart를 설치했다고 서비스가 생기지는 않는다. 넷은 서로 관계없는 독립 제품이다. 지금 설계에 있는 공유 서비스(구 PFSS) 절차(Plan → Claim → Instance → Binding)는 **자원 하나를 받는 방법**만 정한다.

이 명세는 빠져 있던 두 가지를 정한다.
1. **여러 자원을 하나의 목적에 맞게 묶는 절차**
2. 묶은 뒤 **쉽게 풀리지 않는 연결**을 유지하는 규칙

## 2. 용어

| 용어 | 정의 |
|---|---|
| **테넌트** | **회사 하나**의 모든 리소스(사원 영역, 고객 영역, 업무 서비스, 외부에서 편입한 리소스)를 결속한 묶음(D-83). **신뢰의 뿌리**(테넌트 KMS, 내부 CA, 첫 소유자 자격)를 갖는다. "누구(어느 회사)의 것인가"의 경계다 |
| **영역** | 테넌트 안의 칸막이. 사원 영역, 고객 영역. 영역마다 신원과 채널이 다르고, 영역 사이는 교류 계층으로만 오간다 |
| **어셈블리** (가칭) | 영역 안에서 하나의 목적을 위해 묶인 구성요소 조합. "무엇을 위해 묶였나"의 경계다. 예: 메일 어셈블리 |
| **핵심 어셈블리** | 테넌트 발생(Genesis) 때 만들어지고, 다른 어셈블리가 모두 기대는 어셈블리. 신원, 신뢰, Governance, 채널이 여기에 속한다 |
| **구성요소** | 어셈블리를 이루는 개별 제품 인스턴스. 예: Stalwart 인스턴스, PG 클러스터 |
| **연결(Link)** | 두 구성요소 사이의 선언된 의존. 연결 전용 신원·자격·인증서·네트워크 허용 규칙을 갖는 **일급 객체**다 |
| **테넌트 매니페스트** | 테넌트의 목적, 프로파일, 어셈블리 목록을 적은 선언 |
| **어셈블리 정의** | 어셈블리 카탈로그의 틀. 구성요소, 연결, 초기화 단계, 적합성 시험을 적는다 |
| **연결 그래프** | 테넌트 안 모든 연결의 집합. 네트워크 허용 목록과 삭제 보호의 근거다 |
| **테넌트 기록** | 매니페스트와 연결 그래프의 서명된 사본. 테넌트 키로 서명한다 |

> **명칭 메모:** OpenSphere는 한 설치 = 한 회사 = 한 테넌트다(D-14, D-83). "사원 테넌트·고객 테넌트"라는 표현은 쓰지 않는다. 사원 개인이 받는 몫은 테넌트가 아니라 Workspace다.

## 3. 불변식

| ID | 불변식 |
|---|---|
| **T-1** | **신뢰 뿌리는 테넌트 안에서 태어난다.** 테넌트 KMS의 루트 키, 내부 CA 키, 첫 소유자 자격은 테넌트 안에서 생성된다. Backbone은 테넌트 ID와 공개 키만 받는다 |
| **T-2** | **연결은 연결 객체로만 존재한다.** 설정 파일에 손으로 넣은 접속 문자열, 공유 관리자 계정은 허용하지 않는다 |
| **T-3** | **연결마다 전용 신원을 쓴다.** 한 연결의 자격이 새어도 그 연결 밖으로 번지지 않는다 |
| **T-4** | **들어오는 연결이 있는 구성요소는 삭제할 수 없다.** 연결을 먼저 해제해야 한다 |
| **T-5** | **연결 그래프가 곧 네트워크 허용 목록이다.** 그래프에 없는 통신은 거부한다(기본 거부) |
| **T-6** | **연결의 생성·변경·해제는 테넌트 관리자의 고위험 결재 대상이다(D-82).** Governance는 연결에 관여하지 않는다. 단, 어셈블리 정의에 따라 자동 생성되는 연결은 어셈블리 승인으로 갈음한다 |
| **T-7** | **해체는 해체 절차(§10)로만 한다.** 개별 자원을 직접 지워 테넌트를 무너뜨리지 않는다 |
| **T-8** | **테넌트 기록은 테넌트 키로 서명한다.** 선언과 실제가 다르면 drift로 보고 복구하거나 보고한다(D-20을 연결에 적용) |
| **T-9** | **영역 경계를 넘는 연결은 없다.** 사원 영역과 고객 영역 사이는 교류 계층(X-1)이나 등록된 경계 API로만 오간다(D-83) |

## 4. 테넌트 구성

### 4.1 핵심 어셈블리 (Genesis에서 생성)

| 핵심 어셈블리 | 범위 | 구성요소 | 다른 어셈블리가 받는 것 |
|---|---|---|---|
| **trust** | 회사(테넌트)에 하나 | 테넌트 KMS(영역별 하위 키), 내부 CA, 비밀 저장 | 연결 자격, TLS 인증서, 서명·암호화 키 |
| **identity** | 영역마다 | 사원 영역: Samba AD DC ×2 또는 외부 AD, Keycloak · 고객 영역: 고객 CIAM(Keycloak 별도 인스턴스, D-63) | 디렉터리 조회(LDAPS), SSO(OIDC), 워크로드 신원 발급 |
| **governance** | 사원 영역(D-19) | Governance, 전용 PG(D-57) | 할당·결재 결과, 프로비저닝 신호 |
| **channel** | 영역마다(D-66) | 이벤트 채널, 스키마 레지스트리 | 이벤트 발행·구독 |

### 4.2 업무 어셈블리 (Genesis 이후 추가)

메일, 메신저, 문서, 검색, 업무 코어, 에이전트 자리, 사원 앱 실행 환경 같은 것들이다. 업무 어셈블리는 자기 영역의 핵심 어셈블리와 회사 trust에만 **기대고**, 다른 업무 어셈블리와는 연결 객체로만 이어진다.

```
 ┌─ 테넌트 = 회사 하나 (example) ─────────────────────────────────────
 │  trust  회사 단위 신뢰 뿌리 · 영역별 하위 키
 │
 │  ┌─ 사원 영역 ────────────────────────────────────────────────
 │  │  핵심:  identity(AD · Keycloak) · governance · channel
 │  │  업무:  메일 · 메신저 · 문서 · 업무 코어 · 데이터 서비스 · 개발 · 에이전트 자리 · 사원 앱 …
 │  └──────────────────────────────┬─────────────────────────────
 │                                 │ 교류 계층(X-1)만
 │  ┌─ 고객 영역 (필요할 때 추가) ──┴─────────────────────────────
 │  │  핵심:  identity(고객 CIAM) · channel
 │  │  업무:  포털 · 커머스 · 고객 AI
 │  └────────────────────────────────────────────────────────────
 │  외부 편입 리소스는 둘 중 한 영역에 속한다(ER-11)
 └────────────────────────────────────────────────────────────────
```

## 5. 선언 형식

### 5.1 테넌트 매니페스트

```yaml
apiVersion: blueprint.opensphere.io/v1alpha1
kind: Tenant
metadata:
  name: example             # 회사 하나 = 테넌트 하나(D-14, D-83)
spec:
  company: { domain: example.co.kr }
  profile: standard         # 설치 프로파일(R-13): standard | external-ad | regulated
  owners:
    bootstrapGroup: "Domain Admins"   # D-34. 외부 AD면 설치 시 지정
  trust:
    kms: tenant-kms          # 제품은 T-Q3
    recovery: { scheme: m-of-n, m: 2, n: 3, enabled: false }   # D-42 선택 기능
  network:
    defaultDeny: true
    exposure: profile-default         # O-10, D-59
  areas:
    - name: employee
      identity: samba-ad          # samba-ad | external-ad-write | external-ad-read
      coreAssemblies: [identity, governance, channel]
      assemblies:
        - ref: catalog/mail@1.0
        - ref: catalog/messenger@1.0
        - ref: catalog/business-core@1.0
    - name: customer            # 생성 후 테넌트 콘솔에서 영역 추가
      identity: ciam
      coreAssemblies: [identity, channel]
      assemblies:
        - ref: catalog/portal@1.0
  exchange: { enabled: true }   # 영역 사이 교류 계층(X-1)
status:
  phase: Active
  recordDigest: sha256:...  # 서명된 테넌트 기록의 해시
```

### 5.2 어셈블리 정의 (예: 메일)

```yaml
apiVersion: blueprint.opensphere.io/v1alpha1
kind: AssemblyDefinition
metadata:
  name: mail
  version: "1.0"
spec:
  purpose: 사원 메일·일정·연락처
  components:
    - name: stalwart
      engine: stalwart            # Fabric 엔진(D-70)
      claim: { plan: compute.standard, replicas: 2 }
    - name: store
      engine: postgresql          # 공유 서비스 Claim
      claim: { plan: pg.ha-small }
    - name: search
      engine: opensearch
      claim: { plan: search.small }
    - name: blob
      engine: object-store
      claim: { plan: object.standard }
  links:
    - { from: stalwart, to: core/identity.directory, type: directory, protocol: ldaps, access: read }
    - { from: stalwart, to: core/identity.sso,       type: sso,       protocol: oidc }
    - { from: stalwart, to: store,                   type: store,     protocol: postgresql, access: owner }
    - { from: stalwart, to: search,                  type: index,     protocol: https,      access: write }
    - { from: stalwart, to: blob,                    type: blob,      protocol: s3,         access: owner }
    - { from: stalwart, to: core/channel,            type: event,     events: [mail.user.provisioned] }
    - { from: core/governance.adapter, to: stalwart, type: control,   protocol: scim-shape }
  names:
    - { record: MX,    value: "mail.${company.domain}" }
    - { record: TXT,   value: "spf, dkim, dmarc" }     # 공인 DNS는 기반 계열·Backbone 운영(O-10)
  init:
    - schema: stalwart.store.migrate
    - directory: bind-readonly-service-account
    - dkim: generate-in-tenant-kms
  conformance:
    - ad-user-created→mailbox-exists within 20m       # D-21 앱 계정 기준
    - sso-login→jmap-session-ok
    - send→receive-external-loopback
    - search-indexed-within 5m
    - ad-user-disabled→mailbox-locked within 20m
```

## 6. 연결 객체

### 6.1 스키마

```yaml
apiVersion: blueprint.opensphere.io/v1alpha1
kind: Link
metadata:
  name: mail.stalwart--store
  tenant: example
  area: employee
spec:
  from: { assembly: mail, component: stalwart }
  to:   { assembly: mail, component: store }
  type: store                 # directory | sso | store | index | blob | event | control | api | name | trust
  protocol: postgresql
  access: owner               # read | write | owner (최소 권한)
  identity:
    workload: spiffe://example.tenant/employee/mail/stalwart     # 통신 규칙 문서 §3
    credential: { kind: db-role, ref: kms://employee/links/mail.stalwart--store, rotateEvery: 30d }
  tls: { ca: tenant-ca, mutual: true }
  network: { allow: "stalwart → store:5432" }            # T-5: 그래프에서 정책 생성
  protection: { blockDeletionOf: [to] }                  # T-4
  health: { probe: "SELECT 1", interval: 30s }
  approval: { ref: gov://approvals/... }                 # T-6
status:
  state: Bound                # Declared | Issuing | Bound | Degraded | Unbinding | Released
  lastRotated: 2026-11-17T00:00:00Z
  drift: none
```

### 6.2 연결 유형

| 유형 | 의미 | 예 | 자격 형태 |
|---|---|---|---|
| directory | 디렉터리 조회 | Stalwart → AD | 연결 전용 읽기 계정 |
| sso | 사용자 로그인 위임 | 앱 → Keycloak | OIDC 클라이언트 |
| store | 주 저장소 | Stalwart → PG | 연결 전용 DB 역할 |
| index | 검색 색인 | Stalwart → OpenSearch | 색인 범위 역할 |
| blob | 객체 저장 | Stalwart → 객체 저장 | 버킷 범위 키 |
| event | 채널 발행·구독 | 모듈 → 채널 | 주제 범위 자격 |
| control | 프로비저닝 신호 | Governance 어댑터 → 앱 | 어댑터 전용 자격 |
| api | 다른 어셈블리 API 호출 | 사원 앱 → 메일 API | 워크로드 신원 + 위임 토큰 |
| name | 이름 등록 | 메일 → DNS | Backbone 운영 경계 계약(O-10) |
| trust | 인증서·키 발급 | 모든 구성요소 → trust | 테넌트 CA |

### 6.3 단단한 연결을 만드는 장치

| 장치 | 막는 사고 |
|---|---|
| 삭제 보호(T-4) | 쓰이는 PG를 실수로 지워 메일이 멈추는 일 |
| 연결 전용 신원(T-3) | 한 비밀번호 유출이 테넌트 전체로 번지는 일 |
| 자격 회전을 연결 객체가 수행 | 사람이 비밀번호를 바꾸다 연결이 끊기는 일 |
| 연결 drift 대조(T-8) | 손으로 바꾼 접속 설정이 조용히 남는 일 |
| 연결 변경 결재(T-6) | 몰래 새 연결을 만들어 데이터를 빼내는 일 |
| 호환 행렬(§9.2) | 한 구성요소 업그레이드로 연결 상대가 깨지는 일 |
| 해체 절차(§10) | 부분 삭제로 고아 데이터·고아 자격이 남는 일 |

## 7. 수명주기

### 7.1 테넌트 상태

```
Declared → Genesis → Provisioning → Binding → Initializing → Verifying → Active
                                                                   │  ▲
                                                                   ▼  │
                                                                Degraded
Active → Decommissioning → Retired
```

| 상태 | 들어가는 조건 | 나가는 조건 | 실패 시 |
|---|---|---|---|
| Declared | 매니페스트 등록(Backbone 설치기) | 프로파일·카탈로그 검증 통과 | 등록 거부 |
| Genesis | 설치기가 테넌트 네임스페이스에 발생 작업 실행 | trust·identity 핵심 어셈블리 동작, 첫 소유자 자격 인도 | 전체 폐기 후 재시작(데이터 없음) |
| Provisioning | 업무 어셈블리 Claim 제출 | 모든 Instance Ready | 단계 롤백(Claim 회수) |
| Binding | 연결 객체 생성 | 모든 연결 Bound | 실패한 연결만 재시도, 3회 실패 시 보고 |
| Initializing | 스키마·기본 데이터·기본 앱 | 초기화 단계 완료 | 어셈블리 단위 재초기화 |
| Verifying | 적합성 시험 실행 | 전 시험 통과 | Initializing으로 되돌림 + 보고 |
| Active | 테넌트 기록 서명 | — | — |
| Degraded | 연결 Degraded 또는 적합성 시험 실패 | 복구 후 재검증 통과 | 운영 경보, Governance 소유자 통지 |
| Decommissioning | 해체 결재(§10) | 모든 단계 완료 | 단계에서 멈추고 보고, 강제 진행 금지 |
| Retired | 기록 보존 기간 진입 | — | — |

### 7.2 누가 실행하는가

| 단계 | Backbone | 테넌트 관리자(테넌트 콘솔) |
|---|---|---|
| Declared | 설치기 실행, 매니페스트 등록 | 프로파일 선택 확인 |
| Genesis | 발생 작업을 **시작만** 한다. 키를 보지 않는다 | 첫 소유자가 첫 로그인에서 자격을 확정한다. 복구 키를 켰다면 M-of-N 분할을 보관한다 |
| Provisioning | 공급(Instance 생성, 용량) | 어셈블리 Claim 결정(D-30 개정, D-82) |
| Binding·Initializing | 실행 기반 제공 | 연결 승인. 끝나면 리소스 유형·용량을 Governance에 인계 |
| Verifying | 결과 수신(성공·실패만) | 결과 확인 |
| Decommissioning | 공급 회수 실행 | 해체 결정(테넌트 소유자 2인), 데이터 반출, 테넌트 단위 영구 삭제 |

## 8. Genesis 상세

Genesis는 Backbone 경계가 그어지는 순간이다(키가 태어나는 지점).

1. 설치기가 빈 테넌트 네임스페이스 집합과 네트워크 칸막이를 만든다(공급 면).
2. 설치기가 테넌트 안에서 **발생 작업**을 실행한다. 이 작업의 출력 중 Backbone에 돌아가는 것은 테넌트 ID, 공개 키, 상태뿐이다.
3. 발생 작업이 다음을 생성한다.
   - 테넌트 KMS 루트 키
   - 내부 CA
   - identity 어셈블리: AD DC 프로비저닝, 또는 외부 AD 연결 / Keycloak realm
   - governance 어셈블리 + 전용 PG
4. **첫 소유자 인도:** 일회용 인도 코드를 테넌트 소유자 그룹 담당자에게 시스템 밖 경로로 전달한다. 첫 로그인에서 자격과 MFA를 확정하면 인도 코드는 폐기된다.
5. 발생 작업이 자기 자신의 실행 자격을 폐기한다. 이 시점 이후 설치기 자격으로는 테넌트 안에 들어갈 수 없다.
6. 테넌트 기록 v1을 테넌트 키로 서명하고, 그 해시를 Backbone에 알린다(위변조 탐지용).

## 9. 변경

### 9.1 어셈블리 추가·제거
- 추가: 카탈로그 정의 선택 → 테넌트 관리자 승인 → Provisioning부터 Verifying까지 해당 어셈블리만 진행 → 테넌트 기록 갱신 → 리소스 유형·용량을 Governance에 인계(D-82)
- 제거: 해당 어셈블리에 대해 §10 해체 절차를 적용한다

### 9.2 구성요소 업그레이드
- Backbone은 새 엔진 버전을 카탈로그에 **공급**만 한다.
- 테넌트 쪽 배포 인스턴스(Argo)가 끌어간다. 자동 적용 여부는 테넌트 정책을 따른다.
- 적용 전 **호환 행렬**을 확인한다. 이 구성요소에 연결된 상대의 버전 조합이 시험된 조합인지 본다.
- 적용 후 해당 어셈블리의 적합성 시험을 다시 돌린다.

### 9.3 연결 자격 회전
- 연결 객체가 주기에 따라 새 자격을 발급하고, 양쪽 적용을 확인한 뒤 옛 자격을 폐기한다.
- 사람이 손으로 회전하지 않는다.

## 10. 해체 절차

해체는 결속의 역순이다. 어느 단계든 실패하면 **멈추고 보고한다.** 강제로 진행하지 않는다.

1. **결정:** 테넌트 관리자 결재. 테넌트 해체라면 테넌트 소유자 2인 이상(D-82). Governance는 해당 리소스의 할당을 모두 종료한다.
2. **동결:** 새 쓰기를 막고, 기존 세션을 정리한다.
3. **반출:** 데이터 반출 형식과 위치를 확인하고 반출한다. 반출 완료 확인을 기록한다.
4. **연결 해제:** 바깥 어셈블리부터 연결을 Unbinding → Released로 바꾼다. 자격을 폐기한다.
5. **공급 회수:** Instance를 반납한다(Backbone 실행).
6. **영구 삭제:** Governance 결정(D-33)에 따라 공유 서비스가 실행한다. 암호화 키를 파기하는 것(crypto-shred)으로 삭제 완료를 보장한다.
7. **기록 보존:** 테넌트 기록, 해체 기록, 감사 기록을 보존 기간 동안 남긴다.

## 11. 적합성 시험

어셈블리마다 정의에 적힌 시험과 함께, 공통 시험을 둔다.

| 공통 시험 | 기준 |
|---|---|
| 연결 그래프 일치 | 실제 네트워크 허용 규칙 = 그래프에서 생성한 규칙 |
| 기본 거부 | 그래프에 없는 구성요소 쌍의 통신 시도는 실패한다 |
| 자격 범위 | 연결 자격으로 다른 자원에 접근하면 실패한다 |
| 삭제 보호 | 연결이 있는 구성요소의 삭제 요청은 거부된다 |
| Backbone 비접근 | Backbone 역할로 테넌트 Secret 읽기·exec는 실패한다 |
| 회수 시간 | AD 비활성화 → SSO 차단 1분, 앱 계정 20분 p95(D-21) |

## 12. 구현 대응 (후보)

| 명세 요소 | 후보 | 비고 |
|---|---|---|
| 어셈블리 정의·조립 | Crossplane XRD·Composition | 이미 배포 지원 계열에 보유. 어셈블리 = Composite Resource |
| 삭제 보호 | Crossplane Usage, K8s finalizer | T-4 |
| 테넌트·영역 경계 | 네임스페이스 집합 + Capsule, 또는 vCluster | T-Q2 |
| 연결 신원 | SPIFFE/SPIRE | 통신 규칙 문서 §3 |
| 인증서 | cert-manager + 테넌트 CA | T-1 |
| 키·비밀 | OpenBao(MPL-2.0) 등 | T-Q3. Vault는 BSL이라 D-73 대장 확인 필요 |
| 연결 → 네트워크 정책 | Cilium/K8s NetworkPolicy 생성기 | T-5 |
| admission | Kyverno | 연결 그래프 밖 리소스·미서명 이미지 거부 |

라이선스는 원문을 확인해 라이선스 대장(D-73)에 올린 뒤 선정한다.

## 13. 기존 결정과의 관계

| 기존 | 이 명세에서 |
|---|---|
| D-14 한 설치 = 한 회사 | 테넌트도 회사 하나(D-83). 영역은 테넌트 안의 칸막이 |
| D-30 Workspace 앱 기반 자원도 Governance가 Claim | **D-82로 개정.** 어셈블리 Claim 주체는 테넌트(관리자), Governance는 인계받은 리소스의 배분 |
| D-31 서명 Grant | 연결 자격 발급의 근거로 쓴다 |
| D-33 영구 삭제 = Governance 결정 | 해체 6단계 |
| D-54 KubeVirt 엔진/VM 분리 | 모든 구성요소에 같은 원칙 적용 |
| D-57 Governance 전용 PG | governance 핵심 어셈블리 |
| B-2·B-3 | Genesis 5단계(설치기 자격 폐기)로 기술 강제 |
| O-2 Plan → Claim → Instance → Binding | 연결 객체가 Binding을 감싸고 확장한다 |

## 14. 미결

| ID | 미결 |
|---|---|
| T-Q1 | 명칭: "테넌트·어셈블리"를 유지할지. 일반 SaaS의 "테넌트"와 혼동 가능 |
| T-Q2 | 테넌트·영역 경계 기술: 네임스페이스 + Capsule, vCluster, 별도 클러스터(규제 프로파일) |
| T-Q3 | 테넌트 KMS·비밀 저장 제품 |
| T-Q4 | 공유 구성요소 허용 범위: 여러 어셈블리가 PG 클러스터 하나를 함께 쓸지, 어셈블리마다 둘지 |
| T-Q5 | 첫 소유자 인도 의식의 세부: 인도 코드 전달 경로, 외부 AD일 때의 소유자 지정 |
| T-Q6 | 카탈로그(어셈블리 정의)의 소유와 서명: 공급사가 서명한 정의만 허용할지, 회사가 만든 정의도 허용할지 |
| T-Q7 | 사원 앱 실행 환경을 어셈블리로 볼지, 별도 단위(앱)로 볼지. 승격 3단계와의 관계 |
