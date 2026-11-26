# 스토어 자격 관리 v0.1 — 평가 리포트와 설계안

- **상태:** Claude · Codex 합의안(2026-11-26), 소유자 결정 대기(§7 C-1~C-4). 협의 기록: Claude 초안(bc4b656) → Codex 코드 대조 메모 #168(Backbone `1fc7d57`, 파일:줄 근거) → Claude가 수정 제안 전부 채택.
- **출발:** 소유자(2026-11-26): "사용자는 자신이 사용하고 싶은 레포: 스토어에 대한 읽기 전용 토큰을 줄 수 있으면 되는 것이다. 다만 스토어에 등록하고 관리 하기 위해서 더 많은 권한이 필요한 경우 더 많은 권한이 있는 토큰을 설정 하면 된다. 즉 우리는 필요한 정도의 권한으로 여러 레포:store를 등록, 운영, 삭제 등의 작업을 할 수 있으면 되는것 아닌가? 이 과정에서 약속된 기능, 준비 등이 되어 있지 않으면 그것은 그것 대로 평가해서 리포트 하면 된다."
- **정정:** 계정 종류(사용자 · 조직)는 운영자의 선택이고 OpenSphere에 기술 차이가 없다. D-99 S99-2(조직 전환 권장)를 MS7b의 준비 조건으로 적은 것을 뺀다(§5).
- **잇는 문서:** [중립 다중 스토어 v0.1](NEUTRAL-MULTI-STORE-v0.1.md)(D-99) §4 · §5 · §7 · §12-2, Backbone `docs/osr/NEUTRAL-STORE.md`(MS2 비공개 worker 절차 · MS4 · MS6) · `docs/osr/UNIVERSE-PUBLICATION.md`(MS7a · MS7b).
- **기준 시점:** Backbone main `1fc7d57`, 운영 A-5(스토어 0개, v1 reader 1개).

## 0. 평가 기준(소유자)

1. 스토어는 **레포 단위**로 다룬다. 계정 형태는 묻지 않는다.
2. 스토어마다 **필요한 만큼의 권한**을 가진 토큰을 준다. 읽기면 읽기 전용, 관리가 필요하면 그만큼 더.
3. 그 토큰으로 여러 스토어를 **등록 · 운영 · 삭제**할 수 있어야 한다.
4. 약속된 기능이 안 되면 결함으로 리포트한다.

여기에 하나를 지킨다: **토큰은 접근만, 신뢰는 서명 + 소유자 MFA.** 쓰기 토큰이 새도 서명되지 않은 패키지가 설치될 수 없어야 한다(D-99 원칙 2).

## 1. 평가 — 지금 무엇이 되고 무엇이 안 되나

| # | 기대 | 지금(main 1fc7d57) | 판정 |
|---|---|---|---|
| E-1 | 공개 스토어를 토큰 없이 읽기 | 공개 worker가 레지스트리 Secret 없이 레포 단위 익명 pull로 읽는다(Console carrier와는 내부 토큰). 승인된 active 행이 없으면 작업 0 | **됨**(운영에서 아직 안 써 봄) |
| E-2 | 스토어 등록 · 범위 · 정지 · 삭제 | MS4: 설치본 anchor로 서명한 변경을 검증하고 Management 전용 `osr.store.manage` + 활성 소유자 MFA 확인 뒤 Setup/keyops가 일회 영수증을 소비. MS6은 서명 대상 미리 보기만 | **됨** |
| E-3 | 비공개 스토어에 읽기 토큰 주기 | 서명된 등록의 `credential`은 `namespace` · `name` · `repositories` **참조**만. 토큰은 운영자 수작업(kubectl Secret 생성, carrier 토큰 Secret, `privateStoreReaderManifests` 렌더 · 적용, Console carrier 파일). Setup의 `--registry-token-stdin`은 설치 bootstrap/resume 전용 | **부족(F-1 · F-2 · F-3)** |
| E-4 | 토큰 교체 · 폐기 | Secret 내용 교체는 가능하고 worker가 다음 작업 때 다시 읽지만 승인 · 세대 · 영수증 없음. `scope` · `refresh`도 기존 참조 변경을 거절 | **부족(F-1)** |
| E-5 | 스토어 삭제 때 자격 정리 | `suspend`는 reader basis를 없애 이후 작업 · 반입을 거절, `remove`는 suspended 스토어의 참조를 재검사하고 `removed` 기록. Secret · worker · 망 객체 삭제와 부재 영수증은 없음 | **부족(F-4)** |
| E-6 | 더 높은 권한 토큰으로 스토어 관리(게시) | 설치본 내부 게시 자리는 없음. MS7a에 외부 게시용 라이브러리(`publishStore` · `storeRegistry({authorization})`)와 CLI만 | **없음(F-5, C-3)** |
| E-7 | 계정 · 레포가 다른 여러 스토어 | 계정 종류를 판정하지 않음. 스토어 정체 = `registry + OCI namespace + 최초 root 지문`(Git URL은 정체에 없음). 한 스토어가 catalog · 등록부 · 번들 여러 OCI 저장소를 가질 수 있음 | **됨.** 단 같은 `catalogRepository + channel`을 두 root가 공유하면 같은 가변 태그를 읽으므로 등록 · 게시에서 거절해야 함(F-9) |
| E-8 | 토큰 권한이 넘치면 알려 주기 | 코드는 요청마다 정확한 OCI 좌표 · `pull` 범위만 집행, 입력 PAT 권한은 검사 안 함(유출된 원본 PAT의 권한은 좁아지지 않음) | **없음(F-6)** |

