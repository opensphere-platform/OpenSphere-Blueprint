# OpenSphere 전체 계층 구조 파악과 구체화 질문 v0.1

**작성:** 2026-11-16 · Claude(설계 검토 AI)
**목적:** 보스가 제시한 6개 레이어(Backbone, HISS, PSSS, PFSS, Governance, Workspace)를 기존 자료와 대조해 현재 구조를 정리하고, 비어 있거나 서로 충돌하는 부분을 질문으로 구체화한다.
**근거:**
- `/Volumes/DevOps/Projects/OpenSphere-Archive` (51개 저장소, 2026-11-11 스냅샷)
- 현재 `/Volumes/DevOps/Projects/OpenSphere` (Backbone, governance)

**한계:**
- 문서와 소스의 정적 검토다. 운영 상태는 확인하지 않았다.
- 9월 이후의 정본 `DESIGN` 트리(`OpenSphere-Platform/DESIGN/...`)는 아카이브와 로컬 어디에도 없다. 따라서 그 사이의 결정이 빠져 있을 수 있다.
- 이 문서는 확정안이 아니다. 질문의 답을 받아 v0.2에서 확정한다.


> **용어 안내 (D-79, 2026-11-17):** 이 문서의 HISS·PSSS·PFSS, L1~L6 번호, "공통 기반"은 옛 용어다. 지금은 각각 기반·배포 지원·공유 서비스, Fabric(OpenSphere Fabric)으로 부른다. 본문은 작성 당시 기록으로 두었다. 대응은 [용어 대응표](../overview/GLOSSARY.md)를 본다.

---

## 1. 한 문장 목표 (보스 정의)

> 기반 시스템을 만들고, 자원을 배분·통제하며, **관리자의 정확한 의사가 투영된 권한을 갖는 자원**을 사원(회사 중심의 user)에게 full 전산 서비스로 제공한다.

이 목표는 다섯 단계의 사슬로 읽을 수 있다. 각 단계는 앞 단계의 결과에 의존한다.

1. **기반:** 실행할 수 있는 인프라
2. **배분:** 쓸 수 있는 공통 자원(DB, 저장, 신원 등)
3. **통제:** 누가 무엇을 얼마나 쓰는가에 대한 관리자 의도
4. **투영:** 그 의도가 각 엔진의 실제 권한이 됨
5. **전달:** 사원이 자기 몫만 보고 사용함

관리자 영역(Backbone)은 이 사슬 전체를 운영·관찰·복구한다.

## 2. 보스의 6개 레이어와 기존 6계층(SRL)의 대응

기존 자료의 정식 분류는 **6 Service Realization Layer**다. 약어는 2026-09 사용자 결정으로 확정됐다(`OpenSphere-console/apps/osaa-gateway/user-terms.cjs`).

| 기존 SRL | 약어 | 기존 정의 | 보스 레이어(추정 대응) | 대응 확실도 |
|---|---|---|---|---|
| L1 Host Infrastructure | HISS | 클러스터 공통 기반(K8s, CNI, DNS, 저장, ingress, cert, 관측 stack) | **HISS** | 확실 |
| L2 Console Backbone | CBSS | Console 자신의 내구 기반(Supabase, Gitea) | **Backbone** | 높음 |
| L3 Platform Control | PCSS | Console, OS Shell, Registry, R2D2(22), 모듈 관리, Cluster Manager | **Backbone**(?) | **질문 Q1** |
| L4 Platform Support | PSSS | 배포(Argo), adapter(Crossplane), 백업, 정책 실행 연계 | **PSSS** | 확실 |
| L5 Platform Services | PFSS | Foundation: Plan, Claim, Instance, Binding, 데이터 수명주기 | **PFSS** | 확실 |
| L6 Domain | DSS | 사원·고객이 쓰는 업무, 개발, AI 제품 | **Workspace**(일부) | **질문 Q1** |
| (없음) | — | 거버넌스는 헌법 0003, 0006 등 횡단 규범에 흩어져 있음 | **Governance** | **신규 개념, 질문 Q2** |

**관찰:**
1. 보스의 목록에는 L3(PCSS)와 L6(DSS)가 이름으로 드러나지 않는다. 대신 Governance와 Workspace가 있다.
2. Workspace는 기존 설계에서 "계층"이 아니라 L6 도메인 서비스를 사원에게 전달하는 **채널**이다(`perspective-adr-003`). Developer, ERP, AI Workbench는 Workspace를 통해 전달되는 **소비자 제품**이다.
3. "OpenSphere-Governance"라는 저장소나 제품은 어디에도 없다. 2026-11-13 거버넌스 원칙 v1.1은 권한(IGA) 거버넌스를 **"사원(User) 영역" 과제**로 한정했다. 그러나 그 영역이 어느 제품에 속하는지는 정하지 않았다.

## 3. 레이어별 현재 상태

### 3.1 Backbone (관리자 + 관리자 지원 AI)

