# OpenSphere 네 면 구조

**상태:** 방향안. 결정 대장(D-번호)에 반영되지 않았다.
**작성:** 2026-11-17 · 사용자 제안(네 면 구분, Workspace = 리소스 풀) + Claude 검토 의견
**표시:** `합의` 사용자가 동의함 · `제안` 검토 의견, 결정 전 · `미정` 정해야 함
**페이지판:** [four-planes.html](../pages/four-planes.html)

---

> Backbone 구성요소의 구체 책임·실제 배포·작업 이력은 [Backbone 설계·구현·운영 대장](../backbone/README.md)을 참조한다. 이 연결은 본 문서의 제안을 구현 완료로 승격하지 않는다.

## 1. 핵심

> **Workspace는 제품 묶음이 아니라, Governance가 Fabric에서 잘라 준 내 몫이다.**

- **Backbone**은 공급한다.
- **Fabric**의 구성요소는 공급 면과 사용 면을 함께 가진다.
- **Governance**는 사용 면을 권한에 맞게 쪼개 나눈다. 판단만 하고, 집행은 Fabric에서 한다.
- **Workspace**에서 사원과 에이전트는 받은 자원으로 자유롭게 앱을 만든다. 좋은 앱은 회사 앱으로 승격된다.

```
┌ Backbone ── 순수 관리 · 공급 권한
│   Console · OS Shell · R2D2 · Supabase Auth · Gitea · 용량·공급 풀 · 영역 사이 칸막이
│
│   ▼ 공급 면만 운영 · 선언된 경로 · cluster-admin 봉인
│
├ Fabric (OpenSphere Fabric) ── 공급(날실)과 사용(씨실)이 엮인 공유 구성요소
│   [공급 면 · Backbone]     엔진 · 버전 · CRD · 용량 · 인스턴스 수명주기
│   ┄┄┄┄┄┄┄┄┄┄┄┄┄┄ 인도 지점 ┄┄┄┄┄┄┄┄┄┄┄┄┄┄
│   [사용 면 · 할당받은 쪽]  설정 · 자격 · 데이터 · 배포 대상 · 내 메일함 · 내 VM
│   배포 지원   Argo CD · Crossplane                                (구 PSSS)
│   공유 서비스 (구 PFSS) ─ 아래 데이터 · 신원 · 정책 집행 · 연산 · 보호·관측 묶음
│   데이터   PostgreSQL(StackGres) · OpenSearch · Valkey · RustFS · Percona MongoDB(예비)
│   신원     Samba AD DC · 외부 디렉터리 연결 · Keycloak · 권한 판단(OPA 대체 제안: OpenFGA)
│   정책 집행 Kyverno(OPA 대체 제안)
│   연산     KubeVirt
│   보호·관측 백업 서비스 · 관측 서비스(Grafana · Loki · Tempo · 테넌트 게이트웨이)
│   업무     Stalwart · Mattermost · Univer · GitLab · Odoo 엔진
│   런타임   이벤트 채널 · Temporal · 모델 게이트웨이(LiteLLM 후보)
│   신뢰     영역 KMS · SPIRE
│
│   ▼ 사용 면을 판단해 쪼갬 · 집행은 Fabric
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

━ HISS ── 네 면이 모두 그 위에서 도는 바닥 (D-86) · 주인 Backbone · 사용 면 없음
    노드 · K8s 제어면 · KVM 노드 · CNI · 영역 사이 차단 정책
    저장 엔진 · 외부 Ceph 연결(Rook External · CSI) · ingress 컨트롤러 · cert-manager · DNS · 내부 CA
    ▲ 위로 넘기는 것: 네임스페이스 · StorageClass · IngressClass · ClusterIssuer

네 면 옆에 놓이는 것
    업무 코어(Odoo)   엔진은 Fabric. 거래 데이터는 누구의 Workspace도 아닌 회사 공유 자원
    교류 계층         사원↔고객의 유일한 통과 지점(D-75). 고객을 상대하는 사원 앱은 회사 앱 승격 + 교류 계층 통과
    고객 영역         고객 CIAM · 포털 · 공개 웹 · 고객 AI. 네 면 모델 밖의 세 번째 영역(D-62)
```

