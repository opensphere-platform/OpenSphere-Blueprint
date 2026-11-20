# Backbone 구체 설계와 책임 계약

상태: 기존 결정과 확인한 구현을 설명하는 기준 문서. **공급→테넌트 인도 중 미구현 부분은 제안**으로 분리한다. 기준과 근거는 [대장 입구](README.md), 현재 적용 여부는 [현황](IMPLEMENTATION-STATUS.md)을 따른다.

## 1. 정의와 네 면 안의 위치

**Backbone은 OpenSphere 자신의 관리 신원과 운영 원장을 가지고, 검증된 엔진·공급 능력, 플랫폼 관측·변경·업데이트·독립 복구를 책임지는 관리 제어면이다.** 단순 설치기로 축소하지 않는다.

- HISS는 네 면 아래의 바닥이며 Backbone이 운영한다(D-86). Fabric의 한 묶음으로 되돌리지 않는다.
- Fabric 공급 면은 엔진·버전·공급 풀·용량·기술 수명주기를 다룬다. 사용 면의 영역 자격·키·업무 데이터와 다르다.
- 테넌트 구성(어셈블리·연결·용량·검증·해체)과 Governance 배분(정의·할당·결재·회수)을 구분한다(D-82). Backbone은 그 업무 판단 정본을 소유하지 않는다.
- Backbone Execution Core는 **운영 승인·실행 정본**이다. 회사의 주문·회계 등을 소유하는 **업무 코어**와 다르다.
- 제품 R2D2는 관리 지원 에이전트다. 사원·고객 에이전트와 신원·workspace·자격을 공유하지 않는다. 개인 Jupiter 인스턴스와도 별개다.
- Nexus는 Backbone의 관리 공통 통제다. 전사 데이터 중계 버스, 영역 Governance PDP, 새 메시지 브로커가 아니다. 사원↔고객 교류는 별도 교류 계층 계약이다.

## 2. 논리 구성도

```text
운영자 ── Console / OS CLI·Shell ─┐
허용된 제품 R2D2 도구 ───────────┤  각각의 검증된 신원·최소 권한
                                ▼
                   등록된 관리 API / 계약
                                ▼
     Nexus: 현재 권한·plane/위임 확인 → 효과 전 감사 → 요청별 예산
                                ▼
                         기능 소유 모듈
                  ┌─────────────┴─────────────┐
             순수 조회/네이티브 소유자   보호된 변경: Execution Core
                                         승인·의도·멱등·revision·outbox
                                                   ▼
                                   Temporal / 제한 실행부 / 최종 소유자
                                                   ▼
                                    허용된 공급·운영 대상과 영수증
                                                   ▼
                                 원장 조정·관측·통지·작업 결과 보고

별도 수명주기: 독립 Setup → 최초 설치 / 같은 설치 재개 / 고정 업데이트 / 복구
별도 계약: Auth, 네이티브 데이터·전송, 내부 콜백, 최종 Owner의 전용 경로
```

모든 조회가 Core·Temporal을 거치는 그림이 아니다. 등록된 경로여도 모델이 실행할 도구가 자동으로 생기거나 새 권한이 생기지 않는다. 별도 경로는 보호 면제가 아니라 전용 소유자·신원·허용 행위·감사·실패 규칙을 갖는 경로다.

## 3. 구성요소와 데이터·권한 소유권