| 항목 | 내용 |
|---|---|
| 정의 | 운영 인력과 Agent의 직원 전용 영역("호텔의 보이지 않는 운영 영역"). 고객용 백엔드나 사원 포털이 아니다(`OPENSPHERE-BACKBONE-BLUEPRINT.md` §1) |
| 포함 | 관리 신원(Supabase Auth), 관리 데이터(PG19), Gitea + CI, R2D2/OpenClaw, OpenShell 실행, OpenObserve, 자체 업데이트, 독립 복구 |
| 불변 원칙 | 사원 신원·데이터와 분리. 관리 Auth에서 사원 권한으로의 자동 상속 금지(§2) |
| 구현 | Rust BFF + Core + 내부 버스(감사 대상), Console Angular |
| 기존 자료와의 관계 | 기존 `OpenSphere-console`(Supabase + Gitea + OS Shell + OSAA)의 후계로 보이나, 공식 대체 선언은 없다 |

### 3.2 HISS (L1)

| 항목 | 내용 |
|---|---|
| 구성 | 진단만(K8s API, 노드, CNI, DNS, StorageClass, CSI snapshot) + 설치·관리(ingress-nginx, cert-manager, metrics-server, kured, kube-prometheus-stack, StackGres operator, Longhorn 백업 B1) |
| 관리 주체 | `OpenSphere-shell-clusterManager`(L3 기능이 L1 자원을 다룸). 새 `OpenSphere-Cluster-Manager`는 조회 전용 1단계 |
| 수명주기 | Scan → Compare → Plan → Approve → Helm Apply → Probe → Audit. Ready는 24시간 유효한 canary 증거로 판정 |
| 상태 | cert-manager만 22를 통한 전 주기 시험 통과(2026-09). 클린 재현 미완 |

### 3.3 PSSS (L4)

| 항목 | 내용 |
|---|---|
| 구성 | Argo CD 3.4.2(배포), Crossplane(adapter, 실행 writer는 아직 Cluster Manager), provider-helm, Velero(설계만) |
| 역할 | PFSS 선언을 Gitea에 기록하고 Argo로 전달. operator를 Crossplane Release로 배포 |
| 충돌 | 헌법은 "별도 Stack이 아니다", 이후 ADR-0015는 독립 모듈로 결정. Shared Observability 소유(HISS 구현 vs L4 설계). Crossplane writer가 둘. Argo와 Backbone의 Gitea Actions 관계 미정리 |

### 3.4 PFSS (L5, Foundation)

| 항목 | 내용 |
|---|---|
| 카탈로그 | Data(PostgreSQL/StackGres, MongoDB, Valkey, RustFS, OpenSearch), Identity(Keycloak, Syncope, OPA, Samba AD, External Directory), Compute(KubeVirt, 미구현) |
| 모델 | Plan(관리자 정책) → Instance → Claim(사용 의도) → Binding(control plane만 발급, 원문 비밀값 없음) → 회수(해제 ≠ 삭제 ≠ purge) |
| 엔진 권한 투영 | PG `osp_*` DB, 역할 계층, 금지 속성. RustFS bucket/IAM/quota. Valkey ACL. OpenSearch IndexSpace. Samba OU 위임 |
| **결정적 공백** | Claim에 **요청자, 팀, 프로젝트, quota, 비용 필드가 없다.** 사원·팀이 요청하는 경로가 없다. 사원 그룹에서 엔진 권한으로 파생되는 경로가 없다. 사원용 OPA 정책이 없다. 지금의 요청자는 관리자와 도메인 번들뿐이다 |

### 3.5 Governance (신규)

| 항목 | 내용 |
|---|---|
| 확정 원칙(11-13 v1.1) | ① 권한과 거버넌스 ② AOA(모든 기능에 에이전트가 접근할 수 있되, 범위는 거버넌스가 정함) ③ OS Shell 중심 |
| 두 의미 | (a) 소프트웨어 거버넌스: 결정권, ADR, 예외 (b) 권한 거버넌스(IGA): 역할, 할당, 위임, 신청, 승인, 재검토 |
| 제안 구조(미확정) | PAP / PIP / PDP / PEP. 정책 정의는 Gitea 검토, 운영 할당은 관리 API와 PG 원장. 후보 도구: midPoint, Cedar/Cerbos/OPA, OpenFGA/SpiceDB |
| 충돌 | IGA master: Syncope(ADR-FND-002) vs midPoint(11월 조사) vs Samba AD 직접 쓰기(10월 구현) vs STD 자체 Samba AD. "승인"이라는 말이 사원 업무 결재(2인, 결재선)와 운영자 변경 승인(타 운영자 승인 폐기)에 함께 쓰인다 |

### 3.6 Workspace (사원 전달 채널)

