# OS 통합 패키지 계약 v1

**상태:** 초안 2판(2026-11-24). Codex 검토(#82)를 반영했다. 소유자 승인 전이다.
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
6. **데이터 보존 없음(D-96).** 옛 실행 경로에서 새 실행 경로로 운영을 전환할 때 적용한다. 옛 인스턴스를 이행하지 않고, 승인된 전환 순서로 새로 만든다. 같은 실행 경로 안의 패키지 A→B 갱신과 멱등 복구에는 §8 · §7.6을 적용한다(인스턴스 유지).

## 1. 번들과 판정

| part | media type | 내용 | 필수 |
|---|---|---|---|
| `descriptor` | `application/vnd.opensphere.descriptor.v1+json` | id · class · plane · 표시 이름 · 설명 · 프로필 · 의존성 · 권한 요청 · contributions | 필수 |
| `manual` | `…manual.v1+json` | 문서 묶음(§3) | 필수 |
| `knowledge` | `…knowledge.v1+json` | 매뉴얼에서 만든 지식(§4) | 필수 |
| `commands` | `…commands.v1+json` | 소유자 명령(§5). 실행 가능한 `run`은 `owner-commands/v5`만 | 필수 |
| `extension` | `…extension.v1+json` | 메뉴 · 화면(§6), 계약 1.0~1.3 | 화면이 있으면 |
| `listing` · `listing-media` | `…listing.v1+json` · 불투명 묶음 | 스토어 설명(§2) | 권장 |
| `execution` | `application/vnd.opensphere.execution.v1+json` | 실행 문서(§7) | 실행이 있으면 |
| `static` · `static-index` | 불투명 묶음 · 색인 | UI 모듈(§6.4) | 선택 |

- **판정:** Node · Rust 두 판정기와 Setup 봉인 사본이 같은 공유 사례 · 계약 벡터로 같게 판정한다(거절 **이유**까지).
  - 새 형식은 반드시 세 곳과 공유 사례 · 벡터에 함께 들어간다.
  - 정규식은 ASCII 범위만 쓴다(`\s` · `\w` 금지 — Node · Rust 차이).
- **기존 판:** `commands` part는 지금 받는 기존 계약 판(v4)도 판정한다. 다만 run 없는 기존 판의 명령은 실행 목록 · 직접 호출에 나오지 않는다.
- **정규 바이트:** `execution` part는 정규 JSON 바이트로 판정한다(레이어 바이트가 정규 직렬화와 다르면 거절). 다른 part의 형식 · 정규 바이트 요구는 part마다의 규칙을 따른다.
- **등록:**
  - 카탈로그를 받으면 carrier가 각 항목의 번들을 GHCR에서 받아 등록한다. 실패하면 "등록 실패: 사유"로 보인다.
  - 등록 응답만 믿지 않고 **원장을 다시 읽어** part · digest · 문서를 대조한다(저장 실패에도 `200 formal`이 날 수 있음).
- **게시 관문:** `execution` part가 든 번들의 운영 게시는 `host-contract.json` `productionExecutionRenderers`에 렌더러 판이 있을 때만 된다. 이 목록은 소유자 승인 PR로만 바꾼다. `5ea0c0a`에서는 빈 목록이고, 게시 도구(`scripts/osr/publication-execution.mjs`)가 새 실행 문서의 운영 게시를 막는다.
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

- **목록:** 호스트 명령 + 활성 · 미회수 번들의 **재검증된 v5 `run` 항목**이다. 동적 목록과 직접 호출이 같은 기준을 쓴다.
  - 옛 판 · 내림 · 회수 판, run 없는 기존 계약의 명령은 목록에서 빠지고 **직접 호출도 404**다.
- **명령 항목**
  - `id`: 모듈 id로 시작
  - `kind` · `mutation` · `effect`(none · read-cost · mutation · destructive)
  - `arguments`(닫힌 스키마) · `output`(스키마)
  - `requiredPermissions` · `scope`
  - `run: {"via":"archetype"}` 또는 `{"via":"package-job","job":"<id>"}`
- **실행 가능한 run은 번들의 검증된 `execution` 문서를 요구한다.**
- **권한:** `requiredPermissions`를 디스크립터 요청 · 서명 프로필 capabilities · 클래스 정책과 대조하고, 호출자 권한 · 대상 범위를 Core가 원장으로 확인한다.
- **archetype 읽기:** `effect: none`, 설치본 범위, 빈 인수, 모듈 id 뒤의 정확한 `status` 또는 `inspect`만 된다.
  - **출력은 원장 사실의 투영이다:** 설치본 id · 번들 digest · 모듈 · 판 · 활성 상태 · 선택한 인스턴스 이름, `inspect`는 namespace까지.
  - Ready · 재시작 · 프리셋 · 저장 · TLS 지문은 Shell 응답이 아니다(화면 데이터 원천 `instance.*`로 본다).
  - `effect: read-cost`로 실행되는 archetype 읽기는 없다.
- **package-job 명령:** 인스턴스 범위의 변경 · 파괴 명령만 된다(`mutation: true`). 명령 Job에는 Secret을 주지 않는다. Job이 인스턴스 망을 요청하면 선언 범위와 CA를 적용한다. 명령 Job과 Claim Job은 서로 바꿔 쓸 수 없다.
  - 그래서 **엔진 안을 읽는 명령(예: 조직 목록)은 지금 낼 수 없다.** 부록 C-5.
- **실행 경로**
  - 읽기: 정책 · 감사(MFA 없음)
  - 변경 · 파괴: 전용 Core 접수(p7) → 계획에 설치본 · 번들 · 명령 문서 digest · 명령 id · 검증된 입력 · 대상 · fence · 프로필 지문 · 실행 결합을 고정 → MFA
  - 승인자 설정이 있는 파괴 명령은 P3 독립 승인을 받는다.
- **한도:** 입력 · 출력 JSON은 각각 65,536바이트. Job 종료 메시지 경로는 결과를 감싼 전체 JSON 4,096바이트.
- **결과:** 실행 뒤 완료는 접수 때 고정한 증거와 원래 Job UID로 대조한다. 실행 중 회수 · 신뢰 변경이 있어도 기록한다. 판단할 수 없으면 `unknown`으로 닫는다.
- **CLI:** `os <module> <command>` · 도움말 · 인수를 서버 목록에서 만든다. CLI에는 모듈 명령을 박지 않는다.
  - 남은 예외: PostgreSQL `cluster.create` 영수증 판정은 E5b-2에서 지운다.
- **운영 실측(2026-11-24, A단계 반영 뒤):** 운영 모듈은 모두 `owner-commands/v4`(설치 단위 표준 8개: status · inspect · plan · apply · verify · operation · rollback · retire)이고 `run`이 없다. 그래서 운영에서 실행되는 패키지 명령은 아직 없다.

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
- **렌더링 상한:** 차트 계열 10 · 계열당 점 2,000, 렌더링 노드 5,000
  - DataTable은 페이지당 최대 500행이고 전체 노드 예산도 적용한다.
  - 동적 List가 500행을 넘으면 그 블록이 한도 오류다.
  - 1.3 TrendChart 입력 오류는 그 블록만 "읽지 못함", EventList 500건 초과는 "표시 한도 초과"다.
  - 옛 고정 틀을 변환할 때는 읽을 수 없는 추이 점을 빼고 개수를 적으며, 이벤트는 최신 500건을 보인다.
- **데이터:** 호스트가 만든 데이터 모델의 `@path`만 쓴다.
  - 원천은 닫힌 목록이다(부록 A).
  - **선언 데이터 원천은 지금 Fabric 화면에서만 쓸 수 있다.** 다른 섹션의 A2UI 개요는 screenId로 읽기 단추만 묶는다.
  - `instance.*`는 `detailScreenId`가 가리키는 세부 화면 전용이다. `service.summary` · `.instances` · `.claims`는 Fabric 개요 · 세부에서 투영한다.
  - `command:` 원천은 같은 번들의 인수 없는 호스트 읽기 명령의 객체 출력이고, 화면당 16개까지다.
  - `service.consumers`는 옛 `fabric.service` 틀 전용이다.
  - List 항목은 상대 경로로 바인딩하고, 판정기가 항목 스키마로 확인한다.
  - 타입이 맞지 않으면 정적으로는 거절하고, 실행 중에는 "읽지 못함"이다.
- **지표:** 확장 선언의 지표 id + PromQL 틀이다. 호스트가 namespace · 인스턴스 라벨을 강제로 주입하고, Core가 영수증 · 생성 계획으로 범위를 다시 확인한다. 빈 선택자 · 고정 창 · 고정 집계만 쓰고 `offset` · `@` · `label_replace` · 하위 질의는 거절한다.
- **동작:** 두 종류이고 서로 섞지 않는다.
  - **Shell 명령:** Button · CommandButton · Tile의 명령 이벤트는 그 화면 `screen.commands`에 선언한 id와 입력만 쓴다.
  - **고정 호스트 동작**(부록 A): 서명된 `actions[].use`로 따로 선언한다. 호스트 이벤트는 context를 받지 않는다.
    - `5ea0c0a`의 1.3은 `actions[]`가 비어 있어야 한다.
    - **PR 194부터:** 개요 `instance.create`, 세부 `claim.issue` · `claim.release` · `instance.delete`. 호스트가 원장의 현재 인스턴스 후보만 보이고, 입력을 계획과 대조한 뒤 기존 MFA 승인을 연다. 선택 인스턴스가 바뀌면 초안을 거절한다.
  - **권한 · 효과 · 확인 · MFA는 호스트가 정한다.** 문서의 effect 주장은 무시한다.
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

- **원형이 고정하는 것(문서로 바꿀 수 없음):** 객체 이름 · 순서 · 라벨, 보안 컨텍스트(non-root · seccomp · capabilities 전부 drop · 토큰 없음), 준비 · 삭제 완료 판정, namespace(`os-backbone-mod-<module>`)
- **`stateful-engine/1`의 고정 제약(새 엔진이 먼저 부딪히는 곳)**
  - 준비 판정은 엔진 **단일 포트에 HTTPS GET**이다. RESP(Valkey) · LDAP(Samba AD)처럼 HTTP가 아닌 TLS 포트는 판정할 수 없다 → 부록 C-1
  - StatefulSet마다 데이터 PVC 템플릿을 늘 만들고, TLS 초기화도 데이터 경로를 쓴다. 데이터 PVC 없는 엔진은 지금 없다 → 부록 C-3
  - `envFrom`은 인스턴스 자신의 자격에만 쓴다. 다른 패키지 Claim의 소비자 Secret을 엔진에 넣는 길은 없다 → 부록 C-4
  - 고정 init 단계는 TLS 준비뿐이다. 엔진이 PVC에 첫 파일을 만들어야 하면 승인된 이미지의 기동 코드가 해야 한다(기존 파일은 덮지 않음)
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
- **실행부:** 공통 역할은 각 고정 원형 ClusterRole 이름에 한해 `bind`만 허용한다(`escalate` 금지). 실행부는 그 역할을 모듈 namespace에서 자기 SA에 묶는다.
  - 원형에 따라 Secret create · delete를 허용한다. stateful-engine의 채택은 지정 주석 하나의 PATCH로 한정한다(CEL이 그 키만 허용).
  - operator-cr TLS Secret은 읽기 · PATCH 없이 만들고, 지울 때 소유 · UID를 대조한다.
- **패키지 워크로드 · Job:** RoleBinding · API 토큰이 없다(`automountServiceAccountToken: false`). stateful-engine Pod는 데이터 PVC를 쓰고, 패키지 Job에는 데이터 PVC를 주지 않는다.
- **스토어 접수 클래스는 지금 `ui` · `provider`뿐이다.** API가 필요한 컨트롤러(operator)를 내는 `hiss` 클래스 고권한 설치 경로는 **미래 계약**이다(D-88).
- **세밀한 제한:** 프로필 `rbac`(원형 Role의 부분집합) + Core 웹훅의 정확 일치
- **CEL · 정책:** namespace 라벨 + 접두사를 함께 요구한다(`&&`). 새 패키지는 ClusterRole · CEL · 웹훅을 바꾸지 않는다.

### 7.3 Job
- **용도:** `issue` · `release` · `verify`(Claim), `command`(Shell). 용도끼리 바꿔 쓸 수 없다.
- **이미지:** 프로필 `jobImages`의 digest만 쓴다(운영자 별도 승인). 운영용 이미지는 저장소 원천에서 보호 main 관문으로 빌드 · 수용한다.
- **읽는 자격**
  - stateful-engine Claim: issue · release는 `engine-auth`, verify는 그 Claim의 `consumer`와 공개 CA만 받는다.
  - `stackgres-v1` Claim: issue · release Job에 엔진 관리자 자격과 엔진 망을 주지 않는다. 호스트가 고정 SGScript 틀로 엔진 효과를 만들고 `managedSql`을 확인한 뒤, verify가 소비자 자격으로 확인한다.
  - command Job에는 Secret을 주지 않는다.
  - 평문 자격이 저장되는 곳은 소비자 Secret과 stage Secret뿐이다.
- **망:** 망을 쓰는 Job은 승인된 인스턴스 하나 · 포트 하나만 쓴다. DNS는 None + 고정 hostAlias다.
- **결과:** 닫힌 결과 JSON이고 상한이 있다.
  - effect Job은 `done`을 낸다.
  - verify Job은 `connected` · `auth_rejected` · `transport_error` · `probe_error`만 낸다. **판정은 실행부가 한다.**
- **효과 확인**
  - 발급 성공: 소비자 자격으로 TLS 로그인 + 읽기 · 쓰기(`connected`)
  - **회수 성공: 같은 자격의 로그인 자체 거절(`auth_rejected`)만.** 연결 성공 · 전송 오류 · 시간 초과 · 분류 불가는 `unknown`이다. 403 같은 "로그인 뒤 거부"는 자격이 살아 있으므로 회수 성공이 아니다.
  - **verify 계약 판:** 위 판정은 verify **v2**다. `5ea0c0a`는 operator-cr에 v2를 강제하고, 기존 stateful-engine v1의 allow/deny도 호환으로 받는다. v1은 로그인 거절과 로그인 뒤 접근 거절을 실행부가 구별할 수 없다. **운영 안전 기준: 운영용 새 Job 이미지와 P1은 v2로만 검증한다.**
  - 남는 위험: 엔진 안 효과는 승인된 Job 이미지를 믿는 데서 끝난다. 호스트는 소비자 Secret · UID · 망 · 원장을 직접 확인한다.
- **멱등:** 실행부가 재시작해도 같은 Job UID를 잇는다. 실패한 회수는 작업마다 다른 Job 이름으로 다시 시도할 수 있다.

### 7.4 Claim
- **종류:** 실행 문서 `claims`에 선언한다(이름 `^[a-z][a-z0-9-]{1,40}$`, ≤6).
  - 활성화 트랜잭션이 검증된 문서로 선언을 채운다. 선언 밖 종류는 서버가 422로 거절한다.
  - 회수는 **원래 발급 기록의 종류**로 한다.
- **주소 scheme:** 닫힌 목록(`https` · `rediss` · `postgres`)
- **소비자 Secret:** 실행부가 봉투를 풀어 선언한 키만 쓴다. `*-engine-auth` 이름은 예약어다.
- **용량:** 인스턴스의 현재 원장 · 원형 한도로 **계획 · 접수 때** 확인하고, 화면에 남은 발급 가능 수를 보인다.
  - 공통 한도: 해제되지 않은 Claim이 **인스턴스당 10개**에 닿으면 원장이 발급을 거절한다(화면도 10 기준).
  - StackGres는 발급마다 참조 두 개를 쓰는 것을 감안해 참조 공간(127쌍) 예산도 확인한다.
  - 모듈별로 다른 한도가 필요하면 프로필 · 원장 · 화면이 같은 값을 집행하는 공통 계약이 먼저다 → 부록 C-6
- **회수된 패키지:** 패키지 코드 없이 소비자 Secret 삭제 · 망 차단 · 원장 종료로 끊는다. 엔진 안 정리는 "정리 대기"다. 멈춘 설치본이어도 원래 발급 기록만으로 끊는다.

### 7.5 TLS · CA
- **stateful-engine:** Claim이나 인스턴스 망을 쓰는 명령에 CA 기준이 필요할 때, 최초 생성 준비 또는 교체 복구 뒤 실행부가 엔진이 내보낸 사슬(leaf + 자기서명 CA)을 받아 Service DNS로 검증하고 사슬 · 지문을 원장에 기록한다. `<name>-ca` ConfigMap은 write-once다. 채택할 때는 기존 자격 · CA를 그대로 둔다. 이후 지문이 바뀌면 거절한다.
- **operator-cr:** 호스트가 인스턴스마다 CA를 메모리에서 만들어 서버 인증서에 서명하고 **CA 키는 버린다**. 서버 TLS Secret을 만들고, 지울 때는 원래 소유 · UID에 묶어 지운다.
  - 클러스터 망의 Service IP에서 SSLRequest → 사슬 · DNS · 지문으로 확인한다.
  - 소비자 연결은 `verify-full`이 끝까지 되어야 한다.

### 7.6 복구
- **응답 유실:** `unknown` + 점유를 유지하고, 별도 MFA 복구 계획으로 닫는다.
  - stateful-engine 자격 Secret: 워크로드가 없으면 교체, 있으면 주석만 바꾸는 채택이다(자격 · CA 유지).
  - operator-cr 인스턴스: 생성 응답이 불명확하면 MFA 재생성 계획이다(데이터 없음).
  - Claim: 원래 작업에 묶인 stage · 소비자 Secret을 승인 웹훅이 `oldObject`로 관찰한다. 소유가 맞으면 효과 근거를 채우고 회수로 닫는다. 두 Secret이 모두 없으면 전달 실패로 닫고 예약을 푼다. **엔진 안 효과가 없다고 그 사실로 단정하지는 않는다.**
- **코드 능력과 운영 검증은 따로 적는다.** 위는 `5ea0c0a` 코드의 능력이다. 운영 패키지마다 실제로 검증된 범위는 [모듈 통합 명세](MODULE-INTEGRATION-SPECS-v0.1.md)의 합격 시험 결과로 남긴다.

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

고정 호스트 동작은 `actions[].use`로만 선언하고 Shell id와 섞지 않는다. A2UI의 명령 이벤트 이름은 그 화면 `screen.commands`에 적은 명령 id여야 한다. 카탈로그 함수는 `navigate` 하나다(경로 `#/(fabric|hiss|governance|workspace)/<slug>/<slug>`).

**데이터 원천**

| 원천 | 쓰는 곳 |
|---|---|
| `service.summary` · `service.instances` · `service.claims` | 개요(A2UI 포함) |
| `service.consumers` | 고정 틀 개요만(A2UI 제외) |
| `instance.summary` · `.status` · `.events` · `.claims` · `.plans` · `.storage` | 세부 화면 |
| `instance.metrics` | 세부 화면 `trend` 블록 · A2UI. `screen.metrics[]`(scope `pod` 또는 `persistentvolumeclaim`)가 있어야 한다 |
| `command:<moduleId>.<cmd>` | 같은 번들의 인수 없는 호스트 읽기 명령의 객체 출력(화면당 16). 모듈 id 접두사는 core · hiss · delivery · provider · engine · runtime · assembly · ui · product(A2UI · 명령 블록은 osr도) |

- A2UI 표 원천: `service.instances` · `service.claims` · `instance.claims` · `instance.events` · `instance.plans` · `instance.storage`
- 필드 목록은 호스트 계약 `sources`에 있다.

**A2UI 한도:** 문서 262,144바이트 · 컴포넌트 2,000 · 깊이 32 · 행 500 · 계열 10 · 점 2,000 · 렌더링 노드 5,000

**고정 틀 블록:** 개요 kpis · table · kv · note · actions, 세부 탭 kv · table · trend · events · command

**카탈로그 컴포넌트(24):** Text · Icon · Row · Column · List · Card · Tabs · Modal · Divider · Button · TextField · CheckBox · ChoicePicker · DateTimeInput(기본 14), DataTable · FactTable · TrendChart · EventList · StatusTag · Tile · Breadcrumb · Notification · CommandButton · Markdown(Carbon 10). 상류 A2UI 커밋 `24d1bf9`에서 만든다.

**Claim scheme:** `https` · `rediss` · `postgres`

**원형:** `stateful-engine/1`, `operator-cr/1`(operator API `stackgres-v1`: SGCluster, 포트 5432 → 6432, Claim은 SGScript)

## 부록 B. 이름 목록 항목(확인됨, Codex #82)

새 패키지는 아래 두 목록에 이름을 더하지 않는다. **원칙(§0-1)에 맞다.**

| 항목 | 쓰임 | 새 패키지 | 지울 때 |
|---|---|---|---|
| `nativeInstanceSlugs` | 내장 세부 주소와 레거시 셀 링크 표 | 선언한 `navigation.detailScreenId`로 Fabric 일반 세부 라우트와 `?instance=` 북마크를 쓴다. 새 slug 등록 없음. 1.3 개요 표의 인스턴스 링크는 PR 194의 `recordedInstances` + 공통 `instanceRoute`가 채운다 | S3: 기존 북마크를 확인한 뒤 내장 라우트와 함께 지운다 |
| `actionProfiles` | 실행 증거 없는 옛 고정 틀의 형식 판정 · 투영 | 검증된 실행 문서의 engine · presets · claims를 쓴다. `keyspace` · `repository-org`를 넣을 이유 없음 | S3: 기존 판을 지울 때 함께 지운다 |

- **P1 확인 조건:** Valkey의 패키지 id · slug · Claim 종류가 두 목록에 **없는 상태로** 승인 · MFA · 발급 · 회수까지 시험한다.

## 부록 C. 호스트 변경 후보(공통 계약에 더할 것)

모듈 명세에서 드러난, 지금 계약으로는 안 되는 것이다. **하나씩 Backbone 판 하나가 필요하다.** 한 번 더하면 그 뒤의 패키지는 재빌드 없이 쓴다(원칙 §0-1이 말하는 "Backbone 자체 문제"). 필요한 모듈이 정해질 때 단위로 연다.

| # | 변경 | 필요한 모듈 | 내용 |
|---|---|---|---|
| C-1 | 공통 TLS/TCP 준비 판정 | Valkey · Samba AD | HTTPS GET 말고 고정된 선택지(예: TLS 핸드셰이크 + SAN 확인)를 원형에 둔다. 아니면 이미지가 계약에 맞는 HTTPS 준비 응답을 따로 내야 한다 |
| C-2 | `ldaps` scheme · LDAP 준비 판정 · 포트 | Samba AD | scheme 추가. 636은 포트 하한(1024) 밖이라 승인된 상위 포트를 쓸지 정한다 |
| C-3 | 데이터 PVC 없는 선택 | Keycloak | 원형에 명시적 선택과 그에 맞는 생성 · 삭제 · 준비 검증 |
| C-4 | 패키지 간 Claim 소비 결합(E7) | Keycloak · Gitea | 다른 패키지 Claim의 소비자 Secret · 공개 CA를 엔진에 전달하고 그룹 결합을 유지 |
| C-5 | 읽기 Job 경로 | Gitea(조직 목록) | 목적 표지 분리, 별도 서명 이미지 허용, 인스턴스에 고정한 최소 조회 전용 자격 · TLS · 망, 닫힌 결과 · 크기 · 감사 · 속도 한도. "효과 없음" 주장만으로 승인을 생략하지 않는다 |
| C-6 | 모듈별 Claim 한도 | Valkey(64 안) | 프로필 · 원장 · 화면이 같은 한도를 집행 |
| C-7 | 원형 화면의 섹션 범위 일반화 | Gitea를 Workspace에 둘 때 | 지금 1.3의 실행 원천 · 세부 · 호스트 동작은 Fabric 범위다. 인스턴스 소속 · 승인 대조를 유지한 채 섹션 범위를 넓힌다 |
| C-8 | capability 닫힌 선택 | Samba AD(non-root 실패 시) | 서명 프로필의 닫힌 옵션 + 원형 변경. privileged · hostPath · hostNetwork는 계속 금지 |