**결함 목록**

- **F-1 토큰을 넣고 · 바꾸고 · 빼는 제품 경로가 없다.** kubectl 수작업, 승인 · 세대 · 영수증 없음, 소유자 MFA 밖.
- **F-2 carrier를 Console에 파일로 둔다.** 코드는 요청마다 `<64 hex 스토어 정체>` 파일을 다시 연다. 전체 키를 투영하는 Secret 디렉터리가 이미 마운트돼 있다면 키 추가로 끝나지만, **지금 배포 정의에는 그 디렉터리 · env를 설치하는 경로가 없어**(비공개 helper는 `consoleEnv: []`) 첫 도입 때 Deployment 구성이 필요하고, 스토어마다 독립 Secret을 마운트하면 매번 Pod template이 바뀐다.
- **F-3 비공개 worker를 띄우는 것도 수작업이다.** helper는 이미 있는 두 Secret을 참조해 Deployment · NetworkPolicy · CiliumNetworkPolicy를 렌더할 뿐이고 MS4 적용은 DB 전용. 전용 namespace를 쓰려면 Console DNS · egress selector도 분리해야 한다.
- **F-4 스토어 삭제가 자격 · worker 정리까지 닫지 않는다.**
- **F-5 관리 권한 토큰의 자리가 없다.** 회사가 자기 비공개 스토어를 OpenSphere에서 운영하려 해도 게시 경로가 OpenSphere 밖에만 있다.
- **F-6 넘치는 권한을 막지 못한다.**
- **F-7 폐기하면 공개 스토어로 떨어질 수 있다.** 지금 `credential_namespace IS NULL`로 공개 worker를 분류하므로, 폐기하면서 참조를 지우면 공개 읽기가 된다(Codex 발견).
- **F-8 늦은 반입.** 교체 · 폐기 · 정지 뒤 이미 시작된 polling/upload가 옛 세대로 반입될 수 있다(Codex 발견).
- **F-9 같은 발견 좌표 공유.** 두 스토어가 같은 `catalogRepository + channel`을 쓰는 등록을 막지 않는다(Codex 발견).

## 2. GHCR 토큰의 실제 제약(공식 문서 확인, 2026-11-26)

