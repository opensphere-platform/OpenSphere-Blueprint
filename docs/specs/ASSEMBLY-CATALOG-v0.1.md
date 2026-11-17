# 어셈블리 카탈로그와 Governance 리소스 유형 v0.1

**상태:** 초안. 결정 대장(D-번호)에 반영되지 않은 명세 후보다. 구현 승인이 아니다.
**작성:** 2026-11-17 · Claude(설계 검토 AI), 사용자 요구 반영
**상위 기준:**
- [테넌트·어셈블리 구성 명세](TENANT-ASSEMBLY-SPEC-v0.1.md): 어셈블리, 연결 객체, Genesis
- [네 면 구조](../overview/FOUR-PLANES.md) §3.1: Fabric 구성요소 전체 목록
- [기준선 v0.2](../architecture/OPENSPHERE-LAYER-BASELINE-v0.2.md): D-5(배분 단위), D-10(Governance 대상), D-25(showback)
- [외부 리소스 편입 규칙](EXTERNAL-RESOURCE-ADMISSION-v0.1.md): 외부 리소스를 어셈블리로 묶어 Governance 리소스로 올리는 규칙

---

## 1. 이 문서가 답하는 것

테넌트 안에서 어셈블리로 묶으면 **사원·부서·프로젝트·서비스에게 무엇을 나눠 줄 수 있는가.**

- 어셈블리는 Fabric 구성요소를 하나의 목적으로 묶은 것이다.
- Governance가 나눠 주는 것은 구성요소 자체가 아니라, 어셈블리가 내놓는 **리소스 유형**이다.
  - 예: 사원은 "Stalwart"를 받지 않는다. `mail.mailbox`(메일함 10GB)를 받는다.
- 테넌트(테넌트 관리자)가 어셈블리를 구성해 리소스 유형과 용량을 내놓고, 이것이 Governance에 **인계**되어야 신청·결재·할당·회수·재검토·showback이 가능하다(D-82). 테넌트는 누구에게 줄지 정하지 않고, Governance는 어떤 어셈블리가 있을지 정하지 않는다.

```
 Fabric 구성요소 ──(어셈블리로 묶음)──▶ 어셈블리 ──(내놓음)──▶ 리소스 유형 ──(Governance 등록)──▶ 할당 가능한 리소스
 Stalwart · PostgreSQL ·                 메일                    mail.mailbox                   사원 김OO: 메일함 10GB
 OpenSearch · RustFS · AD
```

## 2. 어셈블리 카탈로그

배분 단위는 D-5의 넷이다: 개인, 부서·팀, 프로젝트, 업무 서비스. 위험은 기본값이며, 리소스 유형의 행위별로 더 높게 잡을 수 있다.