## 2. 면별 정의

| 면 | 하는 일 | 주인 | 하지 않는 것 | 상태 |
|---|---|---|---|---|
| Backbone | 설치·운영·복구, 용량·공급 풀, 영역 사이 칸막이, 엔진 버전 공급 | 플랫폼 운영자 | 수요 결정, 영역 자격·키 보유, 내용 열람 | 제안 |
| Fabric | 공유 구성요소 제공. 공급 면은 Backbone, 사용 면은 할당받은 쪽. Governance 판단을 집행(PEP) | 얼굴마다 다름 | 누구에게 줄지 판단 | 제안, 명칭 미정 |
| Governance | 사용 면을 사람·단위·에이전트·앱에 권한에 맞게 쪼갠다. 판단(PDP), 결재, 승격 관문 | 회사 권한 관리자 | 엔진 운영, 집행 직접 수행 | 제안 |
| Workspace | 할당된 사용 면의 묶음. 사원·에이전트가 자유롭게 쓰고 앱을 만든다 | 사원(팀은 팀장) | 권한 판단, 받은 몫을 넘는 사용 | 제안 |

### 2.1 HISS: 네 면 아래의 바닥 (`합의`, D-86)

HISS는 Fabric의 묶음이 아니다. 네 면이 **모두** 그 위에서 돈다. Backbone의 Console · OS Shell · Gitea도 같은 노드와 저장소 위에 있으므로, "Fabric 아래"가 아니라 "네 면 아래"에 둔다.

- **Fabric과 다른 점:** Fabric의 구성요소는 공급 면과 사용 면이 엮여 있다. HISS는 사용 면이 없다. 아무에게도 나눠 주지 않고, 주인은 Backbone 하나다.
- **지키는 일이 여기 모인다:** 영역 사이 차단 정책(X-1의 바닥), 노드 root 신뢰 가정, 외부 저장소 연결 자격, 호스트 전제조건 진단. cluster-admin 봉인(§4)과 같은 자리의 일이다.
- **아카이브 근거:** Cluster Manager(`OpenSphere-shell-clusterManager`)가 Kubernetes · Ceph Storage · HISS 전제조건을 독립 관리 화면으로 두었다. 외부 Ceph는 Rook External Mode와 CSI로 연결하고, 자격은 Kubernetes Secret에만 둔다. 원격 Ceph의 데이터는 관리하지 않는다.

| HISS에 두는 것 | Fabric에 남는 것 |
|---|---|
| 노드 · K8s 제어면 · KVM 노드 | KubeVirt의 VM(엔진 설비만 HISS, D-54 유지) |
| CNI · 영역 사이 차단 정책 | 영역 안 네트워크 정책(연결 그래프에서 생성) |
| 저장 엔진 · 외부 Ceph 연결(Rook External · CSI) | 공유 서비스의 데이터 볼륨과 그 내용 |
| ingress 컨트롤러 · cert-manager · DNS 엔진 | 공개 도메인 노출 조건(O-10) |
| 내부 CA · 클러스터 건강 관측 바닥 | 영역 KMS · SPIRE · 관측 서비스(Grafana · Loki · Tempo) |
| 호스트 전제조건 진단 · 실검증(저장 · 네트워크 · DNS) | — |

**인도 지점:** HISS가 위로 넘기는 것은 넷이다. **네임스페이스 · StorageClass · IngressClass · ClusterIssuer.** 위의 면은 이 넷만 받아 쓰고, 노드·저장 엔진·CNI를 직접 만지지 않는다.

**운영 규칙** (아카이브 HISS 규칙을 그대로 옮긴다)
- 진단 항목과 관리 항목을 구분한다.
- Ready는 실검증으로만 판정한다. StorageClass가 있다는 것만으로 저장이 Ready가 아니고, 임시 PVC·Pod로 할당·마운트·읽기쓰기를 확인해야 한다. 검증 계약이 바뀌면 이전 성공은 무효다.
- 설치·삭제는 고정 Helm chart를 검토(plan)한 뒤에만 하고, 접수(202)를 설치 완료로 보지 않는다.

