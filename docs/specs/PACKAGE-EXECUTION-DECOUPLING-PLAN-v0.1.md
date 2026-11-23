# 패키지 실행 쪽 분리 · 기존 모듈 이행 계획(v0.1 초안)

**상태:** 초안. 소유자 결정과 검토를 기다린다.
**작성:** 2026-11-23 · Claude
**잇는 문서:**
- [패키지 확장 구조 v0.2](PACKAGE-EXTENSIBILITY-PLAN-v0.2.md)(X3 · X4 · X5)
- D-89 · D-90 · D-91

## 1. 어디까지 왔나

소유자 원칙(2026-11-23): "윈도우에 프로그램을 설치한다고 윈도우를 다시 빌드하지 않는다."

| 층 | 상태 |
|---|---|
| 메뉴 · 화면 · 레이어(표시) | **해결.** 서명된 확장 레이어 → 원장 → 메뉴 조회 · 선언형 화면(`fabric.service` · `section.notice`) · 레이어 옵션. OpenSearch · RustFS가 이 방식으로 운영 중이다 |
| 설치 · 인스턴스 · 연결 · 상태(실행) | **미해결.** 서비스마다 Backbone 코드가 있다 |
| 기존 모듈 | OpenSearch · RustFS만 확장 선언을 쓴다. PostgreSQL · Samba AD · Keycloak은 호환 표 + 내장 화면이다 |

## 2. 실행 쪽에 서비스별로 박혀 있는 것(2026-11-23 코드 조사)

새 종류의 서비스(예: Valkey) 하나를 넣으려면 지금 다음을 모두 고친다.

| 곳 | 서비스별로 박힌 것 |
|---|---|
| 배치 규칙 계약 | `materializer-profile` 스키마의 `mechanism` 목록(닫힌 형식) |
| 렌더러(`osr_render.rs`) | `mechanism_of` · `execution_plan` · `render` · `instance_within_profile` · `instance_limit` · `render_instance_writes`의 mechanism별 분기 |
| 객체 생성 | 모두 Rust 코드다. 저장 엔진의 StatefulSet · Service · Secret · ConfigMap(`osr_storage_provider.rs`), SGCluster · SGScript, Samba · Keycloak 전용 모듈 |
| 인스턴스 계획(`osr_install.rs`) | `new_instance_plan`의 서비스별 요청 형식 · 본문 · 연결 객체, `instance_outcome`의 원장 함수 선택 |
| 연결 발급 | PostgreSQL(`osr_issue.rs`, SCRAM · SGScript), Samba(directory-bind), OpenSearch · RustFS(Job 안에서 도는 `backbone-server osr-storage-claim`의 엔진 클라이언트) |
| 상태 읽기 | 실행부 `instance_status`에 손으로 쓴 읽기 넷(응답 모양도 서로 다름), 세부는 PostgreSQL 전용 |
| 실행부(`osr_executor.rs`) | 비시험 코드의 약 53%가 mechanism별(준비 판정 · PVC 이름 · 연결 실행) |
| 승인 대조 | `osr_admission.rs`의 종류별 API 서버 기본값 허용, `osr_core.rs`의 계획 형식 검사 |
| Console 원장 SQL | `claims.kind` CHECK, `instance_limit` · `reserve`의 프로필 목록, 서비스별 basis · done 함수(이행 009~020) |
| Core 원장 SQL | 서비스가 늘 때마다 `p7.accept`를 바꿔 객체 목록을 다시 정한다(core 008~019) |
| 실행부 매니페스트 | 엔진 namespace CEL 목록, 저장 엔진 프로필 목록, 실행부 egress 포트 |

- **배치 규칙(프로필)은 허용 목록일 뿐이다.** 객체 본문 · 포트 · 준비 판정 · 크기 프리셋 · 연결 방법이 없다.
- 일반화의 실마리는 이미 있다.
  - 저장 엔진 둘이 같은 StatefulSet 뼈대를 공유한다.
  - 연결 발급이 Job 안에서 돌아서 실행부는 엔진을 모른다.
  - 설치 적용 · 내리기 루프와 승인 대조 틀은 일반적이다.