| 구분 | 어셈블리 | 구성요소(Fabric) | 나눠 주는 리소스 유형 | 배분 단위 | 측정 | 기본 위험 | 상태 |
|---|---|---|---|---|---|---|---|
| 핵심 | **trust** | 테넌트 KMS, 내부 CA, 비밀 저장(OpenBao 등 후보) | `trust.credential` 연결·앱 자격<br>`trust.certificate` TLS 인증서<br>`trust.key` 서명·암호화 키 | 서비스·앱 | 개수 | 높음 | 제안 · 제품 미정(T-Q3) |
| 핵심 | **identity** | Samba AD DC 또는 외부 AD, Keycloak | `identity.account` 사원 계정<br>`identity.group` 조직·그룹<br>`identity.sso-client` 앱 SSO 등록<br>`identity.service-account` 서비스·에이전트 신원 | 개인·부서·서비스 | 개수 | 중간 · 서비스 계정 높음 | 결정 D-3, D-56 |
| 핵심 | **governance** | Governance, 전용 PostgreSQL | `gov.role` 역할<br>`gov.policy` 정의(정책·서비스 메뉴)<br>`gov.approval-route` 결재선 | 부서·서비스 | — | 높음 | 결정 D-19, D-57 |
| 핵심 | **channel** | 이벤트 채널(Dapr PoC 대기), 스키마 레지스트리 | `event.topic` 이벤트 주제<br>`event.subscription` 구독 | 서비스·프로젝트 | 개수 · 보존 용량 | 중간 | 제안 · D-66, D-67 |
| 업무 | **메일·일정·연락처** | Stalwart, PostgreSQL, OpenSearch, RustFS, identity, 공인 DNS | `mail.mailbox` 개인 메일함<br>`mail.shared-mailbox` 공유 메일함<br>`mail.alias` 별칭·그룹 주소<br>`calendar.calendar` 개인·공유 캘린더<br>`contacts.addressbook` 주소록<br>`mail.forward-rule` 외부 자동 전달 | 개인·부서 | GB · 개수 | 낮음 · 외부 전달 높음 | 결정 D-70 |
| 업무 | **파일·문서** | Stalwart WebDAV 또는 전용 파일 엔진, Univer, RustFS, OpenSearch | `file.space` 개인 파일 공간<br>`file.shared-folder` 팀 공유 폴더<br>`doc.edit` 문서 편집·공동 편집<br>`file.external-share` 외부 공유 링크 | 개인·부서·프로젝트 | GB | 중간 · 외부 공유 높음 | Univer 결정 · 파일 정본 미정(R-12) |
| 업무 | **메신저** | Mattermost, PostgreSQL, RustFS, OpenSearch | `chat.team` 팀<br>`chat.channel` 채널<br>`chat.bot` 봇 계정<br>`chat.webhook` 외부 연동 웹훅 | 부서·프로젝트 | 개수 | 낮음 · 웹훅 높음 | 결정 D-70 · SSO 무료판 확인 필요 |
| 업무 | **개발** | GitLab, PostgreSQL, Valkey, RustFS, KubeVirt(러너·개발 자리) | `dev.group` 그룹<br>`dev.repository` 저장소<br>`dev.runner` CI 러너 할당<br>`dev.registry` 패키지·이미지 저장 용량<br>`dev.deploy` 사원 영역 배포 권한 | 개인·프로젝트 | 개수 · GB · 러너 시간 | 중간 · 배포 높음 | 결정 D-13, D-18, D-55 |
| 업무 | **업무 코어(ERP·SCM)** | Odoo Community, PostgreSQL | `erp.company` 법인<br>`erp.role` 업무 그룹(판매·구매·재고·회계 등)<br>`erp.record-scope` 담당 단위 레코드 범위<br>`erp.approval-limit` 승인 한도 | 개인·부서 | — | 높음 | 결정 D-76 · 레코드 규칙 투영 범위 미정(R-02) |
| 업무 | **데이터 서비스** | 공유 서비스 Provider가 직접 제공 | `data.postgres.database` PostgreSQL DB<br>`data.search.index` OpenSearch 인덱스<br>`data.cache.keyspace` Valkey 키 공간<br>`data.object.bucket` RustFS 버킷<br>`data.document.database` MongoDB DB(예비, D-78) | 프로젝트·서비스 | GB · 메모리 · 연결 수 | 중간 | 결정(Provider 11종, D-77, D-78) |
| 업무 | **에이전트 자리** | KubeVirt 또는 Kata, 모델 게이트웨이, 기록되는 웹 출구, 사원 영역 Shell, 하네스(OpenBot, OEM 협상 중) | `agent.seat` 자리 VM(vCPU·메모리·디스크)<br>`agent.identity` 에이전트 신원·위임<br>`model.usage` 모델 사용량<br>`egress.domain-policy` 웹 출구 허용 도메인 | 개인·부서·프로젝트 | vCPU · GiB · 토큰 | 높음 | 결정 D-50~D-54 · 하네스 미계약 |
| 업무 | **사원 앱 실행 환경** | K8s 네임스페이스, SSO 프록시, 전용 도메인, 앱 가드레일, 데이터 서비스 | `app.runtime` 앱 실행 자원(CPU·메모리)<br>`app.domain` 사원 앱 도메인<br>`app.identity` 앱 신원<br>`app.promotion` 승격 단계(1~3단계) | 개인·팀·서비스 | CPU · 메모리 · 개수 | 1단계 낮음 · 3단계 높음 | 합의(기본 앱·전용 도메인) · 나머지 제안 |
| 업무 | **업무 자동화** | Temporal, PostgreSQL | `workflow.namespace` 워크플로 공간<br>`workflow.worker` 워커 할당 | 프로젝트·서비스 | 실행 수 | 중간 | 결정 D-68 |
| 업무 | **관측** | 관측 서비스(Grafana, Loki, Tempo, 테넌트 게이트웨이) | `observe.logs` 테넌트 범위 로그·추적 조회<br>`observe.dashboard` 대시보드 | 부서·서비스 | 보존 GB | 중간 | 제안 |
| 업무 | **백업** | 백업 서비스(Velero, 백업 operator), RustFS | `backup.policy` 백업 정책(최소 기준 위로만)<br>`backup.restore-request` 복구 요청 | 서비스·프로젝트 | GB · 보존일 | 복구 높음 | 제안(네 면 구조 §3.3) |
| 업무 | **통합 검색** | OpenSearch, 권한 인지 필터 | `search.scope` 검색 범위 | 개인 | — | 중간 | 미설계(레드팀 빠진 항목) |
| 고객 | **고객 신원** | Keycloak(고객 CIAM) | `customer.account` 고객 계정<br>`customer.org` B2B 조직(협력사·공급사)<br>`customer.app-client` 고객 앱 등록 | 서비스 | 개수 | 중간 | 결정 D-63, D-72 |
| 고객 | **대외 커머스·포털** | 헤드리스 커머스(Saleor·Medusa 후보), 자체 포털 | `portal.site` 포털·공개 웹<br>`commerce.channel` 판매 채널 | 서비스 | — | 중간 | 후보(D-71) |
| 고객 | **고객 AI** | 고객용 모델 게이트웨이(미정, R-16) | `model.usage` 고객 AI 모델 사용량 | 서비스 | 토큰 | 높음 | 미정 |