**정해야 할 것:** 기본 저장 엔진(`미정`, O-11). 아카이브는 외부 Ceph(Cluster Manager)와 Longhorn(PostgreSQL 프로필 `hiss.storage.replicated-*`)을 함께 쓴다. 외부 Ceph를 기본으로 하고 Longhorn을 Ceph가 없을 때의 대체로 둘지, 등급별로 나눌지 정한다.

## 3. Fabric: 구성요소마다 두 얼굴

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
| Argo | 엔진(배포 지원) | **영역별 인스턴스.** 배포 결정권 자체라서 공유하면 경계가 무너진다 | AppProject, 저장소 자격, 배포 서명 키 |
| PostgreSQL | 공유 서비스 operator | DB는 Claim마다 따로. operator는 공유하되 Secret 읽기는 거부 | DB 자격, 데이터 |
| Keycloak | 이미지·버전 | 이미 영역별(D-63) | realm, 클라이언트, 사용자 |
| KubeVirt | operator·KVM 노드 | operator는 공유, VM은 영역 소유(D-54) | VM 디스크, 게스트 |
| Stalwart | 엔진·버전·저장 | 사원 영역 인스턴스 | 메일함, JMAP·CalDAV 접근 권한 |
| ingress | HISS 컨트롤러(D-86) | 공유 가능. 영역 사이 칸막이는 Backbone이 지킨다 | 도메인 노출 조건, 사원 앱 경로 |
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
|  | **Percona MongoDB** | Provider `percona-psmdb` · `data.document.mongodb` | operator, 레플리카셋 | Claim → DB·사용자 | 현재 소비자는 없다. 예비 설치(D-78), 소비자 Claim은 Governance 승인으로 연다 | 예비 설치(합의) |
| 신원·정책 | **Samba AD DC** | Provider `samba-ad` | DC 이미지·버전, 복제 토폴로지 | 설치 → 도메인·첫 관리자 자격(Genesis) | 사원 신원 원천(D-3). identity 핵심 어셈블리 | 유지 |
|  | **외부 디렉터리 연결** | Provider `external-directory` · `identity.directory.external` | 연결기 엔진 | 연결 → 바인드 자격·동기화 범위 | 외부 AD 모드(D-6). 쓰기 여부는 설치 선택 | 유지 |
|  | **Keycloak** | Provider `keycloak` · `identity.iam.workspace` | 이미지·버전 | 영역별 인스턴스 → realm·클라이언트 | 사원 SSO(D-56), 고객 CIAM은 별도 인스턴스(D-63) | 유지 |
|  | **OPA** | Provider `opa` · `identity.policy.opa` | 엔진 | 정책 번들 | 드롭 제안. 앱 권한 판단은 OpenFGA(SpiceDB와 PoC 비교), K8s admission은 Kyverno로 나눈다(§3.2) | 제안 |
|  | **~~Apache Syncope~~** | Provider `apache-syncope` · `identity.iga.syncope` | — | — | 드롭(D-77). Governance의 SCIM 형태 프로비저닝 어댑터로 대체 | 드롭(합의) |
| 연산 | **KubeVirt** | Provider `kubevirt` · `compute.virtualization.vm` | operator, KVM 노드, 공급 한도 | VM 생성 → 디스크·게스트 | 에이전트·개발자 자리 VM(D-51, D-54, D-55) | 유지 |
| 보호·관측 | **백업 서비스**(구 PFS Backup) | `opensphere-backup` operator(BackupPolicy·BackupRun·RestoreRun → Velero). 아카이브에서 Platform Support 소유였던 Velero 설치도 이 서비스가 맡는다 | 백업 엔진·실행·저장 위치·최소 보호 기준 | 영역별 백업 정책, 복구 승인, 백업 내용(영역 키로 암호화) | 엔진과 실행은 Backbone, 정책·키·복구 승인은 영역(§3.3) | 제안 |
|  | **관측 서비스**(구 PFS Observability) | Grafana operator 배포판, Loki, Tempo, 관측 테넌트 게이트웨이(`X-Scope-OrgID` 주입) | 수집·저장 엔진, 게이트웨이 | 테넌트별 로그·추적 본문(게이트웨이 grant) | "로그 본문 경로는 영역별"을 이미 게이트웨이로 구현한 사례 | 유지 |
| 공유 서비스 제어 기능 | **공급 풀·Grant 검증** | SupplyPool, 서명 Grant(D-31), 과할당 비율(D-32) | Backbone이 설정 | — | 엔진이 아니라 공급 면의 제어 기능 | 유지 |
|  | **Claim 프로비저닝** | FoundationClaim → 엔진 라우팅 → DB·인덱스·역할·Secret 발급 | 컨트롤러 | Binding(자격 인도) | 인도 지점 자체. 어셈블리 명세의 연결 객체가 감싼다 | 유지 |
|  | **Provider 수명주기** | `foundation.provider-modules.*` 13개 명령(adopt·update·approve 등, OS Shell 경유) | Backbone(Console 관리자) | — | 엔진 채택·갱신은 공급 면. 영역 인스턴스 적용은 영역이 끌어간다(제안) | 유지 |

