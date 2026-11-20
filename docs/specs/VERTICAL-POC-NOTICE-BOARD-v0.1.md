# 공지 게시판 수직 PoC 명세 v0.1 (초안)

- 상태: 초안, 2026-11-21. 소유자 결정 대기(§10).
- 배경: 2026-11-21 소유자 지시. "Fabric · 어셈블리 · 거버넌스 · 워크스페이스로 이어지는 흐름이 각 계층에서 이름만 있는 간단한 화면이라도 완성되어야 수직 흐름 PoC가 완성된다. 사용자는 워크스페이스를 통해 서비스를 받아야 한다."
- 직전 시험(2026-11-21)은 Fabric 수동 경로로 PG를 발급한 뒤 게시판을 kubectl로 띄우고 port-forward로 보게 했다. 어셈블리 · 거버넌스 · 워크스페이스를 건너뛰었고 사용자가 닿을 주소가 없었다. 이 명세는 그것을 대신한다.
- 규범: [ASSEMBLY-FABRIC-SUPPLY-v0.7](ASSEMBLY-FABRIC-SUPPLY-v0.7.md)(AF7), [TENANT-ASSEMBLY-SPEC-v0.1](TENANT-ASSEMBLY-SPEC-v0.1.md)(TAS), [ASSEMBLY-CATALOG-v0.1](ASSEMBLY-CATALOG-v0.1.md)(CAT), [GOVERNANCE-REFERENCE-ARCHITECTURE-v0.1](GOVERNANCE-REFERENCE-ARCHITECTURE-v0.1.md), [FOUR-PLANES](../overview/FOUR-PLANES.md), 결정 대장(OPENSPHERE-LAYER-BASELINE-v0.2 부록 A).

## 1. 완료 기준 (사람이 하는 일로)

| # | 누가 | 어디서 | 하는 일 | 보이는 결과 |
|---|---|---|---|---|
| 1 | 테넌트 관리자 | 회사 관리 콘솔 · 구성 구역 | 카탈로그에서 "공지 게시판" 어셈블리를 고르고, 계획(PG 자리 · 단계 목록)을 보고 MFA 한 번으로 승인 | 어셈블리 상태: 진행 → Active. Fabric 화면에 소유자 "어셈블리: 공지 게시판"인 PG 자원이 생김 |
| 2 | (자동) | — | Core가 계획을 정하고 실행부가 단계를 차례로 실행: PG 자리(기존 공용 · 새 인스턴스) → 발급 → 받을 곳 준비 → 게시판 엔진 설치 → 적합성 시험(엔진이 DB에 쓰고 읽음) | 사람이 kubectl을 쓰지 않는다 |
| 3 | (자동) | — | Active가 되면 리소스 유형 `portal.notice-board`와 용량을 Governance에 인계 | 배분 구역에 "공지 게시판"이 배분 가능한 리소스로 나타남 |
| 4 | Governance 소유자 | 회사 관리 콘솔 · 배분 구역 | `portal.notice-board`를 워크스페이스(사용자 · 팀)에 배정 | 배분 기록(누가 · 누구에게 · 언제) |
| 5 | 사원 | 워크스페이스 | 브라우저로 워크스페이스에 들어가 "공지 게시판"을 누름 | 플랫폼 HTTPS 주소에서 게시판이 열림. 글 쓰기 · 읽기. 사원 PC에서 실행하는 것은 없다 |
| 6 | Governance 소유자 | 배분 구역 | 배정 회수 | 그 사원의 워크스페이스에서 사라지고, 직접 주소로 들어가도 거절 |
| 7 | 테넌트 관리자 | 구성 구역 | 어셈블리 해체(MFA) | 엔진 정지 · 인도 철회 · 접근 폐기, 데이터 보존(AF-7). "데이터 보존 확인, 복원 미검증" |

1~7을 운영에서 한 번 끝까지 돌리면 PoC 완료다. 각 화면은 이름 · 목록 · 핵심 동작만 있는 간단한 화면으로 충분하다(소유자 지시).

