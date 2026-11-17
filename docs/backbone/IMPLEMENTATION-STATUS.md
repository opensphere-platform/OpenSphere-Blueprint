# Backbone 실제 구현·운영 현황

기준일: 2026-11-17 KST. source main `f04476ebfc932c324ff4fc40db3f55cd17f3ba39`; PG 보완 후보 PR23 `c7c60d6ddf166ef95de7595112dea105f12ea52d`. [근거 대장](evidence-index.json)을 함께 읽는다.

**현재 운영에 반영된 Nexus 범위와 R2D2 전체 자가 운영은 다른 단계다.** 과거 개발 실증과 현재 설치를 섞지 않는다. 아래 “운영”은 현재 관리 중인 RKE2 설치를 뜻하며 상용 서비스 인증·HA·전 기능 수용을 뜻하지 않는다.

## 1. 한눈에 보는 상태

| 기능 | 확인한 구현/실증 | 현재 판단·남은 범위 |
|---|---|---|
| 관리 Auth·서비스 데이터 | 기존 PG19rc1, Auth·REST·Storage·Realtime·Edge 및 관리 API | 현재 설치에 구성. 기존 사용자/객체/RLS 시험은 범위별 증거이며 전 upstream conformance 아님 |
| 최초 설치·관리 진입·공개 Setup | 봉인 release/config, native 첫 관리자, TLS, portable 패키지, 같은 설치 재개 | 현재 Setup52 수용. 신규 설치 이력과 후속 same-install 업데이트 구분 |
| OS CLI·기기·위임 | native 기기 등록·읽기 scope·회수·고정 명령·보호 승인 서명 | 임의 셸/전체 자원 변경 권한 없음 |
| Nexus 최소 통제 | Setup49 운영 적용·음성 시험·기존 보존 | 원 감사17건 전체 종결 아님. [후속](AUDIT-FOLLOWUP.md) 참조 |
| Nexus 현황 UI | Setup51 적용, metadata/정책 지문·조회 시각·예산 구분·모바일 선택 수정 | 목록38행은 적용률·업무 성공률 아님 |
| Nexus 공통 통제 확대 | Setup52/Console21, 누락 조회의 인계 감사·권한 확인, 상태 조정 처리 보호 | 합의 범위 수용. 정당한 Auth/data/stream/internal/최종 Owner 전용 경로 유지 |
| Core·Temporal·승인 | 운영 원장·outbox·최종 검증, 별도 승인 키·서명 원문 증거 | 실행 엔진/원장 존재와 모든 업무 adapter 활성화는 다름 |
| Release·Execution | 과거 실제 제한 대상에서 승인·소스→CI→배포·재개 실증 | 그 허용 대상/실증 범위를 일반 cluster-admin 배포나 현재 전기능 활성화로 확대 금지 |
| Gitea·소스 CI·발행 | 보호된 PR/main·native 검사·OCI 검증·별도 publisher | 현재 필수 CI86 실패는 유지. 과거 통과로 새 변경 배포 불가 |
| Git 읽기·OpenShell | 기존 고정 소스 읽기·격리 기능과 네이티브 증명 보존 | 자유 명령/모델 기반 쓰기·Runner 신규 활성화 없음 |
| Swallow·Magpie | native PG 기반 통지·Inbox·관리 모델 기능, Setup29 등 후속 통합 이력 | 통지는 승인 아님. 모델 등록/저장/목록 조회는 실제 추론·자가 운영 아님 |
| R2D2 모델 등록 | credential/provider/모델·역할 메타데이터와 native 검증 준비 | 실제 제품 모델+도구 종단 활성화 미완료. 개인 Jupiter 자격 재사용 금지 |
| R2D2 지식/관측 | 허용 문서·고정 소스 읽기/검색, 별도 read-only MCP/CLI/API·평가 | 의미 기반 RAG·모델 이해 완료 아님. 기억 protocol 준비와 설치를 구분 |
| R2D2 지속 저장/PG | beta.4 이미지 발행, 실제 기존 입력2세션/18이벤트/2예약 정의 전환·복원·거절 격리 실증 | **운영 미전환·저장 선택 미확정·첫 단계 미완료** |
| R2D2 Memory·변경 도구·자가 운영 | 프로토콜·기존 도구/실행 통제 기반 존재 | 제품 기억 재시작/회수·복구, 허용 쓰기 도구와 모델 실제 turn, 요청→배포→실패 복구 종단은 미완료 |
| 전체 DR·HA·SLO | scoped DB/객체/서명/소스 독립 복구 증거 있음 | 전체 클러스터·호스트/키 소실 DR, 모든 서비스 원자 checkpoint·운영 성능 인증 없음 |

## 2. 배포 기준과 이번 읽기 전용 재확인

현재 제품 조합의 출처는 Setup52 최종 수용 기록이다. 본 문서 작성 중 Kubernetes Deployment에서 다음 이미지와 ready1을 다시 관측했다. **readiness 관측으로 실사용/API/데이터를 모두 재검수했다고 쓰지 않는다.**

| 구성요소 | 운영 OCI digest / 관측 |
|---|---|
| Console21 | `sha256:817470fbf183fd18f382e2a3b209e3c7eeb040171143a67b3b999d1a1150e13c`, ready1 |
| Core API main container | `sha256:7b0171681b5d12c5d32f83e18afa3198b009a0a1da16f08441dca14cf38c5a88`, ready1 |
| Core dispatcher/worker | `sha256:84800fdb6a92e1753070156cbe0386673020e7b8d609a9c8837ce98fbb1e88be`, 각 ready1 |
| R2D2 기존 이미지 | `sha256:ad8729cbbad6e5e5c9420c5115c318181f83000aba66fe28bf0b6f6c3b5f9508`, ready1; OpenClaw2026.11.3 기준 |
| Magpie | `sha256:edd98f1cc3cd4773f050d16755e883b4dbc69708676bf3bec0247aa4fc46e7c9`, ready1 |
| Swallow | `sha256:17569f921aff7cb2356faf24ac9ac5ac440ad34bbad2ed214c30505eaba66e19`, ready1 |