**읽는 법**
- **핵심** 어셈블리는 Genesis에서 생긴다. 다른 어셈블리가 기대는 바닥이다. 사원에게 직접 나눠 주는 것은 많지 않고, 주로 서비스·앱에 배분한다.
- **업무** 어셈블리는 Genesis 이후 카탈로그에서 골라 추가한다. 사원·부서·프로젝트가 받는 리소스는 대부분 여기서 나온다.
- **고객** 어셈블리는 고객 테넌트에 속한다. 사원 테넌트와는 교류 계층으로만 만난다(T-9). 교류 객체(견적·주문·ASN 등)는 어느 테넌트의 어셈블리도 아니고, 교류 계약으로 등록한다.

## 3. Governance 리소스 유형 정의

어셈블리가 내놓는 리소스는 Governance에 **리소스 유형**으로 등록한다. 등록되지 않은 리소스는 할당할 수 없다.

```yaml
apiVersion: blueprint.opensphere.io/v1alpha1
kind: ResourceType
metadata:
  id: mail.mailbox
spec:
  assembly: mail                      # 이 리소스를 내놓는 어셈블리
  source: internal                    # internal | external (외부 리소스 편입 규칙)
  control: managed                    # managed | federated | referenced
  actions:                            # 할당·판단의 대상이 되는 행위
    - { id: use,   risk: low }
    - { id: share, risk: medium }
    - { id: admin, risk: high }
  allocation:
    units: [person, unit]             # D-5: person | unit | project | service
    measure: { unit: GB, default: 10, max: 50 }
  provisioning:
    adapter: stalwart-scim            # 제어 신호 경로(통신 규칙 §7)
    create: true
    disable: true
    delete: true
  reconcile:
    list: true                        # 실제 상태를 목록으로 읽을 수 있어야 drift 회수 가능
    interval: 15m
  revocation:
    target: 20m                       # D-21: 앱 계정 20분 p95
  audit:
    source: stalwart.audit-log
  showback:
    costUnit: GB-month                # D-25
  review:
    every: 180d                       # 재검토 주기 기본값(D-37 관리자 설정)
```

