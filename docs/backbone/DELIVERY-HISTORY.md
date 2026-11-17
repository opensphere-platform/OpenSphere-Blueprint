# Backbone 작업·배포·검증 이력

**기록 목적:** 지금까지의 제품 관련 작업을 추적 가능한 주요 단위로 정리한다. 모든 명령·모든 중간 커밋을 복제한 원본 로그가 아니다. [근거 대장](evidence-index.json)에 확인한 원본·source SHA/파일 hash를 남긴다. 원본에 개인/운영 자격이 섞인 경우 요약만 공개한다.

## 1. 역사 기준선과 현재 설치의 구분

| 시기/단계 | 실제 작업·근거 | 당시 수용 범위와 현재 해석 |
|---|---|---|
| 11/10 자가 운영 기준 | R2D2 self-operating Blueprint: 기존 Supabase 재사용, 관리/사용 경계, 요청→소스→CI→배포→복구, 독립 보존 | 최상위 목표·원칙. 모델 자가 운영 완료 보고 아님 |
| 11/11 제품/Core 설계 | `OPENSPHERE-BACKBONE-BLUEPRINT.md`, `CORE-DETAILED-DESIGN-2026-11-11.md` | 제품 책임·Auth/PG/실행·업데이트/복구 초안. 과거 “미정”은 이후 수용 기록과 함께 읽음 |
| P0→P1→P2→P3-1 | synthetic echo/counter, Core 원장·outbox·Temporal·멱등·위임·fence·승인, native 시험/거절 | 과거 개발 topology의 범위 제한 실증. 현재 운영 namespace 재적용 지시 아님. 삭제된 localhost RKE2 복구 금지 |
| 11/12 저장 foundation | 선택형 프로필·명시 검증·활성화 gate·DB 권한·암호화 백업, 실제 DB/객체 clone 복원 | `docs/foundation/` 원본은 당시 부분 수용. 웹 write-once와 기존 서비스별 adoption을 구별 |
| Stage3 Gitea/CI | 내부 Gitea 소스 전환·PR/main 보호·별도 Runner/publisher·버전/digest/OCI/native 실행 검증 | `docs/step3/`, 릴리스 증거. 로컬 relay 주소·과거 체크리스트를 현재 접근 절차로 쓰지 않음 |
| Stage4 이벤트/Swallow | Gitea HMAC intake, 고정 subscriber PG inbox/ACK, native Inbox·회수·응답 유실·권한 시험 | `docs/events/README.md`. 이전 `docs/adapters/` “읽기만”은 초기 기록으로 보존 |
| Stage5 Execution | 실제 제한 OpenShell 작업·독립 reviewer·최종 검증·crash/응답 유실 조정·정리 | `docs/execution/README.md`. 임의 명령·범용 cluster-admin 실행 수용 아님 |
| Stage6 Release | 실제 무해한 PR→필수 CI→source 승인→보호 병합→불변 artifact→제한 staging/delivery 검수 | `docs/release/COMPLETION.md`; 구현 PR39/main6b3e31f, 무해한 PR40/main905a3cf, native package182. 과거 개발 실증이며 현재 모델 자가 운영/HA 아님 |
| Stage7 등록·지식 | 모델/credential 종류·회전·역할·SecretRef 준비, 지식12문서와 고정 소스 검색·관측·별도 read-only 도구 | `docs/r2d2/`, `knowledge/README.md`. genuine 모델 turn·의미 RAG·제품 Memory 설치 미완료 |
| 11/14 신규 RKE2 설치 | 공개 Setup·실제 worker/파일시스템 진단·Longhorn·native 첫 관리자·봉인 release/config·native 구성요소 | `docs/setup/` 및 수용 기록. 현재 설치의 시작. 신규 설치와 과거 설치 adoption 혼용 금지 |
| 11/15~16 운영 설치 보완 | 공개 portable CLI·TLS/관리 진입·서비스/collector 진단·CLI 기기·Git 읽기/OpenShell·Swallow/Magpie native 통합 | 검증된 same-install 후속 업데이트. 서비스 구현 존재와 무제한 자율 활성화는 다름. 관련 operator 수용 원본을 evidence-index로 연결 |

## 2. 11/16~17 Nexus — 설계 검토에서 운영까지

