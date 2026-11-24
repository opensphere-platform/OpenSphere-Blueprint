# 모듈 통합 명세 v0.1

**상태:** 승인(2026-11-24, D-98). 모듈마다 제공 기능(§x.2)과 결정(§x.11)은 소유자가 권장안대로 승인했다. Codex 검토(#82)를 반영했다. 나머지는 [OS 통합 패키지 계약 v1](OS-INTEGRATION-CONTRACT-v1.md)을 이 모듈에 적용한 결과다.
**작성:** Claude. 구현 관점 검토는 Codex.
**기준 코드:** Backbone main `5ea0c0a`(운영 반영), PR 194(검수 중)는 밝혀 적는다.

## 0. 이 문서가 정하는 것

- 계약 v1은 **어떻게** 합류하는지(형식 · 권한 · 판정)를 정한다. 이 문서는 모듈마다 **무엇을** 내는지 정한다.
- 패키지 구현은 이 명세를 넘지 않는다. 명세에 없는 명령 · 탭 · Claim 종류 · 권한은 먼저 이 문서를 고치고 승인을 받는다.
- 명세가 바뀌어도 Backbone은 다시 빌드하지 않는다. 새 원형 · 데이터 원천 · 호스트 동작 · 카탈로그 컴포넌트가 필요할 때만 계약 v1과 Backbone이 바뀐다. 그 경우 명세에 **"호스트 변경 필요"**로 적는다.

## 1. 공통 틀

모듈마다 아래 순서로 쓴다.

| 절 | 내용 |
|---|---|
| x.1 정체 | id · class · 레이어 · 섹션 · 원형 · 의존 패키지 |
| **x.2 제공 기능** | 사용자에게 주는 능력. 소유자 승인 |
| x.3 스토어 설명 | 요지, "권한과 자원"에 보일 사실 |
| x.4 매뉴얼 · 지식 | 문서 목록, 지식에 넣을 범위 |
| x.5 Shell 명령 | id · effect · 실행 경로(archetype / package-job) · 인수 · 권한 |
| x.6 화면 | 개요 블록, 세부 탭, 쓰는 데이터 원천, 동작 |
| x.7 실행 | 원형 값: 프리셋 · 저장 · 포트 · TLS |
| x.8 Claim | 종류 · scheme · 소비자 키 · 발급 효과 · 회수 효과 · 용량 |
| x.9 합격 시험 | 격리에서 무엇을 보이면 합격인가 |
| x.10 지금과 차이 | 운영 판과 목표의 차이, 그 차이를 메울 단위 |
| x.11 결정 | 소유자 결정(D-98) |
| x.12 알림 · 로그(v1.1 초안) | 선언 이벤트(id · 심각도 · 조건), 로그 형식(`json` · `text`와 필드 이름). 계약 v1 §10 · §11 |

**`status` · `inspect`:** 모든 모듈에 공통인 archetype 읽기다. 출력은 원장 사실의 투영(설치본 · 번들 digest · 판 · 활성 상태 · 인스턴스 이름, inspect는 namespace)이고, 엔진 상태는 화면 원천 `instance.*`로 본다(계약 v1 §5).

**호스트 변경 후보:** "C-n"은 계약 v1 부록 C의 항목이다. 그 항목이 Backbone에 들어가기 전에는 해당 기능을 낼 수 없다.

**effect 표기:** `none` 읽기 · `read-cost` 비용 있는 읽기 · `mutation` 변경(MFA) · `destructive` 파괴(MFA, 승인자 명단이 있으면 P3 독립 승인).

## 2. 모듈 목록

| § | 모듈 | 레이어 | 원형 | 상태 |
|---|---|---|---|---|
| 3 | PostgreSQL | Fabric | `operator-cr/1`(`stackgres-v1`) | 운영 레거시 판 · 새 판 PR 194 |
| 4 | OpenSearch | Fabric | `stateful-engine/1` | A단계에서 내림 · 새 판 PR 195 |
| 5 | RustFS | Fabric | `stateful-engine/1` | A단계에서 내림 · 새 판 PR 195 |
| 6 | Samba AD | Governance(지금 fabric-shared) | `stateful-engine/1`(C-1 · C-2, P1 뒤) | 운영 레거시 판 |
| 7 | Keycloak | Governance(지금 fabric-shared) | `stateful-engine/1`(C-3 · C-4) | 운영 레거시 판 |
| 8 | Gitea | Fabric › 배포 묶음 | `stateful-engine/1`(C-4) | **새 설계** · P1 증명 대상 |
| 9 | Valkey | Fabric | `stateful-engine/1` | **새 설계** · P1 증명 대상 |


**모든 기존 모듈에 공통인 차이**(§3~§7의 x.10에서 다시 쓰지 않는다)
- `listing.json`이 없다. 스토어 개요는 디스크립터 설명만 보인다 → 모듈마다 listing을 쓴다.
- 명령이 `owner-commands/v4` 설치 단위 8개다 → v5(`run.via`)로 옮기고, 설치 단위 명령(plan · apply · rollback · retire)은 호스트의 설치 · 갱신 · 내리기 흐름으로 대신한다. 남는 패키지 명령은 각 x.5에 적은 것뿐이다.
- 지식은 매뉴얼에서 자동으로 만들어진다. 매뉴얼을 고치면 지식도 바뀐다.
- 커밋된 프로필(`infra/contracts/osr/profiles/`)에 실행 제약 · `jobImages`가 없다 → 원형으로 옮기는 모듈은 새 프로필 판(운영자 서명)이 필요하다.

## 3. PostgreSQL

### 3.1 정체
- id `provider.postgres`, class provider, 레이어 Fabric(섹션 shared, slug `postgres`), 원형 `operator-cr/1`(`stackgres-v1`)
- 의존: HISS의 StackGres operator 1.19.5(패키지 의존이 아니라 원형 전제), 저장 프로필 `foundation.block-rwo`

### 3.2 제공 기능(승인됨)
1. PostgreSQL 17 인스턴스 만들기 · 지우기. 인스턴스 1개 구성, 프리셋 small(cpu 1 · 메모리 2Gi)
2. **DB Claim:** 앱마다 데이터베이스 + 소유 역할을 발급 · 회수한다. 연결은 `verify-full`만
3. 13탭 세부 보기(아래), cpu · 메모리 추이
4. **포함하지 않는 것:** 백업 · 복원(backups 탭은 "제공하지 않음"으로 보인다, D-96), 복제본 2개 이상, 확장(extension) 설치, 사용자 SQL 실행, 연결 풀 설정 변경

### 3.3 스토어 설명
- 요지: "앱별 데이터베이스를 발급하는 PostgreSQL. 연결은 인증서 검증(verify-full)만 허용한다."
- 권한과 자원: SGCluster 1 + 부속 CR(StackGres가 StatefulSet · Service · PVC를 만든다), 인스턴스 CA(호스트 발급, CA 키 폐기), Claim Job 이미지(issue · verify)

### 3.4 매뉴얼 · 지식
- overview · install(StackGres operator · 실행부 확인부터) · operations(앱 연결: Secret 키 · `verify-full` · `ca.crt`, 상태 확인) · troubleshooting(버튼이 꺼진 이유: 실행부 · 저장 프로필 · 인스턴스 한도) · commands

### 3.5 Shell 명령

| id | effect | 경로 |
|---|---|---|
| `provider.postgres.status` · `.inspect` | none | archetype |

인스턴스 · Claim 변경은 호스트 동작(`instance.*` · `claim.*`)으로만 한다.

### 3.6 화면(PR 194, A2UI 1.3)
- 개요: namespace 글, 인스턴스 표, Claim 표(`service.summary` · `service.instances` · `service.claims`)
- 세부 13탭: overview · connection · storage · monitoring(cpu · memory TrendChart) · topology · events · composition · databases · roles · sessions · backups · lifecycle · documentation
- 원천: `instance.summary` · `.status` · `.storage` · `.events` · `.claims` · `.plans` · `.metrics`
- 북마크 `?instance=`와 탭 주소는 그대로 이어진다

### 3.7 실행
- operator API `stackgres-v1`, postgresMajor 17, instances 1, TLS `host-instance-ca`
- 엔진 · 자격 · 마운트를 문서가 정하지 않는다(원형이 SGCluster로 렌더링)
- 소비자 연결 주소: 5432 → 6432(PgBouncer)

### 3.8 Claim
- 종류 `database`, scheme `postgres`
- 소비자 키: `host` · `port` · `database` · `username` · `password` · `sslmode`(`verify-full`) · `ca.crt`
- 발급: issue Job(자격 · 망 없음)이 무작위 비밀번호의 SCRAM 검증값만 낸다 → 실행부가 고정 SQL로 SGScript를 렌더링하고 SGCluster `managedSql` 참조를 더한다 → verify Job이 소비자 자격으로 TLS 로그인 + 읽기 · 쓰기(`connected`)
- 회수: 실행부의 고정 회수 SQL(release Job 없음) → verify가 같은 자격의 **인증 실패**(SQLSTATE 28P01)만 성공으로 본다. 28000 등은 `unknown`
- 용량: 인스턴스당 SGScript 참조 127쌍, 계획 때 확인 · 화면에 남은 용량

### 3.9 합격 시험
- HISS operator 전제 확인 → MFA 설치 · 생성 → Ready · CA → 발급 · 쓰기 · 읽기 → 회수 · 재접속 거절 → 다른 인스턴스 · cross-Claim 거절 → 이름 충돌 · 부트스트랩 · TLS 오류 → 실행부 재시작 이음 → A→B 갱신 때 인스턴스 유지 → 13개 북마크 → 삭제

### 3.10 지금과 차이
- 운영은 레거시 판(계약 1.1 고정 틀, 실행 문서 없음, 프로필 `provider.stackgres-pg` 0.5.0)이다.
- PR 194가 새 판을 낸다. 검수에서 확인할 것:
  - 세부 화면의 `claim.issue` · `claim.release` · `instance.delete`를 서명된 `actions[]`와 CommandButton으로 넣었다(da7e099).
  - 프로필 원천 `infra/contracts/osr/profiles/provider.stackgres-operator.json`을 더했다. 운영 Claim Job digest는 별도 승인이 남아 `jobImages`가 비어 있다. 그 전에는 Job을 선언한 운영 번들이 판정을 통과하지 않는다.
  - 격리 RKE2(번들 `sha256:003648d2…`): TLS Secret 응답 유실 복구 뒤 Ready, `verify-full` 읽기 · 쓰기, 실행부 재시작 뒤 같은 Job UID, 일반 · 복구 뒤 회수 `auth_rejected`, 기존 세션 종료, 삭제 · 정리 통과
- E5b-2 나머지: Keycloak의 그룹 의존을 새 DB Claim(`verify-full`)으로 옮긴 뒤 Rust · CLI `cluster.create` 영수증 분기를 지운다.

### 3.11 결정(D-98)
1. 첫 판은 small 하나
2. 복제본 · 백업은 범위 밖


## 4. OpenSearch

### 4.1 정체
- id `provider.opensearch`, 레이어 Fabric(slug `opensearch`), 원형 `stateful-engine/1`, OpenSearch 3.10.0

### 4.2 제공 기능(승인됨)
1. 검색 인스턴스 만들기 · 지우기(단일 노드, 프리셋 small · medium)
2. **색인 Claim:** 앱마다 색인 접두사에 한정된 사용자 · 역할을 발급 · 회수한다
3. 세부 보기: 개요 · 저장 · 이벤트 · 색인 · 생명주기(+ 목표: 추이)
4. **포함하지 않는 것:** 주 데이터 저장소 용도(매뉴얼에 명시), 다중 노드, 대시보드(OpenSearch Dashboards), 스냅샷, 플러그인 설치

### 4.3 스토어 설명
- 요지: "앱별 색인 범위를 발급하는 공용 검색 엔진. 원본 데이터 저장소가 아니다."
- 권한과 자원: StatefulSet 1 · Service 1 · 자격 Secret · 설정 ConfigMap · 데이터 PVC 1, Job 이미지(issue · release · verify)

### 4.4 매뉴얼 · 지식
- overview · install · operations(앱에 색인 발급: 앱 namespace · Secret 고르기, MFA) · troubleshooting · commands

### 4.5 Shell 명령
- `provider.opensearch.status` · `.inspect`(none, archetype)

### 4.6 화면
- 지금: 계약 1.2 고정 틀(개요 kpis · kv · actions · 인스턴스 표 · Claim 표, 세부 overview · storage · events · databases("색인") · lifecycle)
- 목표: 1.3 A2UI로 옮기고 monitoring 탭(heap · 디스크)을 더한다. 고정 틀도 그대로 받으므로 급하지 않다(결정 §4.11)

### 4.7 실행
- 엔진 uid 1000, 포트 9200(https), readiness `/_plugins/_security/health` 5초
- env `DISABLE_INSTALL_DEMO_CONFIG`, `OPENSEARCH_JAVA_OPTS`(프리셋 heap)
- 설정 `opensearch.yml`, 자격 `password`(생성 32바이트) · `internal_users.yml`(bcrypt 틀)
- 프리셋 small(500m/1Gi → 2/2Gi, heap 512m) · medium(1/2Gi → 4/4Gi, heap 1g)

### 4.8 Claim
- 종류 `index`, scheme `https`(PR 195에서 채운다)
- 소비자 키: `username` · `password` · `ca` · `url` · `index`
- 발급 → verify: TLS 로그인 + 색인 쓰기 · 읽기(`connected`)
- 회수 → verify: **401만** `auth_rejected`. 403은 자격이 살아 있으므로 `unknown`(#81)

### 4.9 합격 시험
- 발급 · 회수(401) · 다른 Claim 색인 접근 거절 · 재시작 이음 · 응답 유실 복구 · 갱신 때 인스턴스 유지

### 4.10 지금과 차이
- 운영 설치는 A단계에서 내렸다. B단계에서 0.3.0 프로필(실행 제약 · `jobImages`) + 운영용 Job 이미지(PR 195)로 새로 설치한다.

### 4.11 결정(D-98)
- B단계는 지금 고정 틀 화면 그대로, A2UI 전환은 다음 판


## 5. RustFS

### 5.1 정체
- id `provider.rustfs`, 레이어 Fabric(slug `rustfs`), 원형 `stateful-engine/1`, RustFS 1.0.6(S3 호환)

### 5.2 제공 기능(승인됨)
1. 객체 저장 인스턴스 만들기 · 지우기(단일 노드, 프리셋 small · medium)
2. **버킷 Claim:** 앱마다 버킷 하나와 그 버킷만 쓰는 접근 키를 발급 · 회수한다
3. 세부 보기: OpenSearch와 같은 탭("버킷")
4. **포함하지 않는 것:** RustFS 웹 콘솔(`CONSOLE_ENABLE=false`), 다중 노드 · 이레이저 코딩, 공개 버킷 · 미리 서명된 URL 정책 관리, 수명 주기 규칙

### 5.3 스토어 설명
- 요지: "앱별 버킷을 발급하는 S3 호환 객체 저장소."
- 권한과 자원: StatefulSet 1 · Service 1 · 자격 Secret · 데이터 PVC 1 · scratch(logs 100Mi), Job 이미지(issue · release · verify)

### 5.4 매뉴얼 · 지식
- overview(패키지 판과 제품 판이 다름) · install(채널 판 · digest 확인) · operations(앱에 버킷 발급) · troubleshooting(서명 · digest 실패) · commands

### 5.5 Shell 명령
- `provider.rustfs.status` · `.inspect`(none, archetype)

### 5.6 화면
- §4.6과 같다

### 5.7 실행
- 엔진 uid 10001, 포트 9000(https), readiness `/health/ready` 5초, 명령 `/usr/bin/rustfs`, 읽기 전용 루트, `envFromCredentials`
- 자격 `RUSTFS_ACCESS_KEY`(고정 `osr_admin`) · `RUSTFS_SECRET_KEY`(생성 32바이트)
- 프리셋 small(250m/512Mi → 1/1Gi) · medium(500m/1Gi → 2/2Gi)

### 5.8 Claim
- 종류 `bucket`, scheme `https`(PR 195에서 채운다)
- 소비자 키: `accessKey` · `secretKey` · `ca` · `url` · `bucket`
- 발급 → verify: TLS로 그 버킷 PUT · GET(`connected`)
- 회수 → verify: **`InvalidAccessKeyId`만** `auth_rejected`. `AccessDenied`는 `unknown`(#81)

### 5.9 합격 시험
- §4.9와 같고, 다른 Claim 버킷 접근 거절을 더한다

### 5.10 지금과 차이
- §4.10과 같다

### 5.11 결정(D-98)
- §4.11과 같다


## 6. Samba AD

### 6.1 정체
- id `provider.samba-ad`, 지금 plane `fabric-shared`, 프로필 `provider.samba-ad-dc` 0.2.0
- 지금은 root로 돈다(`rootReason: samba-ad-dc`, capabilities 전부 버리고 7개를 다시 더함). 원형 `stateful-engine/1`은 non-root · capabilities 없음이라 **그대로는 들어가지 않는다**

### 6.2 제공 기능(승인됨)
1. 도메인 컨트롤러 인스턴스 만들기 · 지우기(단일 DC)
2. **디렉터리 바인드 Claim:** 소비자(지금은 Keycloak)에게 LDAPS 읽기 전용 바인드 계정을 발급 · 회수한다
3. 상태 · 도메인 정보 보기
4. **포함하지 않는 것:** 직원 계정 · 그룹 관리 화면(거버넌스 제품, §6.11), 다중 DC 복제, GPO, DNS 서버 역할 노출

### 6.3 스토어 설명
- 요지: "직원 신원의 원천이 되는 도메인 컨트롤러. 소비자에게 LDAPS 읽기 계정을 발급한다."
- 권한과 자원: 실행 방식 결정 뒤 채운다(§6.11-1)

### 6.4 매뉴얼 · 지식
- overview · install · operations(인스턴스를 지워도 PVC · PV는 남는다 → D-96에 맞춰 바꿀지 결정) · troubleshooting(`provisioning failed:`) · commands

### 6.5 Shell 명령
- `provider.samba-ad.status` · `.inspect`(none, archetype)

### 6.6 화면
- 지금 없다(extension 없음) → A2UI 1.3 개요 · 세부(overview · connection(LDAPS 주소 · CA) · storage · events · claims · documentation)

### 6.7 실행
- 지금 이미지의 capability 7개(CHOWN · DAC_OVERRIDE · FOWNER · SETUID · SETGID · NET_BIND_SERVICE · KILL)는 원형에서 전부 drop된다.
- **#79 결정:** non-root를 먼저 격리에서 시험한다. 실제로 필요할 때만 **C-8**(서명 프로필의 닫힌 capability 선택 + 원형 변경)을 검토한다. privileged · hostPath · hostNetwork는 계속 금지다.
- 준비 판정: LDAP는 HTTPS가 아니다 → **C-1** 또는 C-2의 LDAP 준비 판정
- 지금 Claim 보조 프로세스(`claims.py`)는 Kubernetes API로 Secret을 읽는다. 토큰 없는 원형에서는 그대로 못 쓴다 → issue · release Job이 LDAPS 또는 관리 인터페이스로 발급하도록 다시 설계한다

### 6.8 Claim
- 종류 `directory-bind`, scheme: 목록에 `ldaps`가 없다. 636은 포트 하한(1024) 밖이다 → **C-2**(scheme · LDAP 준비 판정 · 승인된 상위 포트)
- 소비자 키(안): `url` · `bindDN` · `password` · `baseDN` · `ca.crt`
- 발급 → verify: LDAPS 바인드 + 기준 DN 검색(`connected`)
- 회수 → verify: 같은 자격의 `invalidCredentials`(49)만 `auth_rejected`

### 6.9 합격 시험
- 발급 · 회수 · 재시작 뒤 도메인 유지 · Keycloak 연동

### 6.10 지금과 차이
- 실행 문서 · 화면이 없다. 원형으로 옮기려면 C-1 · C-2가 먼저이고, non-root가 안 되면 C-8도 필요하다. Claim Job을 새로 설계한다.

### 6.11 결정(D-98)
1. 실행: non-root 시험 결과를 보고 정한다. C-8은 non-root가 안 될 때만, P1 뒤
2. 레이어 Governance
3. 직원 계정 · 그룹 관리는 거버넌스 제품에 둔다(이 패키지 화면 아님)
4. 인스턴스 삭제 때 PVC도 지운다
- C-1 · C-2는 P1 뒤


## 7. Keycloak

### 7.1 정체
- id `provider.keycloak`, 지금 plane `fabric-shared`, 프로필 `provider.keycloak` 0.1.0, Operator 없이 인스턴스당 Keycloak 하나
- 의존: PostgreSQL `database` Claim(상태 저장), Samba AD `directory-bind` Claim(직원, LDAPS)

### 7.2 제공 기능(승인됨)
1. 신원 인스턴스 만들기 · 지우기(realm 하나, 첫 기동 때 가져오기)
2. **OIDC 클라이언트 Claim(안):** 워크스페이스 앱마다 클라이언트 id · secret · 발급자 주소를 발급 · 회수한다
3. 상태 · realm 정보 · 연결된 디렉터리 보기
4. **포함하지 않는 것:** Keycloak 관리 콘솔 노출, realm 여러 개, 사용자 직접 관리(원천은 Samba AD), 외부 IdP 연결

### 7.3 스토어 설명
- 요지: "직원 신원으로 앱에 로그인을 제공한다. 앱마다 OIDC 클라이언트를 발급한다."

### 7.4 매뉴얼 · 지식
- overview · install(MFA, namespace · SA 생성) · operations(realm은 첫 기동 때 한 번만 가져온다, 비밀은 연결 Secret에서) · troubleshooting(`osr_keycloak_not_starting`) · commands

### 7.5 Shell 명령
- `provider.keycloak.status` · `.inspect`(none, archetype)

### 7.6 화면
- 지금 없다 → A2UI 1.3 개요 · 세부(overview · connection(발급자 주소 · CA) · dependencies(DB · 디렉터리 Claim 상태) · events · claims · documentation)

### 7.7 실행
- 원형 `stateful-engine/1`(안). 지금 원형은 데이터 PVC를 늘 만든다. 쓰지 않는 PVC를 감수하거나 **C-3**(데이터 PVC 없는 선택)을 연다
- DB · 디렉터리 Claim의 소비자 Secret · CA를 엔진에 넣는 길이 지금 없다 → **C-4**(패키지 간 Claim 소비, E7)
- 두 단계를 구분한다
  - E5b-2: 지금 Keycloak의 DB 연결을 새 DB Claim의 JDBC `verify-full`로 옮겨 검증한다(지금은 `sslmode=require`)
    - 격리 JDBC 검증 통과(2026-11-24, 기준 eb3658b): 실제 발급 Claim으로 Ready, 잘못된 호스트 · 다른 CA는 TLS 거절
    - **그룹 결합(#85):** 이미 Ready인 PostgreSQL을 쓰는 3단계 그룹만 연다. 접수 때 CA 지문 · 인스턴스 UID · Claim 입력을 계획 digest에 고정하고 승인 웹훅이 실행 때 대조한다. 그룹 안에서 PostgreSQL을 새로 만드는 4단계는 열지 않는다(승인 뒤에 생기는 값을 실행 중에 확정하지 않는다). Ready PostgreSQL이 없으면 서버가 거절하고 사유를 보인다
  - E7: 원형 Keycloak이 Claim을 소비하는 공통 결합
- 준비 판정: Keycloak은 HTTPS 관리 포트가 있어 지금 원형으로 된다(포트 · 경로 확인)

### 7.8 Claim
- 종류 `oidc-client`(안), scheme `https`
- 소비자 키(안): `issuer` · `clientId` · `clientSecret` · `ca.crt`
- 발급 → verify: client credentials 토큰 발급(`connected`)
- 회수 → verify: 같은 secret으로 토큰 요청이 `invalid_client`(401)만 `auth_rejected`

### 7.9 합격 시험
- DB · 디렉터리 Claim 소비 → Ready · CA → OIDC Claim 발급 · 토큰 · 회수 거절 → 재시작 뒤 realm 유지(DB) → 공지 게시판 PoC 로그인

### 7.10 지금과 차이
- 실행 문서 · 화면 · OIDC Claim이 없다. E5b-2에서 DB 의존을 새 Claim으로 옮기는 것이 먼저다(§3.10).
- 원형으로 옮기려면 C-4가 필요하고, PVC 없이 돌리려면 C-3이 필요하다.

### 7.11 결정(D-98)
1. 앱별 OIDC 클라이언트를 Claim으로 낸다
2. 레이어 Governance
- C-4는 승인(P1), C-3은 P1 뒤


## 8. Gitea(새 설계)

### 8.1 정체
- id `delivery.gitea`(안), class `provider`, 원형 `stateful-engine/1`
  - id의 `delivery` 접두사와 class는 별개 필드다. D95-8 안의 class `delivery`는 지금 스토어 접수 클래스(ui · provider)에 없어 설치가 거절된다 → class `provider`, plane `fabric-delivery`(Fabric › 배포 묶음)로 한다.
- 의존: PostgreSQL Claim(종류 `database`) 하나
- **Backbone 내장 Gitea(`os-backbone-system/backbone-gitea`)를 대신한다(D95-8).** G1에서 내장 Gitea와 Console의 고정 Gitea 어댑터를 걷어 내고 이 패키지로 바꾼다. 옛 사본은 보존하지 않는다(D-96).
- 개발 저장소(`os-backbone-development/development-source`, 개발 Mac 60103 포워딩 · CI)는 제품 범위 밖이고 그대로 둔다.

### 8.2 제공 기능(승인됨)
1. Git 서버 인스턴스 만들기 · 지우기(프리셋 small · medium)
2. 조직(organization) 단위 접근을 Claim으로 발급 · 회수: 소비자는 그 조직에 한정된 토큰을 받는다
3. 상태 · 저장 사용량 · 저장소 수 보기
4. **포함하지 않는 것:** Actions 실행기(runner), 외부 SSO 연결(§8.11), 미러링 · 웹훅 관리, 사용자 개별 계정 관리 화면

### 8.3 스토어 설명
- 요지: "작업 공간용 Git 저장소. 조직 단위로 접근을 발급한다."
- 권한과 자원: StatefulSet 1 · Service 1 · 데이터 PVC 1, PostgreSQL Claim 1, Job 이미지(issue · release · verify), 인터넷 출구 없음

### 8.4 매뉴얼 · 지식
- overview · install · operations(백업 없음을 명시, D-96) · troubleshooting · commands
- 지식: 조직 · 토큰 범위, 회수 뒤 동작, 저장 한도

### 8.5 Shell 명령

| id | effect | 경로 | 내용 |
|---|---|---|---|
| `delivery.gitea.status` · `.inspect` | none | archetype | 원장 사실 투영(§0) |

인스턴스 · Claim 변경은 호스트 동작으로만 한다. 조직 목록 같은 엔진 안 읽기는 지금 낼 수 없다(§8.11-4, C-5).

### 8.6 화면(A2UI 1.3)
- 개요: kpis(인스턴스 수 · Ready) · 인스턴스 표(동작 `claim.issue` · `instance.delete`) · Claim 표(`claim.release`) · `instance.create`
- 세부 탭: overview · connection(https 주소 · CA 지문) · storage(PVC 사용량) · monitoring(지표) · events · claims · documentation

### 8.7 실행
- 엔진: Gitea 공식 rootless 이미지(프로필 digest), uid 1000, 포트 3000(https, 자기서명 사슬 · 실행부 CA 수집)
- 설정: `app.ini` ConfigMap
- DB 연결: PostgreSQL Claim의 소비자 Secret · CA를 엔진에 넣어야 한다 → **C-4**(Keycloak과 같은 공통 계약). 그 전에는 Gitea를 원형으로 낼 수 없다
- 저장: 데이터 PVC 1(저장소 · LFS), 프리셋별 10Gi · 50Gi
- SSH: 열지 않는다(https만, D-98)

### 8.8 Claim
- 종류 `repository-org`(안), scheme `https`
- 소비자 키: `url` · `org` · `token` · `ca.crt`
- 발급: 조직 생성(없으면) + 그 조직 범위 토큰 발급 → verify: 토큰으로 TLS 로그인 + 저장소 생성 · 읽기(`connected`)
- 회수: 토큰 삭제 → verify: 같은 토큰이 **401**(`auth_rejected`). 조직 · 저장소는 남긴다(정리 대기 아님, 소유자 결정 §8.11)
- 용량: 공통 한도 인스턴스당 Claim 10개(D-98)

### 8.9 합격 시험
- 격리: PostgreSQL Claim 소비 → 인스턴스 Ready · CA → 조직 Claim 발급 · push · clone → 회수 · 401 → 다른 조직 토큰으로 접근 거절 → 실행부 재시작 이음 → 인스턴스 삭제

### 8.10 지금과 차이
- 패키지 없음. G1 단위로 만든다. 원형 · scheme `https` · 준비 판정(HTTPS)은 이미 된다.
- 이름 목록(`nativeInstanceSlugs` · `actionProfiles`)에 더할 필요 없음(계약 v1 부록 B).
- 선행: **C-4**. Workspace에 두면 **C-7**도.

### 8.11 결정(D-98)
1. 레이어 Fabric › 배포 묶음(C-7 안 함)
2. 회수 때 조직 · 저장소를 남긴다
3. SSH는 열지 않는다
4. 조직 목록은 내지 않는다(C-5 안 함)
- C-4 승인. 용량은 공통 한도 10(C-6 안 함)


### 8.12 알림 · 로그(v1.1 초안)
- 선언 이벤트: `<정체>.not-ready`(critical, `instance.notReady` 300초). id 접두사는 G1 때의 정본 패키지 정체로 정한다(#95 B).
- Kubernetes Event 기반 이벤트는 인스턴스가 소유한 객체에서 증명할 수 있는 reason이 정해질 때 더한다(노드 DiskPressure는 쓰지 않는다).
- 로그: `json`, 필드 이름은 고른 Gitea 판의 로그 형식으로 확정

## 9. Valkey(새 설계)

### 9.1 정체
- id `provider.valkey`, class provider, 레이어 Fabric, 원형 `stateful-engine/1`, 의존 없음
- **P1 증명 대상:** Backbone 재빌드 · 이행 · RBAC 변경 없이 설치 · Claim 발급 · 회수 · 갱신이 되는지 보인다.

### 9.2 제공 기능(승인됨)
1. 키-값 인스턴스 만들기 · 지우기(프리셋 small · medium, 단일 노드)
2. **키 범위 Claim:** 소비자는 자기 접두사(`<claim>:*`) 키만 읽고 쓰는 ACL 사용자를 받는다
3. 상태 · 메모리 사용량 · 연결 수 보기
4. 재시작해도 데이터 유지(AOF)
5. **포함하지 않는 것:** 복제 · 클러스터 모드 · Sentinel, pub/sub 채널 권한, 모듈 적재, 스크립트(`EVAL`)

### 9.3 스토어 설명
- 요지: "TLS 전용 키-값 저장소. 서비스마다 분리된 키 범위를 발급한다."
- 권한과 자원: StatefulSet 1 · Service 1 · 데이터 PVC 1, Job 이미지(issue · release · verify), 인터넷 출구 없음

### 9.4 매뉴얼 · 지식
- overview · install · operations(메모리 한도 · 퇴출 정책, 백업 없음) · troubleshooting · commands
- 지식: 키 접두사 규칙, 금지 명령, 회수 때 연결이 끊기는 것

### 9.5 Shell 명령

| id | effect | 경로 |
|---|---|---|
| `provider.valkey.status` · `.inspect` | none | archetype |

인스턴스 · Claim 변경은 호스트 동작으로만 한다.

### 9.6 화면
- 개요: 인스턴스 표 · Claim 표 · `instance.create`
- 세부 탭: overview · connection(`rediss` 주소 · CA 지문) · storage · monitoring(메모리 · 연결 · 명령률) · events · claims · documentation

### 9.7 실행
- 엔진: Valkey 공식 이미지(프로필 digest). 이미지 기본 uid 999는 원형 하한(1000) 밖이라 uid 1000으로 실행한다.
  - upstream 진입점은 임의 non-root를 허용하지만 디렉터리 권한을 고쳐 주지 않는다. 고른 digest · 실제 PVC로 uid 1000 기동 · 저장 · 재기동을 검증한다.
- 평문 포트는 끄고(`port 0`) TLS 포트 6380만 연다
- **준비 판정:** 원형은 엔진 포트에 HTTPS GET을 하는데 Valkey TLS 포트는 RESP다 → **C-1**(공통 TLS/TCP 준비 판정)이 먼저이거나, 이미지가 계약에 맞는 HTTPS 준비 응답을 따로 내야 한다. `rediss` scheme만으로는 해결되지 않는다
- 설정: `valkey.conf` ConfigMap(`tls-port`, `port 0`, `appendonly yes`, `maxmemory` 프리셋, `aclfile`은 데이터 PVC — §9.11-1 (a))
- 기본 사용자 `default`는 끈다(`ACL SETUSER default off`). 관리 사용자는 `engine-auth`의 자격
- 저장: 데이터 PVC 1(AOF), 프리셋별 2Gi · 10Gi

### 9.8 Claim
- 종류 `keyspace`, scheme `rediss`
- 소비자 키: `url` · `username` · `password` · `keyPrefix` · `ca.crt`
- 발급: `ACL SETUSER <user> on >pw ~<prefix>:* -@all +@read +@write -@dangerous` + 영속(§9.11-1) → verify: TLS 로그인 + 범위 안 SET/GET(`connected`) + 범위 밖 키 거절
- 회수: `ACL DELUSER <user>`(Valkey는 그 사용자로 인증된 **기존 연결도 끊는다**) → verify: 같은 자격 `WRONGPASS`(`auth_rejected`)
- 용량: 공통 한도 인스턴스당 Claim 10개(D-98)

### 9.9 합격 시험
- 격리: 설치 → 인스턴스 Ready · CA → Claim A · B 발급 → A가 B 접두사 키에 접근하면 거절 → A 회수 · 기존 연결 끊김 · `WRONGPASS` → 인스턴스 재시작 뒤 B 자격 · 데이터 유지, A는 여전히 거절 → 실행부 재시작 이음 → 0.1→0.2 갱신에 인스턴스 유지 → 삭제
- **P1 기록:** 전 과정 동안 Backbone 이미지 digest · 이행 표지 · ClusterRole · VAP · 웹훅 설정이 바뀌지 않았음을 앞뒤로 남긴다

### 9.10 지금과 차이
- 격리 fixture(`e3b-fixture-keyspace`)만 있다. 운영 패키지는 없다. `rediss` scheme은 이미 있다.
- 선행: **C-1**(또는 이미지의 HTTPS 준비 응답). P1을 Valkey로 증명하려면 이것을 먼저 정해야 한다.
- 계약 v1 부록 B의 이름 목록 없이 설치 · Claim이 되는지가 P1의 핵심 확인이다.

### 9.11 결정(D-98)
1. ACL 영속은 (a) 데이터 PVC의 aclfile + `ACL SAVE`
2. 퇴출 정책 `noeviction`
- C-1 승인. 용량은 공통 한도 10(C-6 안 함)

### 9.12 알림 · 로그(v1.1 초안)
- 선언 이벤트: `provider.valkey.not-ready`(critical, `instance.notReady` 120초). P1은 이 Ready 전이로 시험한다.
- 메모리 부족(`noeviction`이 돌려주는 오류)은 Kubernetes Event나 `startup.problem`이 자동으로 관측하는 사실이 아니다. 관측 원천이 정해진 뒤 더한다(#95 B).
- 로그: `text`(Valkey 기본 로그 형식), 수준 거름 없음
