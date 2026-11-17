# OpenSphere 네 면 구조

**상태:** 방향안. 결정 대장(D-번호)에 반영되지 않았다.
**작성:** 2026-11-17 · 사용자 제안(네 면 구분, Workspace = 리소스 풀) + Claude 검토 의견
**표시:** `합의` 사용자가 동의함 · `제안` 검토 의견, 결정 전 · `미정` 정해야 함
**페이지판:** [four-planes.html](../pages/four-planes.html)

---

## 1. 핵심

> **Workspace는 제품 묶음이 아니라, Governance가 Middle-earth에서 잘라 준 내 몫이다.**

- **Backbone**은 공급한다.
- **Middle-earth**의 구성요소는 공급 면과 사용 면을 함께 가진다.
- **Governance**는 사용 면을 권한에 맞게 쪼개 나눈다. 판단만 하고, 집행은 Middle-earth에서 한다.
- **Workspace**에서 사원과 에이전트는 받은 자원으로 자유롭게 앱을 만든다. 좋은 앱은 회사 앱으로 승격된다.

```
┌ Backbone ── 순수 관리 · 공급 권한
│   Console · OS Shell · R2D2 · Supabase Auth · Gitea · 용량·공급 풀 · 영역 사이 칸막이
│
│   ▼ 공급 면만 운영 · 선언된 경로 · cluster-admin 봉인
│
├ Middle-earth (가칭) ── 두 얼굴이 공존하는 공유 구성요소
│   [공급 면 · Backbone]     엔진 · 버전 · CRD · 노드 · 용량 · 인스턴스 수명주기
│   ┄┄┄┄┄┄┄┄┄┄┄┄┄┄ 인도 지점 ┄┄┄┄┄┄┄┄┄┄┄┄┄┄
│   [사용 면 · 할당받은 쪽]  설정 · 자격 · 데이터 · 배포 대상 · 내 메일함 · 내 VM
│   기반     HISS(K8s · CNI · ingress · cert-manager · 저장) · PSSS(Argo CD · Crossplane · Velero)
│   데이터   PostgreSQL(StackGres) · OpenSearch · Valkey · RustFS · Percona MongoDB
│   신원     Samba AD DC · 외부 디렉터리 연결 · Keycloak · OPA · (Apache Syncope: 정리 대상)
│   연산     KubeVirt
│   보호·관측 PFS Backup · PFS Observability(Grafana · Loki · Tempo · 테넌트 게이트웨이)
│   업무     Stalwart · Mattermost · Univer · GitLab · Odoo 엔진
│   런타임   이벤트 채널 · Temporal · 모델 게이트웨이
│   신뢰     영역 KMS · 내부 CA · SPIRE
│
│   ▼ 사용 면을 판단해 쪼갬 · 집행은 Middle-earth
│
├ Governance ── 할당된 영역을 권한에 맞게 제어·분해
│   정의 · 할당 · 결재 · drift 회수 · 앱 승격 관문 · 사원 앱 도메인 발급
│
│   ▼ 할당 · 개인 · 부서 · 프로젝트 · 서비스 단위
│
└ Workspace ── 권한에 맞게 제공된 자유 영역 · 리소스 풀
    ├ 사원 A          내 자원(메일함 · VM · 앱 도메인) · 회사 자원에 대한 권한 · 에이전트 · 내가 만든 앱
    ├ 팀·프로젝트 X   팀 자원 · 팀 에이전트 · 팀 앱
    └ 회사 기본 앱    웹메일 · 메신저 · 결재 등, 처음부터 "회사 앱"으로 제공 (합의)

네 면 옆에 놓이는 것
    업무 코어(Odoo)   엔진은 Middle-earth. 거래 데이터는 누구의 Workspace도 아닌 회사 공유 자원
    교류 계층         사원↔고객의 유일한 통과 지점(D-75). 고객을 상대하는 사원 앱은 회사 앱 승격 + 교류 계층 통과
    고객 영역         고객 CIAM · 포털 · 공개 웹 · 고객 AI. 네 면 모델 밖의 세 번째 영역(D-62)
```