| 구성요소 | 실제 책임 | 금지/한계 | 주요 소스 위치(Backbone 저장소 기준) |
|---|---|---|---|
| Console / 관리 API | 단일 로그인·탐색·작업·상태 표시, typed 계약 입구 | 버튼 노출은 권한·승인 아님 | `console/src/`, `backend/server/src/console.rs` |
| Supabase Auth / 세션 | 관리 신원, 현재 세션·회원 확인, 서버 보관 세션 | 고객·사원 신원 자동 승격 없음 | `backend/server/src/console.rs`, `infra/setup/` |
| Nexus | 등록 action/plane, 현재 위임/회원 확인, 사전 감사, 추적, 요청별 자원 예산 | Management에 전 업무 세분화 RBAC를 추가했다고 주장하지 않음 | `bus.rs`, `policy.rs`, `nexus_routes.rs`, `contracts.rs` |
| Execution Core / PG | 운영 의도·승인·실행·멱등·revision·감사·outbox의 정본, 최종 보호 | UI·에이전트·알림이 최종 검증 대체 불가 | `backend/server/src/core.rs`, `execution.rs`, `release.rs`, `infra/nexus/`, `infra/execution/`, `infra/release/` |
| Temporal / dispatcher / worker | 승인된 장기 작업 조정, 네이티브 결과/영수증 관측 | 엔진 완료와 업무 성공 다름. 모든 외부 효과 exactly-once 보장 없음 | `backend/workflow/`, Core/outbox 계약 |
| Gitea / Actions | 소스·PR·필수 검사·빌드·불변 산출물 | 소스 Runner에 운영 배포 자격을 주지 않음 | `.gitea/workflows/`, `scripts/step3/`, `scripts/release/` |
| OS CLI / OS Shell | 기기·사용자 검증, typed 명령, 승인 증거 입력 | 무제한 cluster-admin 셸 아님 | `cli/`, `backend/server/src/cli_identity.rs`, `cli_agent.rs` |
| OpenShell / terminal gateway | 허용된 격리 실행·고정 증명 및 결과 수집 | 터미널 존재 ≠ 자유 명령·전체 배포 권한 | `execution.rs`, `broker.rs`, `setup/src/openshell-*.mjs` |
| R2D2 / OpenClaw | 요청 이해·지식/관측 도구·향후 허용된 변경 조정 | 현재 전기능 모델 자가 운영 미완료 | `r2d2*.rs`, `knowledge.rs`, `knowledge_mcp.rs`, `docs/r2d2/` |
| Magpie | 관리 영역 모델/공급자 관리·제한 호출·상태/비용 | 모델 결과는 승인 아님. 사원 키/데이터 자동 공유 없음 | `magpie*.rs`, `infra/magpie/` |
| Swallow / 이벤트 | 자체 Inbox·통지·상태 전달, 고정 구독자 fanout | 토큰 보유/통지 수신은 승인·임의 수신자 신뢰 아님 | `events.rs`, `source_events.rs`, `swallow.rs`, `docs/events/` |
| Foundation / 저장 프로필 | 지원 프로필·선택·검증·활성화 gate·공급 연결 | 아카이브 Provider 전체가 현재 활성화된 것은 아님 | `storage_setup.rs`, `docs/foundation/`, `setup/src/` |
| 관측 | 허용된 관리 건강·작업 지표와 상관관계 | 영역의 업무 내용·파일명·메일 제목 일괄 수집 권한 없음 | `docs/baseline/`, 관측 어댑터와 수집기 |
| Setup / 업데이트 / 복구 | 최초 설치·같은 설치 재개·봉인 산출물 적용·외부 복구 | 일상 Auth 장애 시 복구 권한을 일상 계정으로 합치지 않음 | `setup/src/`, `docs/setup/` |

파일 이름만 쓴 Rust 항목은 `backend/server/src/` 아래다. 코드의 실제 grant/SQL/신뢰 경계가 이 표보다 우선하며, 표가 실행 capability를 발급하지 않는다.

## 4. Nexus 요청 흐름과 전용 경로

### 4.1 일반 관리·위임 요청

1. 진입점이 신원·세션·기기/위임 증거를 검증하고 plane을 서버가 결정한다. 호출자 body의 actor/plane을 신뢰하지 않는다.
2. 등록된 typed action과 허용 binding만 선택한다. 카탈로그 descriptor는 실행 권한이 아니다.
3. 인계 시점에 현재 회원/위임 scope·회수를 다시 확인한다. 진입 후 권한 회수도 거절한다.
4. 소유자 실행 전에 필수 감사 기록을 남긴다. 사전 감사 실패 시 Owner를 호출하지 않는다.
5. 조회/변경/위임 예산을 구분하고, 실제 업무는 소유 모듈/Core에 인계한다.
6. `x-nexus-decision-id` 등으로 결정·결과를 상관시킨다. 네이티브 응답·헤더·stream을 임의로 재작성하지 않는다.
7. 최종 상태는 소유 원장·영수증으로 확인한다. 결과 감사의 bounded best-effort 실패가 이미 확인된 효과를 실패/무효로 뒤집지 않는다.

