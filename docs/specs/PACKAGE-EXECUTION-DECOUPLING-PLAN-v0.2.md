# 패키지 실행 쪽 분리 · 기존 모듈 이행 계획(v0.2)

**상태:** 소유자 결정(2026-11-23, D-92, "수정안대로"). v0.1에 [Codex 검토](PACKAGE-EXECUTION-DECOUPLING-PLAN-v0.1-REVIEW-CODEX.md)를 반영했다.
**작성:** 2026-11-23 · Claude
**역할:** 청사진 · 검수 · 운영 반영 · 전체 진행은 Claude, 구현은 Codex, 결정은 소유자다.
**잇는 문서:**
- [패키지 확장 구조 v0.2](PACKAGE-EXTENSIBILITY-PLAN-v0.2.md)(X3 · X4 · X5)
- D-89 · D-90 · D-91

## 1. 어디까지 왔나

소유자 원칙(2026-11-23): "윈도우에 프로그램을 설치한다고 윈도우를 다시 빌드하지 않는다."

| 층 | 상태 |
|---|---|
| 메뉴 · 화면 · 레이어(표시) | **해결.** 서명된 확장 레이어 → 원장 → 메뉴 조회 · 선언형 화면 · 레이어 옵션. OpenSearch · RustFS가 운영 중이다 |
| 설치 · 인스턴스 · 연결 · 상태(실행) | **미해결.** 서비스마다 Backbone 코드가 있다 |
| 기존 모듈 | OpenSearch · RustFS만 확장 선언을 쓴다. PostgreSQL · Samba AD · Keycloak은 호환 표 + 내장 화면이다 |

## 2. 실행 쪽에 서비스별로 박혀 있는 것(2026-11-23 조사 + Codex 정정)

| 곳 | 서비스별로 박힌 것 |
|---|---|
| 배치 규칙 계약 | `materializer-profile` 스키마의 `mechanism` 목록(닫힌 형식) |
| 렌더러(`osr_render.rs`) | `mechanism_of` · `execution_plan` · `render` · `instance_within_profile` · `instance_limit` · `render_instance_writes`의 mechanism별 분기 |
| 객체 생성 | 모두 Rust 코드다(`osr_storage_provider.rs`, SGCluster · SGScript, Samba · Keycloak 모듈) |
| 인스턴스 계획(`osr_install.rs`) | `new_instance_plan`의 서비스별 요청 · 본문 · 연결 객체, `instance_outcome`의 원장 함수 선택 |
| 연결 발급 | PostgreSQL(`osr_issue.rs`), Samba(directory-bind), OpenSearch · RustFS(Backbone 이미지로 도는 Job의 엔진 클라이언트) |
| 상태 읽기 | 실행부 `instance_status`의 손으로 쓴 읽기 넷, 세부는 PostgreSQL 전용 |
| 실행부(`osr_executor.rs`) | mechanism별 준비 판정 · PVC 이름 · 연결 실행 |
| 승인 대조 | Core가 점유 계획을 잠그고 `planned_writes` · `judge`로 판정한다. 종류별 API 서버 기본값(StackGres PG17 설정 42개, Service · StatefulSet · PVC · Job, Keycloak ServiceAccount 별칭)이 박혀 있다. Job은 실제 UID · 컨트롤러 라벨 관계도 본다 |
| Console 원장 SQL | `claims.kind` CHECK, `instance_limit` · `reserve`의 프로필 목록, 서비스별 basis · done 함수(이행 009~020) |
| Core 원장 SQL | **core 018**의 `p7.accept`가 서비스별 객체 목록을 만들고, 같은 파일의 `p7.admission_deleting`이 Claim 삭제 대상을 프로필별로 찾는다. **core 019** `p7.accept_storage_recovery`가 OpenSearch · RustFS를 직접 검사한다 |
| 실행부 매니페스트 | 프로필 목록이 ClusterRole과 실행부의 `bind` 권한을 정한다. CEL은 두 저장 엔진 namespace에서만 정해진 Secret · Job 작업을 허용하고, StackGres SQL을 막는 CEL이 따로 있다. 실행부 egress 포트도 고정이다 |
| 화면 · 게시 | 선언형 화면의 동작 프로필 · Claim 종류 · 주소 포트 · 전용 소유자 판정, 게시 스크립트의 RustFS · OpenSearch 분기, 번들 레이어 목록 |

- 배치 규칙(프로필)에는 적용 모듈 · 이미지 · 저장소 · 리소스 한도 · RBAC이 있다. **빠진 것은 객체 생성과 준비 · 발급 로직**이다.
- 일반화의 실마리는 이미 있다.
  - 저장 엔진 둘이 같은 StatefulSet 뼈대를 공유한다.
  - 연결 발급이 Job 안에서 돈다.
  - 설치 적용 · 내리기 루프와 승인 대조 틀은 일반적이다.
