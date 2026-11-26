# 공지 게시판 수직 PoC 명세 v0.3 — 패키지 시대, 격리 먼저

- **상태:** 초안 · 일부 결정(2026-11-26). 소유자 결정: **"격리부터"**(PoC-A를 먼저). 나머지 결정은 §7(P-1~P-3) 대기.
- **v0.2와 다른 점:** v0.2(2026-11-21)의 계층 · 완료 기준 · 주소 · 입구 · 신원 원칙(정공법, Samba AD → Keycloak, 회사 관리 콘솔 · Workspace 분리, 게이트웨이 뒤 앱)은 그대로다. 바뀐 것은 **"무엇으로 만드는가"**다. 그 뒤 결정(D-92 · 94 · 95 실행 원형 · 패키지만으로 확장, D-97 A2UI, D-98 계약 v1 · 모듈 명세, D-99 다중 스토어, D-100 이벤트 · 로그, D-102 에이전트 운용, D-104 연속성)에 따라 Fabric 서비스 · 앱 · 테넌트 면 엔진을 모두 **서명된 스토어 패키지**로 만들고, 어셈블리 · Genesis는 Core의 여러 패키지 계획으로 만든다.
- **규범:** v0.2의 규범 + [OS 통합 계약 v1](OS-INTEGRATION-CONTRACT-v1.md) · [모듈 명세](MODULE-INTEGRATION-SPECS-v0.1.md) · [중립 다중 스토어](NEUTRAL-MULTI-STORE-v0.1.md) · [어셈블리 · Fabric 공급 v0.8](ASSEMBLY-FABRIC-SUPPLY-v0.8.md) · [모듈 연속성](MODULE-CONTINUITY-v0.1.md).

## 0. 수직 데이터 흐름(재정의)

| 계층 | 주체 | ↓ 공급 | ↑ 신호 | 정본 원장 |
|---|---|---|---|---|
| HISS | 운영자 | 입구 · 주소 · TLS · 저장소 · 레지스트리 | 노드 · 저장 상태 | 클러스터 |
| Backbone 스토어 | 소유자(MFA) | 신뢰된 스토어 → 검증된 패키지 | 보안 공지(D-104) | Services 스토어 원장 |
| Fabric | 플랫폼 운영자 | 엔진 인스턴스 → Claim(연결 자격) | 인스턴스 이벤트(§10) · 로그(§11) | Services `osr.*` · Core 계획 |
| 어셈블리 | 테넌트 관리자 | 앱 구성: 패키지 + Claim 소비 + 노출 | 진행 · 적합성 결과 | Core 계획(묶음 · MFA) |
| Governance | Governance 소유자 | 리소스 유형 → 사원 배정 | 배정 · 회수 기록 | Governance 원장 |
| Workspace | 사원 | 앱 사용(게이트웨이 → 엔진 → PG) | 접근 기록 | 앱 데이터 PG, 접근 게이트웨이 |

정체 흐름은 따로: Samba AD(사원 원본) → Keycloak(연동 · 토큰) → 회사 관리 콘솔 · Workspace · 게이트웨이. Core는 테넌트 쪽 승인을 이 테넌트 발급자로만 받는다(v0.2 §8).

## 1. 두 단계

| 단계 | 어디서 | 신뢰 | 언제 |
|---|---|---|---|
| **PoC-A** | 운영 RKE2의 **격리 namespace**(V1과 같은 방식) · 일회용 Services/Core DB · 시험 Auth | **시험 스토어 · 시험 키**(MS7a 격리 레지스트리) | 지금(소유자 결정) |
| PoC-B | 운영 설치본, 실제 도메인 | Universe 운영 키(MS7b) | MS7b · P2 뒤 |

PoC-A의 합격 조건에 **흐름 전체에서 Backbone 재빌드 0회**를 넣는다: 시작 전 Backbone 빌드를 고정하고(이미지 · 정책 지문 · 이행 표지), S1~S9 동안 바뀌는 것은 서명된 패키지와 승인된 원장 데이터뿐이어야 한다. 막히면 멈추고, 빈 곳은 X 단위(호스트)로 따로 메운다.

PoC-A 주소: 격리 전용 하위 주소(예: `*.poc-a.dev.opensphere.co.kr`, 소유자 DNS) 또는 격리 Traefik 라우트. 사용자가 보는 결과는 v0.2와 같이 **플랫폼이 낸 HTTPS 주소**로 브라우저에서 연다(port-forward 금지).

## 2. 시나리오와 상태(2026-11-26)