**공유 서비스(구 PFSS) 밖의 Fabric 구성요소**

| 묶음 | 구성요소 |
|---|---|
| 배포 지원(구 PSSS) | Argo CD, Crossplane |
| 업무 엔진 | Stalwart, Mattermost, Univer, GitLab, Odoo(업무 코어) |
| 런타임 | 이벤트 채널(Dapr PoC 대기, D-67), Temporal(D-68), 모델 게이트웨이(LiteLLM 후보, [사원 영역 AI 운영](../architecture/OPENSPHERE-AI-OPERATIONS-v0.1.md)) |
| 신뢰 | 영역 KMS, SPIRE(테넌트 명세 trust 어셈블리). 내부 CA는 HISS(D-86) |

**이 목록에서 나온 정리 과제**

| 과제 | 결과 | 상태 |
|---|---|---|
| Apache Syncope | 드롭. SCIM 형태 프로비저닝으로 처리(D-77) | 합의 |
| Percona MongoDB | 예비 설치. 소비자 Claim은 Governance 승인으로 연다(D-78) | 합의 |
| OPA | 드롭하고 역할을 나눈다: 앱 권한 판단 = OpenFGA(SpiceDB와 PoC 비교), K8s admission = Kyverno(§3.2) | 제안 |
| 백업 소유 | 엔진·실행 = Backbone, 정책·키·복구 승인 = 영역, Backbone은 최소 보호 기준을 건다(§3.3) | 제안 |
| Velero 위치 | 배포 지원에서 빼고 공유 서비스의 백업 서비스로 합친다. Velero는 백업 서비스의 엔진이다. 배포 지원은 부품을 올리는 도구(Argo CD, Crossplane)만 둔다 (2026-11-17) | 합의 |
| 연결 유형 | Valkey(cache), MongoDB(document)를 테넌트 명세 §6.2 연결 유형에 추가 | 할 일 |

### 3.2 권한 판단 엔진: OPA 대신 무엇을 쓰나 (`제안`)

OpenSphere에 필요한 판단은 성격이 둘이다. 하나의 엔진으로 둘 다 하려 하면 어느 한쪽이 약해진다.

| 판단 | 무엇을 묻나 | 적합한 엔진 |
|---|---|---|
| **앱 권한 판단(PDP)** | 이 사원·에이전트·앱이 이 자원에 이 행위를 할 수 있나. 누가 이 자원에 접근할 수 있나(역질의). 테넌트(회사) → 영역 → 어셈블리 → 자원, AD 조직·프로젝트 계층 | **관계 기반 엔진**(OpenFGA, SpiceDB) |
| **K8s admission(집행)** | 이 리소스를 클러스터에 넣어도 되나. 연결 그래프 밖 리소스, 미서명 이미지, 영역 경계 위반 거부 | **K8s 정책 엔진**(Kyverno, Gatekeeper) |

