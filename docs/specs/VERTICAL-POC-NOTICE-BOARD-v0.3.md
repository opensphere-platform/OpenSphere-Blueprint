# 공지 게시판 수직 PoC 명세 v0.3 — 패키지 시대, 격리 먼저

- **상태:** **소유자 결정 D-105**(2026-11-26, "권고대로 승인" — §7 P-1~P-5). Claude · Codex 합의안. 소유자 결정: **"격리부터"**(PoC-A를 먼저). 협의 기록: Codex 메모 #153(코드 · 운영 대조, 파일:줄 근거) → Claude 검토 #155(보완 다섯 가지, 근거 셋 직접 확인: `consumes` maxItems 1 · 와일드카드 DNS · 운영 Keycloak `sslmode=require`) → Codex 동의(3번에 Traefik 우선순위 1100 보탬).
- **v0.2와 다른 점:** v0.2(2026-11-21)의 계층 · 완료 기준 · 주소 · 입구 · 신원 원칙(정공법, Samba AD → Keycloak, 회사 관리 콘솔 · Workspace 분리, 게이트웨이 뒤 앱)은 그대로다. 바뀐 것은 **"무엇으로 만드는가"**다. 그 뒤 결정(D-92 · 94 · 95 실행 원형 · 패키지만으로 확장, D-97 A2UI, D-98 계약 v1 · 모듈 명세, D-99 다중 스토어, D-100 이벤트 · 로그, D-102 에이전트 운용, D-104 연속성)에 따라 Fabric 서비스 · 앱 · 테넌트 면 엔진을 모두 **서명된 스토어 패키지**로 만들고, 어셈블리 · Genesis는 Core의 여러 패키지 계획으로 만든다.
- **규범:** v0.2의 규범 + [OS 통합 계약 v1](OS-INTEGRATION-CONTRACT-v1.md) · [모듈 명세](MODULE-INTEGRATION-SPECS-v0.1.md) · [중립 다중 스토어](NEUTRAL-MULTI-STORE-v0.1.md) · [어셈블리 · Fabric 공급 v0.8](ASSEMBLY-FABRIC-SUPPLY-v0.8.md) · [모듈 연속성](MODULE-CONTINUITY-v0.1.md).
- **기준 시점:** Backbone main `573c558`, 운영 A-5(`2691afa`, Core `358d10e0…` · Console `1cea616e…`), 2026-11-26 운영 읽기 전용 조회.

## 0. 수직 데이터 흐름(재정의)

| 계층 | 주체 | ↓ 공급 | ↑ 신호 | 정본 원장 |
|---|---|---|---|---|
| HISS | 운영자 | 입구 · 주소 · TLS · 저장소 · 레지스트리 | 노드 · 저장 상태 | 클러스터 · HISS 운영자 정책(주소 사용 권한 · 인증서 · 라우트) |
| Backbone 스토어 | 소유자(MFA) | 신뢰된 스토어 → 검증된 패키지 | 보안 공지(D-104 L4) | Services 스토어 원장 |
| Fabric | 플랫폼 운영자 | 엔진 인스턴스 → Claim(연결 자격) | 패키지 이벤트 · 로그(C9 · C10) | Services(설치 · 인스턴스 · Claim · Link · 현재 공급 상태) |
| 어셈블리 | 테넌트 관리자 | 앱 구성: 패키지 + Claim 소비 + 노출 | 진행 · 적합성 결과 | Core(어셈블리 의도 · 승인 · 단계 결과) |
| Governance | Governance 소유자 | 리소스 유형 → 사원 배정 | 배정 · 회수 기록 | Governance 원장 |
| Workspace | 사원 | 앱 사용(게이트웨이 → 엔진 → PG) | 접근 기록 | 게시글은 앱 PG. 게이트웨이는 현재 배정과 Core가 확인한 어셈블리 상태를 요청마다 읽어 판단하고 접근 기록을 남긴다 |

