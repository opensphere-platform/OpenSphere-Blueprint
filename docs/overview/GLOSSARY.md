# OpenSphere 용어 대응표

**상태:** 결정 D-79(용어 정리), D-80(OpenSphere Fabric 명칭), D-81(Governance 표기·정의), D-82(구성과 배분 분리) 반영 · 2026-11-17
**적용:** 이 날 이후 새로 쓰거나 고치는 문서. 이전 문서는 기록으로 두고, 머리에 용어 안내만 붙인다.

---

## 1. 원칙

1. **상위 구조어는 네 면 이름만 쓴다.** Backbone · Fabric(OpenSphere Fabric) · Governance · Workspace. 영역 이름으로 고객 영역, 경계 이름으로 교류 계층, 업무 데이터 정본으로 업무 코어를 함께 쓴다.
2. **HISS · PSSS · PFSS, L1~L6 번호, "공통 기반"은 상위 구조어로 쓰지 않는다.** 이 단어들은 "계층 = 위치 = 주인 하나"라는 모델에서 나왔다. 공유 구성요소의 경계가 그 한가운데를 지난다는 네 면 구조의 핵심과 맞지 않는다.
3. **Fabric 안의 묶음은 기능 이름으로 부른다.** 기반 · 배포 지원 · 공유 서비스. 옛 이름을 병기해야 뜻이 통할 때는 "(구 HISS)"처럼 괄호로 붙인다.
4. **코드·계약 식별자는 당장 바꾸지 않는다.** 아래 §4의 구 식별자는 각 계약의 다음 메이저 버전에서 바꾼다. 새 계약은 처음부터 새 이름을 쓴다.
5. **규정은 이름과 따로 판단한다.** 옛 이름에 붙어 있던 규정 대부분은 Fabric 공급 면의 규칙으로 그대로 옮긴다(§5).

> D-79는 용어에 대한 결정이다. 네 면 구조의 구조 변경(영역별 Argo 인스턴스, cluster-admin 봉인 등)은 여전히 [네 면 구조](FOUR-PLANES.md)의 `제안`이다.

## 2. 상위 구조어

| 용어 | 뜻 |
|---|---|
| **Backbone** | 순수 관리 영역. 설치·운영·복구, 용량·공급 풀, 영역 사이 칸막이, 엔진 버전 공급 |
| **Fabric** (OpenSphere Fabric) | 공급 면과 사용 면이 엮인 공유 구성요소의 집합(D-80). 이름은 원단에서 왔다. **날실**은 Backbone이 먼저 걸어 두는 공급 면(엔진·용량·수명주기), **씨실**은 영역마다 엮어 넣는 사용 면(설정·자격·데이터), 둘이 엮이는 자리가 **인도 지점**이다. Governance는 이 원단을 잘라 나눠 주고 Workspace는 받은 조각을 쓴다. "아래에 깔린 하나의 기반층"이라는 뜻으로 쓰지 않는다 |
| **Governance** (OpenSphere Governance) | **대상**(D-10): 접근·자원·비용·준수. **하는 일**: 정의·할당·결재·재검토·회수·승격의 판단과 그 원장. 판단(PDP)까지만 하고, 집행·분석·보고 엔진은 Fabric 부품에 맡긴다. 이 정의 밖의 기능은 정의를 바꾸는 결정 없이 넣지 않는다(D-81). "자원"은 테넌트가 구성해 내놓은 리소스의 **배분**을 뜻하며, 어셈블리 구성·연결 승인은 하지 않는다(D-82) |
| **Workspace** | 할당된 사용 면의 묶음. 사원·에이전트의 자유 영역이자 리소스 풀 |
| 고객 영역 | 고객 신원(CIAM)과 대외 면. 네 면 모델 밖의 세 번째 영역(D-62) |
| 교류 계층 | 사원 영역과 고객 영역의 유일한 통과 지점(D-75) |
| 업무 코어 | 회사 업무 데이터의 정본(ERP·SCM, D-74). 엔진은 Fabric, 데이터는 회사 공유 자원 |

