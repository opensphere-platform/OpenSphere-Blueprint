# OpenSphere Blueprint

OpenSphere의 계층 구조 설계, 구조 방향, 명세 초안을 모으는 저장소다. 2026-11-17부터 OpenSphere 설계 문서의 정본 위치다. 이전 위치는 OpenSphere 저장소 `governance/architecture/`였다.

문서 상태는 문서마다 다르다. **결정 대장(D-1~D-81)에 들어간 것만 결정**이고, 나머지는 초안·방향안이다. 어느 것도 구현 승인으로 읽지 않는다.

## 1. 구조 방향 (최신)

| 문서 | 내용 | 상태 |
|---|---|---|
| [네 면 구조](docs/overview/FOUR-PLANES.md) · [페이지](docs/pages/four-planes.html) | Backbone · Fabric · Governance · Workspace. Workspace = 리소스 풀, 사원 앱 승격, 전용 도메인 | 방향안(일부 합의) |
| [용어 대응표](docs/overview/GLOSSARY.md) | 상위 구조어, 쓰지 않는 용어(HISS·PSSS·PFSS 등)와 바꿔 쓸 말, 남겨 두는 구 식별자(D-79) | 결정 |
| [Backbone 경계 제안](docs/pages/backbone-boundary.html) | 영역의 키가 태어나는 지점까지가 Backbone. 네 면 구조에 흡수됨 | 이전 판 |

## 2. 명세 초안

| 문서 | 내용 | 상태 |
|---|---|---|
| [테넌트·어셈블리 구성 명세 v0.1](docs/specs/TENANT-ASSEMBLY-SPEC-v0.1.md) | 독립 제품을 하나의 목적으로 묶는 절차, Genesis, 연결 객체, 수명주기, 해체 | 초안 |
| [테넌트 내부 통신 규칙 v0.1](docs/specs/TENANT-COMMUNICATION-RULES-v0.1.md) | 결속·요청·이벤트·제어 네 종류의 통신 규칙, 워크로드 신원과 위임 토큰 | 초안 |
| [Governance 참고 아키텍처 v0.1](docs/specs/GOVERNANCE-REFERENCE-ARCHITECTURE-v0.1.md) | 랜딩존 대응표, 부품 지도, 판단 엔진 비교 시나리오 추가 | 초안 |

## 3. 계층 구조 설계 (결정 대장 포함)

| 문서 | 내용 |
|---|---|
| [계층 구조 기준선 v0.2](docs/architecture/OPENSPHERE-LAYER-BASELINE-v0.2.md) | 영역·계층 정의, 경계 불변식 B-1~B-8, **결정 대장 D-1~D-81**, 미결 O-1~O-10 |
| [계층 지도](docs/architecture/OPENSPHERE-LAYER-MAP.html) | 영역 × 계층 지도, 통신·통제 흐름, 제품 대장, 업무 코어 후보(화면) |
| [계층 구조 검토 v0.1](docs/architecture/OPENSPHERE-LAYER-STRUCTURE-REVIEW-v0.1.md) | 기준선 이전의 아카이브 구조 검토 |
| [O-2 PFSS 경계](docs/architecture/OPENSPHERE-PFSS-BOUNDARY-O2-v0.1.md) | Backbone과 Governance의 공유 서비스(구 PFSS) 제어 분리, Claim 확장, 서명 Grant |
| [Governance 최소 설계](docs/architecture/OPENSPHERE-GOVERNANCE-MIN-DESIGN-v0.1.md) | 원장, 결재, 어댑터, 판단 엔진 비교, G0~G4 단계 |
| [O-6 비상 진입](docs/architecture/OPENSPHERE-BREAKGLASS-O6-v0.1.md) | Backbone의 사원 영역 비상 진입, 보안 동결, 운영 정보 범위 |
| [O-4·O-7 에이전트 신원](docs/architecture/OPENSPHERE-AGENT-IDENTITY-O4-O7-v0.1.md) | 에이전트 신원 정본, 상시 위임, 호출 사슬 |
| [에이전트 구성 재검토](docs/architecture/OPENSPHERE-AGENT-RUNTIME-REVIEW-v0.1.md) | OpenBot 하네스, KubeVirt 자리 VM, 세 출구 |
| [O-9 고객 영역](docs/architecture/OPENSPHERE-CUSTOMER-AREA-O9-v0.1.md) | 세 번째 영역, 고객 CIAM, B2C·B2B, 고객 AI |
| [교류 계층](docs/architecture/OPENSPHERE-EXCHANGE-LAYER-v0.1.md) | 사원↔고객의 유일한 통과 지점, X-1~X-5 |
| [업무 코어·SCM 후보](docs/architecture/OPENSPHERE-CUSTOMER-SCM-UPSTREAM-v0.1.md) | Odoo Community 선정 근거, Liferay 비교, 검증 조건 C1~C9 |
| [Dapr 평가](docs/architecture/OPENSPHERE-DAPR-EVALUATION-v0.1.md) | 영역별 단일 채널, 일관성 기준, Temporal 유지 |

## 4. 검토

| 문서 | 내용 |
|---|---|
| [설계 레드팀 검토 v0.1](docs/reviews/OPENSPHERE-DESIGN-REDTEAM-REVIEW-v0.1.md) | 위 설계 전체에 대한 지적 19건(치명 1, 높음 7, 중간 8, 낮음 3) |

**읽는 순서:** 기준선 v0.2 → 레드팀 검토 → 네 면 구조 → 명세 초안

## 상태 표시

| 표시 | 의미 |
|---|---|
| `합의` | 사용자가 동의한 항목 |
| `제안` | 검토 의견, 결정 전 |
| `미정` | 정해야 할 항목 |

## 식별자

| 접두어 | 문서 |
|---|---|
| D-*, B-*, O-* | 기준선 v0.2 |
| X-* | 교류 계층 |
| R-* | 레드팀 검토 |
| T-*, T-Q* | 테넌트·어셈블리 구성 명세 |
| TC-*, TC-Q* | 테넌트 내부 통신 규칙 |
| S8~S10, GR-Q* | Governance 참고 아키텍처 |

## OpenSphere 저장소에 남은 것

거버넌스 원칙(`policies/GOVERNANCE-AOA-OS-SHELL-PRINCIPLES.md`), 권한·거버넌스 도구 조사(`policies/AUTHORIZATION-GOVERNANCE-TOOLS-RESEARCH-2026-11-13.md`), 형상관리·버전·설치 정책은 OpenSphere 저장소 `policies/`(옛 `governance/`, D-81)에 남는다. 이 저장소의 문서가 그 둘을 언급할 때는 OpenSphere 저장소 경로다.