| 항목 | 내용 |
|---|---|
| 정의 | `audience: workforce` origin들의 집합. portal(메일, 파일, 일정), apps(Odoo + webOS UI), chat(Mattermost), devops(GitLab), account. 통합 축은 Keycloak `opensphere-workforce` realm의 SSO/SLO |
| 원칙 | 운영자와 사원의 신원·origin 분리. 엔진은 재구현하지 않고 UX는 소유. 자격이 없으면 "보이되 진입 불가 + 이유". Console이 죽어도 사원 채널은 산다 |
| 자격 | entitlement = IGA 정규화 그룹 → Keycloak → 서비스별 role |
| 상태 | mock PoC(2026-07~08). 실제 SSO, 자격 필터, Console phase API 미구현. 설치 마일스톤 M05 전부 미착수 |

## 4. 종단 사슬로 본 공백

| 사슬 단계 | 담당(추정) | 현재 | 핵심 공백 |
|---|---|---|---|
| 1 기반 | HISS | 부분 구현 | 클린 재현, Observability와 백업의 소유 정리 |
| 2 배분 | PSSS → PFSS | 엔진별 Provider 일부 구현 | 사원·팀 단위 요청 주체가 없음 |
| 3 통제(의도) | Governance | 원칙만 있음 | 의도를 표현하는 객체(역할, 정책, 할당, quota)의 정본과 작성 주체 미정 |
| 4 투영 | Governance → PFSS Provider → 엔진 | 관리자 명령으로만 투영 | 그룹·역할에서 엔진 권한으로의 자동 파생이 없음. 의도와 실효 권한의 **차이(drift)를 검증하는 장치가 없음** |
| 5 전달 | Workspace | mock | SSO, 자격 필터, 서비스 카탈로그의 실데이터 |
| 횡단 운영 | Backbone | 구현 진행 중 | 사원 영역을 Backbone이 어떻게 관찰·제어하는지(OS Shell이 사원 신원을 다루는가) 미정 |

**가장 중요한 구조적 미정 사항 다섯 가지:**
1. "관리자의 정확한 의사"를 **무엇으로 표현하고 어디에 정본으로 둘 것인가**(역할 정의, 할당, 정책, quota)
2. **사원 신원의 단일 원천**
3. **자원을 받는 단위**(개인, 부서, 팀, 프로젝트)와 quota·비용
4. Governance가 독립 계층(제품)인지, 각 계층에 분산된 횡단 평면인지
5. 사원 영역의 AI 에이전트와 OS Shell의 관계

## 5. 구체화 질문

1차 질문은 구조의 뼈대를 정하는 네 가지다(대화에서 선택지로 제시). 나머지는 답에 따라 순서를 조정해 이어서 묻는다.

### 1차 (뼈대)
- **Q1. 레이어 대응:** Backbone이 기존 L2(관리 기반)와 L3(제어: Console, OS Shell, R2D2, Cluster Manager 제어)를 함께 포함하는가? Workspace는 L6 도메인 제품을 전달하는 채널인가, 도메인 제품까지 포함하는가?
- **Q2. Governance의 성격:** 독립 계층(제품)인가, 횡단 평면인가, Backbone 내부 기능인가?
- **Q3. 사원 신원의 원천:** 외부 HR/AD → IGA → Keycloak 투영인가, OpenSphere 관리형 디렉터리가 원천인가?
- **Q4. 자원을 받는 단위:** 개인, 부서·팀, 프로젝트 중 무엇인가?

### 2차 (1차 답에 따라)
- **Q5. 관리자 의도의 표현 방식:** 화면에서 할당(PG 원장)하는가, 정책 코드(Gitea 검토)인가, 둘을 나누는가(역할·정책 정의는 코드, 개인 할당은 원장)?
- **Q6. 사원 요청의 승인:** 사원이 자원과 권한을 신청할 때의 결재 구조(팀장, 자원 관리자, 보안). 자동 승인 가능 범위. 기존 운영자 변경 승인과는 별개 체계인가?
- **Q7. 의도와 실효 권한의 검증:** 정기 접근 재검토(attestation)와 엔진의 실제 권한 대조(drift 탐지)를 요구하는가? 주기는?
- **Q8. 사원용 AI 에이전트:** Workspace에 사원 대행 에이전트가 있는가? 있다면 결재 불가, 사원 권한 이하 같은 원칙을 확정하는가? Backbone의 R2D2와 분리하는가?
- **Q9. 회사 범위:** 한 설치 = 한 회사(single-org, 기존 D-A 결정)를 유지하는가, 계열사나 다수 회사를 지원하는가?
- **Q10. 업무 서비스 구성:** Workspace의 1차 제공 서비스(메일, 파일, 일정, 메신저, ERP, 개발, AI) 우선순위와 엔진 선택(Stalwart, OxiCloud, Odoo, Mattermost, GitLab)을 유지하는가?
- **Q11. 배포 경로:** PSSS의 Argo CD와 Backbone의 Gitea Actions의 역할 분담. 사원 영역 서비스는 어느 경로로 배포되는가?
- **Q12. 비용·사용량:** 부서별 사용량과 비용 배분(chargeback 또는 showback)이 필요한가?

