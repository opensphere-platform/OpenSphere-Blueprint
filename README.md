# OpenSphere Blueprint

OpenSphere의 구조 방향과 명세 초안을 모으는 저장소다. 여기 있는 문서는 아직 결정 대장(D-번호)에 반영되지 않은 **초안과 방향안**이다. 구현 승인으로 읽지 않는다.

## 문서

| 구분 | 문서 | 내용 | 상태 |
|---|---|---|---|
| 구조 | [네 면 구조](docs/overview/FOUR-PLANES.md) · [페이지판](docs/pages/four-planes.html) | Backbone · Middle-earth · Governance · Workspace. Workspace = 리소스 풀, 사원 앱 승격, 전용 도메인 | 방향안(일부 합의) |
| 명세 | [테넌트·어셈블리 구성 명세 v0.1](docs/specs/TENANT-ASSEMBLY-SPEC-v0.1.md) | 독립 제품을 하나의 목적으로 묶는 절차, Genesis, 연결 객체, 수명주기, 해체 | 초안 |
| 명세 | [테넌트 내부 통신 규칙 v0.1](docs/specs/TENANT-COMMUNICATION-RULES-v0.1.md) | 결속·요청·이벤트·제어 네 종류의 통신 규칙, 워크로드 신원과 위임 토큰 | 초안 |
| 조사 | [Governance 참고 아키텍처 v0.1](docs/specs/GOVERNANCE-REFERENCE-ARCHITECTURE-v0.1.md) | 랜딩존 대응표, 부품 지도, 판단 엔진 비교 시나리오 추가 | 초안 |

**읽는 순서:** 네 면 구조 → 구성 명세 → 통신 규칙 → 참고 아키텍처

## 상태 표시

| 표시 | 의미 |
|---|---|
| `합의` | 사용자가 동의한 항목 |
| `제안` | 검토 의견, 결정 전 |
| `미정` | 정해야 할 항목 |

## 원본 설계 문서와의 관계

이 저장소의 문서는 OpenSphere 저장소 `governance/architecture/`의 설계 문서를 **상위 기준**으로 참조한다.
- 기준선 v0.2와 결정 D-1~D-76
- O-2 PFSS 경계, Governance 최소 설계, O-6 비상 진입, 에이전트 신원, O-9 고객 영역, 교류 계층, Dapr 평가

그 문서들은 이 저장소로 옮기지 않았다. 문서 안에서 `D-번호`, `B-번호`, `X-번호`, `O-번호`는 그 기준선의 식별자다.

## 식별자

| 접두어 | 문서 |
|---|---|
| T-1~T-9, T-Q* | 테넌트·어셈블리 구성 명세 |
| TC-*, TC-Q* | 테넌트 내부 통신 규칙 |
| S8~S10, GR-Q* | Governance 참고 아키텍처 |