- 같은 허용 목록이 여러 곳(Node · Rust 판정기, Setup 사본, Console, 원장 SQL)에 중복돼 있다.

## 3. 목표

**새 패키지가 이미 있는 실행 원형 하나에 맞으면, Backbone 이미지 교체 · 원장 이행 · RBAC/CEL 변경 없이 설치 · 인스턴스 · 연결 · 상태가 동작한다.**

- 원형에 맞지 않는 새 종류는 원형을 더하는 Backbone 갱신이다. 이것은 "운영체제 갱신"이다.

### 3.1 실행 원형

| 원형 | 담는 것 | 첫 대상 |
|---|---|---|
| `stateful-engine` | StatefulSet + Service + 자격 Secret + TLS 설정 + 데이터 PVC, 크기 프리셋, 준비 · 기동 문제 규칙 | OpenSearch · RustFS, 이후 Valkey |
| `claim-job` | 연결 발급 · 회수 Job. **지금은 호스트 Job을 유지한다(Q2).** 패키지 Job은 §3.3 조건을 합의한 뒤에 쓴다 | 인덱스 · 버킷 · (Valkey ACL) |
| `operator-cr` | 승인된 operator의 CR 하나(+ 부속 CR), CR status 경로로 준비 판정 | PostgreSQL. SGCluster를 먼저 옮기고, DB 발급 · 회수는 따로 옮긴다 |

- Samba AD · Keycloak은 호스트 내장 서비스로 둔다(Q3). 원형으로 옮길지는 **그룹 소유권 · 중단 복구를 공통 원형으로 표현할 수 있는지**로 판단한다(E7).

### 3.2 보안 경계

- 승인 계획에 다음을 묶는다.
  - 번들 · runtime 문서 · 프로필 지문
  - 원형과 렌더러 판
  - 이미지 digest
  - 대상과 fence
- **Core가 신뢰하는 원형 · 프로필에서 동작별 쓰기 · 삭제 목록을 독립적으로 계산하고**, 제출된 목록과 정확히 맞춘다. 이것이 일반 `p7.accept`이고, `p7.admission_deleting` · 복구 경로도 같은 목록을 쓴다.
- 생성 자격은 형식과 슬롯만 승인에 묶는다. 작업 중 붙는 추적 주석은 승인 digest에서 파생시킨다.
- idempotency · 예약 · 점유 · 감사 · 복구의 원래 계획과 UID 대조는 그대로 둔다.
- 원형 인자는 닫힌 형식이다. 임의 YAML · 경로 · hostPath · 특권 컨테이너는 받지 않는다.

### 3.3 패키지 Claim Job의 조건(E4 전 합의)

- 원형 · 모듈 · Job 이미지 digest · 검증된 빌더를 묶은 **별도 승인**(일반 공급자 서명만으로는 부족)
- 최소 권한
- 데이터 PVC 마운트 제거
- 소비자 Secret은 지금처럼 실행부가 쓴다.
- 성공 판정은 Job 종료 코드에 더해 **호스트가 실제 효과를 확인**한다.
- 회수된 패키지의 남은 Claim을 그 패키지 코드를 다시 실행하지 않고도 끊을 수 있어야 한다.

## 4. 단계