**OPA를 빼는 이유**
- OPA는 범용 정책 엔진이라 어느 쪽에나 쓸 수 있지만, 앱 권한 판단에 필요한 **관계 저장, 역질의, 시점 일관성**이 내장되어 있지 않다. 관계 데이터를 번들로 따로 밀어 넣어야 하고, 역질의(S5)와 재검토는 직접 만들어야 한다.
- 정책 언어 Rego는 회사 권한 관리자가 화면으로 다루기 어렵다(최소 설계 §9 판정 기준).
- K8s admission 용도로는 Kyverno가 더 단순하고, **서명 이미지 검증이 내장**되어 있다. "영역 키로 서명된 이미지만 통과"를 정책 하나로 쓸 수 있다.

**추천**
1. **앱 권한 판단: OpenFGA를 1순위로, SpiceDB와 PoC로 비교한다.**
   - 둘 다 Zanzibar 계열이고, 관계 계층·역질의·조건(CEL)을 지원하며, PostgreSQL을 저장소로 쓸 수 있다(공유 서비스 PostgreSQL 재사용).
   - OpenFGA는 CNCF 프로젝트라 특정 회사에 덜 묶이고 모델 문법이 단순하다. SpiceDB는 일관성 토큰(ZedToken) 등 일관성 보장이 더 정교하다.
   - 비교 시나리오는 최소 설계 §9의 S1~S7과 참고 아키텍처의 S8~S10을 그대로 쓴다. 이 추천은 D-26 비교를 건너뛰자는 것이 아니라, 후보를 둘로 좁히자는 것이다.
2. **K8s admission: Kyverno.** 연결 그래프 기반 기본 거부, 서명 이미지 검증, 영역 경계 위반 거부를 맡는다.
3. **PDP 어댑터는 AuthZEN 형태로 둔다.** 엔진을 바꿔도 Governance 코드가 바뀌지 않는다.
4. **Cerbos는 보조 후보로 남긴다.** 관계보다 속성 조건이 많은 판단(시간·위치·위험도)이 몰리면 "관계 엔진 + 조건 엔진" 조합(최소 설계 §9)에 쓴다.

라이선스(모두 Apache-2.0로 알려져 있음)는 원문 확인 후 라이선스 대장(D-73)에 올린다.

### 3.3 백업 소유: Backbone인가 (`제안`)

**답: 실행은 Backbone, 결정과 열쇠는 영역이다.** 백업도 Fabric의 다른 구성요소처럼 두 얼굴로 나눈다.

```
 엔진 · 실행      Velero 설치, 백업 operator, 스케줄 실행, 저장 위치(RustFS · 외부 사본), 모니터링   → Backbone
 최소 보호 기준   핵심 어셈블리(AD · Keycloak · Governance 원장 · KMS 봉인본) 필수 백업, 최소 보존 기간  → Backbone이 바닥으로 건다
 ──────────────── 인도 지점: BackupPolicy ────────────────
 정책             무엇을 · 얼마나 자주 · 얼마나 보존(바닥 위로만)                               → 영역(Governance)
 내용 · 열쇠      백업 데이터, 암호화 키(영역 KMS)                                            → 영역
 복구 결정        전체 복구는 영역 소유자 승인(D-40) 후 Backbone 실행, 개별 복구는 영역 셀프서비스  → 영역
```

**왜 전부 Backbone이 아닌가**
- 백업은 데이터 전체의 사본이다. Backbone이 백업과 그 키를 모두 쥐면, 운영 중인 시스템에는 손대지 않고도 **백업을 다른 곳에 복원해 내용을 읽을 수 있다.** B-3을 우회하는 가장 쉬운 길이다.
- 그래서 백업 **내용의 암호화 키는 영역 KMS**에 두고, Backbone은 암호화된 덩어리만 다룬다.

**왜 Backbone이 실행을 맡는가**
- 복구는 Backbone의 책임이다(B-2: 설치·운영·복구). 클러스터 전체 장애에서 복구할 주체는 영역 안에 없을 수 있다.
- 그래서 핵심 어셈블리에 대해서는 Backbone이 **최소 보호 기준**을 건다. 영역은 그보다 더 강하게만 바꿀 수 있다.

**백업은 두 종류로 나눈다**