---

## 6. 1차 답변으로 확정된 사항 (2026-11-16 보스 답변)

| ID | 확정 내용 |
|---|---|
| D-1 | **Backbone** = 원래 BBSS(Backbone Service Stack). OpenSphere가 서비스를 구성할 수 있게 지원하는 **admin 영역**이다. Console, OS Shell, R2D2, 모듈 관리를 포함하며(기존 L2 + L3), 회사 중심 user 영역과 구분된다 |
| D-2 | **Governance는 독립 계층(제품)**이다 |
| D-3 | **사원 신원의 기본 단일 원천은 내장 Samba AD DC**다. 고객사에 기존 도메인 AD가 있으면 **외부 AD를 원천으로 쓰는 구성도 허용**한다 |
| D-4 | Syncope와 midPoint는 IGA master 후보가 아니었다. AD 계정을 따르지 않는 협력 모듈의 계정 동기화 아이디어로 검토된 후보군이다. 목표 구조는 **SCIM 방식의 프로비저닝**이다 |
| D-5 | 자원 배분 단위는 **개인, 부서·팀, 프로젝트, 업무 서비스 네 가지 모두**다 |
| D-6 | 외부 AD 모드에서 고객 AD에 쓸 수 있는지는 **고객이 설치 시 선택**한다. 선택지는 읽기 전용과 전용 OU 쓰기 두 가지다 |
| D-7 | **Workspace = 사원용 업무 제품 전체**다. 진입점, SSO, 메일·파일·일정·메신저, ERP, 개발, AI를 포함하며 기존 L6 DSS를 흡수한다 |
| D-8 | 관리자 의도의 표현: **정의(역할, 정책, Plan)는 Git 코드로 검토·버전 관리하고, 할당(개인·팀·프로젝트·quota)은 화면/API로 처리해 원장에 기록**한다 |
| D-9 | **사원 셀프 신청 + 위험별 결재**를 둔다. 저위험은 정책에 따라 자동 승인, 나머지는 결재선(팀장, 자원 담당자 등)을 거치며, 본인 승인은 금지한다 |
| D-10 | Governance의 범위는 **접근 거버넌스, 자원 거버넌스(quota·배분), 비용·사용량, 준수·감사 보고** 네 영역 전부다 |
| D-11 | Governance는 **두 표면으로 분리**한다. 정의와 전사 관리는 Backbone 콘솔(admin 신원), 신청·결재·팀 내 배분·재검토는 Workspace(사원 신원)에서 한다. Governance는 두 표면이 공유하는 공통 엔진이다 |
| D-12 | **사원 영역 AI 에이전트를 둔다.** Backbone의 R2D2와 분리하며, 사용자별·부서별·프로젝트별 에이전트를 둘 수 있다. **AOA(AI-Oriented Architecture)를 OpenSphere 전체의 관점으로 적용**한다 |
| D-13 | OpenSphere의 모든 소스는 OpenSphere 내부 Git에 둔다(Backbone은 Gitea, 사원 영역은 GitLab). 에이전트를 통한 **셀프 업데이트와 확장**이 가능해야 한다 |
| D-14 | **한 설치 = 한 회사**(기존 single-org 결정 유지) |
| D-15 | 부서·프로젝트 에이전트는 **자체 비인격 신원 + Governance가 할당한 역할**로 동작한다. 요청자를 항상 함께 기록하고, 실제 권한은 **요청자 권한과의 교집합**으로 제한한다. 개인 에이전트는 본인 권한 이하다 |
| D-16 | 에이전트의 소스 변경은 **제안 → 사람 검토 → 배포** 순서를 따른다. 에이전트는 브랜치·PR까지만 만들고, 해당 영역 담당자가 검토·merge한 뒤 기존 CI/배포 경로로 반영한다. 저위험 변경은 정책에 따라 자동 merge를 허용한다 |
| D-17 | AOA의 정식 명칭은 **AI-Oriented Architecture**다. 11-13 거버넌스 원칙 문서의 "Agent-Oriented Architecture" 표기는 수정 대상이다(문서 개정 절차는 별도) |
| D-18 | 사원 영역의 배포 경로는 **GitLab CI(빌드) → PSSS의 Argo CD(배포)**다. Backbone은 자기 자신을 Gitea Actions로 관리한다 |

## 6B. 다음 질문 후보 (4차)