정체 흐름은 따로: Samba AD(사원 원본) → Keycloak(연동 · 토큰) → 회사 관리 콘솔 · Workspace · 게이트웨이. Core는 테넌트 쪽 승인을 이 테넌트 발급자로만 받는다(v0.2 §8, X9).

## 1. 두 단계

| 단계 | 어디서 | 신뢰 | 언제 |
|---|---|---|---|
| **PoC-A** | 운영 RKE2의 **격리 namespace**(V1과 같은 방식) · 일회용 Services/Core DB · 시험 Auth | **시험 스토어 · 시험 키**(MS7a 격리 레지스트리) | 지금(소유자 결정) |
| PoC-B | 운영 설치본, 실제 도메인 | Universe 운영 키(MS7b) | MS7b · P2 뒤 |

**재빌드 0회 합격 조건.** 시작 전에 Core · Console · 실행부 · 웹훅 · Setup · 계약 · 승인 정책 · 이행 표지, 허용 DNS 이름, 노출 어댑터와 공급 범위를 고정한다(이미지 digest · 정책 지문). S1~S9 동안 바뀌는 것은 서명된 패키지와 승인된 원장 데이터, 그리고 그 계획이 만든 어셈블리별 리소스 · 라우트 · 원장 행(효과 영수증)뿐이어야 한다. 합격에 필요한 호스트 수정이 드러나면 멈추고 X 단위에서 고친 뒤 **고정 기준선부터 다시** 돌린다. 인도 코드 · Claim 자격 · 토큰은 캡처와 로그에 남기지 않는다.

**PoC-A 주소(D-105 P-4).** 같은 깊이 이름 `poc-a-id` · `poc-a-admin` · `poc-a-workspace` · `poc-a-board`.dev.opensphere.co.kr. 기존 와일드카드 A(`*.dev.opensphere.co.kr` → 175.45.161.138)로 이미 응답하므로 DNS 요청이 필요 없다(2026-11-26 확인). 인증서는 **운영 `dev-opensphere-tls` · `PIN.hosts` · TLSStore를 바꾸지 않고** 격리 namespace의 별도 HTTP-01 작업 · Secret으로 받는다(스테이징 CA 먼저 → 운영 CA, 80의 확인 경로도 격리 객체). 확인 경로는 격리 namespace의 `IngressRoute`(`web`)로, 규칙을 네 호스트의 `/.well-known/acme-challenge/`로 한정하고 우선순위 **1100**을 명시한다. 운영 `acme-http01`(1000) · `http-to-https`(1)는 그대로 공존한다(Codex 대조, Traefik v3.7 우선순위 규칙). 다단계 이름(`id.poc-a.dev…`)은 현재 HTTP-01 규칙 · SAN 목록이 보장하지 않아 쓰지 않는다. 사용자가 보는 결과는 v0.2와 같이 **플랫폼이 낸 HTTPS 주소**로 브라우저에서 연다(port-forward 금지).

## 2. 시나리오와 상태(2026-11-26, 코드 · 운영 대조)