현재 공통 예산은 조회16, 변경4, 위임 root2다. 짧은 query/policy 단계 제한은 4초다. **변경 future나 원장을 조정하는 상태 조회 전체를 4초 후 취소하지 않는다.** Release/Execution/CI 상태 조회는 GET이어도 원장 투영 복구를 할 수 있다. native HTTP/DB 제한·실행 원장 규칙을 유지한다. 수치는 운영 처리량·SLA가 아니다.

### 4.2 별도 계약이 필요한 경로

| 경로 | 유지 이유 / 보호 기준 |
|---|---|
| Auth·최초 관리자·기기 로그인 | 로그인 전의 신원 성립 경로. native Auth/설치 증명·throttle·감사 계약을 적용 |
| REST·Storage·Realtime·Edge·파일/stream | 데이터 신원·RLS·객체/함수 정책과 native 전송 의미를 유지. 관리 dispatcher에 강제 편입하지 않음 |
| 내부 status/knowledge/secret 공급/통지 | 고정 출처·전용 토큰·허용 action. 관리 프록시에서 `/internal` 차단. 토큰만으로 모든 내부 경로 신뢰 금지 |
| Gitea webhook | raw body HMAC와 고정 이벤트 수신 계약. 사용자 승인이나 배포 지시로 취급하지 않음 |
| Core·네이티브 최종 쓰기 | 현재 승인·역할·키 세대·대상 revision·fence를 최종 Owner에서 강제 |
| Setup·복구 | 일상 Console과 분리한 독립 운영자 증명·설치 식별·복구 키·고정 산출물. 일반 웹 예외 API로 만들지 않음 |

AST 경로 단서/직접 호출 fingerprint 검사는 소스 드리프트 탐지다. 동적 문자열·trait 호출·외부 엔진·SQL 의미까지 완전 증명하지 않는다. 현재 검토 수치는43파일/305경로 단서이고38개 UI 행은 선언 목록이다. 어느 것도 전체 endpoint 수나 통제 적용률이 아니다.

## 5. 보호 승인과 Core 최종 검증

- 독립 운영자가 실제 Auth 주체와 이미 부여된 reviewer 역할을 확인해 승인 공개키를 등록·회수한다. 등록은 역할 부여가 아니다.
- 로그인 기기 키 표를 그대로 승인 신뢰 원천으로 재사용하지 않는다. Console이 승인 키를 임의 등록·교체할 수 없어야 한다.
- Core challenge는 설치/issuer, 주체·역할/키 세대, operation·stage, plan·artifact·target·decision, nonce와90초 만료를 묶는다.
- 독립 CLI가 issuer pin과 효과 요약·digest를 확인하고 OS 보안 저장소 키로 서명한다. 일반 조회에는 추가 사람 승인을 붙이지 않는다.
- Core가 issuer·사용자 서명과 현재 권한·revision을 확인하고 승인 원장·원문 서명 증거를 원자적으로 보존한다.
- 동일한 접수 서명 재제출은 기존 영수증으로 귀결된다. 회수된 키·다른 사용자·바뀐 계획은 거절한다. 이미 확정된 효과를 자동 취소하지 않는다.
- Console 침해에 대한 보호 승인 분리이지 Core/운영자/호스트/신뢰된 서명 클라이언트 침해까지 방어한다는 보장이 아니다. 하드웨어 비추출 키/WebAuthn 구현으로 표현하지 않는다.

## 6. 장기 실행·이벤트·결과 불명

- Request/Operation/Audit/Outbox는 기존 Core 원장을 재사용한다. 두 번째 범용 작업 원장을 만들지 않는다.
- 동일 주체·행위·멱등 키/같은 입력은 기존 작업으로 재개, 다른 의미 입력은 충돌이다.
- 승인·generation·대상 revision/fence를 최종 효과 지점에서 다시 확인한다. 취소는 이미 전달/확정된 효과를 “미실행”으로 바꾸지 않는다.
- 외부 응답 유실은 `unknown`이다. 원래 요청의 정확한 영수증/네이티브 대상 상태를 확인하기 전 새 키로 재전송하지 않는다.
- Magpie의 오래된 pending은 조회 시2분 기준으로 unknown 분류한다. 자동 실패·재실행 권한이 아니며 범용 자동 reconciler도 아니다. 정확한 원래 lease로만 늦은 응답이 정착한다.
- Gitea source 이벤트와 통지는 PG의 고정 subscriber inbox/ACK/lease/backoff를 이용한다. 공개 범용 publish/replay 권한으로 확대하지 않는다.
- 통지·엔진 history·로그는 실행 정본을 대체하지 않는다. 사용자 신원·secret·payload 본문을 감사 상관 필드에 복사하지 않는다.