## 2. 면별 정의

| 면 | 하는 일 | 주인 | 하지 않는 것 | 상태 |
|---|---|---|---|---|
| Backbone | 설치·운영·복구, 용량·공급 풀, 영역 사이 칸막이, 엔진 버전 공급 | 플랫폼 운영자 | 수요 결정, 영역 자격·키 보유, 내용 열람 | 제안 |
| Middle-earth | 공유 구성요소 제공. 공급 면은 Backbone, 사용 면은 할당받은 쪽. Governance 판단을 집행(PEP) | 얼굴마다 다름 | 누구에게 줄지 판단 | 제안, 명칭 미정 |
| Governance | 사용 면을 사람·단위·에이전트·앱에 권한에 맞게 쪼갠다. 판단(PDP), 결재, 승격 관문 | 회사 권한 관리자 | 엔진 운영, 집행 직접 수행 | 제안 |
| Workspace | 할당된 사용 면의 묶음. 사원·에이전트가 자유롭게 쓰고 앱을 만든다 | 사원(팀은 팀장) | 권한 판단, 받은 몫을 넘는 사용 | 제안 |

## 3. Middle-earth: 구성요소마다 두 얼굴

경계는 구성요소와 구성요소 사이가 아니라 **구성요소 한가운데**를 지난다. 얼굴을 나눴다고 선언하는 것만으로는 부족하고, 인스턴스 단위에서 실제로 떼어 놓아야 한다.

**구성요소를 세 층으로 보고, 가운데 층에서 정한다**

```
 엔진            코드 · 버전 · CRD               → 공급자(Backbone)가 제공
 인스턴스        실행 중인 컨트롤러와 그 권한    → ★ 여기서 공유할지 나눌지 정한다
 설정·자격·내용                                  → 소비자(영역)가 소유
```

- **인스턴스를 공유하면** 싸고 단순하지만, 분리는 관리 규칙 수준에 그친다. 공급자가 마음먹으면 넘을 수 있다.
- **인스턴스를 영역별로 두면** 기술적으로 분리된다. 공급자는 엔진 버전만 올리고, 영역 인스턴스의 관리 자격은 갖지 않는다.
- 아래 표의 "인스턴스 판단" 열이 구성요소마다 이 판단을 적은 것이다.

| 구성요소 | 공급 면 · Backbone | 인스턴스 판단 | 사용 면 · 할당받은 쪽 |
|---|---|---|---|
| Argo | 엔진(PSSS) | **영역별 인스턴스.** 배포 결정권 자체라서 공유하면 경계가 무너진다 | AppProject, 저장소 자격, 배포 서명 키 |
| PostgreSQL | PFSS operator | DB는 Claim마다 따로. operator는 공유하되 Secret 읽기는 거부 | DB 자격, 데이터 |
| Keycloak | 이미지·버전 | 이미 영역별(D-63) | realm, 클라이언트, 사용자 |
| KubeVirt | operator·KVM 노드 | operator는 공유, VM은 영역 소유(D-54) | VM 디스크, 게스트 |
| Stalwart | 엔진·버전·저장 | 사원 영역 인스턴스 | 메일함, JMAP·CalDAV 접근 권한 |
| ingress | HISS 컨트롤러 | 공유 가능. 영역 사이 칸막이는 Backbone이 지킨다 | 도메인 노출 조건, 사원 앱 경로 |
| 관측 | 수집 엔진 | 지표 경로는 공유, 로그 본문 경로는 영역별 | 로그·추적 내용 |
| KMS | 엔진 | **영역별.** 다른 모든 선을 지켜 주는 장치 | 서명·암호화·복구 키 |

### 3.1 구성요소 전체 목록 (기존 PFSS 계획 반영)