## 2. 계층과 입구 (D-84를 따름)

| 입구 | 쓰는 사람 | 이 PoC에서 |
|---|---|---|
| Backbone 관리 Console | 플랫폼 운영자 | 지금의 Console. Fabric · OSR 스토어 · 설치 기록 |
| 회사 관리 콘솔 | 테넌트 관리자(구성 구역), Governance 소유자 · 위임 관리자(배분 구역) | **새로 만든다.** 구성 구역: 어셈블리 카탈로그 · 내 어셈블리 · 계획 승인. 배분 구역: 인계받은 리소스 · 배정 · 회수 |
| 워크스페이스 | 모든 사원 | **새로 만든다.** 내 앱 목록 · 앱 열기 |

- 관리 기능은 워크스페이스 메뉴 안에 넣지 않는다(BL:71).
- 테넌트 관리자 권한과 Governance 소유자 권한은 코드에서 따로 검사한다. PoC 동안 같은 사람이 둘 다 가질 수 있지만 권한을 하나로 합치지 않는다(AF7 Q7 권고).
- **입구의 위치와 사원 신원은 소유자 결정이다(§10 P1 · P2).**

## 3. 어셈블리 정의 (`assembly.notice-board`)

```yaml
kind: AssemblyDefinition
metadata: { name: notice-board, version: "0.1" }
spec:
  components:
    - name: board
      engine: { module: engine.notice-board, version: ">=26.11" }
      requires:
        - name: store
          service: { module: provider.postgres, version: ">=26.11 <27" }
          kind: database
          plan: { min: pg.small }            # 등급 카탈로그 전에는 공유 프로필 size-small
          storage: { sizeGiB: 1, maxGiB: 20 }
          connections: 5
          access: owner
          placement: { allow: [assembly, shared], suggest: assembly }
          deliver: { form: env-secret }
  offers:
    - resourceType: portal.notice-board       # Governance에 인계할 리소스 유형(CAT §3)
      actions: [use, admin]
      allocation: { units: [user, team] }
  conformance:
    - board-write-read                        # 엔진이 발급된 자격으로 글 하나를 쓰고 읽는다
```

- 서명된 OSR assembly artifact로 등록한다(실행하지 않음, OSR:81). 필요는 정의에만 적는다(AF-1).
- 리소스 유형 이름은 CAT §4 규칙(영역 접두어 `portal`, 제품명 금지)을 따른다.

## 4. 게시판 엔진 (`engine.notice-board`)

- **OSR 엔진 모듈**(서명된 패키지). 설치는 실행부가 설치 허용 범위대로 한다. kubectl로 띄우지 않는다.
- 내용: 정적 화면(공지 목록 · 쓰기) + DB 접근 API. PoC 판은 이미 클러스터가 쓰는 PostgREST와 nginx 이미지를 digest로 고정해 쓰고, 화면 · 설정은 패키지 안의 정적 층으로 싣는다. 별도 앱 이미지를 만들지 않는다.
- **새 설치 허용 범위 `engine.web-stateless` 0.1.0**(지금 어떤 설치 허용 범위도 상태 없는 웹 워크로드를 허락하지 않는다, AF7:402):
  - 허용 종류: Deployment(최대 2), Service(최대 2), ConfigMap(최대 2), Job(1, 초기화), NetworkPolicy. Secret은 만들지 않는다(접속 Secret은 ⑤가 인도).
  - 금지: Ingress · HTTPRoute(노출은 플랫폼이 한다, §6), ClusterRole · ClusterRoleBinding · CRD, privileged.
  - 엔진 namespace: `os-backbone-mod-engine-notice-board-<어셈블리 짧은 ID>`(실행부 경계 `os-backbone-mod-*` 안).
- 접속 정보는 AF7 §7.4대로 Secret으로 받고 env로 연결한다. 엔진 → 인스턴스 5432(pgbouncer)만 허용.