| ID | 질문 | 왜 필요한가 |
|---|---|---|
| Q-13 | Governance는 어느 신뢰 영역에서 실행되고 데이터를 어디에 두는가? Backbone PG, 사원 영역 PG(PFSS), 별도 중 무엇인가? | admin과 사원 두 표면이 쓰는 공통 엔진이므로, 두 신원 평면을 어떻게 받아들일지와 장애 격리(Backbone 장애 시 사원 결재 가능 여부)가 걸려 있다 |
| Q-14 | 의도와 실제 권한의 차이(drift)를 발견하면 **자동 교정**하는가, **보고 후 사람이 교정**하는가? 정기 재검토 주기는? | "정확한 의사 투영"의 검증 방식 |
| Q-15 | 퇴사·권한 회수가 모든 앱에 전파되는 목표 시간은? (기존 설계값은 20분 p95) | 프로비저닝 어댑터의 동기화 방식(즉시 push vs 주기 대조)을 결정 |
| Q-16 | 조직도(부서 계층·직책·관리자)는 누가 어디서 입력하는가? 관리자 화면, 인사 시스템 파일·API 연동, AD에 직접 입력 중 무엇인가? | 결재선과 부서 quota의 기반 |
| Q-17 | 비용은 **보여 주기(showback)**인가, **부서 예산에서 차감(chargeback)**인가? 단가 기준은? | 비용·사용량 영역의 데이터 모델 |
| Q-18 | Governance의 판단 엔진을 직접 만들 것인가, Cedar·OPA·OpenFGA 같은 엔진을 쓸 것인가? | 11-13 조사의 후보 선정을 마무리 |
| Q-19 | Workspace 1차 제공 서비스와 우선순위, 엔진 선택(Stalwart·OxiCloud·Odoo·Mattermost·GitLab 등) 유지 여부 | 구현 순서 |
| Q-20 | 사원 영역 에이전트가 쓰는 모델·지식은 Backbone의 모델 관리(Magpie 등)를 공유하는가, 분리하는가? | 비용·데이터 경계 |

### 4차 답변 (Q-13~Q-16)

| ID | 확정 내용 |
|---|---|
| D-19 | **정정: Governance는 사원 영역에 속한다. 엔진과 데이터도 사원 측에 둔다.** D-11의 "Backbone 콘솔에서 정의·전사 관리"는 재확인 대상이다(5차 질문) |
| D-20 | drift 처리: **의도보다 많은 권한은 자동 회수, 부족한 권한은 보고**한다. 앱 안에서 직접 바뀐 변경은 기록한다 |
| D-21 | 회수 전파 목표: **SSO 세션·새 로그인은 즉시(1분 이내) 차단, 앱별 계정 비활성은 20분 p95 이내** |
| D-22 | 조직도(부서 계층·직책·관리자)의 정본은 **AD**다. 내장 AD 모드에서는 Governance 화면에서 입력해 AD에 기록하고, 외부 AD 모드에서는 읽기만 한다 |

### 5차 답변

| ID | 확정 내용 |
|---|---|
| D-23 | Governance의 관리자는 **사원 영역의 관리 역할**이다. 회사 IT·보안·인사 담당자가 사원 신원(AD)으로 로그인해 작업한다. **Backbone 관리자는 Governance를 설치·운영·복구만 하고, 사원 권한의 내용에는 관여하지 않는다.** D-11은 "두 표면 모두 사원 영역 안"으로 대체된다 |
| D-24 | 정의 저장: **내장 저장소 + 화면 편집**에 동의한다. 다만 기록을 GitLab에 두는 것이 최선인지는 감사인 의견을 듣고 정한다(§7A) |
| D-25 | 비용은 **보여 주기(showback) 먼저** 한다. quota 초과만 막고, 예산 차감은 후속 단계로 둔다 |
| D-26 | 판단 엔진은 **기존 엔진을 채택**한다. 후보(Cedar·Cerbos·OPA, OpenFGA·SpiceDB)를 같은 시나리오로 실증 비교한 뒤 선정한다 |

## 7A. 정의 기록 저장소에 대한 의견 (D-24)

**결론: GitLab을 정본으로 두는 것은 최선이 아니다.**
- **정본:** Governance 내장 저장소의 버전 기록(revision)으로 둔다.
- **GitLab:** 한 방향 사본(mirror)으로 쓴다. 용도는 diff 열람, 외부 감사, DB와 독립된 백업이다.

**Git 정본이 불리한 이유:**

| 쟁점 | Git(GitLab)을 정본으로 할 때 | 내장 저장소를 정본으로 할 때 |
|---|---|---|
| 승인 권한 | **merge 권한이 곧 정책 승인 권한**이 된다. GitLab maintainer가 사실상 회사 권한 정책의 결재자가 된다 | Governance가 정한 결재선만 활성화할 수 있다 |
| "승인됨 ≠ 활성" 원칙(11-13) | merge 시점과 실제 적용 시점이 분리되기 쉽다. 두 상태를 따로 맞춰야 한다 | 초안 → 승인 → 활성을 한 원장의 상태로 관리한다 |
| 시점별 증거 | "X일에 누가 무엇을 할 수 있었나"를 답하려면 Git 정의와 DB 할당 이력을 합쳐야 한다 | 정의와 할당이 같은 시간축에 있어 바로 답할 수 있다 |
| 가용성 | GitLab 장애 시 정책 변경과 긴급 회수용 정의 수정이 막힐 수 있다 | Governance만 살아 있으면 된다(D-21 즉시 회수와 맞음) |
| 작성 주체 | 인사·보안 담당자는 Git을 쓰지 않는다. 화면 편집과 Git 직접 수정이 함께 쓰는 두 writer 문제가 생긴다 | writer가 하나다. 화면, API, 에이전트 모두 같은 경로를 쓴다 |
| 변조 방지 | 강제 push와 이력 재작성은 보호 브랜치·서명 설정에 의존한다 | revision을 수정 불가(INSERT 전용)로 두고 내용 해시를 연결해 남긴다 |
| 참조 무결성 | 정의에서 삭제된 역할을 할당이 계속 참조할 수 있다. 별도 검증이 필요하다 | 활성화할 때 같은 트랜잭션에서 검증한다 |

