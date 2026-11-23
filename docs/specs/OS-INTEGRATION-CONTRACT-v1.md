# OS 통합 패키지 계약 v1

**상태:** 초안(2026-11-24). 소유자 승인 전이다.
**작성:** Claude. 구현 관점 검토는 Codex.
**목적:** 패키지가 OS에 합류하는 방식(OS 통합)을 통합 지점마다 **한 문서로** 정한다. 패키지를 만드는 사람과 검수하는 사람이 보는 기준서다.
**모은 출처:**
- D-89 · D-90 · D-93(레이어), D-94(E2a 실행 계약), D-95(OS 통합), D-96(데이터 보존 없음), D-97(A2UI)
- [OS 통합 재작성 v0.1](OS-INTEGRATION-REWRITE-v0.1.md), [E2a v0.2](PACKAGE-EXECUTION-ARCHETYPE-E2A-v0.2.md), [A2UI v0.1](OS-UI-A2UI-v0.1.md)
- 구현 중 검수 결정(Codex 채널 #30~#81). 사양에 없던 것을 이 문서로 옮긴다.

**기준 코드:** Backbone main `5ea0c0a`(운영 반영, 2026-11-24). 그 뒤 병합되는 판은 해당 절에 판을 밝힌다.

모듈마다 무엇을 제공하는지는 이 문서가 아니라 [모듈 통합 명세](MODULE-INTEGRATION-SPECS-v0.1.md)가 정한다.

## 0. 원칙

1. **Backbone 재빌드 0회**(D-95 §0). 패키지를 설치 · 갱신 · 회수할 때 다음 중 아무것도 바뀌지 않는다.
   - Backbone 이미지 · Console 빌드 · 원장 이행
   - ClusterRole · CEL · 웹훅
   - CLI 배포 · 지식 묶음 · Setup
2. **무엇이 OS이고 무엇이 패키지인가**

| OS(바뀌면 Backbone 갱신) | 패키지(서명 번들의 데이터) |
|---|---|
| 판정기(Node · Rust · Setup 봉인 사본), 호스트 계약, 원형과 렌더러, A2UI 카탈로그 `opensphere.carbon/v1`, 고정 호스트 동작, 데이터 원천 목록, Shell 계약, 실행부 · 웹훅 · 정책, 원장 | listing · manual · knowledge · commands · extension(A2UI 화면) · execution 문서 · (필요 시) UI 모듈 정적 묶음 · Job 코드 이미지 |

3. **세 겹의 신뢰**

| 누가 | 무엇을 | 어떻게 |
|---|---|---|
| 공급자(패키지 서명) | 번들 내용 | 공급자 키 서명. 판정기가 형식을 판정한다 |
| 운영자(소유자 서명 신뢰 맥락) | 배치 규칙(프로필): 이미지 digest, `jobImages`, 실행 제약, 자원 · 권한 상한 | 신뢰 파일 PR + 맥락 서명 + 소유자 터미널 적재 |
| 호스트(OS 코드) | 원형 · 카탈로그 · 호스트 동작 · 데이터 원천 · 한도 | Backbone 판 |

패키지 서명만으로 이미지 · 권한 · Job 이미지를 늘릴 수 없다.

4. **보안 경계는 줄이지 않는다.**
   - Core가 쓰기 목록을 독립 계산해 정확히 맞춘다.
   - MFA · 원장 · idempotency · 예약 · 점유 · 복구, 닫힌 형식을 유지한다.
   - 엔진 이름으로 분기하는 호스트 코드를 두지 않는다. 엔진 지식은 원형의 API 항목(예: `stackgres-v1`) 한곳에만 둔다.
5. **실패는 닫힌 쪽으로.** 판단할 수 없으면 `unknown`(점유 유지)이고, 성공으로 처리하지 않는다.
6. **데이터 보존 없음(D-96).** 기존 인스턴스를 이행하지 않는다. 판 전환은 지우고 새로 설치한다.

## 1. 번들과 판정

| part | media type | 내용 | 필수 |
|---|---|---|---|
| `descriptor` | `application/vnd.opensphere.descriptor.v1+json` | id · class · plane · 표시 이름 · 설명 · 프로필 · 의존성 · 권한 요청 · contributions | 필수 |
| `manual` | `…manual.v1+json` | 문서 묶음(§3) | 필수 |
| `knowledge` | `…knowledge.v1+json` | 매뉴얼에서 만든 지식(§4) | 필수 |
| `commands` | `…commands.v1+json` | 소유자 명령(§5), `opensphere.owner-commands/v5` | 필수 |
| `extension` | `…extension.v1+json` | 메뉴 · 화면(§6), 계약 1.0~1.3 | 화면이 있으면 |
| `listing` · `listing-media` | `…listing.v1+json` · 불투명 묶음 | 스토어 설명(§2) | 권장 |
| `execution` | `application/vnd.opensphere.execution.v1+json` | 실행 문서(§7) | 실행이 있으면 |
| `static` · `static-index` | 불투명 묶음 · 색인 | UI 모듈(§6.4) | 선택 |

- **판정:** Node · Rust 두 판정기와 Setup 봉인 사본이 같은 공유 사례 · 계약 벡터로 같게 판정한다(거절 **이유**까지).
  - 새 형식은 반드시 세 곳과 공유 사례 · 벡터에 함께 들어간다.
  - 정규식은 ASCII 범위만 쓴다(`\s` · `\w` 금지 — Node · Rust 차이).
- **정규 바이트:** `execution` 등 JSON part는 정규 JSON 바이트로만 낸다. 판정기는 레이어 바이트가 정규 직렬화와 다르면 거절한다.
- **등록:**
  - 카탈로그를 받으면 carrier가 각 항목의 번들을 GHCR에서 받아 등록한다. 실패하면 "등록 실패: 사유"로 보인다.
  - 등록 응답만 믿지 않고 **원장을 다시 읽어** part · digest · 문서를 대조한다(저장 실패에도 `200 formal`이 날 수 있음).
- **게시 관문:** `execution` part가 든 번들의 운영 게시는 `host-contract.json` `productionExecutionRenderers`에 렌더러 판이 있을 때만 된다. 이 목록은 소유자 승인 PR로만 바꾼다.
- **패키지 저장소는 GHCR 하나다.** 정보의 출처는 같은 digest의 서명 번들뿐이다(외부 웹 정보를 쓰지 않음).

## 2. 스토어 설명(설치 전)

- **`listing`**(`opensphere.store-listing/v1`)
  - summary ≤140자, description(markdown ≤16KiB), releaseNotes(≤8KiB)
  - icon: 번들된 Carbon catalog의 이름
  - screenshots ≤5장(webp · png, 각 1MiB, `listing-media`)
  - links: https만, 글자 링크
- **markdown:** 호스트가 정리한다. HTML · 이미지 · 스크립트는 빼고 https 링크만 남긴다.
- **호스트가 계산해 보이는 사실(패키지 주장이 아님)**
  - 레이어 · 묶음 · 의존성 · 원형
  - 만들 객체 kind와 한도 · 권한(프로필 rbac · capabilities) · 저장 방식
  - 호환 판 · 서명자 · digest · 매뉴얼 목록
  - **UI 모듈이 읽는 데이터 원천 목록**
- **상세 탭:** 개요 · 매뉴얼 · 권한과 자원 · 판 기록

## 3. 매뉴얼 · 도움말

- **문서 종류:** overview · install · operations · troubleshooting · commands(지금 스키마)
- **쓰이는 곳:** 설치 전에는 스토어 상세 "매뉴얼", 설치 후에는 섹션 화면 맨 아래 "도움말"이다. **활성 판**의 문서를 쓴다.
- 디스크립터 `contributions.manual.artifact`가 가리키는 part를 읽는다.

## 4. 지식

- **합류:** 활성 · formal pass · 번들과 키 미회수 · sha 일치인 설치본의 `knowledge`만 지식 서비스(Console · MCP · CLI)에 합류한다. 내리기 · 회수하면 바로 빠진다.
- **출처 표시:** 결과마다 모듈 · 판 · bundleDigest · part digest · authorityTier를 남긴다.
- **권위:** 패키지 지식은 **tier 2**다. 제품 문서보다 높은 권위를 갖지 않는다.
- **만드는 방법:** 묶음 도구(`scripts/osr/bundle.mjs`)가 매뉴얼에서 자동으로 만든다. 매뉴얼 문서 하나가 지식 문서 하나다(id `knowledge:<module>:<type>`, 출처 `{part:"manual", digest}`). 패키지가 매뉴얼과 다른 지식을 따로 쓰지 않는다.

## 5. OS Shell · CLI 명령

- **목록:** 호스트 명령 + 활성 · v5 · 재검증된 설치본의 명령이다.
  - 옛 판 · 내림 · 회수 판의 명령은 목록에서 빠진다.
  - **직접 호출도 404**로 거절한다(화면에서 숨기는 것만이 아님).
- **명령 항목**
  - `id`: 모듈 이름으로 시작
  - `kind` · `mutation` · `effect`(none · read-cost · mutation · destructive)
  - `arguments`(닫힌 스키마) · `output`(스키마)
  - `requiredPermissions` · `scope`
  - `run: {"via":"archetype"}` 또는 `{"via":"package-job","job":"<id>"}`
- **권한:** `requiredPermissions` ⊆ 프로필 capabilities이고, 호출자 권한 · 대상 범위는 Core가 원장으로 확인한다.
- **archetype 명령:** 원형이 주는 호스트 읽기다(지금 접미사 `status` · `inspect`만).
- **package-job 명령:** `mutation: true`만 된다(읽기 명령으로 효과를 낼 수 없음). 명령 Job과 Claim Job은 서로 바꿔 쓸 수 없다.
- **실행 경로**
  - 읽기: 정책 · 감사(MFA 없음)
  - 변경 · 파괴: 전용 Core 접수(p7) → 계획에 설치본 · 번들 · 명령 문서 digest · 명령 id · 검증된 입력 · 대상 · fence · 프로필 지문 · 실행 결합을 고정 → MFA
  - 파괴 명령은 승인자 명단이 있으면 P3 독립 승인을 받는다.
- **결과:** 접수 때 고정한 출력 스키마와 원래 Job UID로 판정한다. 실행 중 회수 · 신뢰 변경이 있어도 기록한다. 판정할 수 없으면 `unknown`이다. 크기 상한은 64KiB(Job 종료 메시지 경로는 4KiB)다.
- **CLI:** `os <module> <command>` · 도움말 · 인수를 서버 목록에서 만든다. CLI에는 모듈 명령을 박지 않는다.
  - 남은 예외: PostgreSQL `cluster.create` 영수증 판정은 E5b-2에서 지운다.
- **지금 운영 판:** 모든 모듈이 `owner-commands/v4`(설치 단위 표준 8개: status · inspect · plan · apply · verify · operation · rollback · retire)이고 `run.via`가 없다. 그래서 운영에서 실행되는 패키지 명령은 아직 없다. 각 모듈을 v5로 옮기는 것은 모듈 명세의 "지금과 차이"에 적는다.

## 6. 메뉴 · 화면

### 6.1 메뉴와 레이어
- **레이어:** hiss · fabric · governance · workspace(D-89). 패키지는 자기 레이어(디스크립터 plane → 섹션)에만 메뉴를 낸다.
- **같은 경로 충돌:** 같은 섹션 · 묶음 · slug를 다른 패키지가 쓰면, 계획(409)과 활성화 트랜잭션에서 거절한다.
- **레이어 옵션**(D-90 · D-93): 표시 이름 · 순서 · 아이콘 · 숨김 · 설치 허용은 관리자 설정이고, 패키지가 바꾸지 않는다.

### 6.2 화면 계약 판
- **1.0~1.2 고정 틀**(`fabric.service` · `section.notice` · `fabric.instance-detail`)은 그대로 받고, A2UI 템플릿으로 그린다.
- **1.3 `kind:"a2ui"`가 새 패키지 화면의 기본**이다(D-97 ①). 응답의 계약 판은 패키지의 `requires.contract` 그대로다.

### 6.3 A2UI 1.3 화면 규칙
- **문서:** A2UI v1.0 surface(createSurface · updateComponents · updateDataModel 정적 묶음)
- **카탈로그:** `opensphere.carbon/v1`(기본 14 + Carbon 10, 부록 A). Carbon 사용 규칙은 컴포넌트 안에 고정한다. 스타일 · URL · HTML · 스크립트 · 함수 정의는 없다.
- **구조:** 트리만(root 하나, 부모 하나), 깊이 ≤32, 문서 ≤256KiB, 컴포넌트 ≤2,000
- **렌더링 상한:** 목록 · 표는 한 번에 500행(페이지), 차트는 계열 10 · 계열당 점 2,000, 노드 5,000
  - 넘으면 그 블록만 "표시 한도 초과"다.
  - 추이의 읽을 수 없는 점은 빼고 "값을 읽지 못한 점 n개"를 적는다.
  - 이벤트는 최신 500 + "이전 이벤트 n건 생략"이다.
- **데이터:** 호스트가 만든 데이터 모델의 `@path`만 쓴다.
  - 원천은 닫힌 목록이다(부록 A): `instance.*` · `instance.metrics` · `service.*` · `command:<읽기 명령>`.
  - List 항목은 상대 경로로 바인딩하고, 판정기가 항목 스키마로 확인한다.
  - 타입이 맞지 않으면 정적으로는 거절하고, 실행 중에는 "읽지 못함"이다.
  - `instance.*`는 세부 화면에서만 쓴다. 세부 화면의 `service.*`는 같은 사용자가 개요에서 이미 보는 범위라 허용한다.
- **지표:** 확장 선언의 지표 id + PromQL 틀이다. 호스트가 namespace · 인스턴스 라벨을 강제로 주입하고, Core가 영수증 · 생성 계획으로 범위를 다시 확인한다. 빈 선택자 · 고정 창 · 고정 집계만 쓰고 `offset` · `@` · `label_replace` · 하위 질의는 거절한다.
- **동작**
  - 그 화면에 선언한 Shell 명령 id와 **고정 호스트 동작 이름**(부록 A)뿐이다.
  - **확인 · MFA는 컴포넌트가 아니라 호스트가 알려 준 명령 효과로 정한다.** 문서의 effect 주장은 무시한다.
  - 개요에서는 읽기 명령과 원형의 `instance.create`만 된다. 변경 명령은 세부 화면에서만 된다.
  - 화면 이동은 같은 섹션의 정확한 주소만 된다.
- **화면 상태:** 인스턴스 없는 개요는 섹션과 무관하게 screenId로 맞춘다. 세부 화면은 fabric이고 `?instance=` 북마크는 그대로다.

### 6.4 UI 모듈(마지막 수단)
- **언제:** A2UI로 표현할 수 없을 때만 쓴다. 서명된 `static` 묶음을 `<iframe sandbox="allow-scripts">`(allow-same-origin 없음)에 넣는다.
- **자산:** `/osr-ui/<bundleDigest>/<색인 경로>`를 **세션 없이** 내려준다.
  - 활성 · 미회수 판만 내려주고, 색인 sha · 크기 · 형식을 대조한다.
  - 헤더: nosniff, 번들 경로로 좁힌 CSP(`connect-src 'none'`, unsafe 금지), CORP same-origin + 자격 없는 CORS, `max-age=0, must-revalidate, immutable`(회수 즉시 404)
  - IP별 속도 제한을 둔다.
- **다리:** 전용 MessagePort이고, 메시지는 16KB · 정확 키다.
  - `data.read`는 선언 원천만, 프레임마다 속도 제한 · 짧은 캐시를 둔다.
  - `command.request`는 선언 명령만이고, 확인 · MFA는 상위 Console이 띄운다.
  - `navigate`는 같은 섹션만, `theme.get`을 둔다.
  - 부모 `frame-src`는 그 digest 경로뿐이다.
- **잔여 위험(수용):** WebRTC · dns-prefetch는 CSP로 막히지 않는다. 스토어 상세에 "UI 모듈이 읽는 원천"을 보이는 것으로 대응한다.

## 7. 실행

### 7.1 원형

| 원형 | 담는 것 | 엔진 지식 |
|---|---|---|
| `stateful-engine/1` | StatefulSet + Service + 자격 Secret + (설정 ConfigMap) + 데이터 PVC + TLS 초기화, 프리셋, 준비 · 기동 문제 판정 | 없음(문서가 값만 정함) |
| `operator-cr/1` | 승인된 operator CR 하나(+ 부속 CR) | 호스트 계약의 operator API 항목(지금 `stackgres-v1`)에만 있다. 모르는 API id는 닫힌 쪽으로 실패한다 |

- **원형이 고정하는 것(문서로 바꿀 수 없음):** 객체 이름 · 순서 · 라벨, 보안 컨텍스트(non-root · seccomp · capabilities 없음 · 토큰 없음), 준비 · 삭제 완료 판정, namespace(`os-backbone-mod-<module>`)
- **격리 시험:** 호스트가 namespace 접두사 · 라벨 도메인을 주입한다. 운영 경로에서 주입값이 기본값과 다르면 거절한다.
- **실행 문서(`stateful-engine/1`)가 정하는 것**
  - engine: 이름 · uid 1000~65535 · 포트 1024~65535 · 명령 · 읽기 전용 루트 · readiness(HTTPS 경로 · 주기)
  - env ≤32 · mounts ≤16 · scratch ≤4 · config ≤64KiB · credentials ≤8 · presets 1~4
  - claims: 종류 · scheme · Job
  - 한도는 호스트 계약 `archetypes`에 있다.
- **프로필의 실행 제약(운영자 서명):** archetypes · 허용 명령 · env 이름 · 마운트 경로 뿌리 · config 파일 · envFrom · 자격 키 · **`jobImages`**(digest 고정)
  - 실행 문서는 이 범위 안에서만 값을 정한다.
  - 이미지는 프로필의 `image`에서만 온다.

### 7.2 권한
- **실행부:** 원형별 고정 ClusterRole(OS)은 실행부 자신의 상한이다. 설치 때 그 namespace에 실행부 SA로 RoleBinding을 만든다.
  - 실행부 ClusterRole에는 그 이름들에 대한 `bind`만 있다(`escalate` 금지).
  - Secret은 create · delete만 하고 읽지 않는다. 예외는 복구 주석 PATCH 한 곳이며, CEL이 그 키만 허용한다.
- **패키지 Job · 워크로드:** Kubernetes API 권한이 없다(RoleBinding 없음, `automountServiceAccountToken: false`). 데이터 PVC를 마운트하지 않는다.
- **API가 필요한 컨트롤러(operator)는 provider 패키지에 허용하지 않는다.** `hiss` 클래스(별도 고권한 실행부 · 승인)로만 낸다.
- **세밀한 제한:** 프로필 `rbac`(원형 Role의 부분집합) + Core 웹훅의 정확 일치
- **CEL · 정책:** namespace 라벨 + 접두사를 함께 요구한다(`&&`). 새 패키지는 ClusterRole · CEL · 웹훅을 바꾸지 않는다.

### 7.3 Job
- **용도:** `issue` · `release` · `verify`(Claim), `command`(Shell). 용도끼리 바꿔 쓸 수 없다.
- **이미지:** 프로필 `jobImages`의 digest만 쓴다(운영자 별도 승인). 운영용 이미지는 저장소 원천에서 보호 main 관문으로 빌드 · 수용한다.
- **읽는 자격:** issue · release는 `engine-auth`만, verify는 그 Claim의 `consumer`만 받는다. command Job은 Secret이 없다.
- **망:** 선언한 인스턴스 포트만. DNS는 None + 고정 hostAlias다.
- **결과:** 닫힌 결과 JSON이고 상한이 있다.
  - effect Job은 `done`을 낸다.
  - verify Job은 `connected` · `auth_rejected` · `transport_error` · `probe_error`만 낸다. **판정은 실행부가 한다.**
- **효과 확인**
  - 발급 성공: 소비자 자격으로 TLS 로그인 + 읽기 · 쓰기(`connected`)
  - **회수 성공: 같은 자격의 로그인 자체 거절(`auth_rejected`)만.** 연결 성공 · 전송 오류 · 시간 초과 · 분류 불가는 `unknown`이다. 403 같은 "로그인 뒤 거부"는 자격이 살아 있으므로 회수 성공이 아니다.
  - 남는 위험: 엔진 안 효과는 승인된 Job 이미지를 믿는 데서 끝난다. 호스트는 소비자 Secret · UID · 망 · 원장을 직접 확인한다.
- **멱등:** 실행부가 재시작해도 같은 Job UID를 잇는다. 실패한 회수는 작업마다 다른 Job 이름으로 다시 시도할 수 있다.

### 7.4 Claim
- **종류:** 실행 문서 `claims`에 선언한다(이름 `^[a-z][a-z0-9-]{1,40}$`, ≤6).
  - 활성화 트랜잭션이 검증된 문서로 선언을 채운다. 선언 밖 종류는 서버가 422로 거절한다.
  - 회수는 **원래 발급 기록의 종류**로 한다.
- **주소 scheme:** 닫힌 목록(`https` · `rediss` · `postgres`)
- **소비자 Secret:** 실행부가 봉투를 풀어 선언한 키만 쓴다. `*-engine-auth` 이름은 예약어다.
- **용량:** 원형이 정한 한도는 **계획 · 접수 때** 확인한다(예: operator-cr의 managedSql 참조 127쌍). 화면에 남은 용량을 보인다.
- **회수된 패키지:** 패키지 코드 없이 소비자 Secret 삭제 · 망 차단 · 원장 종료로 끊는다. 엔진 안 정리는 "정리 대기"다. 멈춘 설치본이어도 원래 발급 기록만으로 끊는다.

### 7.5 TLS · CA
- **stateful-engine:** 생성 · 복구 뒤 실행부가 엔진이 내보낸 사슬(leaf + 자기서명 CA)을 받아 검증하고(SAN = Service DNS), 지문을 원장에 기록하고, `<name>-ca` ConfigMap을 둔다(write-once). 이후 지문이 바뀌면 거절한다.
- **operator-cr:** 호스트가 인스턴스마다 CA를 메모리에서 만들어 서버 인증서에 서명하고 **CA 키는 버린다**.
  - TLS Secret은 만들기만 한다.
  - 클러스터 망의 Service IP에서 SSLRequest → 사슬 · DNS · 지문으로 확인한다.
  - 소비자 연결은 `verify-full`이 끝까지 되어야 한다.

### 7.6 복구
- **응답 유실:** `unknown` + 점유를 유지한다. 별도 MFA 복구 계획에서 승인 웹훅이 `oldObject`의 UID · 라벨 · 원래 작업 주석을 대조해 기록한다.
  - stateful-engine 자격 Secret: 워크로드가 없으면 교체, 있으면 주석만 바꾸는 채택이다(자격 유지).
  - 소비자 Claim: UID를 확인한 뒤 정상 회수로 닫는다. 둘 다 없으면 `failed`로 닫고 예약을 해제한다.
  - operator-cr: 인스턴스를 지우고 다시 만든다(생성 단계, 데이터 없음).

## 8. 생명주기

- **설치 · 갱신:** MFA 계획이다. A→B 갱신은 인스턴스를 지우지 않는다. 표시 · 화면만 바뀌면 쓰기 차이는 작업 추적 표식뿐이다.
- **내리기:** 인스턴스가 남아 있으면 거절한다(`osr_instances_remain`).
- **회수(키 · 번들):** 목록 · 메뉴 · 자산 · 지식 · 명령에서 즉시 빠진다. Claim은 §7.4대로 끊는다.
- **판 혼재:** 계획은 렌더러 판 · 실행부 digest에 묶인다. 같은 실행부라도 렌더러 판이 다르면 거절한다.

## 9. 패키지 합격 의무

- **공유 사례:** 두 판정기 공유 사례 · 계약 벡터(이유 포함), Setup 봉인 사본
- **격리 영수증:** 시험한 **git head · 바이너리 digest · 번들 digest**를 남긴다. 실제 실행부 SA로 돌린다.
- **화면:** 브라우저 회귀 시험을 저장소에 둔다(CI에 Chromium이 없으면 격리 영수증).
- **실행:** 발급 · 회수(인증 거절) · 재시작 이음 · 응답 유실 복구 · 용량 경계를 시험한다.

## 부록 A. 이름 목록(main `5ea0c0a`, `infra/contracts/osr/host-contract.json`)

**화면 계약 판:** 1.0 · 1.1 · 1.2 · 1.3. A2UI는 1.3, 카탈로그 `opensphere.carbon/v1`.

**고정 호스트 동작**(`actions[].use` · actions 블록 · `rowActions`의 닫힌 목록)

| 이름 | 효과 |
|---|---|
| `instance.create` | 원형 인스턴스 생성 계획(MFA) |
| `instance.delete` | 인스턴스 삭제 계획(MFA) |
| `claim.issue` | Claim 발급 계획(MFA) |
| `claim.release` | Claim 회수 계획(MFA) |

A2UI `CommandButton`의 이벤트 이름은 호스트 동작이 아니라 그 화면 `screen.commands`에 적은 명령 id여야 한다. 카탈로그 함수는 `navigate` 하나다(경로 `#/(fabric|hiss|governance|workspace)/<slug>/<slug>`).

**데이터 원천**

| 원천 | 쓰는 곳 |
|---|---|
| `service.summary` · `service.instances` · `service.claims` | 개요(A2UI 포함) |
| `service.consumers` | 고정 틀 개요만(A2UI 제외) |
| `instance.summary` · `.status` · `.events` · `.claims` · `.plans` · `.storage` | 세부 화면 |
| `instance.metrics` | 세부 화면 `trend` 블록 · A2UI. `screen.metrics[]`(scope `pod` 또는 `persistentvolumeclaim`)가 있어야 한다 |
| `command:<moduleId>.<cmd>` | 읽기 명령 결과. 모듈 id 접두사는 core · hiss · delivery · provider · engine · runtime · assembly · ui · product(A2UI · 명령 블록은 osr도) |

- A2UI 표 원천: `service.instances` · `service.claims` · `instance.claims` · `instance.events` · `instance.plans` · `instance.storage`
- 필드 목록은 호스트 계약 `sources`에 있다.

**A2UI 한도:** 문서 262,144바이트 · 컴포넌트 2,000 · 깊이 32 · 행 500 · 계열 10 · 점 2,000 · 렌더링 노드 5,000

**고정 틀 블록:** 개요 kpis · table · kv · note · actions, 세부 탭 kv · table · trend · events · command

**카탈로그 컴포넌트(24):** Text · Icon · Row · Column · List · Card · Tabs · Modal · Divider · Button · TextField · CheckBox · ChoicePicker · DateTimeInput(기본 14), DataTable · FactTable · TrendChart · EventList · StatusTag · Tile · Breadcrumb · Notification · CommandButton · Markdown(Carbon 10). 상류 A2UI 커밋 `24d1bf9`에서 만든다.

**Claim scheme:** `https` · `rediss` · `postgres`

**원형:** `stateful-engine/1`, `operator-cr/1`(operator API `stackgres-v1`: SGCluster, 포트 5432 → 6432, Claim은 SGScript)

## 부록 B. 원칙에 맞는지 확인할 호스트 계약 항목

호스트 계약에 **모듈 이름이나 Claim 종류를 이름으로 든 목록**이 남아 있다. 새 패키지가 여기에 이름을 더해야 동작한다면 §0-1(재빌드 0회)에 어긋난다. Codex 검토로 확정한다.

| 항목 | 지금 값 | 질문 |
|---|---|---|
| `nativeInstanceSlugs` | postgres · opensearch · rustfs | Valkey · Gitea 같은 새 패키지가 이 목록 없이 인스턴스 화면을 갖는가 |
| `actionProfiles` | `database` → stackgres-pg, `index` → opensearch-instance, `bucket` → rustfs-instance | 새 Claim 종류(`keyspace` 등)가 이 대응 없이 호스트 동작을 쓰는가. 원형 실행 판은 실행 문서로 대신하는가 |

이 둘이 레거시 판에만 쓰이면, P2에서 레거시 판을 지울 때 함께 지운다.