- **같은 허용 목록이 여러 곳에 있다.** 레이어 묶음 표가 Node · Rust 판정기, Setup 사본, Console, 원장 SQL 023에 각각 들어 있다.

## 3. 목표

**새 패키지가 이미 있는 "실행 원형" 하나에 맞으면, Backbone 이미지 교체 · 원장 이행 없이 설치 · 인스턴스 · 연결 · 상태가 동작한다.**

- Backbone은 소수의 **실행 원형**(검토된 객체 틀 + 형식 있는 인자 + 준비 · 상태 규칙)과 승인 · 실행 경계를 가진다. 이것이 "운영체제 기능"이다.
- 패키지는 원형을 고르고, 인자(이미지 · 포트 · 환경 · 설정 파일 · 크기 프리셋 · 연결 방법 · 상태 필드)를 서명된 레이어로 낸다. 이것이 "프로그램"이다.
- 원형에 맞지 않는 새 종류는 원형을 더하는 Backbone 갱신이다. 이것은 패키지 갱신이 아니라 운영체제 갱신이다.

### 3.1 실행 원형(안)

| 원형 | 담는 것 | 첫 대상 |
|---|---|---|
| `stateful-engine` | StatefulSet + Service + 자격 Secret + TLS 설정 + 데이터 PVC, 크기 프리셋, 준비 · 기동 문제 규칙 | OpenSearch · RustFS(이후 Valkey · MongoDB) |
| `claim-job` | 연결 발급 · 회수를 서명된 패키지 Job 이미지로 실행. 입력은 단계 Secret, 출력은 선언된 키의 소비자 Secret, 망은 정해진 NetworkPolicy | OpenSearch · RustFS의 인덱스 · 버킷 |
| `operator-cr` | 승인된 operator의 CR 하나(+ 부속 CR). 준비 판정은 CR status 경로로 선언 | PostgreSQL(StackGres SGCluster · SGScript) |

- Samba AD · Keycloak은 형태가 특수하다(영역 · OU, 다단계 요청 묶음). 그래서 당분간 **호스트 내장 서비스**로 둔다(§6 Q3).

### 3.2 보안 경계(바뀌지 않는 것)

- 승인 계획의 digest가 렌더링된 객체 전부를 덮는다. 실행부 · 승인 웹훅은 같은 digest에서 같은 결과를 렌더링해 대조한다(X4(i)).
- 원형 인자는 닫힌 형식이다. 임의 YAML · 임의 경로 · hostPath · 특권 컨테이너는 받지 않는다.
- Core `p7.accept`의 객체 목록은 서비스별 SQL이 아니라 **승인된 계획의 객체 목록을 프로필 허용 목록과 대조하는 일반 규칙**으로 바꾼다. 서비스가 늘어도 Core 이행이 없게 한다.
- `claim-job`의 패키지 이미지는 엔진 관리자 자격으로 돈다. 그래서 공급자 릴리스 키로 서명된 이미지, digest 고정, 정해진 망 정책만 허용한다(§6 Q2).

## 4. 단계