기존 PFSS 계획의 모듈은 아카이브 Foundation 하위 모듈 카탈로그(`OpenSphere-shell-foundation/deploy/catalog/foundation-child-packages.json`)의 **Provider 11종**과, 이를 받치는 operator·백업·관측 저장소에서 가져왔다. 상태는 이 구조에서의 판단이다(`유지` · `미정` · `충돌` · `정리 필요`).

| 계열 | 구성요소 | 기존 PFSS 근거 | 공급 면 · Backbone | 인도 → 사용 면 | 비고 | 상태 |
|---|---|---|---|---|---|---|
| 데이터 | **PostgreSQL** | Provider `postgres` · StackGres operator 1.19.0 | operator, PG 버전, 클러스터 수명주기, 용량 | Claim → DB·역할·연결 Secret | Governance 원장(D-57), 업무 코어 Odoo DB(C6)의 기반 | 유지 |
|  | **OpenSearch** | Provider `opensearch` · OpenSearch operator 배포판 | operator, 클러스터, heap·디스크 | Claim → 인덱스·역할 | 메일·문서 검색 색인(어셈블리 index 연결) | 유지 |
|  | **Valkey** | Provider `valkey` | 엔진, 메모리 한도 | Claim → 키 공간·ACL 사용자 | 세션·캐시. 어셈블리 연결 유형 추가 필요(cache) | 유지 |
|  | **RustFS** | Provider `rustfs` | 엔진, 저장 용량 | Claim → 버킷·접근 키 | 객체 저장(blob 연결), 백업 저장소 | 유지 |
|  | **Percona MongoDB** | Provider `percona-psmdb` · `data.document.mongodb` | operator, 레플리카셋 | Claim → DB·사용자 | 현재 설계에 소비자가 없다. 유지·보류 판단 필요 | 미정 |
| 신원·정책 | **Samba AD DC** | Provider `samba-ad` | DC 이미지·버전, 복제 토폴로지 | 설치 → 도메인·첫 관리자 자격(Genesis) | 사원 신원 원천(D-3). identity 핵심 어셈블리 | 유지 |
|  | **외부 디렉터리 연결** | Provider `external-directory` · `identity.directory.external` | 연결기 엔진 | 연결 → 바인드 자격·동기화 범위 | 외부 AD 모드(D-6). 쓰기 여부는 설치 선택 | 유지 |
|  | **Keycloak** | Provider `keycloak` · `identity.iam.workspace` | 이미지·버전 | 영역별 인스턴스 → realm·클라이언트 | 사원 SSO(D-56), 고객 CIAM은 별도 인스턴스(D-63) | 유지 |
|  | **OPA** | Provider `opa` · `identity.policy.opa` | 엔진 | 정책 번들(Governance 정의에서 생성) | 판단 엔진 비교 후보 5종 중 하나(D-26). 선정 결과에 따라 유지·교체 | 미정 |
|  | **Apache Syncope** | Provider `apache-syncope` · `identity.iga.syncope` | 엔진 | — | 기준선 D-4에서 IGA 정본이 아니라고 결정. 퇴역 또는 비활성 후보 | 충돌 |
| 연산 | **KubeVirt** | Provider `kubevirt` · `compute.virtualization.vm` | operator, KVM 노드, 공급 한도 | VM 생성 → 디스크·게스트 | 에이전트·개발자 자리 VM(D-51, D-54, D-55) | 유지 |
| 보호·관측 | **PFS Backup** | `opensphere-backup` operator(BackupPolicy·BackupRun·RestoreRun → Velero). Velero 설치는 Platform Support 소유 | 백업 실행 엔진, 저장 위치 | 영역별 백업 정책, 백업 내용(영역 키로 암호화) | 기준선 §3은 백업을 PSSS로 적었다. 아카이브는 Velero 설치=PSSS, 백업 operator=PFS로 나눈다. 정리 필요 | 정리 필요 |
|  | **PFS Observability** | Grafana operator 배포판, Loki, Tempo, 관측 테넌트 게이트웨이(`X-Scope-OrgID` 주입) | 수집·저장 엔진, 게이트웨이 | 테넌트별 로그·추적 본문(게이트웨이 grant) | "로그 본문 경로는 영역별"을 이미 게이트웨이로 구현한 사례 | 유지 |
| PFSS 제어 기능 | **공급 풀·Grant 검증** | SupplyPool, 서명 Grant(D-31), 과할당 비율(D-32) | Backbone이 설정 | — | 엔진이 아니라 공급 면의 제어 기능 | 유지 |
|  | **Claim 프로비저닝** | FoundationClaim → 엔진 라우팅 → DB·인덱스·역할·Secret 발급 | 컨트롤러 | Binding(자격 인도) | 인도 지점 자체. 어셈블리 명세의 연결 객체가 감싼다 | 유지 |
|  | **Provider 수명주기** | `foundation.provider-modules.*` 13개 명령(adopt·update·approve 등, OS Shell 경유) | Backbone(Console 관리자) | — | 엔진 채택·갱신은 공급 면. 영역 인스턴스 적용은 영역이 끌어간다(제안) | 유지 |