## 3. 쓰지 않는 용어와 바꿔 쓸 말

| 옛 용어 | 출처 | 바꿔 쓸 말 | 비고 |
|---|---|---|---|
| **HISS** (Host Infrastructure Service Stack, L1) | 아카이브 6계층, 기준선 v0.2 §3 | **기반** | Fabric의 묶음. K8s, CNI, ingress 컨트롤러, cert-manager, DNS, 저장 엔진, KVM 노드 |
| **PSSS** (Platform Support Service Stack, L4) | 아카이브, 기준선 v0.2 §3 | **배포 지원** | Fabric의 묶음. Argo CD, Crossplane, Velero 설치 |
| **PFSS** (Platform Foundation Service Stack, L5) | 아카이브, 기준선 v0.2 §3 | **공유 서비스** | Fabric의 묶음. 데이터·신원·연산·보호·관측 계열 Provider와 공급 제어 기능 |
| PFS Backup | 아카이브(`opensphere-backup`) | **백업 서비스** | 공유 서비스의 보호 계열 |
| PFS Observability | 아카이브(Grafana·Loki·Tempo·관측 게이트웨이) | **관측 서비스** | 공유 서비스의 관측 계열 |
| "공통 기반" | 기준선 v0.2 §3의 영역 표기 | **Fabric** | 주인이 하나라는 인상을 주는 표현이라 쓰지 않는다 |
| L1~L6 | 아카이브 6계층 번호 | 쓰지 않음 | 설치 순서를 뜻하지 않는다. 기준선 v0.2도 이미 "설명용"으로 약화했다. 사원 앱 승격 단계도 혼동을 피해 L1~L3 대신 **1~3단계**로 부른다 |
| CBSS, PCSS | 아카이브 | **Backbone** | D-1에서 이미 흡수 |
| DSS | 아카이브 | **Workspace** | 기준선 v0.2에서 이미 흡수 |
| 6 SRL | 아카이브 | 쓰지 않음 | 네 면 구조로 대체 |
| Middle-earth (가칭) | 네 면 구조 초안(2026-11-17) | **Fabric** | D-80으로 대체. 톨킨 저작물 상표와 겹쳐 쓰지 않는다 |

## 4. 남겨 두는 용어

| 용어 | 뜻 | 비고 |
|---|---|---|
| **Foundation** | Backbone의 **공급 면 관리 도구**. Provider를 채택·갱신하는 화면과 `foundation.provider-modules.*` 명령 | 관리하는 대상(공유 서비스)과 구분한다 |
| **Provider** | 공유 서비스의 엔진 단위. 예: PostgreSQL Provider, KubeVirt Provider | "PFSS Provider" 대신 "공유 서비스 Provider" 또는 그냥 "Provider" |
| Plan · Claim · Instance · Binding | 공유 서비스의 공급·인도 절차 | 인도 지점은 Binding |
| SupplyPool(공급 풀), Grant | 공급 한도와 서명된 배분 증거(D-31, D-32) | |
| 테넌트 | 영역 단위의 **회사 차원 리소스 결합**. 무엇이 있고 어떻게 엮였고 얼마나 줄 수 있는지를 정한다(D-82) | 누구에게 줄지는 Governance |
| 테넌트 콘솔 · 테넌트 관리자 | 테넌트 구성(어셈블리·연결·용량·검증·외부 편입·해체)을 하는 화면과 역할(D-82) | 역할을 누구에게 줄지는 Governance가 정한다 |
| 인계 | 테넌트가 리소스 유형과 용량을 Governance에 넘기는 일. 둘이 만나는 유일한 지점 | D-82 |
| 어셈블리 | 테넌트 안에서 하나의 목적을 위해 묶인 Fabric 구성요소 조합 | [어셈블리 카탈로그](../specs/ASSEMBLY-CATALOG-v0.1.md) |
| 리소스 유형 | 어셈블리가 내놓고 Governance가 나눠 주는 단위. 예: `mail.mailbox`. 제품명이 아니라 영역 이름으로 짓는다 | 사원은 구성요소가 아니라 리소스 유형을 받는다 |
| 외부 어셈블리 | Fabric 밖의 리소스를 연결기·연결 객체로 묶어 들인 어셈블리 | [외부 리소스 편입 규칙](../specs/EXTERNAL-RESOURCE-ADMISSION-v0.1.md) |
| 관리형 · 연동형 · 참조형 | 외부 리소스의 통제 등급. 적합성 시험으로 판정 | managed · federated · referenced |