| 단위 | 소스·CI·발행·설치 | 실제 증거와 한계 |
|---|---|---|
| 설계 v0.1 / 외부 감사 / 답변 / 재평가 | 초기 기준965c78e, 감사17건, 최소 범위 합의 | 원 설계·감사·정정 모두 보존. 정적 성립 조건과 실제 공격 성공을 구별 |
| 최소 강제 규칙 | PR6~11, required run39, main `41f61abd403da7a2d9a31cd0120beb4362ceaa6a`; 공개 Setup49·OS CLI edge.2 | Auth 자체 가입/공개 internal 차단, 위임 재확인, 사전 감사, 별도 변경 예산, 세션 DB 점유·refresh, 독립 서명, Magpie unknown |
| 최소 강제 규칙 검증 | 실제 격리 Auth/Core/PG 승인15, 세션9, 위임 gate9, Magpie7; Mac Keychain 실제 CLI 서명·오프라인 증거 확인 | 운영 경계404·기존 로그인·6PVC/TLS/관리자·같은 작업 재개 보존.17건 전체 해결 아님 |
| 효과 실측 | 같은 Auth1.2초 지연·동시3요청의 점유 트랜잭션3→0; 두 Console refresh 호출1 | 격리 인과 비교. 운영 처리량·전체 성능 수치 아님 |
| Nexus UI | PR12~15, 최종 source `5c6780bc44d3685ce0c407784bbcaa0b599e77c1`; Setup51 / Console19 | metadata·정책 지문·예산·조회 시간·38행 한계 표시, 모바일 route 선택, 실제 화면·재개 검증 |
| 전체 경로 점검·합의 통제 확대 | PR16~18, required source57/61/65, main `b867824b0b96001cc91d853bfc8ecdedb966958a`; Console21 source `a4cf0bcd069cfe9057946b13f7036691b87454fd`, publication64; 공개 Setup52 | 43Rust파일/305path 단서·34단서 포함 파일 검토. source AST guard·누락 조회 인계 감사·현재 권한/위임 회수·장기 상태 조정 취소 방지 |
| Setup52 수용 | 서버 단위74·inventory2·Setup209·Mac/Linux 패키지 각23; 실제 Auth/PG 관측30+위임4 | 실제 배포 브라우저/모바일·같은 작업 및49/51 재개 무변경. 기존6PVC/TLS/Core issuer/역할 보존. 외부 엔진은 controlled upstream이므로 전 upstream conformance 아님 |

### 실패·대체 이력도 보존

- 발행32의 Runner 보고 실패 후 이미 발행된 immutable digest/BuildKit/registry/OCI/native 실행을 독립 대조했다. 무조건 재발행하지 않았다.
- Setup47은 OCI metadata 불일치로 효과 전 차단,48에서 보완. Setup48은 SQL prologue parser에서 중지했고49에서 기존 marker/동일 작업으로 재개했다. 일부 앞선 migration을 없었던 것으로 처리하지 않았다.
- Setup50 로컬 UI 후보는 미발행·미적용, 모바일 보완51을 수용했다.
- Console20→21은 발행/검수 단위를 구분한다. 백엔드 bytes 동일 확인이 소스·발행 provenance 생략 허가가 아니다.

## 3. 11/17 R2D2 PG 저장 첫 단계 — 아직 보류

| 단위 | 소스/검증 | 반영 상태 |
|---|---|---|
| 파일 중심 초기안 | PR19 | PG 우선 지시로 대체, 미병합·운영 adoption 미실행 |
| native PG runtime | PR20 / CI74 / main `ffb9de47f6ff3d3d8d8d0a88d2331b7e18608544`, 발행77, 버전26.1117.1519.8 | artifact 수용, 운영 이미지 미교체 |
| 저장 view·OCI CAS 재개 | PR21 / CI78 / main `78071ef8744669357b41009af9117ad1c8ebd683` |7노드 cache 검증, 최초 대용량 전송 실패/타임아웃을 기록하고 기존 CAS로 재개. 설치 완료 아님 |
| native first-stage operator | PR22 / CI83 / main `f04476ebfc932c324ff4fc40db3f55cd17f3ba39` | 정지 helper·캡처·port·저장 선택·재개 구현. Setup53은 로컬 후보만, 운영 미적용 |
| SCRAM 보완 | PR23 / head `c7c60d6ddf166ef95de7595112dea105f12ea52d` / 소스229검사 | required CI86 advisory 실패, 미병합. Setup54 미발행 |
| 원본 입력 native 실증 | 실제2세션/18이벤트/2예약 정의·원래 세션 ID·paired 복구·다른 제한 DB/role·workspace bytes·PG 장애 거절 | 격리 검증 통과. 운영 정지 백업·마이그레이션·재기동·write-once 선택은 미실행 |
| 현재 정책 차단 | RUSTSEC-2026-0543 chrono 유지보수 중단, 기존 lock 동일 | 예외 없음 유지. 한시 예외는 미승인 제안. 모델·다음 단계 미진행 |

## 4. 소스·복구 보존의 실제 의미

- Backbone: Gitea 보호된 main 정본, GitHub 비공개 원격의 **명시 보존 push**, DevOps bundle/ZIP/OCI/암호화 복구본. origin 등록만으로 자동 백업이라고 보고하지 않는다.
- Setup49/51/52와 PG 중간 checkpoint에서 독립 bundle clone/fsck·accepted SHA·Windows 직접 읽기 ZIP 검사를 기록했다. PG 실패 후보는 별도 branch 보존, 운영 승인된 main과 구분했다.
- DB/객체 clone·anchor+PG·서명 원문·별도 역할 복원은 각각의 실제 범위가 있다. 전체 클러스터 DR·외부 키 escrow·물리 HA·운영 RPO/RTO는 미검증이다.
- 이름 변경·OCI 방화벽·DNS 운영 등 Backbone 제품 밖의 인프라 요청은 이 제품 릴리스 완료 이력에 합산하지 않는다.

## 5. 후속 기록 형식

새 단위마다 날짜/요청, 기능 범위, source/PR/CI, artifact version+digest, 설치 여부, 검증 환경·입력·결과, 보존·복구, 실패·미실행·다음 결정권자를 기록한다. 비밀 원본 대신 공개 가능한 요약·SHA를 사용한다. 상위 설계 결정이 필요하면 이 대장만 고치지 말고 D-대장 절차와 연결한다.