| # | 단계 | 만드는 방법(v0.3) | 지금 | 검증 증거 |
|---|---|---|---|---|
| S0 | 입구 · 주소 · TLS | v0.2 §2(운영 VIP · Traefik · ACME). PoC-A는 §1 주소 | **운영 입구 기반 있음**(`kube-system/rke2-traefik` VIP 80 · 443, `os-hiss-edge-tls` ACME · 리다이렉트 · 기본 TLSStore). **PoC-A 주소 · TLS · 라우트 미구성** | 운영 11-21 증거와 PoC-A 새 주소의 브라우저 증거를 따로 |
| S1 | 스토어 신뢰 | MS4로 시험 스토어 적재(실제 Setup MFA) | **격리 완료 · 운영 전환 전.** MS4 실제 MFA 적재 · MS7a 시험 왕복 있음. 운영은 스토어 0 상태(A-5 전제), Universe 입점은 MS7b | 적재 영수증 |
| S2 | Fabric 패키지 | PG 새 판(`operator-cr/1` · A2UI), Keycloak 새 판(verified DB · `verify-full` · 두 Claim 소비), **Samba AD 새 판** | **PG 새 원형 · 패키지 원천 · 격리 실증 있음.** Keycloak 26.8.2 레거시 그룹이 새 PG Claim으로 JDBC `verify-full`을 **격리에서** 검증. 운영 `opensphere-auth`는 레거시 경로의 `sslmode=require`(PG CA 볼륨 없음), 운영 `board` · `main` · `opensphere-auth-db`는 레거시 설치 ID, 운영 Samba `opensphere`는 Ready 레거시 DC. **Keycloak · Samba 새 실행 part 없음** | 설치 승인 · 인스턴스 Ready · CA 기록 |
| S3 | 회사 만들기(Genesis) | §2.1의 세 계획(AF-I6 계획 엔진) | **공급 서비스 묶음 · realm 골격 있음, Genesis 미구현.** Ready PG → DB Claim → 디렉터리 Claim → Keycloak 묶음과 realm 역할 · OTP 정책 · WRITABLE LDAPS 코드는 재사용 가능. 회사 · 핵심 어셈블리 원장, G1~G7 계획, 인도 코드 · 부트스트랩 봉인, 테넌트 발급자 등록은 남음. 현재 realm 생성물에 Genesis 클라이언트 · 초기 사용자 없음 | 계획 digest · 단계 영수증 · 관측값 |
| S4 | 회사 관리 콘솔 · Workspace · 게이트웨이 | 테넌트 면 앱 패키지 `tenant-portal`(두 모드) — X6 원형으로 설치, X7 노출 단계가 주소를 냄. **Genesis G5 · G6 단계로 센다**(S3c 안) | **입구 인프라 있음, 테넌트 제품 경로 미구현.** 운영 `backbone-execution-gateway` · 터미널 게이트웨이는 관리 경로. 회사 관리 콘솔 · Workspace · 앱 프록시 · 테넌트 OIDC 세션 필요 | `poc-a-admin.` · `poc-a-workspace.` HTTPS, MFA |
| S5 | 게시판 어셈블리 | 정의 → 계획 → PG Claim 소비(X2) → 노출(게이트웨이 뒤) → 적합성 시험 → Active. **테넌트 발급자 승인만**(S3c 뒤) | **정의 검사 · PG 공급 · 두 패키지 연결 골격 있음, 실행 가능한 게시판 어셈블리 미구현.** `assembly-definition/v1`과 실질 판정은 있음(`members` · `composition.claims` 중심). 운영의 같은 이름 PG · REST Service는 패키지 게시판의 증거가 아님(v0.2 V1은 수동 게시판 철거 이력) | Active, 글쓰기 · 읽기 |
| S6 | Governance 인계 · 배정 | Active 때 리소스 유형 인계, 배분 구역에서 배정 | 디렉터리 공급 · realm 역할 골격만, 인계 · 배정 원장 미구현 | 배정 기록(부여자 ≠ 대상) |
| S7 | 사원 사용 | AD 계정 로그인 → 타일 → 게이트웨이(세션 · 배정 · Active) → 앱 | 미구현 | 플랫폼 주소로 열림 |
| S8 | 회수 | 배정 회수 → 30초 안에 차단, 우회 주소 차단. 인스턴스 Claim 회수와는 별개 | 미구현 | 403 · 직접 주소 거절 |
| S9 | 해체 = **접근 철회 · 데이터 유지**(P-3) | §2.2의 닫힌 해체 계획 | **개별 중단 · 회수 · 삭제 · 내리기 · 복구 있음(X2 연결 해제 재사용), 어셈블리 해체 · 보존 원장 미구현** | 정리 · 보존 영수증 |
| ↑ | 신호 | 패키지 이벤트 → Swallow, 권한 있는 로그 조회, 감사 | **일반 감사 · 이벤트 전달 · 관측 바닥 있음, 패키지 이벤트 · 로그 조회 미구현(C9 · C10).** 1차 완주는 감사만, 2차 완주에서 알림 · 로그(P-2) | 알림 · 로그 · 감사 행 |