**필드 규칙**

| 필드 | 규칙 |
|---|---|
| `actions` | 최소 `use`와 `admin`을 둔다. `admin`은 기본 위험 높음(레드팀 R-11: 앱 관리자는 Governance 고위험 할당) |
| `allocation.units` | D-5의 네 단위 중에서만 고른다 |
| `provisioning` | 생성·비활성·삭제 중 지원하지 않는 것은 `false`로 적는다. 비활성을 지원하지 않으면 `control: managed`가 될 수 없다 |
| `reconcile.list` | `false`면 drift 자동 회수가 불가능하다. 이 경우 `managed`가 될 수 없다 |
| `revocation.target` | 지킬 수 없는 리소스는 등록 시 실제 측정값을 적고, D-21 기준과의 차이를 위험으로 기록한다 |
| `source`, `control` | 외부 리소스는 [외부 리소스 편입 규칙](EXTERNAL-RESOURCE-ADMISSION-v0.1.md)의 등급 판정을 따른다 |

## 4. 리소스 유형 이름 규칙

- 형식: `<영역>.<종류>` 또는 `<영역>.<엔진>.<종류>`. 소문자와 하이픈만 쓴다.
- 영역 접두어: `identity`, `trust`, `gov`, `event`, `mail`, `calendar`, `contacts`, `file`, `doc`, `chat`, `dev`, `erp`, `data`, `agent`, `model`, `egress`, `app`, `workflow`, `observe`, `backup`, `search`, `customer`, `portal`, `commerce`, `ext`(외부 리소스).
- 제품명을 접두어로 쓰지 않는다. 예: `stalwart.mailbox`가 아니라 `mail.mailbox`. 엔진이 바뀌어도 할당이 유지되게 하기 위해서다. 엔진을 구분해야 하는 데이터 서비스만 `data.postgres.database`처럼 엔진을 가운데에 둔다.
- 기존 Provider capability ID(`compute.virtualization.vm`, `data.document.mongodb` 등)는 Fabric 공급 면의 식별자다. 리소스 유형 ID는 사용 면의 식별자다. 둘을 섞지 않는다.

## 5. 새 어셈블리를 카탈로그에 올리는 조건

1. **목적이 하나다.** 여러 목적을 한 어셈블리에 넣지 않는다.
2. **구성요소는 Fabric 안에 있다.** Fabric 밖의 것은 외부 리소스 편입 규칙을 따른다.
3. **연결이 모두 선언되어 있다.** 연결 객체 목록, 연결 유형, 접근 범위를 적는다(구성 명세 §6).
4. **리소스 유형이 최소 하나 있다.** 내놓는 리소스가 없으면 핵심 어셈블리의 일부이거나 어셈블리가 아니다.
5. **적합성 시험이 있다.** 생성 → 할당 → 사용 → 회수 → 대조 시험을 어셈블리 정의에 적는다(구성 명세 §11).
6. **라이선스가 대장에 있다.** D-73 라이선스 대장에 구성요소 전부가 올라 있다.
7. **정의가 서명되어 있다.** 카탈로그 정의의 서명 주체는 미결이다(T-Q6).

## 6. 미결

| ID | 미결 |
|---|---|
| AC-Q1 | 파일 정본 엔진: Stalwart WebDAV, 전용 파일 엔진, AFFiNE 중 무엇으로 할지(R-12) |
| AC-Q2 | 통합 검색의 권한 인지 방식: 색인 시점 ACL 저장, 질의 시점 PDP 필터 |
| AC-Q3 | `erp.record-scope`를 Odoo 레코드 규칙으로 어디까지 투영할지(R-02) |
| AC-Q4 | 고객 AI 모델 게이트웨이를 사원용과 같은 제품의 별도 인스턴스로 둘지(R-16) |
| AC-Q5 | 리소스 유형 레지스트리를 Governance 원장 안에 둘지, 카탈로그 저장소(GitLab)에 둘지 |
