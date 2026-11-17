# OpenSphere 용어 대응표

**상태:** 결정 D-79 반영(2026-11-17)
**적용:** 이 날 이후 새로 쓰거나 고치는 문서. 이전 문서는 기록으로 두고, 머리에 용어 안내만 붙인다.

---

## 1. 원칙

1. **상위 구조어는 네 면 이름만 쓴다.** Backbone · Middle-earth(가칭) · Governance · Workspace. 영역 이름으로 고객 영역, 경계 이름으로 교류 계층, 업무 데이터 정본으로 업무 코어를 함께 쓴다.
2. **HISS · PSSS · PFSS, L1~L6 번호, "공통 기반"은 상위 구조어로 쓰지 않는다.** 이 단어들은 "계층 = 위치 = 주인 하나"라는 모델에서 나왔다. 공유 구성요소의 경계가 그 한가운데를 지난다는 네 면 구조의 핵심과 맞지 않는다.
3. **Middle-earth 안의 묶음은 기능 이름으로 부른다.** 기반 · 배포 지원 · 공유 서비스. 옛 이름을 병기해야 뜻이 통할 때는 "(구 HISS)"처럼 괄호로 붙인다.
4. **코드·계약 식별자는 당장 바꾸지 않는다.** 아래 §4의 구 식별자는 각 계약의 다음 메이저 버전에서 바꾼다. 새 계약은 처음부터 새 이름을 쓴다.
5. **규정은 이름과 따로 판단한다.** 옛 이름에 붙어 있던 규정 대부분은 Middle-earth 공급 면의 규칙으로 그대로 옮긴다(§5).

> D-79는 용어에 대한 결정이다. 네 면 구조의 구조 변경(영역별 Argo 인스턴스, cluster-admin 봉인 등)은 여전히 [네 면 구조](FOUR-PLANES.md)의 `제안`이다. Middle-earth의 공식 명칭도 아직 정하지 않았다.

## 2. 상위 구조어

| 용어 | 뜻 |
|---|---|
| **Backbone** | 순수 관리 영역. 설치·운영·복구, 용량·공급 풀, 영역 사이 칸막이, 엔진 버전 공급 |
| **Middle-earth** (가칭) | 공급 면과 사용 면이 공존하는 공유 구성요소의 집합. 공식 명칭은 미정(톨킨 저작물 상표라 제품 용어로는 중립 명칭 권장) |
| **Governance** | 사용 면을 사람·단위·에이전트·앱에 권한에 맞게 쪼개 나누는 판단(PDP)과 결재 |
| **Workspace** | 할당된 사용 면의 묶음. 사원·에이전트의 자유 영역이자 리소스 풀 |
| 고객 영역 | 고객 신원(CIAM)과 대외 면. 네 면 모델 밖의 세 번째 영역(D-62) |
| 교류 계층 | 사원 영역과 고객 영역의 유일한 통과 지점(D-75) |
| 업무 코어 | 회사 업무 데이터의 정본(ERP·SCM, D-74). 엔진은 Middle-earth, 데이터는 회사 공유 자원 |

## 3. 쓰지 않는 용어와 바꿔 쓸 말

| 옛 용어 | 출처 | 바꿔 쓸 말 | 비고 |
|---|---|---|---|
| **HISS** (Host Infrastructure Service Stack, L1) | 아카이브 6계층, 기준선 v0.2 §3 | **기반** | Middle-earth의 묶음. K8s, CNI, ingress 컨트롤러, cert-manager, DNS, 저장 엔진, KVM 노드 |
| **PSSS** (Platform Support Service Stack, L4) | 아카이브, 기준선 v0.2 §3 | **배포 지원** | Middle-earth의 묶음. Argo CD, Crossplane, Velero 설치 |
| **PFSS** (Platform Foundation Service Stack, L5) | 아카이브, 기준선 v0.2 §3 | **공유 서비스** | Middle-earth의 묶음. 데이터·신원·연산·보호·관측 계열 Provider와 공급 제어 기능 |
| PFS Backup | 아카이브(`opensphere-backup`) | **백업 서비스** | 공유 서비스의 보호 계열 |
| PFS Observability | 아카이브(Grafana·Loki·Tempo·관측 게이트웨이) | **관측 서비스** | 공유 서비스의 관측 계열 |
| "공통 기반" | 기준선 v0.2 §3의 영역 표기 | **Middle-earth** | 주인이 하나라는 인상을 주는 표현이라 쓰지 않는다 |
| L1~L6 | 아카이브 6계층 번호 | 쓰지 않음 | 설치 순서를 뜻하지 않는다. 기준선 v0.2도 이미 "설명용"으로 약화했다. 사원 앱 승격 단계도 혼동을 피해 L1~L3 대신 **1~3단계**로 부른다 |
| CBSS, PCSS | 아카이브 | **Backbone** | D-1에서 이미 흡수 |
| DSS | 아카이브 | **Workspace** | 기준선 v0.2에서 이미 흡수 |
| 6 SRL | 아카이브 | 쓰지 않음 | 네 면 구조로 대체 |

## 4. 남겨 두는 용어

| 용어 | 뜻 | 비고 |
|---|---|---|
| **Foundation** | Backbone의 **공급 면 관리 도구**. Provider를 채택·갱신하는 화면과 `foundation.provider-modules.*` 명령 | 관리하는 대상(공유 서비스)과 구분한다 |
| **Provider** | 공유 서비스의 엔진 단위. 예: PostgreSQL Provider, KubeVirt Provider | "PFSS Provider" 대신 "공유 서비스 Provider" 또는 그냥 "Provider" |
| Plan · Claim · Instance · Binding | 공유 서비스의 공급·인도 절차 | 인도 지점은 Binding |
| SupplyPool(공급 풀), Grant | 공급 한도와 서명된 배분 증거(D-31, D-32) | |

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

- 새 문서에서는 §2와 §3의 바꿔 쓸 말만 쓴다.
- 옛 문서를 인용하거나 아카이브 근거를 적을 때만 옛 용어를 쓴다. 예: "기존 PFSS 계획의 모듈".
- 코드 블록과 식별자는 실제 이름 그대로 쓴다.
- 이전 문서(기준선 v0.2와 v0.1 설계 문서)는 본문을 고치지 않는다. 머리의 용어 안내로 이 표를 가리킨다. 기준선 v0.3을 쓸 때 본문을 새 용어로 옮긴다.