## 5. 어셈블리 계획 (PoC 판)

AF7 §7의 계획 · 상태 · 예약 · 점유 · 승인 대조를 그대로 쓰되, 이 PoC가 실제로 쓰는 단계만 만든다.

| 단계 | 내용 | 이미 있는 것 |
|---|---|---|
| ① 서비스 확인 | `provider.postgres`가 켜져 있어야 함. 꺼져 있으면 PoC 판은 멈춘다(켜기 포함은 AF-4, 다음 판) | 설치본 |
| ② 자리 | `assembly`: 새 인스턴스 `<어셈블리>-postgres`(준비 스크립트 포함), `shared`: 관리자가 공용으로 표시한 인스턴스 | 인스턴스 만들기(AF-I3) |
| ③ 발급 | Claim(owner `assembly:<UID>`) → 발급 SGScript | 발급(AF-I4) |
| ④ 받을 곳 준비 | 엔진 namespace(`os-backbone-mod-*`)와 그 안의 binding writer RoleBinding을 실행부가 만든다(AF7 ④ 그대로. 수동 경로의 운영자 준비와 다르다) | 실행부 경계 안 |
| ⑤ 인도 | 접속 Secret을 엔진 namespace에 | 발급(AF-I4) |
| ⑥ 엔진 설치 | `engine.notice-board`를 `engine.web-stateless`로 | 실행부(새 설치 허용 범위) |
| 시험 | `board-write-read`(엔진의 준비 · 쓰기 · 읽기 확인) | 새로 |

- 계획 하나에 MFA 한 번(AF-3). 승인은 단계 목록 전체의 digest에 묶인다. 웹훅(AF-13)이 모든 쓰기를 대조한다.
- PoC 판은 단계마다 Core의 시작 · 완료를 기록하고, 실패하면 Blocked로 멈춘다. 재개 · 보상(취소)은 해체(§1의 7)로 대신한다(PoC 판의 한계, §9).

## 6. 앱 노출 (사원이 브라우저로 닿는 길)

- 사원은 **워크스페이스 화면에서 앱을 누르고, 플랫폼이 낸 HTTPS 주소**로 들어간다. 주소는 플랫폼의 SSO 프록시(워크스페이스 게이트웨이)를 거친다(FP:279 제안을 PoC에서 처음 구현).
- 게이트웨이는 요청마다 ① 사원 세션 ② 그 사원에게 `portal.notice-board` 배정이 살아 있는지(Governance 배분 기록) ③ 어셈블리 Active를 확인하고, 엔진 Service로 넘긴다. 하나라도 아니면 거절한다. 그래서 배정을 회수하면 직접 주소로도 들어갈 수 없다(§1의 6).
- **주소 형태는 소유자 결정이다(§10 P3).** FP §6.3의 사원 앱 도메인(`사용자ID.회사-apps.net`)은 합의됐지만 도메인 · 인증서가 정해지지 않았다.

## 7. Governance 인계와 배분 (최소 기록)

- **인계**(AF7 §7.6): 어셈블리 Active 때 `{리소스 유형, 용량, 어셈블리 정의 generation, 활성 조건}`을 기록한다. Degraded면 새 배정을 막는다.
- **배정**: `{리소스 유형, 단위(user · team), 대상, 부여자, 시각, 상태(active · revoked)}`. 자기 승인 금지(D-9)는 PoC에서 "배정하는 사람 ≠ 받는 사원"으로 지킨다. 위험 등급 · 결재 흐름은 다음 판.
- 앱 권한은 SCIM 모양의 프로비저닝 경로로 간다(O2 §3, GMD §8). PoC 게시판은 자체 사용자 관리가 없으므로 게이트웨이 확인으로 대신한다. 서명된 Grant(D-31)는 인프라 배분용이라 이 배정에 쓰지 않는다.
- 앱 자신의 DB는 어셈블리 Claim이지 배분이 아니다(D-82, D-30 개정).

## 8. 화면 (최소)