**구 식별자: 다음 메이저 버전까지 그대로 유지한다**

| 구 식별자 | 위치 |
|---|---|
| `PFSS Provider 표준 v1` | Provider 저장소 README·계약 |
| `foundation.provider-modules.*` (13개 명령) | Foundation 명령 계약 `owner-commands.json` |
| `FoundationClaim`, `FoundationModel` | CRD |
| `pfss/claims/<ns>/<claim>/claim.json`, `pfss/providers/<id>/registration.json`, `pfss-provider-<id>` | 설치 Gitea 경로, Argo 좌표 |
| `opensphere-foundation` | 네임스페이스 |
| `OpenSphere-provider-*` | 저장소 이름 |
| `OPENSPHERE-PFSS-BOUNDARY-O2-v0.1.md` | 이 저장소의 기존 문서 파일명 |

새 이름으로 바꿀 때는 옛 식별자를 별칭으로 한 버전 이상 함께 받아, 설치된 환경이 깨지지 않게 한다.

## 5. 옛 이름에 붙어 있던 규정의 처리

| 규정 | 처리 |
|---|---|
| Plan → Claim → Instance → Binding, Provider 표준 v1, SupplyPool, 서명 Grant(D-31) | **유효.** 공유 서비스의 공급·인도 규칙 |
| "진단 항목과 관리 항목을 구분한다"(기반) | **유효.** 기반 운영 규칙 |
| 영구 삭제는 Governance 결정, 공유 서비스 실행(D-33) | **유효** |
| 사원 영역 배포 = GitLab CI → Argo(D-18) | **수정 제안.** 영역별 Argo 인스턴스(네 면 구조 §3) |
| 백업 = PSSS(기준선 §3) | **수정 제안.** 엔진·실행은 Backbone, 정책·키·복구 승인은 영역(네 면 구조 §3.3) |
| L1~L6 설치 순서 | **폐기** |

## 6. 쓰기 규칙

- **"Governance"(영문)는 제품만 가리킨다.** 대외 표기는 "OpenSphere Governance". 한글 "거버넌스"는 프로젝트 원칙·정책이나 일반 활동(데이터 거버넌스 등)을 가리킬 때만 쓴다. 예: "Governance가 결재한다"(제품), "거버넌스 원칙"(프로젝트 원칙)(D-81).
- 프로젝트 원칙·정책 문서는 OpenSphere 저장소 `policies/`에 있다(옛 경로 `governance/`, D-81).
- **대외 표기는 "OpenSphere Fabric"으로만 한다.** "Fabric" 단독 표기는 설계 문서 안에서만 쓴다. Microsoft Fabric, Azure Service Fabric, Hyperledger Fabric 등과 겹치므로 대외에 쓰기 전에 상표를 확인한다.

- 새 문서에서는 §2와 §3의 바꿔 쓸 말만 쓴다.
- 옛 문서를 인용하거나 아카이브 근거를 적을 때만 옛 용어를 쓴다. 예: "기존 PFSS 계획의 모듈".
- 코드 블록과 식별자는 실제 이름 그대로 쓴다.
- 이전 문서(기준선 v0.2와 v0.1 설계 문서)는 본문을 고치지 않는다. 머리의 용어 안내로 이 표를 가리킨다. 기준선 v0.3을 쓸 때 본문을 새 용어로 옮긴다.
