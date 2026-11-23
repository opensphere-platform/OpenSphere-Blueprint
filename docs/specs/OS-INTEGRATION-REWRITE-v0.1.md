# OS 통합 — 패키지만으로 확장되는 Backbone 재작성(v0.1)

**상태:** 소유자 결정(2026-11-23, D-95)
**작성:** 2026-11-23 · Claude
**역할:** 정의 · 검수 · 운영 반영 · 전체 진행은 Claude, 구현은 Codex, 결정은 소유자다(소유자: "너는 정의하고 구현은 코덱스가 맡는다").
**기준 코드:** Backbone main 0aec0e3. 검수 중인 PR은 176 · 177이다.

**이 문서가 바꾸거나 잇는 것**
- D-92: 단계 순서를 이 문서 §6으로 바꾼다. Q2 · Q3을 개정한다.
- D-94(E2a v0.2)는 그대로 쓴다.
- D-89 · D-90 · D-93(레이어)과 D-87 · D-88(HISS)을 잇는다.

## 0. 기준(소유자 원칙)

> 윈도우에 프로그램을 설치한다고 윈도우의 어떤 부분도 재빌드하지 않듯이, Backbone은 Backbone 자체 문제가 있을 때만 다시 빌드 · 배포한다.

**합격의 정의:** 새 패키지를 GHCR에 게시하고, 스토어에서 설치 · 갱신 · 내리기 · 회수할 때 다음이 **0회**여야 한다.
- Backbone(Core · Console · 실행부 · 승인 웹훅) 이미지 교체
- Console 재빌드
- 원장 이행
- ClusterRole · CEL 정책 · 웹훅 · 역할 배치 변경
- CLI 재배포
- 지식 묶음 재빌드
- Setup 변경

설치 전 설명부터 설치 후 화면 · 명령 · CLI · 매뉴얼 · 지식 · 실행 · 상태까지 모두 패키지에서 온다.

**OS 통합(OS Integration):** 패키지가 설치되면서 OS의 여러 면에 합류하는 것 전체를 이렇게 부른다. 각 면은 "통합 지점"이다.

| 통합 지점 | 패키지 part | 상태(0aec0e3) |
|---|---|---|
| 스토어 설명(설치 전) | `listing`(새), `manual` | 이름 · 한 줄 설명만 보인다 |
| 메뉴 · 화면(설치 후) | `extension`, `static`(UI 모듈) | 메뉴 · 개요 · 목록만 선언형이다. 세부 13탭과 Samba · Keycloak · PostgreSQL 화면은 내장이다 |
| OS Shell 명령 | `commands` | 검증 · 저장만 한다. Shell 명령 목록은 `contracts.rs`에 고정돼 있다 |
| CLI | (Shell 계약을 읽음) | Shell에 패키지 명령이 없다. 일부 명령은 CLI에 박혀 있다 |
| 매뉴얼 | `manual` | 저장만 한다. 화면에 없다 |
| 지식(R2D2 · MCP) | `knowledge` | 지식 서비스는 컴파일된 `pack.json`만 쓴다 |
| 실행(설치 · 인스턴스 · 연결 · 상태) | `execution`(D-94) | 서비스마다 Rust · SQL · 매니페스트 코드가 있다 |

**Backbone(OS)으로 남는 것 — 이것이 바뀔 때만 재빌드한다**
- Core: 승인 · 계획 · 원장 · 정책
- 판정기
- 실행 원형과 원형 렌더러
- 실행부 · 승인 웹훅
- Console 껍데기: 레일 · 섹션 · 화면 틀 · 스토어 틀 · UI 모듈 격리와 다리 · MFA
- OS Shell 계약 · CLI 실행 파일
- 지식 서비스 엔진
- Setup
- 제품 자체의 문서 묶음

새 원형 · 새 화면 틀 · 새 다리 기능은 "운영체제 갱신"이다.

## 1. 결정(D-95)

