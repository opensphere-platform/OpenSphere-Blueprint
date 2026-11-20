# OpenSphere Blueprint

OpenSphere의 계층 구조 설계, 구조 방향, 명세 초안을 모으는 저장소다. 2026-11-17부터 OpenSphere 설계 문서의 정본 위치다. 이전 위치는 OpenSphere 저장소 `governance/architecture/`였다.

문서 상태는 문서마다 다르다. **결정 대장(D-1~D-86)에 들어간 것만 결정**이고, 나머지는 초안·방향안이다. 어느 것도 구현 승인으로 읽지 않는다.

## 1. 구조 방향 (최신)

| 문서 | 내용 | 상태 |
|---|---|---|
| [네 면 구조](docs/overview/FOUR-PLANES.md) · [페이지](docs/pages/four-planes.html) | Backbone · Fabric · Governance · Workspace. Workspace = 리소스 풀, 사원 앱 승격, 전용 도메인 | 방향안(일부 합의) |
| [용어 대응표](docs/overview/GLOSSARY.md) | 상위 구조어, 쓰지 않는 용어(PSSS·PFSS 등)와 바꿔 쓸 말, 새 뜻으로 다시 쓰는 HISS(D-86), 남겨 두는 구 식별자(D-79) | 결정 |
| [Fabric 구조](docs/pages/fabric.html) | Fabric의 네 묶음(기반·배포 지원·공유 서비스·엔진), 공유 서비스와 Fabric의 차이, 공유 서비스·엔진·어셈블리·리소스 유형 네 층 | 제안 |
| [Backbone 경계 제안](docs/pages/backbone-boundary.html) | 영역의 키가 태어나는 지점까지가 Backbone. 네 면 구조에 흡수됨 | 이전 판 |

## Backbone 상세 설계와 실제 이력

[**Backbone 설계·구현·운영 대장**](docs/backbone/README.md)에서 현재 책임·계약과 실제 배포/검증 상태를 함께 확인한다.

| 문서 | 내용 |
|---|---|
| [상세 설계](docs/backbone/DESIGN.md) | Nexus·Core·R2D2·실행·저장·공급 경계·업데이트·독립 복구 계약 |
| [구현·운영 현황](docs/backbone/IMPLEMENTATION-STATUS.md) | Setup52/Console21 수용, 실제 운영 이미지 관측, PG 첫 단계 보류와 미완료 구분 |
| [작업·배포·검증 이력](docs/backbone/DELIVERY-HISTORY.md) | 설계·Core 실증·CI·설치·Nexus·PG 후보의 source/PR/CI/산출물/실패·보존 |
| [Nexus 감사 후속](docs/backbone/AUDIT-FOLLOWUP.md) | 원 Nexus17건의 범위별 조치·잔여 위험. 원 감사와 별도인 팀장 후속 판정 |
| [근거 대장](docs/backbone/evidence-index.json) | 입력 지문·증거 수준·읽기 전용 운영 관측; 비밀 원본 미공개 |

**이 묶음은 D-대장 변경이나 새 구현·배포·CI 예외 승인이 아니다.** 설계 제안, 소스 병합, 이미지 발행, 운영 반영과 전기능 자가 운영을 구분한다. 현재 R2D2 PG 전환은 미완료다.

## 2. 명세 초안