**Git이 주는 장점은 사본으로 충분히 얻는다:**
- Governance가 각 revision을 **활성화할 때마다** 사람이 읽을 수 있는 형식(YAML/JSON)으로 GitLab 보호 저장소에 서명 commit한다. 쓰기 권한은 Governance 서비스 계정 하나만 갖는다.
- 그러면 GitLab에서 diff, blame, 장기 보관, 외부 감사 열람이 가능하다.
- DB와 독립된 사본이므로 복구 근거로도 쓸 수 있다. 다만 복원은 Governance 절차로만 한다.
- 개발자식 제안을 원하면 GitLab MR을 **제안 채널**로 허용할 수 있다. MR은 Governance에 "초안 revision"으로 들어오고, 활성화는 Governance 결재로만 한다. merge가 승인을 대신하지 않는다.
- 에이전트 제안(D-16)도 같은 방식이다. 에이전트는 Governance API로 초안 revision만 만든다.

**D-8 수정안:** "정의는 Git 코드"를 **"정의는 Governance 내장 저장소의 버전 기록(정본) + GitLab 서명 사본"**으로 바꾼다. 코드처럼 버전·diff·검토되는 성질은 유지한다.

### 6차 답변

| ID | 확정 내용 |
|---|---|
| D-27 | **§7A 채택.** 정의의 정본은 Governance 내장 저장소의 버전 기록이다. GitLab에는 활성화 때마다 서명 사본을 남긴다. GitLab MR은 제안 채널로만 쓰며 merge가 승인을 대신하지 않는다. **D-8은 이 내용으로 대체된다** |
| D-28 | Workspace 1차 서비스는 **메일·일정·파일, 메신저, 개발(GitLab), ERP·업무 앱 전부**다. 다만 **개별 엔진은 기존 후보(Stalwart·OxiCloud·Radicale·Odoo·Mattermost 등)에 묶이지 않는다.** 현 시점 기준으로 다시 선정한다 |
| D-29 | 사원 영역 에이전트는 **사원 영역 전용 모델 게이트웨이**를 쓴다. 공급자 키와 지식 저장소도 사원 영역에 따로 두며, Governance가 부서·프로젝트별 사용량·비용을 관리한다. Backbone(Magpie 등)과 키·데이터를 공유하지 않는다 |

## 6A. 답변을 반영한 목표 구조 (초안, D-29까지 반영)

```
 admin 영역 (admin 신원: Supabase Auth)        │  사원 영역 (사원 신원: 내장 Samba AD DC 또는 외부 AD)
                                              │
 ┌──────────────────────────────────┐         │  ┌────────────────────────────────────────────────────┐
 │ Backbone (구 BBSS)                │         │  │ Workspace (사원용 업무 제품 전체)                      │
 │ Console·OS Shell·R2D2·모듈 관리    │ 설치·   │  │ 진입점·SSO·메일/일정/파일·메신저·개발(GitLab)·ERP      │
 │ Gitea(Backbone 소스)·Magpie       │ 운영·   │  │ 사원·부서·프로젝트 에이전트 · 사원 전용 모델 게이트웨이  │
 │                                  │ 복구 ──▶│  └───────────────▲────────────────────────────────────┘
 │ ※ 사원 권한의 내용에는 관여 안 함   │         │                  │ 신청·결재·팀 배분·재검토 / 정의·전사 관리
 └───────────────┬──────────────────┘         │  ┌───────────────┴────────────────────────────────────┐
                 │                            │  │ Governance (독립 제품, 사원 영역 엔진·데이터)           │
                 │                            │  │ 접근·자원(quota)·비용(showback)·준수·감사               │
                 │                            │  │ 정의 정본 = 내장 버전 기록 → GitLab 서명 사본            │
                 │                            │  │ 판단 엔진: 기존 엔진 실증 비교 후 선정                    │
                 │                            │  └───────────────┬────────────────────────────────────┘
                 │                            │                  │ 원하는 상태 → 어댑터(SCIM 모양 계약) → drift 대조
 ────────────────┴────────────────────────────┴──────────────────┴────────────────────────────────────
 PFSS (L5 Foundation): Plan → Claim(요청자·단위·quota) → Instance → Binding · 엔진별 권한 투영
 PSSS (L4): 배포(사원 영역: GitLab CI → Argo) · adapter · 백업 · 정책 실행 연계
 HISS (L1): K8s · 네트워크 · 저장 · 인증서 · 관측 기반
```