| # | 결정 |
|---|---|
| D95-1 | §0 기준을 합격의 정의로 삼는다. 이 기준에 못 미치는 모든 요소를 재작성한다(§3~§5) |
| D95-2 | 이름은 **OS 통합**이다. 통합 지점은 스토어 설명 · 메뉴 · 화면 · Shell · CLI · 매뉴얼 · 지식 · 실행이다 |
| D95-3 | 패키지 정보의 출처는 **같은 digest의 서명된 번들뿐**이다. GitHub 등 외부 웹 정보는 쓰지 않는다. 패키지 저장소는 **GHCR 하나**다 |
| D95-4 | 설치 전: 새 `listing` part와 `manual`을 고정된 스토어 상세 틀에 그린다. 권한 · 객체 · 자원 · 호환 · 서명자는 패키지가 주장하는 값이 아니라 **호스트가 계산해** 보인다. 카탈로그를 받을 때 그 항목의 번들을 모두 받아 등록한다 |
| D95-5 | 설치 후: 선언형 틀(세부 탭 틀 추가)을 쓰고, 틀에 맞지 않는 화면은 **서명된 패키지 UI 모듈**로 가져온다. UI 모듈은 격리 프레임에서 돌고, 정해진 다리로만 호스트와 말한다(새로 허용) |
| D95-6 | 패키지 실행 코드(연결 발급 · 회수 Job, 운영 명령 Job, 필요하면 컨트롤러)를 **D-92 §3.3 조건 아래 허용한다**(D-92 Q2 개정). 조건은 별도 승인 · 최소 권한 · 데이터 PVC 금지 · 소비자 Secret은 호스트가 씀 · 호스트가 효과 확인 · 회수된 패키지의 Claim을 패키지 코드 없이 끊음이다 |
| D95-7 | Samba AD · Keycloak도 패키지로 옮긴다(D-92 Q3 개정). 운영 디렉터리 · 그룹 연동 보존이 합격 기준이다 |
| D95-8 | Backbone 내장 Gitea(`os-backbone-system/backbone-gitea`)를 Backbone 설치본에서 빼고, **Fabric › 배포 묶음의 스토어 패키지**(Git 저장소)로 만든다. Console의 고정 Gitea 어댑터는 걷어 낸다. 옛 사본(커밋 274, 2026-11-15)은 보관 기록 후 정리한다. 개발 저장소(`os-backbone-development/development-source`)는 제품 범위 밖이고 그대로 둔다 |
| D95-9 | 다음 차례의 범위는 **코드 + 격리 설치본 전체 검증**이다. 운영 전환은 그 뒤 Backbone 마지막 갱신 1회 + 서비스별 소유자 승인으로 한다 |

## 2. 공통 규칙(모든 단위)

- **보안 경계는 줄이지 않는다.**
  - 승인 대조는 그대로다. Core가 신뢰하는 원형 · 프로필에서 쓰기 목록을 독립적으로 계산하고 정확히 맞춘다.
  - 원장 기록, MFA, idempotency, 예약 · 점유 · 복구도 그대로다.
  - 패키지가 낸 값은 언제나 닫힌 형식으로 판정한다.
- **두 판정기:** 패키지 문서의 새 형식은 Node · Rust 판정기 · Setup 봉인 사본 · 공유 사례 파일 · 계약 벡터를 함께 낸다(E2a-1과 같은 방식).
- **원장:** 이미 적용된 이행 원본 · 해시는 그대로 둔다. 일반화는 새 이행으로 하고, 옛 함수는 운영 전환이 검증될 때까지 남긴다.
- **운영 금지:** 운영에 반영하지 않는다.
  - 격리 설치본 · 시험 DB · 시험 키 · 시험 프로필만 쓴다.
  - 격리용 클러스터 범위 이름(namespace · ClusterRole · 웹훅 · 정책)은 운영과 겹치지 않게 짓는다. 운영 객체를 고치지 않는다.
  - E3 전까지 운영 대상 게시 차단(D-94)을 유지한다.
- **PR 규칙**
  - 단위마다 PR 하나를 main 대상으로, 최신 main 위에서 연다. 앞 단위에 기대면 그 PR이 병합된 뒤에 연다.
  - PR 본문에 합격 기준 표와 증거(시험 수, 격리 영수증, 캡처)를 남긴다.