| 문서 | 내용 | 상태 |
|---|---|---|
| [테넌트 구조 페이지](docs/pages/tenant.html) | 테넌트 생성, 유지하는 힘(연결 객체), 테넌트 안 통신, Governance로 잇는 방법을 한 화면에 | 초안 요약 |
| [테넌트·어셈블리 구성 명세 v0.1](docs/specs/TENANT-ASSEMBLY-SPEC-v0.1.md) | 독립 제품을 하나의 목적으로 묶는 절차, Genesis, 연결 객체, 수명주기, 해체 | 초안 |
| [테넌트 내부 통신 규칙 v0.1](docs/specs/TENANT-COMMUNICATION-RULES-v0.1.md) | 결속·요청·이벤트·제어 네 종류의 통신 규칙, 워크로드 신원과 위임 토큰 | 초안 |
| [어셈블리 카탈로그 v0.1](docs/specs/ASSEMBLY-CATALOG-v0.1.md) | 어셈블리 19종이 나눠 주는 Governance 리소스 유형, 리소스 유형 정의 형식, 카탈로그 등재 조건 | 초안 |
| [어셈블리 · Fabric 협력 공급 명세 v0.6](docs/specs/ASSEMBLY-FABRIC-SUPPLY-v0.6.md) | 어셈블리가 필요를 선언하면 Fabric 서비스 켜기 · 인스턴스 · DB · 접속 자격 인도까지 한 계획으로 실행하는 절차, 구 버전 의도, 실행부 쓰기 전체의 승인 대조 웹훅, SGScript 발급과 발급 역할 권한, 자격 세대, 예약 · 점유 · 한도(v0.1~v0.5는 기록용) | 초안(Q1~Q3 · Q11 결정, Q9 · Q10 결정 대기, 운영 적용 전 제한 검증) |
| [외부 리소스 편입 규칙 v0.1](docs/specs/EXTERNAL-RESOURCE-ADMISSION-v0.1.md) | 외부 AD·SaaS·DB·모델 API를 외부 어셈블리로 묶어 Governance 리소스로 올리는 규칙 ER-1~ER-14, 통제 등급 | 초안 |
| [OpenSphere Registry(OSR) 규격 v0.2](docs/specs/OPENSPHERE-REGISTRY-OSR-v0.2.md) | Backbone 밖 모듈의 등록 · 형식적/실질적 멤버, 필수 기여(매뉴얼 · OS Shell 명령 · OCI · RAG), 유효 권한 교집합, 클래스별 설치 profile, referrer 서명, 회수 · 독립 복구, GHCR 발행과 확장 설치 흐름, Backbone 준비도 점검(부록 A). [v0.1](docs/specs/OPENSPHERE-REGISTRY-OSR-v0.1.md)은 기록 | 초안 |
| [OSR · 4종 인프라 종합 구현 계획서 v0.2](docs/specs/OSR-IMPLEMENTATION-PLAN-v0.2.md) | 계획 검토 반영. 착수 기준 · 의존성 선행 조건, Core 승인 adapter · 제한 실행부 · 인계 증명, 클래스별 profile, 6단계(계약 → 형식 검증 → 설치본 · 승인 → 수직 실증 → 실패 · 복구 → 외연)와 완료 기준. [v0.1](docs/specs/OSR-IMPLEMENTATION-PLAN-v0.1.md)은 기록 | 초안 |
| [OSR 계약 · 시험 벡터(단계 1)](docs/specs/osr/README.md) | 스키마 16개, canonical JSON · 서명 규칙, materializer profile 초안 2개, 참조 검증기와 정상 · 거절 시험 벡터 74개(`node docs/specs/osr/tools/check-vectors.mjs`) | 초안 |
| [Governance 참고 아키텍처 v0.1](docs/specs/GOVERNANCE-REFERENCE-ARCHITECTURE-v0.1.md) | 랜딩존 대응표, 부품 지도, 판단 엔진 비교 시나리오 추가 | 초안 |

## 3. 계층 구조 설계 (결정 대장 포함)

| 문서 | 내용 |
|---|---|
| [계층 구조 기준선 v0.2](docs/architecture/OPENSPHERE-LAYER-BASELINE-v0.2.md) | 영역·계층 정의, 경계 불변식 B-1~B-8, **결정 대장 D-1~D-86**, 미결 O-1~O-13 |
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
| [사원 영역 AI 운영](docs/architecture/OPENSPHERE-AI-OPERATIONS-v0.1.md) | 전 사원 토큰 공급(모델 게이트웨이), 개인 · 공용 에이전트의 상태와 킬 스위치, 데이터 세 층, 메뉴 배치, 규제 점검, 결정 후보 A~M |

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
| AC-Q* | 어셈블리 카탈로그 |
| ER-*, ER-Q* | 외부 리소스 편입 규칙 |
| TC-*, TC-Q* | 테넌트 내부 통신 규칙 |
| S8~S10, GR-Q* | Governance 참고 아키텍처 |

## OpenSphere 저장소에 남은 것

거버넌스 원칙(`policies/GOVERNANCE-AOA-OS-SHELL-PRINCIPLES.md`), 권한·거버넌스 도구 조사(`policies/AUTHORIZATION-GOVERNANCE-TOOLS-RESEARCH-2026-11-13.md`), 형상관리·버전·설치 정책은 OpenSphere 저장소 `policies/`(옛 `governance/`, D-81)에 남는다. 이 저장소의 문서가 그 둘을 언급할 때는 OpenSphere 저장소 경로다.