| 종류 | 대상 | 소유 |
|---|---|---|
| 플랫폼 백업 | Backbone 자신의 상태, etcd, HISS·배포 지원 설정 | Backbone이 전부 |
| 영역 백업 | 사원·고객 영역의 데이터·설정 | 위 두 얼굴 구분을 따른다 |

**기준선·아카이브 정리:** 기준선 §3의 "PSSS: 백업·복구"와 아카이브의 "Velero 설치 = Platform Support, 백업 operator = PFS"는 둘 다 **공급 면**이다. 따라서 둘 다 Backbone 운영으로 묶이고 충돌하지 않는다. 정할 것은 계층 이름표뿐이다. 이 구조에서는 백업 엔진을 Fabric "보호·관측" 계열로 두고, Velero 설치와 백업 operator를 백업 서비스 하나로 합친다(2026-11-17 합의). Velero는 배포 지원에 두지 않는다.

**확인할 점:** Velero의 파일 시스템 백업 저장소 키와 StackGres 백업 암호화를 영역 KMS 키로 분리할 수 있는지는 PoC에서 확인해야 한다. 분리할 수 없는 엔진은 애플리케이션 단계에서 암호화한 뒤 백업한다.

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
| HISS (D-86) | 노드, K8s 제어면, CNI, 저장 엔진(외부 Ceph 연결 포함), ingress 컨트롤러, 인증서·DNS 엔진, **영역 사이 차단 정책**(X-1의 바닥) | 네임스페이스 · StorageClass · IngressClass · ClusterIssuer | 네임스페이스 안의 내용, 영역 내부 네트워크 정책, 공개 도메인 노출 조건(O-10) |
| **배포 지원**(구 PSSS) | Argo 엔진, Crossplane 엔진, 백업 실행 | 엔진 → 영역 인스턴스 | 사원 영역 Argo 인스턴스·AppProject·동기화 대상, 배포 서명 키, 백업 내용(영역 키로 암호화) |
| **공유 서비스**(구 PFSS) | Provider·Operator, Plan, SupplyPool, 과할당 비율(D-32), Instance 생성·확장·이전 | Instance → Binding | Claim·Binding부터: 수혜 단위, quota, 발급된 자격, 데이터 |
| KubeVirt | 엔진, KVM 노드, 공급 한도 | VM 생성 | VM 디스크, 게스트 내부 |
| **신원** | Supabase Auth(admin) | 설치 → 첫 관리자 자격 | Samba AD·외부 AD, 사원 Keycloak, 고객 CIAM. 설치는 Backbone이 하되 첫 관리자 자격은 영역에서 태어난다 |
| 관측 | 상태·건강·용량 지표, 단위별 사용량(D-41) | 지표 ↔ 본문 | 로그·추적 본문. 사원 영역 자체 관측 스택 필요 |
| 소스·배포 | Gitea, Backbone 자기 배포 | 분리 | GitLab, 사원 영역 CI |
| 모델 | Magpie | 분리 | 사원 영역 게이트웨이, 고객 AI 게이트웨이 |
| **키** | Backbone 자신의 키 | 키 생성 | **영역별 KMS.** 이것이 없으면 경계 전체가 성립하지 않는다(R-07) |

굵게 표시한 배포 지원, 공유 서비스, 신원, 키가 핵심 행이다.

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
| 1단계 개인 앱 | 소유자 위임 | 소유자 몫 | 본인 | `kim.회사-apps.net` | 자동(가드레일 통과) |
| 2단계 팀 앱 | 팀 신원 | 팀 몫 | 팀원 | `팀.회사-apps.net` | 팀장 승인, 가벼운 검토 |
| 3단계 회사 앱 | **서비스 신원** | Governance 서비스 배분(D-30) | 역할 기반 | `앱.회사도메인` | 보안 검토, 운영 책임 이전, 회사 도메인 발급 |

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
| 쓴다 | `사용자ID.회사-apps.net` | 별도 등록 도메인, Public Suffix List 등록으로 앱끼리 쿠키 분리. 회사 도메인 주소는 3단계 승격 뒤에만 준다 |

도메인 이름과 와일드카드 인증서 운영 방식은 정해야 한다(`미정`).