| # | 단계 | 만드는 방법(v0.3) | 지금 | 검증 증거 |
|---|---|---|---|---|
| S0 | 입구 · 주소 · TLS | v0.2 §2(운영 VIP · Traefik · ACME). PoC-A는 격리 주소 | 운영 완료(11-21) | 공인 443 응답 |
| S1 | 스토어 신뢰 | MS4로 시험 스토어 적재(실제 Setup MFA) | 코드 완료(MS4) | 적재 영수증 |
| S2 | Fabric 패키지 | PG 새 판(operator-cr · A2UI), Keycloak 새 판(verified DB · `verify-full`), **Samba AD 새 판** | PG · Keycloak 호스트 쪽 완료, Samba 원형 미착수(P-1) | 설치 승인 · 인스턴스 Ready · CA 기록 |
| S3 | 회사 만들기(Genesis) | identity · governance 어셈블리 = **여러 패키지 계획 하나**(Samba → `directory-bind` → Keycloak · PG Claim → realm → 테넌트 발급자) | 없음(X8 · X9) | 계획 digest · MFA 한 번 · 단계 영수증 |
| S4 | 회사 관리 콘솔 · Workspace · 게이트웨이 | 테넌트 면 앱 패키지 `tenant-portal`(두 모드) — **앱 실행 원형**으로 설치, **노출 단계**가 주소를 냄 | 없음(X6 · X7) | `admin.` · `workspace.` HTTPS, MFA |
| S5 | 게시판 어셈블리 | 정의 → 계획 → PG Claim 소비(X2) → 노출(게이트웨이 뒤) → 적합성 시험 → Active | X2 연결만 완료 | Active, 글쓰기 · 읽기 |
| S6 | Governance 인계 · 배정 | Active 때 리소스 유형 인계, 배분 구역에서 배정 | 없음(tenant-portal) | 배정 기록(부여자 ≠ 대상) |
| S7 | 사원 사용 | AD 계정 로그인 → 타일 → 게이트웨이(세션 · 배정 · Active) → 앱 | 없음 | 플랫폼 주소로 열림 |
| S8 | 회수 | 배정 회수 → 30초 안에 차단 | 없음 | 403 · 직접 주소 거절 |
| S9 | 해체 | 계획 · MFA, 데이터는 P-3 | 없음 | 정리 영수증 |
| ↑ | 신호 | 인스턴스 이벤트 → Swallow, 로그 조회, 감사 | 감사만(C9 · C10 미착수) | 알림 · 로그 · 감사 행 |

## 3. 필요한 호스트 기능(X 단위, 이름 없이)

| 단위 | 내용 | 근거 |
|---|---|---|
| **X6 앱 실행 원형** | 상태 없는 웹 앱(`web-app/1` 제안): Deployment · Service · ConfigMap · 초기화 Job, Secret은 만들지 않고 Claim 투영으로 받음, Ingress · 클러스터 범위 객체 금지. v0.2 §5 `engine.web-stateless`를 계약 원형으로 | 계약 원형은 지금 `stateful-engine/1` · `operator-cr/1`뿐 |
| **X7 노출 · 로그인 연동** | 계획의 노출 단계가 호스트 라우트(Traefik)를 만들고, 앱은 직접 노출하지 않음. 게이트웨이 뒤 노출(`via: app-gateway`)과 OIDC 클라이언트 등록 계약 | 빈칸 5종 중 "외부 노출 · 로그인 연동"(검토 리포트 §2.1-1) |
| **X8 어셈블리 계획 단위** | 여러 패키지에 걸친 계획 하나(`osr-assembly-plan/v1`, AF-I6): 정의 `requires` 해석 · 잠금 · 단계 순서 · MFA 한 번 · 인계 | 지금 묶음은 공급자 서비스 단위 |
| **X9 테넌트 발급자** | Core가 테넌트 Keycloak 발급자(JWKS)를 등록하고, 테넌트 계획 승인을 그 토큰(`acr` OTP · `auth_time` · 역할)으로만 받음. Backbone 관리자 ↔ 테넌트 관리자 승인 분리(B-1) | v0.2 §8 · G7 |

## 4. 패키지(PoC-A, 시험 키)

| 패키지 | 원형 | 비고 |
|---|---|---|
| PG 새 판 | `operator-cr/1` | 운영 B단계 판과 같은 원천 |
| Keycloak 새 판 | `stateful-engine/1`(또는 명세 §7) | PG Claim 소비(X2), realm 가져오기 |
| Samba AD 새 판 | `stateful-engine/1` | P-1 |
| `tenant-portal` | X6 | 회사 관리 콘솔 · Workspace · 게이트웨이, 테넌트 면 제품(Backbone 소스 아님, B-1 · B-2) |
| `notice-board` | X6 | 정적 화면 + PostgREST, 자기 사용자 관리 없음 |

## 5. 증거(영수증)

각 단계: 계획 digest · 승인(MFA) · 실행부 영수증 · 대상 UID · 기대값 · 실제값 · 검증 못 한 범위. 마지막에 Backbone 빌드 전후 비교와 격리 정리 영수증. 브라우저 캡처(1440 · 390): 회사 관리 콘솔 · Workspace · 게시판 · 403 화면.

## 6. 그대로 두는 것(v0.2)

§1 완료 기준(사람이 하는 일 1~9), §2.2 주소 이름, §3의 Samba · Keycloak 최소판 원칙(Administrator 비밀번호를 내보내지 않음, Keycloak Operator 안 씀, 관리 콘솔 차단), §4 Genesis 단계 G1~G7 · 부트스트랩 계정 · 인도 코드는 소유자 터미널에서만, §6.3 게이트웨이 확인 셋, §7 두 모드 · 권한 분리, §8 승인, §9 인계 · 배정, §10 최소판 한계.

## 7. 결정 항목

| # | 질문 | 권고 |
|---|---|---|
| **P-1** | Samba AD 새 판(원형)을 언제 | **PoC-A를 위해 패키지를 지금 만든다(격리 전용).** 운영의 E7b(레거시 Samba 이행) 순서는 그대로 P1 뒤. 11-21 결정 "사원 신원은 Samba AD까지"를 지키기 위해 Samba를 빼지 않는다 |
| **P-2** | X6~X9의 순서 | **V1 · G1 → X6~X9 → PoC-A → (TLS · H3 · S3 · C9 · C10) → P1 → P2.** PoC-A가 호스트 빈 곳을 더 드러낼 것이므로 P1(재빌드 0회 실증) 전에 메워 두는 편이 P1 뒤 재빌드를 피한다 |
| **P-3** | 어셈블리 해체 때 데이터 | **해체 = 보관(Archive, D-104 §1.2).** 앱 데이터는 반출본 · 보관 볼륨으로 남기고, 영구 삭제는 별도(사원 영역 업무 데이터는 D-33 Governance 결정). D-104의 "인스턴스 삭제 기본값 = 삭제"는 직접 삭제에만 적용 |