**Backbone과 사원 영역의 관계:** Backbone 관리자는 PFSS·PSSS·HISS와 사원 영역 제품(Workspace, Governance)을 **설치·운영·복구**한다. 사원에게 무엇을 줄지는 사원 영역의 관리 역할이 Governance에서 정한다(D-23).

**이 구조가 요구하는 새 설계 요소** (기존 자료에 없거나 미구현):
1. Governance 원장: 할당, quota, 신청, 결재, 재검토, 비용. 내장 정의 revision(역할, 정책, Plan)과 같은 시간축에 둔다.
2. Claim 확장: 요청자, 수혜 단위(개인·부서·팀·프로젝트·서비스), quota, 기한, 승인 참조.
3. 프로비저닝 계약: SCIM 2.0 스키마 + OpenSphere 확장. Provider별 어댑터(create/update/disable/delete/list)와 drift 대조.
4. 조직 모델: 부서 계층과 프로젝트 객체. AD OU·그룹과의 매핑.
5. 사원 영역 에이전트의 신원 모델: 사용자·부서·프로젝트 에이전트가 각각 누구의 권한으로 동작하는지, 결재 불가 원칙, R2D2와의 분리.
6. 소스 기반 자기 확장 경로: Gitea(Backbone)와 GitLab(사원 영역)의 변경이 에이전트 제안 → 검토 → 배포로 이어지는 통제.

## 7. 신원·프로비저닝 구조에 대한 의견 (D-3, D-4 관련)

### 7.1 SCIM의 위치를 먼저 정확히

- SCIM 2.0(RFC 7643 스키마, RFC 7644 프로토콜)은 **"원천이 대상 앱에 계정과 그룹을 밀어 넣는 프로비저닝 규격"**이다. 신원의 원천도, 로그인(SSO) 규격도 아니다.
- Entra ID 구조에서 Entra는 **SCIM 클라이언트**(프로비저닝 엔진)이고, 각 SaaS 앱이 **SCIM 서버**다.
- 따라서 OpenSphere에서 "SCIM 같은 구조"를 만든다는 것은 다음 셋을 갖춘다는 뜻이다.
  1. **AD(원천)의 변경을 감지하는 수집기**
  2. **원하는 상태를 계산하는 판단부**(누가 어느 앱에 어떤 역할로 있어야 하는가)
  3. **대상별로 밀어 넣고 대조하는 실행기**

### 7.2 현실 제약: 대상 앱 상당수가 SCIM 서버를 제공하지 않는다

Workspace 후보 엔진(Stalwart, OxiCloud, Odoo, Mattermost, GitLab CE 등)과 PFSS 엔진(PostgreSQL, RustFS, Valkey, OpenSearch) 대부분은 SCIM 서버 기능이 없거나 유료 판에만 있다. 대상 앱을 계정 연동 방식으로 나누면 세 가지다.

| 유형 | 연동 방식 | 예시 | 프로비저닝 필요 |
|---|---|---|---|
| A. 디렉터리 직접 사용 | LDAP bind / Kerberos로 AD를 직접 조회 | 파일(Samba), 메일(LDAP 연동), 리눅스 호스트 | 없음. AD 그룹만 맞으면 됨 |
| B. SSO 연동 | Keycloak(AD federation)으로 OIDC/SAML 로그인 | 대부분의 웹 앱 | **필요.** 첫 로그인 시 자동 생성(JIT)만 쓰면 퇴사자 계정이 앱에 남고, 로그인 전에 권한을 줄 수 없다(기존 G-JIT 금지 원칙과 같은 이유) |
| C. 앱 자체 계정·역할 | 앱 고유 API(REST/SQL/ACL) | PG role, S3 IAM, Valkey ACL, Odoo 사용자·권한, GitLab 멤버십 | **필요.** 이미 PFSS Provider가 엔진별 권한 투영 코드를 갖고 있음 |

### 7.3 권고: "SCIM 모양의 내부 계약 + 대상별 어댑터"

1. **원천 분리**
   - AD(내장 Samba 또는 외부 AD)는 **"누구인가와 조직 소속"**의 원천이다: 계정, 상태, 부서·직책·관리자, 조직 그룹.
   - Governance는 **"무엇을 얼마나 쓸 수 있는가"**의 원천이다: 역할, 할당, 프로젝트, quota, 기한, 승인 이력.
   - 두 원천을 한 곳에 섞지 않는다.
2. **내부 계약은 SCIM 2.0 스키마를 따른다**
   - User + EnterpriseUser 확장(employeeNumber, department, manager)과 Group을 그대로 쓴다.
   - 여기에 OpenSphere 확장(entitlement, project, quota, validUntil)을 더한다.
   - 이유: 외부 표준과 이름이 같아지고, SCIM 서버를 가진 앱은 **어댑터 없이 바로 SCIM으로** 붙일 수 있다.