Core API의 부가 container와 worker는 다른 digest를 쓸 수 있다. 전체 설치를 단일 source/image 번호로 표현하지 않는다. 나머지 Auth·Gitea·Metadata·PostgREST·Realtime·Storage·Edge·Temporal도 해당 Deployment ready1을 관측했다. 전체 토폴로지/네트워크·권한 검수의 대체 증거는 아니다.

Setup52 수용 시 기존 관리자·Core issuer pin·역할·자체 가입 차단·내부 hook·6개 PVC·TLS 및 기존 Setup49/51 작업 재개의 무변경을 확인했다. 이것은 **그 수용 시점** 증거다. 이번 문서 작업에서는 제품 설정·DB·키·저장 선택을 바꾸지 않았다.

## 3. PG 첫 단계 상세 — 완료/미완료 경계

### 완료된 소스·격리 검증

- PR20/main `ffb9de47…`, 필수 CI74, 발행77: OpenClaw2026.11.5-beta.4 기반 자체 R2D2 **26.1117.1519.8**.
- 후보 digest: `sha256:9cf745003953ffda3716b29aae8b0c573508199dbe4233287e66d8347684a136`.
- PR21/main `78071ef8…`, CI78: fail-closed 저장 view·네이티브 OCI CAS 재개. 7개 노드 cache 검증은 설치/선택 완료가 아니다.
- PR22/main `f04476eb…`, CI83: 정지 helper·암호화 캡처·native port/복구·workspace 소유권·재개 operator. Setup53 로컬 후보는 보존됐으나 공개 발행·운영 적용하지 않았다.
- PR23 `c7c60d6…`: PG role DDL에 평문 암호를 넣지 않도록 SCRAM verifier 사용, native 정상 인증/오류 암호 거절. 소스 검사229개 통과, **필수 CI86 실패·미병합**. Setup54는 미발행.
- 실제 기존 native 입력의 세션 키/ID·이벤트·예약 정의 유지, 원본/복원 Gateway 확인, 다른 제한 DB/역할로 복원·원본 DB 접근 거절, workspace 검증 파일 일치.
- PG 연결 실패 시 application SQLite 우회 거절, 기존 status 전용 플러그인·provider 비활성 정책 유지.
- 잘못된 Gateway+전체 CLI 동시 실행의 격리 OOM 실패를 기록했다. 올바른 offline CLI→Gateway→중지→offline 검사 순서로 같은 메모리 한도에서 통과했다. 운영 Gateway에 전체 CLI를 겹쳐 실행하지 않는다.

### 실제 미완료

운영 R2D2는 여전히 기존 이미지/저장이다. 새 PG 전용 DB/역할 생성, 운영 정지 시점 paired 백업, native PG port, 실제 Pod 교체·재시작 검증, foundation 저장 선택 확정, 새 공개 Setup 적용·동일 작업 재개는 **미실행**이다. 준비된 스크립트·서버 dry-run·이미지 발행을 그 증거로 대신하지 않는다.

현재 차단은 필수 CI86의 **RUSTSEC-2026-0543 / chrono 유지보수 중단**이다. 해당 native CI와 저장된 advisory 기록에 근거하며 악용 취약점 입증과 구별한다. 기존 source main과 후보 Cargo.lock은 동일하다. 기존 `deny.toml`의 예외 없음 정책을 변경하지 않았으며 PR23은 미병합이다.

- 결정권자: 보스.
- 재개 조건: 기존 정책을 유지하고 별도 의존성 전환 범위를 결정하거나, 해당 ID의 명시적 기한부 예외와 만료/변경 시 차단 guard를 정식 승인.
- “11월24일까지 한시 예외”는 **미승인 제안**이다. 문서 반영 요청을 예외 승인으로 해석하지 않는다.
- 최신 advisory/CI 상태가 바뀌면 원격 native 기록을 다시 확인한다. 이 문서가 이후 상태를 자동 추적하지 않는다.

## 4. 역할·키·활성화의 비자동성

- 승인 키 등록과 reviewer 역할 부여는 별도다. 이번 Nexus/PG 작업이 역할을 자동 부여하지 않았다.
- 키/모델 저장 → 목록·credential 검증 → native 적용 → 실제 모델 호출 → tool turn → 업무 효과는 각각 다른 상태다.
- 저장 프로필 선택과 서비스 활성화는 다르다. R2D2 저장 첫 단계가 끝나도 모델·Memory·RAG·Runner·자율 쓰기를 다음 단계로 자동 진행하지 않는다.
- contract_only·미선택 서비스는 그대로 비활성이다. 화면에 보인다는 이유로 구성 완료 표시하지 않는다.

## 5. 보존과 알려진 한계

보호된 source main과 실패 후보를 구분해 GitHub 비공개 보존 원격에 명시 push했으며, DevOps bundle의 독립 clone/fsck·Windows 직접 읽기 ZIP 증거가 있다. **자동 GitHub 백업은 구성됐다고 확인하지 않았다.** Blueprint 공개 문서와 Backbone 비공개 소스 보존을 구분한다.

암호화 원본 입력·paired backup·역할/파일 복원은 범위별 증거다. whole-cluster DR·외부 키 escrow·호스트 소실 RPO/RTO가 완료됐다는 뜻이 아니다. PG19 전체 upstream conformance·실제 모델 부하/도구 실행·모든 업무 경로 회귀·전 영역 기술적 비접근은 별도 관문이다.