## 7. 세션·저장·비밀값

Auth HTTP 응답 동안 DB 연결/트랜잭션·행 잠금을 점유하지 않는다. token refresh는 기존 암호화 세션 안의 단일 writer claim으로 직렬화한다. 응답 유실 뒤 다른 replica가 같은 refresh token을 다시 사용하지 않는다. 불명 claim 만료 뒤 재로그인이 필요할 수 있다. 과거 바이너리로 되돌리기 전에 불명 refresh를 정리하거나 재인증해야 한다.

저장은 적합한 기존 PG·제공 서비스 우선 재사용와 **관리자 선택형 프로필**을 함께 따른다. 저장 선택·검증·활성화는 서로 다르다. 최초 웹 선택 후 모드 재선택/reset/unlock을 허용하지 않으며, 변경은 별도 검토된 마이그레이션이다.

| 저장 대상 | 책임과 경계 |
|---|---|
| 관리 PG / Auth / Core / services | 관리 신원·원장·암호화 세션·서비스별 최소 SQL grants. Console의 Core DB 직접 접근과 승인 키 변경 금지 |
| Gitea | native Git 파일시스템/PVC 요구를 정식 프로필로 관리. 임의 S3/PG 치환 금지 |
| 파일·객체 | 권한·원문 bytes·Storage API 계약 및 복구를 검증. 객체 사본과 DB 정합성 구별 |
| R2D2 PG 후보 | 기존 PG에 전용 DB·제한 runtime role. state/agent/workboard/logbook/team-reports native PG 선택. **아직 운영 미적용** |
| R2D2 필수 로컬 자료 | workspace·산출물·SQLite anchor·기기 자격·업데이트/복구 journal은 upstream 필수 경계. application SQLite fallback을 추가하지 않음 |
| 비밀값 | 서버 보호/SecretRef·좁은 private pipe로 공급. 브라우저/API/Git/모델 프롬프트 평문 반환 금지. 복구 키는 암호문 옆에 저장하지 않음 |

PG 후보는 native beta.4를 재사용하며 별도 state/memory DB 엔진을 구현하지 않는다. PG19rc1은 upstream 정식 검증16–18 범위 밖이므로 scoped 실증과 전체 conformance를 구별한다. PG를 쓴다고 다중 Gateway active-active가 안전해지지 않는다. 한 Gateway 소유와 anchor+PG+파일의 짝을 보존한다.

## 8. R2D2 입장의 흐름과 아직 연결되지 않은 것

```text
관리자 요청 → 허용 범위 확인 → 지식/소스 검색 + 현재 관측 + 허용된 기억
           → 출처를 붙인 계획 → 등록된 도구 → Nexus/소유 모듈/Core 검증
           → 필요한 독립 사람 승인 → 제한 실행 → 실제 결과·영수증 확인
           → 작업 결과/출처 기록 → 사용자 보고
```

현재 지식은 bounded 검색/읽기·고정 main 소스 경로·현재 관측이다. semantic embedding/vector RAG 완료가 아니다. Memory protocol 준비와 제품 workspace에 실제 설치·재시작 후 기억 검증을 구별한다. 등록된 키/모델/역할·native schema 검증과 실제 모델 도구 turn을 구별한다.

도구 호출이 연결되지 않은 업무, 승인되지 않은 scope, 모델 미활성 상태는 명시적으로 거절/미구성으로 보여야 한다. 일반 OS shell·자유 SQL·cluster-admin·검사 완화 도구로 우회하지 않는다. 저장 첫 단계 완료 후에도 모델/Memory/변경 도구/전체 자가 운영은 별도 단계다.

## 9. 소스·발행·설치·복구