### 2.1 S3 Genesis — 승인 시점에 이미 관측된 값만 잠근다

새 Samba · PG의 CA 지문이나 발급자의 첫 JWKS처럼 **승인 뒤에 생기는 값을 계획에 뒤늦게 채우는 것**은 기존 Keycloak 그룹의 사전 고정 규칙을 바꾼다. PoC-A는 그 규칙을 바꾸지 않고 세 계획으로 나눈다. 셋 다 플랫폼 관리자 MFA, 계획 엔진은 AF-I6 하나.

| 계획 | 내용 | 승인 전에 잠그는 것 |
|---|---|---|
| **S3a Fabric 공급** | Samba · PG 인스턴스(플랫폼 운영자) | 정체 · 설치 ID · 번들 · 프로필 · fence |
| **S3b 신원 구성** | Keycloak 인스턴스가 PG `database` · Samba `directory-bind` 두 Claim을 소비(X2b) + realm | S3a에서 **관측된** 두 CA 지문 · 인스턴스 UID |
| **S3b2 발급자 노출** | Keycloak 공개 경로 `poc-a-id` 노출(X7) | S3b에서 **관측된** Keycloak Service UID · 포트 |
| **S3c1 인도 준비** | 테넌트 발급자 등록, `tenant-portal` 설치(G5) | S3b2 노출 뒤 X9가 HTTPS로 **관측한** realm · JWKS · issuer URL |
| **S3c2 인도** | `tenant-portal` 노출(G6, X7), 인도 코드 · 실명 소유자 재로그인 | S3c1에서 **관측된** `tenant-portal` Service UID · 발급자 등록 |

S3 "회사 인도 완료"는 S3c2의 issuer 등록 · 실명 소유자 재로그인 뒤에 기록하고, S5는 그 뒤 시작한다. 단계 사이 관측값이 임의로 바뀌면 다음 계획을 시작하지 않는다. "Genesis MFA 한 번 + 앞 단계 관찰 영수증만 후속 참조로 인정"하는 계약은 **X8b로 PoC-A 뒤**에 따로 승인받는다(새 공급자 생성 단계의 UID · SAN · 허용 공개키 정책을 승인 전 고정).

