# OS 화면 구성 표준 — A2UI(v0.1)

**상태:** 소유자 결정(2026-11-23, D-97, "권고대로 D-97")
**작성:** 2026-11-23 · Claude
**잇는 문서:** [OS 통합 재작성 v0.1](OS-INTEGRATION-REWRITE-v0.1.md)(D-95 · D-96) §3.5 · §6
**기준:** A2UI 사양 v1.0(https://a2ui.org/specification/v1.0-a2ui/, 2026-06), Apache-2.0
**역할:** 정의 · 검수 · 반영은 Claude, 구현은 Codex, 결정은 소유자다.

## 1. 결정

**A2UI를 OS 화면 구성의 중추 기술로 삼는다.**
- 범위는 페이지의 **내용**까지다. 화면 껍데기와 보안이 걸린 상호작용은 OS가 직접 그린다.
- 윈도우 비유로 말하면 **OpenSphere 카탈로그가 OS의 공용 컨트롤**이다. 패키지와 OS 페이지는 그 컨트롤을 조합한 **문서(데이터)**다.

| 단계 | 대상 | 방식 | 시기 |
|---|---|---|---|
| ① 패키지 화면 전부 | 스토어 패키지의 메뉴 화면 · 세부 탭 · 섹션 공지 | A2UI만 쓴다. 지금 고정 틀(`fabric.service` · `section.notice` · `fabric.instance-detail`)은 A2UI 템플릿으로 다시 구현하되 기존 선언은 그대로 받는다. UI 모듈(S2)은 A2UI로 표현할 수 없을 때만 쓴다 | **D-95 안(S4)** |
| ② OS 자체의 내용 페이지 | 섹션 홈 · 개요 · 상태 대시보드 · 스토어 상세 · 도움말 · 단순 설정 폼 | 고칠 일이 생길 때 하나씩 A2UI 문서로 옮긴다. 같은 카탈로그를 쓰고, 문서는 Backbone이나 ui 패키지가 낸다. 일부러 전부 다시 쓰지 않는다 | D-95 뒤, 기회가 생길 때 |
| ③ OS 껍데기와 보안 상호작용 | 레일 · 탐색 · 로그인 · MFA · 승인 · 계획 확인 창 · 레이어 드래그 순서 · 아이콘 라이브러리 · Setup | Angular로 직접 그린다. A2UI 화면에서는 카탈로그 컴포넌트로 불러 쓴다(예: 승인 단추). MFA · 확인 창은 언제나 OS가 띄운다 | 바꾸지 않음 |

## 2. 형식

- **문서:** A2UI v1.0의 surface 문서다. `createSurface` · `updateComponents` · `updateDataModel` 메시지를 정적인 하나의 묶음으로 담는다(REST 방식, 스트리밍 없음).
  - 패키지는 확장 선언의 화면 항목에 `kind: "a2ui"`, `catalog: "opensphere.carbon/v1"`, `surface`(문서)를 적는다.
- **사양 판:** v1.0으로 고정한다. 사양 판을 올리는 것은 OS 갱신이다.
- **카탈로그 `opensphere.carbon/v1`:** 우리가 **직접 만든다**(§6 조사 — 공개된 Carbon용 A2UI 카탈로그는 없다).
  - JSON Schema로 정의한 닫힌 목록이다. 렌더러는 모든 컴포넌트를 Carbon Angular 컴포넌트로 그린다.
  - **기본 카탈로그는 가져온다:** A2UI 카탈로그 연결(기본 카탈로그를 통째로 또는 골라서 가져오기)로 기본 컴포넌트의 스키마를 그대로 쓴다. 새로 쓰지 않는다.
    - 가져올 것: Text · Icon · Row · Column · List · Card · Tabs · Modal · Divider · Button · TextField · CheckBox · ChoicePicker · DateTimeInput
    - 가져온 컴포넌트도 그리는 것은 Carbon 컴포넌트다. 예: Button → `cds-button`, Tabs → `cds-tabs`, Modal → `cds-modal`
  - **Carbon 고유 컴포넌트만 더한다:**
    - DataTable(정렬 · 페이지 · 빈 상태 · 읽지 못함 상태)
    - FactTable(사실 표), TrendChart(`@carbon/charts`), EventList, StatusTag, Tile, Breadcrumb, Notification
    - CommandButton(선언한 Shell 명령 + OS 확인 · MFA)
    - Markdown(I3와 같은 안전 처리)
  - **Carbon 사용 규칙은 컴포넌트 안에 고정한다.** 패키지가 바꿀 수 없다.
    - 색 · 간격 · 글꼴 토큰, 상태 색의 뜻, 접근성(키보드 · 레이블)
    - AI가 만든 내용 표시(Carbon AI label 지침)
    - 패키지가 넣을 수 있는 것은 정해진 속성 값뿐이고, 스타일 값은 넣을 수 없다.
  - **넣지 않는 것:** Image · Video · AudioPlayer · `openUrl`은 처음 판에 넣지 않는다.
  - **원천과 판:** 카탈로그 스키마 JSON은 OS 계약 원천 `infra/contracts/osr/catalogs/opensphere.carbon-v1.json`에 둔다.
    - 두 판정기 · Setup 봉인 사본 · 렌더러 · (나중에) 에이전트가 같은 파일을 쓴다. E0의 생성 방식을 따른다.
    - 카탈로그는 OS 자산이다. 컴포넌트를 늘리면 카탈로그 판이 올라가고 Backbone도 갱신한다.
    - 외부 공개는 이번 범위가 아니다(나중에 공개할 만한 부산물로 기록만 한다).
- **데이터 바인딩:** `@path`는 호스트가 채운 데이터 모델만 가리킨다.
  - 데이터 모델은 호스트가 S1의 닫힌 원천(`instance.*`, `instance.metrics`, `command:<읽기 명령>`)과 패키지 섹션 문맥으로 만든다.
  - 패키지가 데이터 모델 값을 직접 넣을 수 있는 것은 정적 글자뿐이다.
- **동작:** A2UI `action` 이름은 그 화면에 선언한 Shell 명령 id만 가리킨다.
  - 읽기 명령은 정책 · 감사를 거친다. 변경 · 파괴 명령은 OS의 확인 · MFA 창을 띄운다(I1 경로).
  - 화면 이동(`navigate`)은 같은 섹션 안의 정확한 주소만 허용한다.
- **금지:** HTML · CSS · 스크립트, 외부 URL 불러오기, 함수 정의는 없다.
  - 카탈로그 함수는 렌더러가 정한 것만 쓴다(A2UI `allowedCallers` = `rendererOnly`).
  - 문서 크기는 화면마다 256KiB, 컴포넌트는 2,000개까지다.

### 2.1 착수 전 합의(2026-11-24, Codex 설계 메모에 대한 결정)

- **카탈로그 스키마 해석**
  - 공식 Basic 카탈로그 v1.0은 외부 `$ref` 등 지금 판정기가 그대로 처리하지 않는 형식을 쓴다.
  - 그래서 업스트림 파일을 **특정 커밋으로 고정해 저장소에 들이고**(`infra/contracts/osr/catalogs/upstream/a2ui-basic-v1.json` + 출처 · 커밋 · sha256), 빌드 때 생성기가 모든 참조를 풀어 **닫힌 단일 스키마**(`opensphere.carbon-v1.json`)를 만든다.
  - 두 판정기 · Setup · 렌더러는 이 생성본만 읽는다.
  - 생성기 `--check`는 두 가지를 검사한다: 생성본이 원천과 같은지, 그리고 업스트림의 제약(required · enum · 타입 · 범위)이 변환 중에 빠지지 않았는지. 빠지면 실패한다.
- **Fabric 서비스 화면의 데이터**
  - 데이터 모델의 원천에 S1의 인스턴스 원천과 함께 호스트 계약의 `service.summary` · `service.instances` · `service.claims`(필드 범위는 지금 `host-contract.json` `sources` 그대로)를 넣는다.
  - 고정 틀 셋을 A2UI 템플릿으로 바꿀 때, 기존 생성 · 삭제 · 발급 · 회수 단추는 **호스트 템플릿이 지금의 승인 경로에 그대로 연결**한다.
  - 새 1.3 패키지 문서의 동작은 그 화면에 선언한 Shell 명령만 부른다.
- **렌더링 상한(문서 크기와 따로)**
  - 목록 · 표 반복: 화면에 한 번에 최대 500행. 넘으면 DataTable 페이지로 나눈다.
  - 차트: 계열 10개, 계열마다 점 2,000개
  - 중첩 깊이: 32
  - 그려지는 노드 합계: 5,000
  - 넘으면 그 블록만 "표시 한도 초과"로 그리고, 나머지 화면은 그대로 둔다.
- **바인딩 판정**
  - 타입이 맞지 않는 `@path`: 정적으로 알 수 있으면 판정기가 거절하고, 실행 중에 드러나면 그 블록을 "읽지 못함"으로 그린다.
  - 다른 인스턴스 경로: 데이터 모델을 인스턴스마다 호스트가 만들기 때문에 처음부터 만들 수 없다.
  - 두 경우 모두 공유 사례에 넣는다.

- **구조 규칙(2026-11-24, S4-1 검수 결정)**
  - 모든 컴포넌트는 부모가 정확히 하나인 트리다(root 제외). 자식을 두 번 참조해 그려지는 노드를 불리는 구조를 막기 위해서다.
  - 깊이는 32 이하이고, 두 판정기가 같은 이유로 거절한다.
  - List 템플릿은 A2UI v1.0의 상대 경로로 항목을 바인딩할 수 있다. 판정기가 배열 원천의 항목 스키마로 타입을 확인하고, 배열 밖으로 나가는 경로는 거절한다.
  - **변경 명령의 확인 · MFA는 컴포넌트가 아니라 명령의 효과로 정한다.** 어느 컴포넌트가 불러도 렌더러가 OS 확인 · MFA를 띄운다.
  - 메시지 봉투도 v1.0 server-to-client 스키마를 업스트림에서 함께 고정해 대조한다.
  - 카탈로그 `functions`에 `navigate`(rendererOnly)를 선언한다.

### 2.2 진행 순서와 S4 나눔(2026-11-24 협의)

- **지금 진행 중인 단위는 그대로 마친다.**
  - 실행 · 명령 · 원장 · 판정 층(E2b · E4 · I1 · I2, E3의 실행 쪽)은 A2UI 영향이 없다.
  - E3의 OpenSearch · RustFS 세부 탭 선언(계약 1.2)은 S4가 그대로 받아 공통 A2UI 템플릿으로 그린다. 버려지는 작업은 없고, 더해지는 것은 변환과 브라우저 회귀 시험뿐이다.
- **순서:** PR 185 병합 → E3 격리 검증과 S4-1(계약)을 함께 → S4-2(렌더러) → S4-3(호환 · 활성화) → E5(PostgreSQL 13탭은 **처음부터 A2UI 1.3**) · G1 · P1 화면
- **S3(내장 화면 제거)의 범위:** 내장 Angular 화면(`fabric-*-page`) · 호환 표 · 중복 렌더러를 지운다. 다만 유효한 계약 1.0~1.2 선언을 A2UI 템플릿으로 바꾸는 변환은 남긴다.
- **각 단위의 A2UI 영향(Codex 확인):** 다시 해야 하는 단위는 없다.
  - 영향 없음: PR 185 고침 · TLS
  - 화면 부분만 바뀜: E3 · E5 · E7 · G1 · H3 · S3 · P1 · P2. 새 패키지 화면을 A2UI로 만들고, P2에는 "1.3 지원 호스트 먼저 · 기존 북마크 확인"을 넣는다.
- **S4는 PR 셋으로 나눈다.**
  - **S4-1 계약:** 카탈로그(기본 14 + Carbon 10 = 24), 계약 1.3, 두 판정기, Setup 봉인 사본, 공유 벡터, 업스트림 고정 · 생성기
  - **S4-2 렌더러:** Angular 22 · Carbon 어댑터, 데이터 바인딩, I1 명령 호출과 OS 확인 · MFA, 렌더링 상한, 브라우저 적합성 시험
  - **S4-3 호환과 활성화:** 고정 틀 셋의 A2UI 템플릿화, 기존 북마크 · 화면 회귀, 같은 Console에서 1.3 패키지 A→B 갱신. 1.3 패키지의 일반 활성화는 여기서 연다.

## 3. 렌더러

- **자체 구현:** 렌더러는 **Console(Angular 22)에 직접 둔다.**
  - 공식 `@a2ui/angular`(0.14.0, 2026-11)는 peer가 Angular `^21.2.5`라 지금 Console(22.2.5)에 들일 수 없다. 0.x라서 판도 자주 바뀐다.
  - 사양 v1.0의 문서 · 바인딩 · 동작 규칙을 따르고, 카탈로그 컴포넌트는 Carbon Angular 컴포넌트로 그린다.
- **적합성 시험:** 사양의 메시지 예제와 우리 카탈로그 예제를 렌더러 시험으로 둔다.
  - 공식 라이브러리가 Angular 22를 지원하고 1.x가 되면 바꿀지 다시 판단한다.
- **에이전트(R2D2 · MCP):** 이번 범위가 아니다. 같은 카탈로그를 쓰면 나중에 붙일 수 있게 카탈로그 스키마를 따로 낼 수 있는 형태로 둔다.

## 4. 판정

- **판정기:** Node · Rust 두 판정기와 Setup 봉인 사본이 카탈로그 스키마로 판정한다.
  - 판정 항목: 컴포넌트 종류 · 속성, 자식 참조(`root` 하나, 순환 없음, 고아 없음), `@path`가 데이터 모델 스키마 안인지, 동작이 선언된 명령인지, 크기 한도
- **공유 사례 · 계약 벡터:** 함께 낸다.
- **판 혼재:** 기존 계약 1.0 · 1.1 · 1.2 화면은 그대로 받는다. 새 판(1.3)에서 `kind: "a2ui"`를 연다.

## 5. 단위 S4

(PR 나눔은 §2.2. 아래 합격 기준은 셋을 합친 것이다.)

| 범위 | 합격 기준 |
|---|---|
| 카탈로그 `opensphere.carbon/v1` 스키마 · 렌더러 · 두 판정기 · 공유 사례 · Setup 봉인 사본 · 계약 1.3 | 두 판정기가 같은 사례를 같게 판정한다. 렌더러 적합성 시험을 통과한다 |
| 고정 틀 셋을 A2UI 템플릿으로 다시 구현 | 기존 OpenSearch · RustFS · PostgreSQL 화면과 북마크가 같은 Console에서 그대로 보인다(캡처 비교) |
| 패키지 A2UI 화면 | 같은 Console 빌드에서 시험 패키지 A → B 갱신만으로 화면 배치 · 표 · 차트 · 동작 단추가 바뀐다. 변경 단추는 OS의 확인 · MFA를 거친다 |
| 악성 사례 | 선언 밖 명령 · 다른 인스턴스 데이터 · 외부 URL · 과대 문서 · 순환 참조를 거절한다 |

- **순서:** I1 · I2 병합 뒤(동작이 Shell 명령에 기대므로). E3과는 함께 진행해도 된다.
- **P1:** Valkey · Gitea 화면을 A2UI로 만든다.

## 6. 조사 기록(2026-11-23)

**A2UI**
- **사양:** v1.0(2026-06), Apache-2.0, `a2ui-project/a2ui`(Google 주도로 보임)
- **방식:** surface · 컴포넌트 트리(인접 목록, `root` 하나) · 데이터 모델(JSON Pointer 바인딩) · `action` 메시지
- **전송:** 정해져 있지 않다. AG-UI · A2A · MCP · SSE · WebSocket · REST를 쓸 수 있고, 일반 REST JSON으로도 된다(LLM 없이).
- **카탈로그:** JSON Schema. 공식 문서는 운영 앱이면 **자기 디자인 시스템을 비추는 카탈로그를 직접 정의하라**고 권한다.
- **기본 카탈로그:** 18개다. 표 · 차트는 없다.
- **보안:** 선언만 있고 코드 실행이 없다. HTML · CSS · 스크립트를 보내지 않는다. 함수는 `allowedCallers`로 묶는다.
- **렌더러(npm):** `@a2ui/angular` 0.14.0(peer `@angular/core ^21.2.5`). `@a2ui/react` · `@a2ui/lit` · `@a2ui/web_core`는 0.15.0이다. 0.10 → 0.14가 몇 달 만에 나왔다.
- **우리 Console:** `@angular/core` 22.2.5, `@carbon/charts` 1.27.27

**Carbon용 A2UI 카탈로그 — 없음**
- npm(`a2ui carbon`, `a2ui catalog carbon`, `a2ui ibm`, `a2ui catalog`)에서 찾았다. 다른 디자인 시스템용 카탈로그(shadcn · Radix · Stage · Spectrum Charts · ECharts 등)는 있고, Carbon용은 없다.
- 웹(A2UI 문서 · Carbon 문서), Carbon MCP(Carbon 문서 · Carbon Labs)에도 A2UI 관련 항목이 없다.

**A2UI와 MCP**
- 따로 정한 전송 규격은 없다. 공식 가이드의 네 방식:
  - ① A2UI 버튼으로 MCP 도구 호출(`@a2ui/catalog-mcp` 0.0.3)
  - ② MCP 서버가 `a2ui://` 자원(`application/a2ui+json`)으로 화면 제공
  - ③ MCP Apps `ui://` 위젯을 A2UI 화면에 넣기
  - ④ 외부 MCP App 안에서 A2UI 그리기
- **개발용 공식 MCP 서버(생성 · 검증 · 카탈로그 탐색) — 없다.** Angular 전용 MCP도 없다.
- 비슷한 것은 공식 에이전트 스킬(`npx skills add a2ui-project/a2ui`), 저장소의 샘플 MCP 서버, 커뮤니티 `@maxhealth.tech/prefab`이다.
- 스토어 · 섹션 화면 렌더링에는 MCP가 필요 없다(Console이 원장의 서명된 선언을 그린다). MCP는 나중의 R2D2 · 에이전트 쪽 일이고, 이번 범위 밖이다. 외부 스킬을 개발에 쓸지는 따로 정한다.

**출처**
- https://a2ui.org
- https://a2ui.org/concepts/overview/
- https://a2ui.org/specification/v1.0-a2ui/
- https://a2ui.org/concepts/catalogs/
- https://a2ui.org/catalogs
- https://a2ui.org/reference/components/
- https://a2ui.org/specification/v0_10/catalogs/basic/catalog.json
- https://a2ui.org/ecosystem/renderers/
- https://a2ui.org/concepts/sdks/
- https://a2ui.org/guides/mcp-overview/
- https://a2ui.org/guides/a2ui-over-mcp/
- https://a2ui.org/guides/mcp-catalog/
- https://github.com/a2ui-project/a2ui
- https://docs.cloud.google.com/gemini/enterprise/docs/a2ui-agents/a2ui-component-gallery-reference
- https://carbondesignsystem.com/community/component-index/
- https://carbondesignsystem.com/building-blocks/core/components/ai-label/guidelines/