1. 기준 소스에서 분리 브랜치/격리 작업 공간 → 단위 commit/push → Gitea PR.
2. 필수 source 검사·라이선스/출처/advisory·native 빌드 검증. 실패한 필수 검사와 branch protection 우회 금지.
3. source SHA·version·OCI digest·로그·native 실행/패키지 증거를 결합해 불변 산출물 수용. 빌드 성공 ≠ 배포 승인.
4. 공개 Setup 버전 산출물을 검증·다운로드해 고정 설치에 적용. 원래 cluster/install/release/config 지문·UID/CAS·writer lock을 보존한다.
5. 변경 전 암호화 백업, migration marker, 실제 건강·원장·기존 관리자·PVC·TLS 보존을 확인한다. 같은 작업 재개는 기존 상태를 검증하며 무변경으로 끝날 수 있다.
6. unknown 작업에 자동 재실행/잠금 해제/하향 migration을 하지 않는다. 이미지 롤백과 DB/역할/issuer/파일 복원을 별개로 판단한다.
7. Console·Auth·Gitea·R2D2 없이도 읽을 수 있는 DevOps 소스 bundle/ZIP·OCI·암호화 복구본을 보존한다. 독립 키 보관·호스트 소실 실행은 별도 증거가 필요하다.

Backbone Gitea가 소스·CI 정본이다. GitHub 보존 원격은 **명시 push를 확인한 보존 사본**이며 자동 mirror 설정 완료가 아니다. 반면 **이 Blueprint 자체의 origin은 공개 GitHub**다. 두 저장소의 역할을 혼동하지 않는다.

## 10. 공급→테넌트 인도와 상위 신뢰 경계 — 보완 제안

다음은 D-82·D-86과 네 면 제안의 구체화이며 **현재 운영에서 전부 실행되는 API/CRD 계약이 아니다**.

| 단계 | 책임·필수 증거 |
|---|---|
| 공급 선언 | Backbone의 지원 엔진·버전·Profile/Pool·용량. 영역 업무 배분 판단 없음 |
| 테넌트 구성 | 영역 소유자가 어셈블리·Link·용량·검증·해체를 결정. Governance가 사원 배분을 대신 구성하지 않음 |
| 영역 인도 | 수신자·대상·기한·revision·멱등 키·서명·원래 UID·영수증을 묶고 임시 설치 자격을 폐기 |
| Governance 배분 | 영역의 주체/리소스 유형·한도·회수 결정, native 집행자 검증. Core 운영 승인 키와 영역 Grant/KMS/CA를 합치지 않음 |
| 관측·회수·복구 | 계약상 공급 지표, 신규 쓰기 차단→연결/자격 회수→보존/반출→승인된 삭제·자원 반환. 부분 완료는 영수증으로 재개 |

영역 내 키 생성·설치 자격 폐기만으로 공급자의 기술적 비접근이 증명되지 않는다. 노드/cluster-admin, Secret 읽기·exec·mount, operator·이미지 공급망, 백업 복원 권한을 함께 본다. 현재 D-38의 고객 별도 확인(기술 강제 아님)과 새 기술 보장 제안을 구별한다. Backbone 설치가 현재 이 권한을 모두 제거했다고 주장하지 않는다.

Genesis 부분 완료·응답 유실에 “전체 폐기 후 재시작”을 자동 적용하지 않는다. timeout/재시도/DLQ는 결과 불명 해소가 아니며, 소유 엔진의 정확한 상태와 영수증을 먼저 대조한다.

## 11. 운영 Console UX 요구사항 — 2026-11-20 소유자 요청 반영

[운영 UX · 관리 기능 수용 요구사항](../specs/OPENSPHERE-OPERATIONS-UX-REQUIREMENTS-v0.1.md)의 UX-01~10을 적용한다. Backbone 기능 전체는 Configuration 안에 배치하고 상위 테넌트 구성·Governance·Workspace의 책임은 유지한다. 대상 관계·실행 단계·운영 증거·의존성과 완료 수준을 먼저 연결한다. 버튼 노출은 승인이나 권한이 아니며 독립 Setup·복구 경로를 일상 Console에 종속시키지 않는다. 요구사항 반영이며 구현·운영 완료 표시가 아니다.