| 단계 | 내용 | 끝났다고 보는 기준 | Backbone 갱신 |
|---|---|---|---|
| **E0 계약 단일 원천** | 허용 목록(레이어 · 묶음 · 동작 프로필 · 호환 표 · 데이터 원천 등)을 계약 파일 하나에서 Node · Rust · Console · SQL로 생성 | 지금 값 · 판정과 같다(생성 결과 비교). 이미 적용된 SQL 원본과 해시는 보존 | 1회 |
| **E1 PostgreSQL 확장 선언** | PostgreSQL 새 판에 `extension.json`. 개요 · 인스턴스 · 연결은 선언형, 13탭 세부는 내장 | 스토어 활성화, 기존 탭 · `instance` 북마크, 발급 · 회수 화면까지 시험한 뒤 "패키지 갱신만으로 됨"을 확정 | 없음(패키지) |
| **E2a 원형 계약 · 나란히 비교** | `runtime` 레이어 형식, 원형 판정, 서명 · 번들 · 원장 등록 · Setup 봉인 사본 반영. 기존 렌더러와 원형 렌더링을 나란히 비교 | 설계 합의, 두 판정기 · 시험 사례, 비교 결과 일치 | 1회 |
| **E2b 승인 경로 전환** | 일반 `p7.accept` · 삭제 · 복구, Services 원장 일반 함수, 실행부 · 웹훅의 전환 순서 | **판 혼재 · 되돌리기 시험:** 옛 판으로 승인된 계획을 판 교체 뒤 실행 · 회수 · 복구. 새 Core + 옛 실행부, 옛 계획 + 새 렌더러에서 무엇을 실행할 수 있는지 규칙과 시험 | 1회 |
| **E3 `stateful-engine` 이행** | OpenSearch · RustFS | 설치 · 생성 · 삭제 · 복구 전체 `planned_writes`와 삭제 순서, API 서버 기본값이 적용된 객체의 `judge`가 같다. 운영 전환에서 StatefulSet · PVC · PV · Secret UID와 데이터 보존. 그 뒤 Rust 분기 제거 | 1회 |
| **E4 `claim-job` 패키지화** | §3.3 조건 설계 · 합의 뒤 엔진 클라이언트를 패키지 Job으로 | 인덱스 · 버킷 발급 · 회수 · 읽기쓰기가 같다. 소비자 Secret 쓰기 실패 · 실행부 재시작 · 같은 이름 Secret 충돌 시험. 회수된 패키지의 Claim 정리 경로 | 1회 |
| **E6 새 서비스 실증** | Valkey를 `stateful-engine` + `claim-job` 패키지로만 추가 | **Backbone 이미지 · 원장 이행 · RBAC · CEL · 역할 배치 변경 0회**로 설치 · 인스턴스 · 연결 · 상태 · 메뉴 · 화면이 동작. Valkey 연결 = ACL 사용자 + 키 범위: 교차 접근 거절, 이미 인증된 연결까지 회수, 재시작 뒤 ACL · 데이터 보존 | **0회(목표, E4가 전제)** |
| **E5 `operator-cr` 이행** | PostgreSQL. **E5a** SGCluster 인스턴스, **E5b** DB 발급 · 회수(SCRAM · SGScript · 실제 로그인 확인 · Keycloak 그룹 연동) | 기존 클러스터 · Claim · 진행 중 계획이 새 경로에서 검증된 뒤 Rust 분기 제거 | 각 1회 |
| E7 Samba AD · Keycloak | 원형으로 옮길지 결정 | 그룹 소유권 · 중단 복구의 원형 표현 가능성 | — |
| 병행 X3 세부 화면 | 13탭 세부를 선언형으로 | PostgreSQL 13탭이 선언으로 같은 질문에 답한다 | 원형과 함께 |

- **순서:** E0 · E1(병행 가능) → E2a → E2b → E3 → E4 → E6 → E5 → E7
- 전환마다 **렌더 결과의 동등성**과 **운영 상태 보존**(실제 쓰기 목록 · 객체 UID · 볼륨 · 데이터)을 따로 증명한다.

## 5. 위험

| 위험 | 대응 |
|---|---|
| 원형이 넓어져 승인 대조가 약해짐 | 닫힌 인자, Core의 독립 계산 · 정확 일치 |
| 패키지 Job 이미지에 엔진 관리자 자격 위임 | §3.3 조건 전에는 하지 않음(Q2) |
| 렌더 결과가 같아도 적용 과정에서 필드 소유권 · 기본값 · 컨트롤러 동작이 다름 | 전환 전후 실제 쓰기 목록 · UID · 볼륨 · 데이터 기록 |
| 판 혼재 · 되돌리기에서 점유 · 미확정 효과 손실 | E2b 합격 기준 |
| 회수된 패키지의 남은 Claim | E4 합격 기준(패키지 코드 없이 정리) |
| 원장 일반화 중 예약 · 점유 · 감사 이력 손실 | 쓰기 이행은 보존 확인 뒤(v0.2 C3) |
| 단계마다 Backbone 갱신 | E0~E5 동안은 불가피하다. E6 이후 새 서비스는 0회가 목표 |

## 6. 결정(D-92)

| # | 결정 |
|---|---|
| Q1 | 실행 원형(형식 있는 템플릿) 먼저. 패키지 컨트롤러의 쓰기 권한은 별도 결정 |
| Q2 | 지금은 호스트 Claim Job 유지. 패키지 Job은 §3.3 조건을 설계 · 합의한 뒤(E4) |
| Q3 | Samba AD · Keycloak은 호스트 내장 유지. 판단 기준은 그룹 소유권 · 중단 복구의 원형 표현 가능성 |
| Q4 | E0 · E1 → E2a → E2b → E3 → E4 → E6 → E5 → E7. E6은 E4가 전제 |
| Q5 | 첫 신규 서비스는 Valkey. 연결 = ACL 사용자 + 키 범위. 교차 접근 거절 · 기존 연결 회수 · 재시작 뒤 보존이 합격 기준 |