3. **실행은 기존 Provider 패턴을 재사용한다**
   - 각 PFSS Provider와 Workspace 앱 연동 모듈이 "프로비저닝 어댑터" 인터페이스를 구현한다: create, update, disable, delete, list(대조용).
   - SCIM 지원 앱은 범용 SCIM 어댑터 하나로 처리하고, 나머지는 앱별 어댑터로 처리한다.
   - 이는 현재 Foundation이 이미 하고 있는 "엔진별 권한 투영"을 **관리자 명령이 아니라 Governance의 원하는 상태에서 출발하도록** 바꾸는 것이다.
4. **판단과 대조는 Governance가 맡는다**
   - AD 변경(입사, 이동, 퇴사, 그룹 변경)과 Governance 할당 변경을 받아 대상별 원하는 상태를 계산한다.
   - 어댑터의 list 결과와 비교해 차이(drift)를 보고하거나 교정한다. 이것이 "관리자 의사가 정확히 투영됐는가"를 **검증하는 장치**다.
5. **Syncope·midPoint는 지금 도입하지 않는다**
   - 대상이 10여 종이고 원천이 AD 하나라면, 위 구조를 Provider 패턴으로 구현하는 편이 운영 부담이 작다.
   - 다음 경우에는 midPoint(ConnId 커넥터, 인증 캠페인)를 재평가한다.
     - 이기종 원천이 늘어날 때(예: 인사 시스템 + 외부 AD + 협력사)
     - 정기 접근 재인증 캠페인을 조직 규모로 운영해야 할 때
     - 커넥터 수가 크게 늘 때
6. **Keycloak의 역할**
   - AD를 읽기 전용으로 federation하는 **SSO 중계자**다. 별도 원천이 되지 않는다.
   - 퇴사 시 AD 비활성 → Keycloak 세션 회수 → 어댑터 disable 순으로 전파한다. 목표 시간은 기존 설계의 20분 p95를 유지할지 결정이 필요하다.

### 7.4 이 의견에서 생기는 결정 사항
- 외부 AD 모드에서 OpenSphere가 고객 AD에 **쓸 수 있는가**(전용 OU에 그룹 생성 등), 아니면 **읽기 전용**인가 → 2차 질문
- 내장 Samba AD 모드에서 조직·사원 정보를 누가 입력하는가(관리자 화면, 인사 파일 연동 등)

---

## 부록: 주요 근거

| 주제 | 위치 (A = OpenSphere-Archive) |
|---|---|
| 10 관점 × 6 SRL | `A/OpenSphere-Knowledge/10-PLATFORM/PLATFORM-ARCHITECTURE-PERSPECTIVES-AND-LAYERS.md`, `A/OpenSphere-Platform-V2/_DOCS_/20-아키텍처/arch-002-*` |
| 계층 약어 | `A/OpenSphere-console/apps/osaa-gateway/user-terms.cjs` |
| 계층 분리·PFS 정의·bootstrap 순서 | `A/OpenSphere-Platform-V2/_DOCS_/01-CONSTITUTION/CONSTITUTION-0004-*` |
| 권한 5요소 교집합 | `A/.../CONSTITUTION-0003-SHELL-HOSTING-INTEGRATION.md` §11.4 |
| 위험 비례 승인 | `A/.../CONSTITUTION-0006-ADMIN-MODULE-LIFECYCLE-RISK-GOVERNANCE.md` |
| Workspace 채널 | `A/.../10-의사결정/perspective-adr-003-workspace-delivery-channel.md`, `A/.../20-아키텍처/arch-006-*` |
| IGA·JIT 금지 | `A/.../10-의사결정/foundation/ADR-FND-002-iga-syncope-no-jit.md` |
| Foundation 경계·Claim 모델 | `A/OpenSphere-shell-foundation/docs/PRODUCT-BOUNDARIES.md`, `deploy/foundation-contracts.yaml` |
| HISS 계약 | `A/OpenSphere-shell-clusterManager/HISS-LIFECYCLE-CONTRACT.md`, `docs/his-operation-control.md` |
| PSSS 전달 | `A/OpenSphere-Platform-Support/docs/PFSS-DELIVERY-20261007.md` |
| 현재 거버넌스 원칙 | `OpenSphere/governance/GOVERNANCE-AOA-OS-SHELL-PRINCIPLES.md`, `AUTHORIZATION-GOVERNANCE-TOOLS-RESEARCH-2026-11-13.md` |
| Backbone 경계 | `OpenSphere/OpenSphere-Backbone/OPENSPHERE-BACKBONE-BLUEPRINT.md` |
| 이전 문서 검토 | `A/_review/2026-11-11/OPENSPHERE-DOCUMENT-REVIEW-2026-11-11.md` |