> **명확화(2026-11-26, X8 구현 중):** X7 노출은 접수 때 이미 Ready인 Service의 UID를 잠근다. 같은 계획에서 새로 만드는 `tenant-portal` Service의 UID를 단계 영수증으로 나중에 참조하는 것은 X8b(PoC-A 뒤)에 해당한다. 따라서 §2.1 규칙(승인 시점에 이미 관측된 값만 잠근다)대로 S3c를 S3c1 · S3c2로 나눈다. 플랫폼 관리자 MFA는 S3 전체에서 세 번이 아니라 네 번이다. P-5의 취지(Genesis MFA 한 번은 X8b로 PoC-A 뒤)는 그대로다. (Codex 질의 #187 → Claude 판단)

> **명확화(2026-11-27, PoC-A 1차 실행 계획 검토):** S3c1이 잠그는 issuer · JWKS는 X9가 공개 HTTPS로 읽어야 관측된다. X7은 접수 때 Ready Service UID를 잠그므로 S3b가 새로 만든 Keycloak을 같은 계획에서 노출할 수 없다. 그래서 S3b와 S3c1 사이에 **S3b2(발급자 노출)** 계획을 둔다. 플랫폼 관리자 MFA는 S3 전체에서 다섯 번이다. 같은 규칙으로 두 가지를 정한다. **S5 노출**은 S3c1에서 이미 관측된 게이트웨이 Service(소유 tenant · 설치 ID · UID · 공개 host)를 S5b 테넌트 계획에 사전 고정한다(어셈블리 노출 자식이 앞 어셈블리의 기존 Service를 가리키는 결합, X8c). **S9 해체**는 §2.2의 순서를 테넌트 MFA 한 번의 닫힌 계획으로 묶는다(라우트 UID 제거 · 소비자 정지 · Claim 회수 · 보존 원장, X8d). Keycloak의 C-3은 §4 표대로 **PoC-A 격리 범위**에 넣는다(C-2와 같은 격리 예외, 운영 사용은 계약 순서대로 P1 뒤). (Codex PoC-A 1차 계획 → Claude 판단)

### 2.2 S9 닫힌 해체 계획

1. 새 배정 · 공개 접근 · 쓰기 차단, 사용자 세션 종료
2. 소비 앱 정지 확인(연결 중 Claim을 먼저 회수하면 X2 사용 중 검사에 걸린다)
3. 이 어셈블리의 Claim · Secret · 망 허용 회수(공유 PG는 이 어셈블리 Claim만, 살아 있는 PG · DB 보존)
4. 라우트 정리, 소유 자산 유지 확인. 전용 PG는 검증된 Retain 경로가 있을 때만 정지 후 보관 볼륨으로 표시하고, 증명하지 못하면 데이터를 가진 DB를 격리한 채 보존한다(StatefulSet 삭제 · SGCluster 삭제는 PVC 삭제를 부를 수 있으므로 회수 정책과 실제 볼륨 UID 확인)

원장에는 보존 책임 주체 · 원 계획과 어셈블리 UID · 원 인스턴스 UID · DB/볼륨 식별자 · 저장 클래스 · 회수 정책 · 확인 시각 · 보존 용량을 남긴다. 실패는 Blocked 또는 unknown이며 남은 공간을 가용량으로 돌려주지 않는다.

## 3. 필요한 호스트 기능(X 단위)

| 단위 | 내용 | 근거 |
|---|---|---|
| **X6 앱 실행 원형 `web-app/1`** | **별도 원형**(`stateful-engine/1`의 무볼륨 변형 아님: 그쪽은 StatefulSet · 인스턴스 Secret · PVC · 데이터 TLS 초기화 · PVC 소멸 관측이 한 묶음). Deployment · 교체 가능한 Pod · 외부 Claim · 준비 판정. 별도 Role · 바인딩 · VAP, 기존 원형 권한을 넓히지 않음. 작성자는 이미지 · 포트 · 검증된 설정 · 슬롯만 선언, 호스트가 Service · 망 · 리소스 한도를 만듦. Pod 토큰 · API 권한 · PVC · 노출 객체 · 클러스터 범위 객체 제외. **초기화는 닫힌 단계**: 별도 승인된 Job 이미지가 지정 DB의 초기화 자격과 공개 CA만 받아 멱등으로 쓰고 완료 후 회수. `engine` 클래스의 호스트 생명주기 · 추가 명령 계약 명시(X5 완화는 지금 `provider`만) | 재사용: 정체 · 범위 · 프로필 · 증거 재판정, namespace 배정, 승인 객체 집합, Core–실행부–웹훅 독립 대조, 소유관계 · 복구 · CA 관측, Claim 투영 |
| **X7 노출 · 로그인 연동** | 호스트 소유 라우트를 **공개 백엔드 Service와 같은 namespace**에: 기본은 호스트 정책이 고른 IngressClass의 namespaced Ingress, Traefik 고유 기능(예: Keycloak 공개 경로 허용 목록)이 필요할 때만 고정 어댑터의 한정 IngressRoute. 전용 SA · 별도 admission이 승인된 hostname · Service · 포트 · entrypoint · owner UID만 대조, 패키지와 일반 원형 실행부는 Ingress 쓰기 없음. `kube-system`은 Traefik 운영 권한만, TLSStore · ACME 자격은 HISS 소유. `board.` 대상은 게이트웨이 namespace의 게이트웨이 Service, 게시판 Service는 게이트웨이에서 오는 포트만 허용. **OIDC 클라이언트는 Keycloak 발급 Claim `oidc-client`**: 소비자별 client · 정확한 redirect URI · audience, 공개 URL이나 패키지 선언으로 redirect 범위 확장 거절, confidential client 자격은 그 소비자 Secret에만 투영, 회수 시 토큰 발급 · 게이트웨이 접근이 각각 막히는지 시험 | 빈칸 5종 중 "외부 노출 · 로그인 연동"(검토 리포트 §2.1-1) |
| **X2b 복수 소비 슬롯** | Keycloak의 `database` + `directory-bind` 동시 소비: 닫힌 복수 슬롯, 공급자별 정체 · Secret · CA · 망, 쌍별 회수 순서를 함께 승인. 실패 사례: 한쪽 Claim이 틀리거나 회수되면 Keycloak 시작 안 됨, 타 설치본 Secret 투영 안 됨. X8과 별도 PR | 지금 `consumes` maxItems 1(main 573c558 확인), 서버는 첫 슬롯만 선택 |
| **X8 어셈블리 계획 단위** | AF-I6 `opensphere.osr-assembly-plan/v1`을 Core가 내는 상위 불변 계획으로. `assembly-definition/v1` 바이트 · 검사는 보존, 전체 패키지 정체를 받는 새 판에서 `requires` · 공급 자리 · 버전 범위 · 용량 · 노출 · 적합성 · 인계 선언. PoC는 순서 고정 짧은 DAG. 해석기는 모호한 공급자 · 순환 · 용량 부족을 계획 단계에서 거절하고 정체 · 설치 ID · 출처 · 번들 · 프로필 · 렌더러 · fence · 기존 UID · 예정 객체 · Claim/Binding/Link ID · (기존 공급자의) CA 지문을 잠금. X2 예약 · 순서 · MFA 결합 · 중단 · 복구와 MS5b 독립 검사 재사용, 하위 계획 단독 실행 불가, 마지막 검증 · 영수증 뒤에만 Active · 인계, 타임아웃 뒤 unknown은 점유 유지 · 명시 복구. X2 그룹 digest와 v1 · v2 경로 유지. Genesis와 업무 어셈블리가 엔진 공유(Genesis는 플랫폼 승인, 업무 어셈블리는 테넌트 발급자 승인) | 지금 X2는 정확히 두 단계 · 한 `consume` |
| **X8c 기존 Service 노출 결합** | 어셈블리 노출 자식이 앞서 Active가 된 같은 tenant 어셈블리의 Ready Service(게이트웨이)를 승인 전 관측값으로 고정. 승인 뒤 채우기 없음 | §2.1 명확화(S5) |
| **X8d 닫힌 해체 계획** | §2.2 순서를 한 부모 계획으로: 새 배정 · 공개 접근 차단 → 소비자 정지 확인 → Claim · Secret · 망 회수 → 라우트 UID 제거 → 보존 원장 | §2.2 |
| **X8b 단계 영수증 참조**(PoC-A 뒤) | §2.1의 Genesis MFA 한 번 계약 | §2.1 |
| **X9 테넌트 발급자** | 승인 입구를 기존 `/otp`와 분리하고 Core p7 재확인 · 예약 · 감사 체계 재사용. Genesis가 tenant UID · issuer URL · 허용 JWKS 출처 · 알고리즘 · 세대를 등록. 주체 = 서버가 검증한 `(tenant UID, issuer, sub)`, audience · 클라이언트 · 역할 · `acr` · `auth_time` · 만료 · 발급자 상태 확인. Core 일회 챌린지를 주체 · 세션 · tenant UID · 계획 digest · 만료에 묶어 승인 트랜잭션에서 소비. 원문 토큰은 원장 · 감사에서 제외. Nexus 테넌트 전용 판정 plane · 고정 typed action. 테넌트는 승인된 공급 범위 안의 조립만, Fabric · 스토어 정책은 플랫폼 역할. **D-102 위임 계정은 Genesis · 승인 불가**. 차단 사례: 다른 issuer의 같은 `sub`, 다른 audience · 계획, 승격 · 회수된 역할, 관리 토큰의 테넌트 승인, 테넌트 토큰의 Fabric 승인 | 지금 Core는 Backbone Auth 한 곳의 HS256 · `authenticated`만, Nexus는 Console 관리자 세션 기준(B-1) |

## 4. 패키지(PoC-A, 시험 키)

| 패키지 | 원형 | 비고 |
|---|---|---|
| PG 새 판 | `operator-cr/1` | 운영 B단계 판과 같은 원천 |
| Keycloak 새 판 | `stateful-engine/1 + C-3`(승인된 모듈 명세 기본) | 두 Claim 소비(X2b), realm 가져오기, `oidc-client` Claim 발급. X6 설계 메모에서 `web-app/1` 적합성을 비교하고, 옮기는 편이 낫다면 그때 소유자 결정(명세 변경) |
| Samba AD 새 판 | `stateful-engine/1` | P-1: non-root 격리 스파이크부터, `ldaps` 상위 포트 1636(C-2) |
| `tenant-portal` | X6 | 회사 관리 콘솔 · Workspace · 게이트웨이, 테넌트 면 제품(Backbone 소스 아님, B-1 · B-2) |
| `notice-board` | X6 | 앱 자체 HTTP 서빙 + PostgREST, 자기 사용자 관리 없음, 스키마 · 권한 초기화는 X6 닫힌 단계 |

## 5. 증거(영수증)와 합격 항목

각 단계: 계획 digest · 승인(MFA) · 실행부 영수증 · 대상 UID · 기대값 · 실제값 · 검증 못 한 범위. 마지막에 Backbone 빌드 전후 비교와 격리 정리 영수증. 브라우저 캡처(1440 · 390): 회사 관리 콘솔 · Workspace · 게시판 · 403 화면. 추가로 합격에 넣는 것:

- **실제 Console 경로 회귀:** 계획 → MFA → 인스턴스 · Claim 시작을 Console에서(V1에서 드러난 v2 정체 결함 MS5c와 같은 공백 방지). 구성 단위 검증만으로 합격 처리하지 않는다. X1 읽기 명령 범위와 X5 provider 한정도 Keycloak · Samba · 앱 생명주기에서 따로 확인
- **외부 브라우저 기준 입구:** HTTPS, 틀린 호스트, Keycloak 관리 경로 차단, 쿠키 경계, 앱 직접 경로 거절
- **게이트웨이:** 관리자 · 사원 두 주체, 자기 배정 거절, Live · Active 판정, 배정 전 · 회수 후 403, 다른 tenant/assembly 캐시 격리, 조회 장애 때 만료 허가 재사용 금지, 외부 신원 헤더 제거 · 검증된 신원만 새로 씀, 게시판 작성자 · DB 역할은 서버가 정함, 워크로드 세션 · 장기 연결도 회수 기한 적용
- **Samba(P-1):** UID 1000 이상 · capability 없음 · 준비 PVC · 읽기 전용 rootfs에서 첫 기동 · 재시작, 승인된 DNS의 LDAPS, 할당 OU 사용자 생성 · 비밀번호 변경 성공과 다른 OU · 관리 작업 거절, 해제 뒤 같은 bind 거절. 운영 Secret 리더 대신 승인된 Job의 닫힌 효과 경로. 직접 DB 파일 쓰기나 인스턴스 전용 특권 Job은 합격으로 인정하지 않음
- **게시 경계(MS7b 전 확인):** `productionExecutionRenderers` 관문이 MS7b 보호 게시 진입점과 S2 운영 게시 조건에도 같은 렌더러 승인 · 프로필 · Job 이미지 정책으로 걸리는지(지금 MS7a v2 게시 함수는 그 관문을 직접 부르지 않음). PoC-A는 시험 게시 유지

## 6. 그대로 두는 것(v0.2)

§1 완료 기준(사람이 하는 일 1~9), §2.2 주소 이름(PoC-B), §3의 Samba · Keycloak 최소판 원칙(Administrator 비밀번호를 내보내지 않음, Keycloak Operator 안 씀, 관리 콘솔 차단), §4 Genesis 단계 G1~G7 · 부트스트랩 계정 · 인도 코드는 소유자 터미널에서만, §6.3 게이트웨이 확인 셋, §7 두 모드 · 권한 분리, §8 승인, §9 인계 · 배정, §10 최소판 한계.

## 7. 결정 항목(D-105, 권고대로 승인)

| # | 질문 | 합의 권고 |
|---|---|---|
| **P-1** | Samba AD 새 판(원형)을 언제 | **PoC-A에 포함, 격리 non-root 스파이크부터.** C-2(`ldaps` 연결 원천 · LDAP 기능 판정)는 선행, 우선 상위 포트 1636으로 원형의 1024 하한 유지(테넌트 명세가 고정 636을 요구하면 그때 포트 계약 추가). C-8(capability)은 non-root 시험이 실패해 근거가 생기고 소유자가 운영자 서명 프로필 범위를 승인할 때만. **기존 C-2 · 조건부 C-8 · E7b 순서에 대한 PoC-A 격리 예외**로 적고, 운영 레거시 Samba 이행(E7b)은 그대로 P1 뒤. Keycloak 복수 슬롯(X2b)과 Keycloak 원형 기본값(§4)도 이 결정에 함께 기록 |
| **P-2** | 순서 | **MS5c → V1 재실증**(G1은 병행, PoC-A의 선행 조건 아님) → **병행 준비**[S0 격리 주소 · TLS, Samba C-2 스파이크, X6, X2b] → **X7 · X8 · X9** → 기준선 고정 → **PoC-A 1차 완주**(S0–S9, ↑는 감사) → **H3 · C9 · C10** → 기준선 재고정 → **PoC-A 2차 완주**(알림 · 로그 합격 포함, 최종 합격 영수증) → TLS · S3(레거시 화면 정리, PoC-A 선행 아님) → P1 → P2. 공통 호스트 변경이 V1 · G1과 겹치면 각각 별도 PR |
| **P-3** | 해체 때 데이터 | **PoC-A의 S9 = 접근 철회 · 데이터 유지**(§2.2). D-104 Archive(L1 `dataLifecycle` 계약, 사전 승인된 반출 대상 · 형식 · 암호화 키 참조 · 보존 책임, 산출물 digest · 크기 · 읽기 검증 영수증 뒤 원본 정리)는 **당기지 않고 D-104 순서대로**. L2(되돌릴 수 없는 이행 직전 보호 스냅숏)는 해체 선행 조건이 아님. D-33 업무 데이터 Purge는 별도 Governance 결정, D-96 운영 전환 · 격리 합성 데이터 정리와 섞지 않음. D-104의 "인스턴스 삭제 기본값 = 삭제"는 직접 삭제에만 적용 |
| **P-4** | PoC-A 주소 · 인증서 | §1: `poc-a-id` · `poc-a-admin` · `poc-a-workspace` · `poc-a-board`.dev.opensphere.co.kr(DNS 요청 불필요), 인증서는 격리 namespace의 별도 HTTP-01 작업 · Secret(운영 HISS 객체 변경 없음, 스테이징 CA → 운영 CA). 운영 CA 인증서는 공개 CT 로그에 이 네 이름이 남는다 |
| **P-5** | PoC-A Genesis 승인 횟수 | §2.1: **세 계획(S3a · S3b · S3c), 각 플랫폼 관리자 MFA.** "Genesis MFA 한 번"은 X8b로 PoC-A 뒤 |