## 7. 채택하면 바뀌는 결정

| 대상 | 지금 | 바뀌는 방향 | 상태 |
|---|---|---|---|
| D-7, D-28 | Workspace = 사원용 업무 제품 전체 | Workspace = 할당된 사용 면 + 에이전트 + 사원 앱 | 제안 |
| D-70 | Stalwart·Mattermost·Univer = Workspace 제품 | Fabric 엔진. 선정 기준에 API·프로토콜 우선 추가 | 제안 |
| 기준선 §3, 계층 지도 | HISS·PSSS·PFSS = "공통 기반" 한 칸 | 네 면 구조 | 제안 |
| B-2, B-3 | 약속 수준의 경계 | 인도 지점 + 영역 KMS + cluster-admin 봉인으로 기술 강제 | 제안 |
| D-16 | 에이전트 소스 변경 규칙 | 사원 앱 승격 3단계로 확장 | 제안 |
| 신규 | — | 회사 기본 앱 제공 | 합의 |
| 신규 | — | 사원 앱 전용 등록 도메인 | 합의 |
| D-79 | HISS·PSSS·PFSS, L1~L6, "공통 기반" | 상위 구조어로 쓰지 않음. 배포 지원·공유 서비스로 부르고(HISS는 D-86) 코드 식별자는 다음 메이저까지 유지([용어 대응표](GLOSSARY.md)) | 합의 |
| D-86 | 기반(구 HISS) = Fabric의 묶음 | HISS를 Fabric에서 빼서 네 면 아래 바닥으로 둔다(§2.1). D-79의 HISS 부분 개정. Fabric의 묶음은 배포 지원 · 공유 서비스 둘 | 합의 |
| 신규 | 모델 게이트웨이 제품 미정, 토큰 배분 규칙 없음, 공용 에이전트 정의 없음 | 원장이 배분 · 신원 · 위임의 정본, 게이트웨이(LiteLLM 후보)는 집행 지점. 가중 토큰, 소유자 할당 하위 배분, 공용 에이전트 = 단위 소유 서비스 신원, 데이터 세 층, 메뉴는 회사 관리 콘솔의 "에이전트" · "AI 배분"과 Workspace "내 AI"(Admin Console은 "AI 공급"만). 결정 후보 A~M([사원 영역 AI 운영](../architecture/OPENSPHERE-AI-OPERATIONS-v0.1.md)) | 제안 |
| 공유 서비스 Provider(구 PFSS Provider) | Foundation 하위 모듈 11종 | Fabric 구성요소로 편입(§3.1) | 제안 |
| D-77 | Apache Syncope Provider | 드롭, SCIM으로 처리 | 합의 |
| D-78 | Percona MongoDB | 예비 설치 | 합의 |
| D-26 후보 | 판단 엔진 5종 | OPA 드롭, OpenFGA·SpiceDB로 좁혀 PoC, admission은 Kyverno(§3.2) | 제안 |
| 기준선 §3 | 백업 = PSSS | 실행은 Backbone, 정책·키·복구 승인은 영역(§3.3) | 제안 |
| 신규 | — | 테넌트·어셈블리 구성 절차 | 제안([명세](../specs/TENANT-ASSEMBLY-SPEC-v0.1.md)) |
| 신규 | — | 테넌트 내부 통신 규칙 | 제안([규칙](../specs/TENANT-COMMUNICATION-RULES-v0.1.md)) |
| D-84 | 관리 화면 수 | 접근 지점 셋: Admin Console · 회사 관리 콘솔(구성·배분 구역) · Workspace | 합의 |
| D-82 | 구성과 배분이 섞임(D-30) | 테넌트(회사 차원 결합, 회사 관리 콘솔 구성 구역)와 Governance(사원에게 배분)를 나누고 리소스 유형으로만 잇는다. 관리 표면 넷 | 합의 |
| D-80 | — | 공유 구성요소 집합의 공식 명칭 = **OpenSphere Fabric**(약칭 Fabric). 대외 표기 전 상표 확인 | 합의 |
| 신규 | — | 현장 Backbone 관리자 | 미정 |