- 워크플로 밖에서 GHCR(OCI) 인증에 GitHub가 문서화한 선택은 **personal access token(classic)** 이다. 워크플로 안에서는 그 레포에 발급되는 `GITHUB_TOKEN`도 쓸 수 있다(이 토큰 자체가 GitHub Actions가 발급한 App 설치 토큰). [Container registry 인증](https://docs.github.com/en/packages/working-with-a-github-packages-registry/working-with-the-container-registry#authenticating-to-the-container-registry) · [GITHUB_TOKEN](https://docs.github.com/en/actions/concepts/security/github_token#about-the-github_token)
- **`read:packages`는 레포 하나로 좁혀지지 않는다.** scope와 그 계정의 실제 패키지 접근 권한이 함께 적용된다. fine-grained 토큰 · 특정 Packages REST API에서 받는 토큰은 `ghcr.io` OCI 지원의 근거가 아니다. [패키지 권한과 scope](https://docs.github.com/en/packages/learn-github-packages/about-permissions-for-github-packages#about-scopes-and-permissions-for-package-registries) · [Discussion #38467](https://github.com/orgs/community/discussions/38467) · [Discussion #153160](https://github.com/orgs/community/discussions/153160)

**뜻:**
1. GHCR의 최소 권한 읽기 = **그 스토어 패키지만 볼 수 있는 전용 계정**의 classic PAT `read:packages`. 계정 형태는 여기서도 상관없다. 조직 SSO · PAT 정책은 통과해야 한다.
2. OpenSphere는 토큰 범위를 믿지 않고 **등록 때 고정한 정확한 OCI 좌표 · 동작에만** 자격을 쓴다(MS2에 이미 있음).
3. 게시는 **게시 job에만 `permissions: packages: write`인 `GITHUB_TOKEN`** 을 우선, 쓸 수 없을 때만 게시 전용 계정의 classic `write:packages` PAT. `repo` · `delete:packages` · 관리자 scope는 필요 없다. **별도 Universe 심사용 App의 설치 토큰은 게시 자격으로 쓰지 않는다**(§5).
4. 레지스트리마다 사정이 다르므로 자격 자리는 레지스트리 중립으로 두되, 지금 계약의 registry origin은 `https://ghcr.io` 하나다.

## 3. 설계 원칙

1. **자격 자리는 스토어마다, 용도별 활성 세대 하나.** 등급 `read`(목록 · 등록부 · 번들 pull) · `publish`(그 스토어 OCI 좌표 push). 교체 중에는 후보 세대 하나를 더 둔다. 공개 스토어는 `read` 없이 익명. **`authMode`(공개 · 비공개)를 자격 참조와 따로 기록**하고, 유효한 `read` 세대가 없는 비공개 스토어는 작업 0(F-7).
2. **토큰 값은 Console · 원장 · 로그 · 화면에 없다.** PAT · 레지스트리 Bearer 원문과 그 지문을 원장에 두지 않는다. 원장 · 영수증에는 설치 ID · 스토어 정체 · 용도 · 세대 · 정확한 OCI 좌표 · Secret UID/이름 · 소유자 · 결정 id · 시각 · 만료 출처 · 닫힌 판정 코드만. Console은 이 읽기 투영만 본다.
3. **자격 작업은 소유자 MFA, 단 신뢰 변경 영수증과 별개의 닫힌 형식.** `osr.store.manage`의 비위임 · 활성 소유자 · 일회 MFA 패턴과 keyops 경계를 재사용하되, 작업 형식은 작업 id · 설치 · 클러스터 · 스토어 · 용도 · 현행 trust 판과 범위 · 이전/새 세대 · 허용 목록 · 기한을 결합한다. **토큰은 Console MFA 요청에 넣지 않는다**(지금 MFA wire는 `document` · `requestId` · `code`만 받음). Nexus 감사 지문 · 비위임 · 쿠키 거절 시험을 함께.
4. **스토어를 늘려도 Backbone 배포 구성을 건드리지 않는다.** 첫 기능 배포 한 번 뒤로는 마운트 · 롤아웃 없음(§4.2).
5. **토큰은 접근만.** `publish` 자격이 있어도 서명은 오프라인 키로만. 게시 Job은 서명되지 않은 입력을 쓰기 전에 거절하고, 외부에서 PAT로 직접 올라온 서명 없는 바이트는 reader가 채택하지 않는다.
6. **넘치는 권한은 거절**(§4.3).
7. **실패는 닫힌 쪽, 일시 장애는 파괴적 근거가 아니다.** 단발 401/403 · SSO · API 제한 · TLS · 전송 오류는 상태 · 재시도 사유로 분류하고 정리의 근거로 삼지 않는다. 검증된 만료는 읽기를 막는다. 마지막 검증 head의 만료는 기존 규칙대로 계속 계산. 다른 스토어는 영향 없음.
8. **늦은 반입은 세대로 거절**(F-8).

## 4. 수명주기

| 동작 | 누가 · 어디서 | 호스트가 하는 일 | 원장 · 영수증 |
|---|---|---|---|
| **스토어 등록**(공개) | 소유자, Setup MFA(MS4 그대로) | 공개 worker 경로로 읽기 시작. 같은 `catalogRepository + channel`을 다른 root가 쓰면 거절(F-9) | 신뢰 변경 영수증 |
| **자격 등록 · 교체**(`read`) | 소유자, Setup 표준 입력 + MFA | 작업 id로 **후보 세대 예약** → immutable Secret · 고정 worker 경계 준비 → scope 확인(§4.3) → 후보 세대가 허용 좌표를 실제 pull한 증거(이 동안 정식 반입 권한 없음) → **활성 포인터 CAS + 옛 세대 carrier 차단** → 옛 객체 UID 조건 삭제. 승격 전 실패면 기존 세대 유지, 승격 뒤 삭제 실패는 `cleanup_pending`으로 같은 작업 id로 재개 | 세대 전이 · 범위 확인 · pull 증거 · 정리 |
| **폐기** | 소유자, 같은 경로 + MFA | carrier 먼저 차단 → 로컬 Secret · worker 정리. `authMode`는 비공개 그대로(작업 0) | 폐기 사유 · 정리 확인. **설치본의 Secret 삭제와 GitHub의 PAT 폐기는 다른 효과** — 상류 폐기는 발급자에게서 확인 |
| **스토어 정지** | Setup MFA(MS4) | 남은 작업 무효화, 자격은 유지 | — |
| **스토어 삭제** | Setup MFA(MS4) | 정지 → Services 참조 · 적용 직전 Core 증거 재확인 → `removed` + `cleanup_pending` 기록(같은 좌표 재사용 · 재읽기 차단) → 기록한 UID의 Secret · worker · 망만 삭제 → 불명 응답은 부재 재확인으로 닫고 UID가 달라졌으면 멈춤. tombstone · 하한 · 회수 · 출처 · 복구 증거는 유지 | 정리 영수증(F-4) |
| **만료 표시 · 알림** | 호스트 | MS6 상태에 만료 사유 표시. 14일 · 3일 전 알림은 C9 이벤트 경로가 생길 때 연결 | 상태 · 알림 기록 |

### 4.1 토큰을 넣는 경로

- **Setup 소유자 터미널(첫 판).** `setup store-credential set|rotate|revoke <store> --grade read|publish` — 비대화형 bounded stdin 또는 별도 FD, 로그인 · OTP와 PAT 입력을 분리, 설치본 · kube context · 대상 작업을 확인한 뒤에 비밀을 읽는다. kube 명령 argv/env, kubectl `last-applied` 주석, Secret HTTP 응답 · 감사 본문, 오류 로그에 원문이 남지 않는지 시험한다. 전용 Secret namespace의 저장 시 암호화 · 접근 권한도 설치 경계에서 확인. Setup의 설치 확인 · 비밀 stdin 패턴(R1 `owner-recovery`)을 재사용.
- **Console 화면 입력은 보류.** 브라우저 봉인은 브라우저에서 도는 코드가 값을 먼저 볼 수 있고, Console이 키와 화면 코드를 함께 공급하면 장악된 Console이 둘 다 바꿀 수 있다. 연다면 설치 anchor에 묶인 수신 키를 독립 검증하는 경로, 작업 결합 · 재전송 거절, 복호화 구성요소 하나 · 좁은 RBAC가 먼저 정해져야 한다(별도 결정).

### 4.2 carrier와 worker(F-2 · F-3)

- **carrier:** Setup이 레지스트리 PAT와 별도로 고엔트로피 carrier 토큰을 발행해 worker Secret에 두고, **원장에는 그 carrier 토큰의 검증값만** 둔다(사용자 PAT의 지문이 아님). Console은 `(storeIdentity, generation)`으로 활성 · 유효 세대의 좁은 조회 함수만 불러 상수 시간 비교한다. 고정 Service 좌표 · 인증된 TLS. 세대는 **수집 권한**에만 묶이고 서명 스냅숏 · 출처를 대신하지 않는다. 회수하면 새 호출과 옛 세대의 저장 직전 반입이 모두 막힌다. 첫 기능 배포의 Console 구성 한 번 이후로 스토어 추가 · 교체는 Console 배포 변경 0.
- **worker:** 고정 reader namespace에 미리 설치한 **전용 writer Role/Binding**(Secret · Deployment · NetworkPolicy · CiliumNetworkPolicy의 필요한 동작만). worker 자체는 Kube API · SA 토큰 · DB 권한 0. 이름 · 설치/스토어 라벨 · 세대 · 허용 Secret mount · 이미지/명령 · 망 · UID 조건을 VAP와 승인 대상 대조로 집행(`CREATE` 이름은 RBAC `resourceNames`로 못 막으므로 admission 필요). Secret `get/list/watch`, 임의 Pod/exec/RoleBinding, 패키지 원형 Role 변경은 주지 않는다. 범용 모듈 실행부에 권한을 더하지 않는다. 처음에는 Setup이 승인 · 실행을 조율하고 좁은 writer가 고정 작업을 적용.

### 4.3 넘치는 권한 확인(F-6)

- Setup이 등록 · 교체할 때만 고정 `https://api.github.com/user`로 제한된 검사: TLS · redirect 없음 · 짧은 timeout · 본문/로그 미사용, 응답 헤더 `X-OAuth-Scopes`(부여된 scope)를 본다(`X-Accepted-OAuth-Scopes`는 호출이 검사하는 범위라 쓰지 않음).
- `read`는 `read:packages`만, `publish`는 `write:packages`(+ 포함되는 `read:packages`)만. 빈/누락 헤더 · 지원하지 않는 종류 · `repo` · `public_repo` · `delete:packages` 등은 GHCR 슬롯에서 거절.
- 실제 classic PAT의 헤더 모양은 전용 시험 계정으로 확인하는 합격 항목. 허용 좌표별 실제 pull은 별도 증거.

### 4.4 `publish` 자격(관리 권한)

- 쓰임: 설치본이 **자기 비공개 스토어**를 운영할 때(선택 기능).
- **호스트 전용 게시 Job**(고정 호스트 이미지)이 승인된 작업에 따라 `publishStore`를 실행하고, 그 스토어의 `publish` Secret만 투영받는다. 외부 URL · 임의 명령 · 제출자 코드 · 오프라인 개인 키를 받지 않는다. 쓰기 전에 current trust · 하한 · 서명 · 허용 OCI 좌표 · 세대를 독립 확인하고, 나머지 객체 재조회와 포인터 마지막 쓰기(MS7a 규칙)를 지킨다.
- 범위는 **OCI push**까지. Git 저장소 관리 · 원격 패키지 삭제는 열지 않는다. 지금 registry origin이 `https://ghcr.io` 하나라서 "로컬 레지스트리 운영"은 별도 전송 계약이 승인된 뒤에만 약속한다.
- Universe 같은 공개 스토어의 게시는 GitHub Actions 보호 게시 job(§2-3)에서 한다. 설치본은 Universe 쓰기 자격을 갖지 않는다.

## 5. MS7b 준비 목록 정정

| 이전 | 정정 |
|---|---|
| B1 `triangles-store` 조직 전환 · 관리 계정 먼저 | **뺀다.** 계정 형태는 소유자 판단. 승인된 Git 저장소 · OCI 좌표 · 보호 main · 검토자 · 게시 job을 고정한다. 비공개 저장소의 environment · 필수 검토자는 요금제마다 달라 실제로 있는지 따로 확인 |
| B3 게시 자격 | App은 심사 · 검사 권한까지만. GHCR 게시는 **게시 job의 `GITHUB_TOKEN`(`packages: write`) 우선**, 기존 GHCR 패키지는 Actions 저장소에 실제 쓰기 권한이 있는지 확인, 안 되면 게시 전용 classic `write:packages` PAT를 보호 environment Secret으로 |
| (없음) | **익명 재조회 합격:** 목록 · 등록부 · 모든 배포 번들 · referrer까지 익명으로 다시 읽혀야 설치본에 `read` 자격이 필요 없다는 것이 확인된다 |
| (없음) | 두 Git 저장소의 Actions concurrency는 공통 레지스트리 잠금의 증거가 아니다. OCI 좌표를 분리하거나 하나의 보호 writer로 직렬화 |
| (없음) | **이 문서의 SC 단위는 MS7b의 선행 조건이 아니다.** 비공개 스토어를 처음 쓰기 전에 SC1 · SC2가 필요하다 |

Backbone `docs/osr/UNIVERSE-PUBLICATION.md`의 MS7b 순서도 위대로 고친다(SC1 PR에 함께).

## 6. 위협과 막는 방법

| 위협 | 막는 방법 |
|---|---|
| 토큰 유출(화면 · 로그 · 원장 · 서명 문서 · kube 감사 · `last-applied`) | 값은 Secret에만, 입력은 Setup stdin/FD, 원장에 지문도 없음, 유출 경로별 시험 |
| `read` 토큰이 다른 패키지까지 읽음(GHCR 제약) | 전용 계정 권고 + 정확한 좌표만 요청 + 화면 고지 |
| 넘치는 권한 | 등록 · 교체 때 scope 확인 · 거절 |
| 폐기가 공개 읽기로 떨어짐 | `authMode` 분리, 세대 없는 비공개 스토어는 작업 0 |
| 늦은 반입 | 세대 기준 거절 |
| 쓰기 토큰으로 악성 게시 | 게시 Job은 서명된 입력만, reader는 서명 · 하한 · 공급자 지문 독립 검증 |
| 같은 발견 좌표 공유 | 등록 · 게시에서 거절 |
| 스토어 하나의 장애가 다른 스토어로 | 스토어별 worker · Secret · 망 경계, 실패는 그 스토어만 |
| 삭제 뒤 자격 잔존 | `cleanup_pending` + UID 기준 정리 + 부재 영수증 |
| 자격 변경이 MFA 밖 | 모든 자격 작업이 소유자 MFA, 세대 CAS 기록 |

## 7. 결정 항목

| # | 질문 | 합의 권고 |
|---|---|---|
| **C-1** | 자격 자리 모델 | **스토어마다 `read` · `publish` 분리, 용도별 활성 세대 하나(+교체 후보), `authMode` 별도, 값은 Secret에만, 원장은 수명주기 · 범위 · 결정 증거만, 레지스트리 PAT와 carrier 자격을 섞지 않음** |
| **C-2** | 토큰 입력 경로 | **Setup 표준 입력 + 설치본 소유자 MFA.** Console 화면 입력은 보류(별도 신뢰 경계가 정해지면 결정) |
| **C-3** | `publish` 자격을 OpenSphere 안에 둘까 | **선택 기능으로 둔다: 호스트 전용 게시 Job, OCI push까지, 자체 운영 비공개 스토어용.** Git 관리 · 원격 삭제 없음, 로컬 레지스트리는 별도 전송 계약 뒤. Universe 게시는 GitHub Actions 쪽 |
| **C-4** | 순서 | **MS7b와 병행, 선행 조건 아님.** 첫 비공개 읽기의 합격 조건은 SC1 · SC2a · SC2b, SC3는 설치본 내부 게시가 필요할 때만. 반영 회차는 소유자 결정 |

## 8. 구현 단위

| 단위 | 범위 |
|---|---|
| **SC1 원장 · 계약** | 값 없는 원장, `read` · `publish` 슬롯과 `authMode`, 세대 CAS, 폐기 · 정리 상태, 허용 scope 규칙과 음성 벡터, 같은 발견 좌표 거절. 현재 MS4 봉투 바이트와 공개 · v1 경로는 보존. `UNIVERSE-PUBLICATION.md` MS7b 정정 |
| **SC2a 자격 수명주기** | Setup stdin · MFA · scope 확인 · pull 증명, 고정 worker · 전용 writer · VAP, 배포 무변경 carrier, 교체 · 폐기, 늦은 반입 거절 |
| **SC2b 정리 · 장애** | 정지 · 삭제의 UID 정리, `cleanup_pending` 재개, 관측 · 응답 유실 실증 |
| **SC3 게시 Job** | 호스트 전용 게시 Job, 승인된 입력 · 현재 신뢰 독립 확인, 게시 전용 자격 · 정확한 망 · 좌표, 불변 태그 · 포인터 · 응답 유실 · 동시 실행 시험 |

**합격:** 같은 Backbone 빌드 · 같은 배포 구성에서
1. 비공개 시험 스토어 둘을 각자 `read` 토큰으로 등록 · 읽기 — **같은 소유자 아래 두 스토어**와 **서로 다른 계정 아래 두 스토어** 각각
2. 하나의 교체 · 폐기가 다른 스토어에 영향 없음, 폐기 뒤 공개 읽기로 떨어지지 않음
3. 넘치는 권한 토큰 거절
4. 교체 · 폐기 · 정지 뒤 늦은 반입 거절
5. worker 재시작 · MFA 뒤 응답 유실 · DB 커밋 전후 실패 · Secret UID 충돌 · 정리 재개
6. 읽기 거절과 일시 장애 구분, 다른 스토어 정상
7. 스토어 삭제 뒤 Secret · worker · 망 없음
8. `publish` 게시 Job은 서명 없는 입력을 쓰기 전에 거절, 외부에서 올라온 서명 없는 바이트는 reader가 채택하지 않음
9. 화면 · 로그 · 원장 · kube 감사에 토큰 값 0건
10. MS6이 로컬 폐기와 상류 PAT 폐기를 구분해 표시