- **멈추고 묻는 경우:** 설계가 이 문서와 맞지 않거나 보안 경계를 줄여야만 될 때만, 고치기 전에 채널로 묻는다. 그 밖에는 정해진 순서대로 계속 진행한다.
- **엔진 분기 금지:** 엔진 이름으로 분기하는 호스트 코드를 새로 넣지 않는다. 옛 분기는 이행이 검증된 단위에서 지운다.

## 3. 통합 지점별 정의

### 3.1 스토어 설명 — `listing` part(I3)

```json
{ "schema": "opensphere.store-listing/v1", "module": "…", "version": "…",
  "summary": "≤140자", "description": "markdown ≤16KiB", "releaseNotes": "markdown ≤8KiB",
  "icon": "<Carbon 아이콘 이름(catalog.json 안)>",
  "screenshots": [{"file": "screens/1.webp", "caption": "≤80자"}],
  "links": [{"label": "…", "url": "https://…"}] }
```

- **스크린숏:** 최대 5장, 각 1MiB 이하의 webp · png다. 불투명 part `listing-media`(색인 + 묶음, `static`과 같은 방식)로 낸다. 판정기의 "불투명 허용 목록"에 넣는다.
- **markdown:** 호스트가 안전하게 정리한다. HTML · 스크립트 · 외부 이미지를 뺀다. 링크는 https만 글자 링크로 둔다.
- **호스트가 계산해 함께 보이는 사실**
  - 레이어 · 묶음, 의존성, 원형
  - 만들 객체 kind와 개수 한도, 받을 권한(프로필 rbac · capabilities), 저장 방식
  - 호환 판, 서명자 · digest, 매뉴얼 목록
- **카탈로그 등록:** 카탈로그를 받으면 carrier가 각 항목의 번들을 GHCR에서 받아 등록한다. 등록에 실패한 항목은 "등록 실패: <사유>"로 보인다. "listed"(설명 없음) 상태는 받는 중일 때만 생긴다.
- **스토어 상세:** 스토어 상세 화면(Console 틀)에 탭을 둔다: 개요(listing) · 매뉴얼(문서별) · 권한과 자원(호스트 계산) · 판 기록.

### 3.2 매뉴얼(I3)

- 설치 전에는 스토어 상세의 "매뉴얼" 탭에서 본다.
- 설치 후에는 그 패키지 섹션 화면의 "도움말"(보조 탐색 맨 아래)에서 본다. **활성 판**의 `manual`을 쓴다.
- 문서 종류(overview · install · operations · troubleshooting · commands)는 지금 스키마 그대로다.

### 3.3 지식(I4)

- 지식 서비스는 두 원천을 합쳐 쓴다.
  - 컴파일된 제품 묶음(`pack.json`, 제품 문서 — OS의 일부)
  - **활성 설치본의 `knowledge` part**(원장)
- 활성화하면 합류하고, 내리기 · 회수하면 빠진다. 다시 시작하지 않아도 반영된다. 원장 변경 알림을 받거나 짧은 주기로 판을 대조한다.
- 결과마다 출처를 남긴다: 모듈 · 판 · bundleDigest · part digest · authorityTier.
- 패키지 지식은 제품 묶음보다 높은 권위를 갖지 않는다.
- MCP(`opensphere_knowledge`)도 같은 결과를 낸다.

### 3.4 OS Shell · CLI(I1 · I2)

- **Shell 명령 목록** = 호스트 명령(지금 `contracts.rs`) + **활성 설치본의 `commands`**
  - 명령 id는 모듈 이름으로 시작한다(지금 형식 `provider.opensearch.status`).
  - 권한은 명령의 `requiredPermissions`이 프로필 `capabilities` 안에 있을 때만 생긴다.
- **실행 경로:** 지금 Shell 계약 그대로 Core `p1.accept` → 정책 → (변경이면) 승인 · MFA → 실행부를 지난다.
- **실행 주체**는 둘 중 하나다.
  - `archetype`: 원형이 주는 일반 동작. 예: 상태 · 설치본 확인.
  - `package-job`: 실행 문서의 `jobs`에 선언한 패키지 Job(§3.6).
  - 명령 문서에 `run: {"via": "archetype" | "package-job", "job": "<id>"}`를 더한다. owner-commands의 다음 판 스키마다.