| 단계 | 내용 | 끝났다고 보는 기준 | Backbone 갱신 |
|---|---|---|---|
| **E0 계약 단일 원천** | 레이어 · 묶음 · 동작 프로필 · 호환 표 · 데이터 원천 같은 허용 목록을 계약 파일 하나(`infra/contracts/osr/host-contract.json`)에서 Node · Rust · Console · SQL로 생성 | 목록 하나를 바꾸면 생성만으로 다섯 곳이 맞는다(시험). 지금 값과 같다 | 1회 |
| **E1 PostgreSQL 확장 선언** | PostgreSQL 새 판에 `extension.json`(stackgres-pg 동작 프로필은 이미 있음). 개요 · 인스턴스 · 연결은 선언형, 13탭 세부는 내장 유지 | 스토어 갱신만으로 PostgreSQL 메뉴 · 개요가 선언형이 되고 기존 탭 · `instance` 링크가 그대로 열린다 | 없음(패키지 갱신) |
| **E2 실행 원형 계약** | `runtime` 레이어 형식(원형 · 인자 · 프리셋 · 준비 규칙 · 상태 필드 · 연결 방법), 일반 `p7.accept`, 원장의 일반 함수(클래스 · 프로필 목록 대신 프로필 문서), 승인 대조의 원형별 기본값 | 설계 합의(소유자 결정 Q1 · Q2 · Q3), 두 판정기 · 시험 사례 | 1회(계약 · 원장) |
| **E3 `stateful-engine` 이행** | OpenSearch · RustFS를 원형으로 옮김 | 같은 입력에서 원형이 지금 Rust 코드와 **같은 객체**를 렌더링한다(정답 비교 시험). 운영 인스턴스 · 데이터 그대로. 그 뒤 Rust 분기 제거 | 1회 |
| **E4 `claim-job` 이행** | 엔진 클라이언트를 Backbone 바이너리에서 패키지 Job 이미지로 옮김, 연결 원장 일반화 | 인덱스 · 버킷 발급 · 회수 · 읽기쓰기 확인이 지금과 같다. Backbone 바이너리에 엔진 클라이언트가 없다 | 1회 |
| **E5 `operator-cr` 이행** | PostgreSQL 인스턴스 · DB 발급을 원형으로 | 기존 클러스터 · Claim 그대로. SCRAM · SGScript 경로가 원형 규칙으로 표현된다 | 1회 |
| **E6 새 서비스 실증** | Valkey(또는 MongoDB)를 `stateful-engine` + `claim-job` 패키지로만 추가 | **Backbone 이미지 교체 · 원장 이행 0회**로 설치 · 인스턴스 · 연결 · 상태 · 메뉴 · 화면이 동작한다 | **0회(목표)** |
| E7 Samba AD · Keycloak | 호스트 내장으로 둘지, 원형을 더할지 결정 | 소유자 결정 | — |
| 병행 X3 세부 화면 | 13탭 세부를 선언형으로(상태 필드 선언 위에) | PostgreSQL 13탭이 선언으로 같은 질문에 답한다 | 원형과 함께 |

- 순서는 위험이 낮은 것부터다. E0 · E1은 바로 할 수 있다. E2부터는 설계 합의가 먼저다.
- E3~E5는 **정답 비교**(지금 코드의 렌더링 결과 = 원형의 렌더링 결과)로 운영 객체가 바뀌지 않음을 먼저 보이고 옮긴다.
- 역할은 지금과 같다. 청사진 · 검수 · 운영 반영은 Claude, 구현은 Codex, 결정은 소유자다.

## 5. 위험

- **원형이 너무 넓으면 승인 대조가 약해진다.** 인자를 닫힌 형식으로 두고, 원형마다 렌더링 결과를 승인 digest로 덮는다.
- **패키지 Job 이미지 신뢰.** 엔진 관리자 자격이 패키지 코드로 넘어간다. 서명 · digest 고정 · 망 정책 · 단계 Secret 범위로 묶는다.
- **이행 중 운영 객체 변화.** 정답 비교로 막는다. 다르면 이행하지 않는다.
- **원장 일반화 중 예약 · 점유 · 감사 이력 손실.** C3(v0.2)대로 쓰기 이행은 보존을 확인한 뒤에 한다.
- **Backbone 갱신 횟수.** E0~E5 동안 단계마다 한 번씩 갱신이 있다. E6 이후 새 서비스는 갱신이 없게 하는 것이 목표다.

## 6. 소유자 결정이 필요한 것

| # | 질문 | 권고 |
|---|---|---|
| Q1 | 실행 쪽 분리 방식 | **실행 원형(형식 있는 템플릿) 먼저.** 패키지 컨트롤러(v0.2 X4(ii))는 쓰기 대조 모델이 정해진 뒤에 |
| Q2 | 연결 발급 코드를 패키지 Job 이미지로 옮기는 것 | 허용한다. 공급자 릴리스 키 서명 · digest 고정 · 정해진 망 정책일 때만 |
| Q3 | Samba AD · Keycloak | 당분간 호스트 내장 서비스로 둔다. 메뉴는 호환 표 유지. 세 번째 비슷한 서비스가 생기면 원형을 검토 |
| Q4 | 착수 순서 | E0 · E1부터(위험 낮음). E2 설계 합의 뒤 E3~E6 |
| Q5 | 첫 신규 서비스 실증 대상 | Valkey(저장 엔진 원형에 가장 가깝다) |