**PFSS 밖의 Middle-earth 구성요소**

| 묶음 | 구성요소 |
|---|---|
| HISS | K8s, CNI, ingress 컨트롤러, cert-manager, DNS, 저장 엔진 |
| PSSS | Argo CD, Crossplane, Velero 설치 |
| 업무 엔진 | Stalwart, Mattermost, Univer, GitLab, Odoo(업무 코어) |
| 런타임 | 이벤트 채널(Dapr PoC 대기, D-67), Temporal(D-68), 모델 게이트웨이 |
| 신뢰 | 영역 KMS, 내부 CA, SPIRE(테넌트 명세 trust 어셈블리) |

**이 목록에서 나온 정리 과제**

1. **Apache Syncope:** 기준선 D-4와 충돌한다. Provider를 퇴역시킬지, 비활성으로 남길지 정한다.
2. **OPA:** 판단 엔진 비교(D-26) 결과로 유지·교체를 정한다. 그 전까지 새 소비자를 붙이지 않는다.
3. **Percona MongoDB:** 현재 설계에 소비자가 없다. 유지·보류를 정한다.
4. **백업 소유:** 기준선 §3(PSSS)과 아카이브(Velero 설치=PSSS, 백업 operator=PFS)를 하나로 맞춘다.
5. **연결 유형:** Valkey(cache), MongoDB(document)를 테넌트 명세 §6.2 연결 유형에 추가한다.

## 4. Backbone 경계: 영역의 키가 태어나는 지점까지

아래 셋 중 하나라도 "예"이면 Backbone 밖이다.
1. 영역의 키·자격이 필요한가?
2. 수요 쪽 결정인가?
3. 내용을 보게 되는가?

**한 줄로**

```
 Backbone 안 ── 엔진 · 공급 · 수명주기 · 건강 · 영역 사이 칸막이
 ──────── 인도 지점: Instance → Binding · 설치 → 첫 관리자 자격 · 키 생성 ────────
 Backbone 밖 ── 자격 · 수요 결정 · 내용 · 영역 키 · 영역 내부 설정
```

클라우드에 비유하면 하이퍼바이저와 용량은 사업자 몫이고, 게스트 OS·데이터·IAM은 테넌트 몫인 것과 같은 자리다.

**계층별 경계선**