- **결과:** 명령의 `output` 스키마로 판정한다. 64KiB 이하다. 영수증 계약은 그대로다.
- **CLI:** CLI는 Shell 계약을 동적으로 읽어 명령을 만든다. CLI에 박힌 모듈별 명령은 지운다. 호스트 명령의 편의 별칭만 남긴다. 새 패키지 명령은 CLI 재배포 없이 `os <module> <command>`로 나온다.

### 3.5 화면 — 세부 탭 틀(S1) · UI 모듈(S2)

**세부 탭 틀 `fabric.instance-detail`(S1)**
- 인스턴스 세부를 선언으로 그린다. 탭 목록, 탭마다 블록(사실 표 · 표 · 추이 차트 · 이벤트 목록 · 동작 단추), 블록마다 데이터 원천을 적는다.
- **데이터 원천은 닫힌 목록이다**
  - 호스트 일반: `instance.summary` · `instance.status` · `instance.events`(그 인스턴스 객체의 Kubernetes 이벤트) · `instance.claims` · `instance.plans`(계획 · 감사) · `instance.storage`
  - 관측: `instance.metrics`. 확장 선언에 지표 id와 PromQL 틀을 둔다. 호스트가 `namespace` · 인스턴스 라벨을 **강제로 주입**하고, 다른 라벨 선택자 · 하위 질의는 거절한다. 관측 바닥은 HISS kube-prometheus-stack이다.
  - 패키지: `command:<읽기 명령 id>`. §3.4의 읽기 명령 결과다.
- **동작 단추**는 Shell 명령 id를 부른다. 변경 명령이면 호스트가 확인 · MFA를 띄운다.
- PostgreSQL 13탭이 이 틀로 같은 질문에 답해야 한다(X3 합격 기준). OpenSearch · RustFS 세부도 이 틀로 옮긴다. 내장 13탭 · `nativeInstanceSlugs`는 지운다.

**패키지 UI 모듈(S2)**
- **배포:** 서명된 `static` 묶음(지금 `ui.console-static` 방식)을 provider · engine · delivery · hiss 클래스에도 허용한다. 확장 선언의 화면 항목에 `kind: "module"`, `entry`(묶음 안 경로)를 적는다.
- **격리**
  - Console이 `/osr-ui/<bundleDigest>/…`로 내려준다.
  - `<iframe sandbox="allow-scripts">`이고, `allow-same-origin`은 없다(불투명 출처). 응답 헤더 CSP는 `sandbox allow-scripts; default-src 'none'; script-src 'self'; style-src 'self'; img-src 'self' data:; connect-src 'none'`다. `unsafe-eval` · `unsafe-inline` · 외부 출처는 금지다.
  - 쿠키 · 저장소 · 토큰에 닿지 않는다.
- **다리**는 `postMessage`이고, 메시지 형식은 닫혀 있다.
  - `data.read(source, params)`: §3.5의 데이터 원천 중 확장 선언에 적은 것만
  - `command.request(id, args)`: 확장 선언에 적은 명령만. 확인 · MFA는 호스트 화면이 띄운다.
  - `navigate(path)`: 자기 섹션 주소만
  - `theme.get()`: Carbon 토큰
  - `ready` · `resize`
  - 호스트는 메시지를 모두 판정하고, 결과만 돌려준다.
- **자산과 세션(2026-11-23 보충):**
  - 격리 프레임의 요청에는 세션 쿠키가 실리지 않는다. 그래서 UI 모듈의 정적 자산은 **세션 없이** 내려준다. GHCR에 공개 게시된 서명 묶음이라 비밀이 아니다.
  - 내려주는 조건은 다음과 같다.
    - 활성 · 미회수 설치본의 `/osr-ui/<bundleDigest>/<색인 경로>`만
    - 색인 sha256 · 크기 · 형식으로 검증
    - 헤더: nosniff, 번들 경로로 좁힌 CSP, `Cross-Origin-Resource-Policy: same-origin`, digest 기준 immutable 캐시
    - 세션 · CSRF 미들웨어와 분리한 경로
  - `script-src 'self'`는 같은 출처의 다른 경로를 허용하므로(Chrome 확인) 번들 경로로 좁힌다.
  - 데이터 · 명령은 상위 Console이 다리 메시지를 판정해서 부른다.