| 화면 | 내용 |
|---|---|
| 회사 관리 콘솔 · 구성 구역 · 어셈블리 | 카탈로그(등록된 어셈블리), 내 어셈블리(상태 · 단계 진행), 추가(자리 선택 → 계획 → MFA 패널), 해체 |
| 회사 관리 콘솔 · 배분 구역 · 리소스 | 인계받은 리소스 유형 목록(용량 · 어셈블리 상태), 배정 목록, 배정 · 회수 |
| 워크스페이스 · 내 앱 | 배정받은 앱 타일. 누르면 §6 주소로 열림 |
| Fabric · PostgreSQL(있음) | 소유자 열에 "어셈블리: 공지 게시판", 어셈블리 소유 자원은 지우기 막힘(AF-I1에 있음) |

## 9. v0.7 · 결정 대장과 다른 점 (PoC 판의 한계)

| 기준 | PoC 판 | 이유 · 이후 |
|---|---|---|
| AF7 단계 DAG · 재개 · 보상 | 순서 고정, 실패 시 Blocked, 해체로 정리 | PoC 범위. AF-I7에서 |
| AF-4 서비스 켜기 포함 | 꺼져 있으면 멈춤 | 운영에 이미 켜져 있음 |
| 사원 신원 = Keycloak(D-56) | §10 P1 결정에 따름 | Keycloak 신원 어셈블리가 운영에 아직 없음 |
| Governance 결재 · 위험 등급(GMD §7) | 직접 배정 · 회수만 | 다음 판 |
| 사원 앱 도메인(FP §6.3) | §10 P3 결정에 따름 | 도메인 · 인증서 미정 |

## 10. 소유자 결정

| # | 항목 | 권고 | 대안 |
|---|---|---|---|
| P1 | 사원 신원 | PoC 동안 Backbone Auth에 **사원 계정을 따로** 두고, Console 관리자와 다른 세션 · 권한(워크스페이스만)으로 쓴다. 문서에 "B-1의 PoC 임시 예외"로 적고, Keycloak 신원 어셈블리가 들어오면 교체한다 | Keycloak 신원 어셈블리부터 먼저(큰 선행 작업) · 관리자 계정을 그대로 사원으로(분리 시험이 안 됨) |
| P2 | 입구 | 지금의 단일 입구(31443)에 **경로로 나눈다**: `/`(Backbone Console), `/company/`(회사 관리 콘솔), `/workspace/`(워크스페이스). 경로마다 로그인 정책이 다르다 | 입구(호스트 · 포트)를 셋으로 나눈다 |
| P3 | 앱 주소 | 같은 입구의 **`/workspace/apps/<앱>/` 경로**, 게이트웨이가 세션 · 배정을 확인하고 엔진으로 넘긴다 | 사원 앱 도메인(`*.회사-apps.net`)부터 정한다(도메인 · 인증서 필요) |
| P4 | 리소스 유형 이름 | `portal.notice-board` | 다른 이름 |

## 11. 구현 순서

| 단계 | 내용 |
|---|---|
| V1 | kubectl로 띄운 게시판 제거, 그 수동 Claim 해제(발급 해제 기능) |
| V2 | 설치 허용 범위 `engine.web-stateless` 0.1.0, 엔진 모듈 `engine.notice-board`(패키지 · 서명 · 등록), 실행부 엔진 설치 |
| V3 | 어셈블리 정의 등록, Core 어셈블리 계획(단계 · 승인 · 단계 시작/완료), 실행부 단계 실행, 적합성 시험 |
| V4 | 회사 관리 콘솔(구성 구역: 어셈블리 · 계획 승인 · 해체, 배분 구역: 리소스 · 배정 · 회수), Governance 인계 · 배정 기록 |
| V5 | 워크스페이스(사원 로그인 · 내 앱), 게이트웨이(§6) |
| V6 | 격리 확인 → 운영 반영(소유자 확인) → §1의 1~7을 운영에서 |