| 대상 | Backbone 안 | 인도 지점 | Backbone 밖 (사원·고객 영역) |
|---|---|---|---|
| HISS | 노드, K8s 제어면, CNI, 저장 엔진, ingress 컨트롤러, 인증서·DNS 엔진, **영역 사이 차단 정책**(X-1의 바닥) | 영역 네임스페이스 생성 | 네임스페이스 안의 내용, 영역 내부 네트워크 정책, 공개 도메인 노출 조건(O-10) |
| **PSSS** | Argo 엔진, Crossplane 엔진, 백업 실행 | 엔진 → 영역 인스턴스 | 사원 영역 Argo 인스턴스·AppProject·동기화 대상, 배포 서명 키, 백업 내용(영역 키로 암호화) |
| **PFSS** | Provider·Operator, Plan, SupplyPool, 과할당 비율(D-32), Instance 생성·확장·이전 | Instance → Binding | Claim·Binding부터: 수혜 단위, quota, 발급된 자격, 데이터 |
| KubeVirt | 엔진, KVM 노드, 공급 한도 | VM 생성 | VM 디스크, 게스트 내부 |
| **신원** | Supabase Auth(admin) | 설치 → 첫 관리자 자격 | Samba AD·외부 AD, 사원 Keycloak, 고객 CIAM. 설치는 Backbone이 하되 첫 관리자 자격은 영역에서 태어난다 |
| 관측 | 상태·건강·용량 지표, 단위별 사용량(D-41) | 지표 ↔ 본문 | 로그·추적 본문. 사원 영역 자체 관측 스택 필요 |
| 소스·배포 | Gitea, Backbone 자기 배포 | 분리 | GitLab, 사원 영역 CI |
| 모델 | Magpie | 분리 | 사원 영역 게이트웨이, 고객 AI 게이트웨이 |
| **키** | Backbone 자신의 키 | 키 생성 | **영역별 KMS.** 이것이 없으면 경계 전체가 성립하지 않는다(R-07) |

굵게 표시한 PSSS, PFSS, 신원, 키가 핵심 행이다.

**지금 설계에서 바뀌는 곳** (`제안`)
- **Argo 분리:** 엔진은 공급하고, 영역 인스턴스는 영역이 소유한다. 영역 키로 서명된 이미지만 통과한다.
- **Binding이 경계:** 공급 쪽 조작은 허용한다. 영역 네임스페이스의 Secret 읽기·exec·볼륨 마운트는 거부한다.
- **영역 KMS:** 서명 Grant, 정의 서명, 백업 암호화, 복구 키의 뿌리다.
- **cluster-admin 봉인:** 평상시 권한이 아니다. 고객 확인 또는 M-of-N으로 C3 경로에서만 연다.

노드 root만 기술적으로 막을 수 없으므로 **신뢰 가정**으로 명시한다. 현장의 Backbone 관리자가 누구인지는 아직 정하지 않았다(`미정`). 고객사 인프라팀이면 위 장치는 선택이고, 공급사가 원격 운영하면 필수다.

## 5. Workspace: 화면이 아니라 리소스 풀

- **내 자원:** 메일함, 일정, 파일 공간, 자리 VM, 모델 사용량, 사원 앱 도메인, 앱 실행 자원
- **회사 자원에 대한 내 권한:** 업무 코어(Odoo) 거래 데이터, 공유 드라이브, 회사 앱

**예: 사원이 자기 웹메일을 만든다**
1. 사원이 에이전트에게 웹메일을 만들어 달라고 한다.
2. 에이전트가 내 메일함의 JMAP 권한과 내 앱 실행 자원으로 앱을 만든다.
3. 사원 앱 전용 도메인(`kim.회사-apps.net`)에 올린다.
4. 플랫폼이 앱 앞에 SSO 프록시를 세운다. 기본은 본인만 접근할 수 있다.
5. 동료들이 원하면 팀 앱, 회사 앱으로 승격을 신청한다.

**회사 기본 앱** (`합의`): 웹메일, 메신저, 결재 등은 처음부터 제공한다. 모바일, 신규 입사자, 장애 시 대체 수단으로 필요하다. 기본 앱도 "회사 앱"으로 다뤄 같은 모델 안에 둔다.

## 6. 사원 앱

### 6.1 승격 3단계 (`제안`)