- **실행부 권한(E2b, 2026-11-23 보충):**
  - 원형마다 고정된 ClusterRole(OS의 일부)을 둔다. 실행부는 그 ClusterRole에 대한 `bind`만 갖는다(`escalate` 금지).
  - 설치 때 패키지 namespace에 RoleBinding을 만든다. 프로필 `rbac`은 원형 ClusterRole의 부분집합이어야 한다.
  - 망은 패키지 namespace 쪽 설치 때 NetworkPolicy와 실행부의 라벨 기반 일반 egress로 표현한다.
  - CEL은 namespace 라벨 기준으로 바꾼다.
  - 새 원형만 ClusterRole을 늘린다(OS 갱신).
- **시험:** 악성 모듈 사례를 둔다(쿠키 접근, 상위 창 접근, 외부 요청, 선언 밖 원천 · 명령, 큰 메시지). 모두 막혀야 한다.

### 3.6 실행 — 원형 + 패키지 Job(E2a-2 · E2b · E3 · E4 · E5 · E7)

- 원형과 판정은 D-94(E2a v0.2)를 따른다.
- **패키지 Job**(D95-6)은 실행 문서에 `jobs`로 선언한다.

```json
"jobs": [{ "id": "claim-issue", "image": "<프로필 jobImages 중 하나의 이름>",
  "args": ["issue", "${claim.name}"], "timeoutSeconds": 120,
  "resources": {"limits": {"cpu": "500m", "memory": "256Mi"}},
  "reads": ["engine-auth"], "network": ["instance"] }]
```

- **이미지:** 프로필 `jobImages`(digest 고정)에서만 온다. 이 목록은 **별도 승인 대상**이다. 패키지 서명만으로는 쓸 수 없다. 운영자가 신뢰 맥락에서 승인한 프로필 판이어야 한다.
- **권한**
  - 패키지 namespace 안의 Role(프로필 `rbac`)만 받는다. 서비스 계정 토큰은 그 Role 범위다.
  - 데이터 PVC를 마운트하지 않는다. 읽을 수 있는 Secret은 `reads`에 적은 것(엔진 자격)뿐이다.
  - 망은 `network`에 적은 대상(그 인스턴스 Service)뿐이다. 실행부가 설치본마다 NetworkPolicy로 만든다.
- **결과:** Job은 정해진 결과 JSON(종료 코드 + 64KiB 이하 출력)만 낸다. **소비자 Secret은 실행부가 쓴다.**
- **효과 확인:** 성공 판정은 Job 종료 코드에 더해 **호스트가 확인한다.** 실행 문서에 `verify` 읽기 Job을 두고, 호스트가 그 결과를 Claim 기대값과 대조한다. 예: 새 자격으로 로그인 성공, 회수 뒤 거절.
- **회수된 패키지:** 패키지 코드 없이 끊을 수 있어야 한다. 소비자 Secret 삭제 + NetworkPolicy 차단 + 원장 Claim 종료를 호스트가 한다. 엔진 안의 자격 정리는 다음 활성 판이 할 수 있을 때 하고, 그때까지는 "정리 대기"로 보인다.
- **Claim 종류의 일반화**
  - 실행 문서 `claims`에 종류를 선언한다. 항목은 kind, issue · release · verify Job, 소비자 Secret 키 목록이다.
  - 원장 `claims.kind`의 고정 CHECK는 새 이행에서 "활성 설치본이 선언한 종류"를 대조하는 판정으로 바꾼다.
  - 선언형 화면의 동작 종류(`actionProfiles`: database · index · bucket)도 패키지 선언에서 온다.
- **승인 경로 일반화(E2b)**
  - core 018 `p7.accept` · `p7.admission_deleting`, core 019 복구, Services 원장의 서비스별 함수(이행 009~020), 실행부 매니페스트를 바꾼다.
  - 매니페스트는 프로필별 ClusterRole · 엔진 namespace 고정 CEL · 고정 egress 포트를 쓰지 않는다. 대신 설치본 라벨 기반의 일반 규칙 + 설치 때 만드는 namespace 범위 Role · NetworkPolicy를 쓴다.
  - 결과적으로 새 패키지가 RBAC · CEL · 웹훅을 바꾸지 않아야 한다.
  - 판 혼재 · 되돌리기 시험은 D-92 E2b 합격 기준 그대로다.

### 3.7 Gitea 패키지(G1)

- **패키지:** `delivery.gitea`(class `delivery`, 평면 `fabric-delivery` → Fabric › 배포 묶음)
- **형태:** `stateful-engine` + 패키지 Job이다.
  - DB는 **PostgreSQL 패키지의 database Claim**을 쓴다. 패키지 사이 의존성을 실증하기 위해서다. 의존성은 디스크립터 `dependencies`에 적고, 설치 계획이 확인한다.
  - Actions 실행기는 이번 범위가 아니다. 특권 컨테이너가 필요해서 금지이고, 따로 정한다.
- **화면:** 저장소 목록 · 조직 · 사용자 · 백업이다. 선언형 + 세부 탭, 필요하면 UI 모듈로 그린다.
- **Shell 명령:** `delivery.gitea.repo.list` 등
- **Backbone에서 걷어 낼 것**
  - Setup `runtime-templates.json`의 `backbone-gitea` 객체들
  - Core 환경변수의 Gitea 주소
  - `adapters.rs` GiteaRead와 `/console-api/adapters/gitea`
  - Console 화면
  - `features::git` 소비자 전부(먼저 목록을 만들어 PR에 남긴다)
- **운영의 옛 Gitea 정리**는 D95-9에 따라 운영 전환 단계에서 소유자 승인으로 한다. 먼저 저장소 묶음과 DB 덤프를 보관한다.

### 3.8 HISS(H3 · H3b)

- HISS 구성 계획 v0.2(D-88) §9의 H3 · H3b를 이 규칙으로 한다.
  - HISS 화면 · 명령 · 매뉴얼도 `hiss` 패키지의 OS 통합으로 온다.
  - HISS 고권한 실행은 `hiss` 전용 실행부 · 웹훅이다(같은 승인 대조).
- Setup은 같은 패키지로 부트스트랩한다. Setup에 HISS 구성요소를 따로 박지 않는다.

## 4. 기존 서비스의 이행(격리 실증까지)

| 서비스 | 새 형태 | 합격 |
|---|---|---|
| OpenSearch · RustFS(E3) | `stateful-engine` + 패키지 Job(인덱스 · 버킷 Claim) | 격리 설치본에서 옛 경로로 만든 인스턴스 · Claim을 새 판으로 넘긴다. StatefulSet · PVC · PV · Secret UID와 데이터를 보존한다. 발급 · 회수 · 읽기쓰기가 같다. 옛 Rust 분기를 지운다 |
| PostgreSQL(E5) | `operator-cr`(SGCluster) + 패키지 Job(DB 발급 · 회수: SCRAM · SGScript · 실제 로그인 확인) | 기존 클러스터 · Claim · 진행 중 계획이 새 경로에서 검증된다. 13탭이 세부 틀로 같은 답을 낸다 |
| Samba AD · Keycloak(E7) | Samba: `stateful-engine` + 패키지 Job(samba-tool). Keycloak: `operator-cr` 또는 `stateful-engine`(Codex가 PR 설계 메모로 제안). 그룹 연동은 패키지 Job + 호스트 효과 확인 | 격리 설치본에서 기존 디렉터리 · 사용자 · 그룹 · Keycloak 영역 · 연동을 보존한다. 중단된 작업을 복구한다. 내장 모듈 · 화면을 지운다 |
| HISS 구성요소(H3) | `hiss` 패키지 | 한 항목의 갱신이 스토어 → MFA → HISS 실행부 → 실검증 → 원장으로 끝난다 |

## 5. 마지막 실증(P1) · 운영 전환 준비(P2)

**P1 — 기준 실증(격리 설치본)**
- 시작할 때 Backbone 모든 이미지 digest · 배포 세대 · 원장 이행 판 · ClusterRole · CEL · 웹훅 · CLI 판 · 지식 묶음 digest · Setup 판을 기록한다.
- 그다음 두 새 패키지를 시험 키로 게시하고 설치 → 인스턴스 → 연결 → A→B 갱신 → 내리기 · 회수까지 한다.
  - **Valkey**: `stateful-engine` + 패키지 Job. 연결 = ACL 사용자 + 키 범위. 교차 접근 거절 · 기존 연결까지 회수 · 재시작 뒤 보존.
  - **Gitea**: PostgreSQL 의존성.