| 단계 | 실행 신원 | 자원 | 접근 | 주소 | 관문 |
|---|---|---|---|---|---|
| L1 개인 앱 | 소유자 위임 | 소유자 몫 | 본인 | `kim.회사-apps.net` | 자동(가드레일 통과) |
| L2 팀 앱 | 팀 신원 | 팀 몫 | 팀원 | `팀.회사-apps.net` | 팀장 승인, 가벼운 검토 |
| L3 회사 앱 | **서비스 신원** | Governance 서비스 배분(D-30) | 역할 기반 | `앱.회사도메인` | 보안 검토, 운영 책임 이전, 회사 도메인 발급 |

승격할 때 실행 신원과 소유를 바꾸지 않으면, 만든 사람이 퇴사하는 날 회사 앱이 멈춘다.

### 6.2 앱 실행 가드레일 (`제안`)

"Governance 안에서 일어나니 위험이 아니다"는 성립하지 않는다. Governance는 누가 어떤 자원을 갖는지는 정하지만, 그 자원으로 만든 코드가 무엇을 하는지는 정하지 않는다. 그래서 플랫폼이 다음 넷을 강제한다.
1. **인증은 플랫폼이 한다.** 앱 앞에 SSO 프록시를 둔다.
2. **기본은 비공개다.** 공유와 외부 공개는 승격 단계에서 연다.
3. **소유자 권한을 넘지 않는다.** 위임 사슬 교집합(D-46·D-47)을 따른다.
4. **나가는 길을 통제한다.** 외부 송신과 데이터 분류 규칙으로 "읽기 + 외부 송신" 조합을 막는다.

### 6.3 사원 앱 전용 도메인 (`합의`)

| | 주소 | 판단 |
|---|---|---|
| 쓰지 않음 | `사용자ID.회사도메인` | 상위 도메인 SSO 쿠키 노출, 피싱 주소 위장, 회사 도메인 평판 공유 |
| 쓴다 | `사용자ID.회사-apps.net` | 별도 등록 도메인, Public Suffix List 등록으로 앱끼리 쿠키 분리. 회사 도메인 주소는 L3 승격 뒤에만 준다 |

도메인 이름과 와일드카드 인증서 운영 방식은 정해야 한다(`미정`).

## 7. 채택하면 바뀌는 결정

| 대상 | 지금 | 바뀌는 방향 | 상태 |
|---|---|---|---|
| D-7, D-28 | Workspace = 사원용 업무 제품 전체 | Workspace = 할당된 사용 면 + 에이전트 + 사원 앱 | 제안 |
| D-70 | Stalwart·Mattermost·Univer = Workspace 제품 | Middle-earth 엔진. 선정 기준에 API·프로토콜 우선 추가 | 제안 |
| 기준선 §3, 계층 지도 | HISS·PSSS·PFSS = "공통 기반" 한 칸 | 네 면 구조 | 제안 |
| B-2, B-3 | 약속 수준의 경계 | 인도 지점 + 영역 KMS + cluster-admin 봉인으로 기술 강제 | 제안 |
| D-16 | 에이전트 소스 변경 규칙 | 사원 앱 승격 3단계로 확장 | 제안 |
| 신규 | — | 회사 기본 앱 제공 | 합의 |
| 신규 | — | 사원 앱 전용 등록 도메인 | 합의 |
| PFSS Provider | Foundation 하위 모듈 11종 | Middle-earth 구성요소로 편입. Syncope 퇴역 여부, OPA 유지 여부, MongoDB 소비자, 백업 소유를 정리(§3.1) | 제안 |
| 신규 | — | 테넌트·어셈블리 구성 절차 | 제안([명세](../specs/TENANT-ASSEMBLY-SPEC-v0.1.md)) |
| 신규 | — | 테넌트 내부 통신 규칙 | 제안([규칙](../specs/TENANT-COMMUNICATION-RULES-v0.1.md)) |
| 신규 | — | Middle-earth 공식 명칭. 톨킨 저작물 상표라 제품 용어로는 중립 명칭 권장 | 미정 |
| 신규 | — | 현장 Backbone 관리자 | 미정 |