- 확인할 것: 스토어 상세(listing · 매뉴얼 · 호스트 계산 사실), 메뉴 · 화면 · 세부 탭 · (Gitea) UI 모듈, Shell 명령과 CLI `os <module> …`, 지식 질의의 출처, 실행 · 상태.
- 끝날 때 처음 기록과 **모두 같아야** 한다. 다르면 무엇이 왜 바뀌었는지가 곧 남은 작업이다.
- E6의 TLS 전제(D-94 Q6, 인증서 용도의 형식화)는 P1 전에 끝낸다.

**P2 — 운영 전환 준비(실행하지 않음)**
- 통합 판 하나로 운영 전환 순서서를 쓴다.
  - Backbone 마지막 갱신 1회
  - 원장 이행 목록 · 리허설 결과
  - 서비스별 이행 순서 · 되돌리기
  - 옛 Gitea 보관 · 정리
- 운영 모양 자료(Claude가 넘기는 읽기 전용 스냅샷)로 격리 리허설을 마친다.
- 실행은 소유자 승인으로 Claude가 한다.

## 6. 단위와 순서(Codex)

| 순서 | 단위 | 내용 | 기대는 것 |
|---|---|---|---|
| 0 | PR 176 · 177 | 검수 · 병합(Claude) | — |
| 1 | **E2a-2** | 원형 렌더러 · 나란히 비교(D-94 §6) | 177 |
| 2 | **I3** | `listing` · `listing-media` part, 카탈로그 등록 시 번들 받기, 스토어 상세(개요 · 매뉴얼 · 권한과 자원 · 판 기록), 설치 후 "도움말" | — |
| 3 | **I4** | 지식 합류 · 출처 · 활성화 반영 · MCP | — |
| 4 | **E2b** | 승인 경로 일반화, Services 원장 일반 함수, Claim 종류 일반화, 실행부 매니페스트 일반화(RBAC · CEL · egress), 판 혼재 시험 | 1 |
| 5 | **S1** | `fabric.instance-detail` 틀 · 데이터 원천(관측 지표 주입 포함) | — |
| 6 | **E4** | 패키지 Job(jobs · claims · verify · 회수 정리), 프로필 `jobImages` 별도 승인 | 4 |
| 7 | **I1 · I2** | Shell 명령 합류 · `run.via` · 실행 경로, CLI 동적화 · 박힌 명령 제거 | 6 |
| 8 | **E3** | OpenSearch · RustFS 이행 + 세부 틀 전환 + Rust 분기 제거 + 게시 차단 해제 조건 정리 | 1 · 4 · 5 · 6 |
| 9 | **S2** | UI 모듈 격리 · 다리 · 악성 사례 | 5 · 7 |
| 10 | **E5** | PostgreSQL 이행(SGCluster → DB 발급) + 13탭 선언형 | 6 · 5 |
| 11 | **E7** | Samba AD · Keycloak 이행(설계 메모 먼저, 같은 PR) | 6 · 10 |
| 12 | **TLS** | 인증서 용도 형식화 + 기존 PVC 재기동 시험(D-94 Q6) | 8 |
| 13 | **G1** | Gitea 패키지 + Backbone 내장 Gitea · 어댑터 제거 | 10 · 9 |
| 14 | **H3 · H3b** | HISS 스토어 경로 · Setup 부트스트랩 | 4 · 6 |
| 15 | **S3** | 호환 표 · 내장 화면(`fabric-*-page`) · `nativeInstanceSlugs` · `actionProfiles` 고정값 제거 | 8 · 10 · 11 · 13 |
| 16 | **P1** | 기준 실증(Valkey · Gitea) | 전부 |
| 17 | **P2** | 운영 전환 순서서 · 격리 리허설 | 16 |

- 2 · 3 · 5는 다른 단위에 기대지 않는다. 검수를 기다리는 동안 먼저 진행한다.
- 각 단위의 합격 기준은 §3 · §4 · §5의 해당 줄이다. PR 본문에 표로 남긴다.
