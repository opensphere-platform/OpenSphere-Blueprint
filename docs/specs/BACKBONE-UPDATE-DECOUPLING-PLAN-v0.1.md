# Backbone 업데이트와 Setup 실행 도구 분리 계획안 v0.1

- 작성: Jupiter / 2026-11-18 KST
- 상태: Claude 협의용 초안. 합의·구현·운영 적용 완료 문서가 아니다.
- 요청: Backbone 갱신마다 Setup을 새로 패키징하는 결합을 해소할 구체적 방법 준비.
- 기준: `/Volumes/DevOps/Operations/Supabase/multihead/R2D2-SELF-OPERATING-BLUEPRINT.md`
- 관련: `OPENSPHERE-REGISTRY-OSR-v0.2.md`, `OSR-IMPLEMENTATION-PLAN-v0.2.md`

## 1. 제안 결론

Setup은 독립적인 설치·갱신·복구 실행 도구로 유지하고, Backbone 버전별 갱신 정의를 **서명된 불변 Release Bundle**로 외부화한다. 같은 계약과 지원 기능 범위 안의 새 Backbone 버전은 기존 Setup으로 적용한다. Setup 기능·계약·검증기·보안 수정이 필요한 경우에만 Setup을 새로 발행한다.

외부화를 지원하는 전환용 Setup은 한 번 새로 발행해야 한다. 이후에도 모든 미래 릴리스를 영구 지원한다는 뜻은 아니다. 지원하지 않는 작업이나 계약은 명시적으로 거절한다.

Backbone 자체 수명주기는 Setup의 독립 경로를 유지한다. OSR의 일반 모듈 설치로 Backbone 자신을 갱신하지 않으며, Console/Core/OSR의 정상 동작을 복구의 필수 전제로 삼지 않는다.

## 2. 확인한 현재 결합

읽기 확인 대상: `/Volumes/DevOps/Projects/OpenSphere/OpenSphere-Backbone-main/` 작업 트리. 이 확인은 운영 배포 상태나 edge.60 공개 패키지 자체의 검증을 의미하지 않는다.

| 위치 | 현재 확인 내용 | 전환 영향 |
| --- | --- | --- |
| `setup/src/console-chain-profile.mjs` | Console predecessor/successor 정의 내장 | 새 Console 단계마다 소스 변경 |
| `setup/src/backbone-bundle-profile.mjs` | Console/Core 이미지와 정책·카탈로그·migration 지문 내장 | 새 Backbone 묶음마다 소스 변경 |
| `setup/src/backbone-bundle-assets.mjs` | migration 자산 내장 | profile만 분리해서는 부족 |
| `setup/src/backbone-bundle.mjs` | 내장 profile/assets import 및 검증·적용 | 검증된 입력을 받도록 리팩터링 필요 |
| `setup/src/channels.mjs` | 외부 채널→bundle→로컬 lock 기능 존재 | 재사용하되 갱신용 계약 확장 필요 |
| 같은 파일 `validateBundle` | release.installerDigest가 실행 도구와 정확히 같아야 함 | 채널 경로도 정확한 도구 digest 결합 |
| 같은 파일 `catalogEntry` | bundle URL을 Setup release 경로로 제한 | 제품 릴리스와 CLI 발행 경로 분리 필요 |
| `setup/src/identity.mjs` | `.mjs`와 의존성을 installerDigest에 포함 | profile 변경도 실행 도구 identity 변경 |
| `setup/scripts/package-portable.py` | Setup src를 복사하고 identity 일치 검증 | 분리 후에도 도구 자체 무결성 보존 |

따라서 기존 채널 기능을 무시하고 새 다운로드 시스템을 만들거나 installerDigest 비교만 제거하지 않는다. 기존 lock·checksum·다운로드 제한을 재사용하고, 외부 서명 신뢰와 명시적 호환 계약을 보강한다.

## 3. 대안과 선택 이유

1. **현행 유지:** 단기 이행에는 사용 가능하나 제품 릴리스와 도구 발행이 계속 결합된다.
2. **기존 Setup + 외부 서명 Bundle:** 권고. 적용·재개·복구와 원장을 재사용하고 입력/신뢰 계약을 분리한다.
3. **새 상시 updater/GitOps 도입:** 이번 범위에서는 보류. 기존 Setup과 Gitea Actions로 해결할 수 있어 서비스·권한·복구 의존성을 추가할 필요가 없다.

서명/메타데이터 보안은 기존 프로젝트의 검증된 도구·라이브러리를 우선 검토한다. 구현 전 TUF 방식과 OCI 서명 도구의 기존 스택 적합성도 짧게 비교하고, 키 회전·회수·재전송 방어 요구를 충족하는 최소 구성을 선택한다. 후보 검토는 도입 결정이 아니다. 별도 유료 서비스 도입은 포함하지 않는다.

## 4. 산출물과 책임 분리

### A. Setup 실행 도구

- 고정 신뢰 root, 서명 검증, 계약/지원 기능 검사, 대상 관측.
- 승인과 installation/cluster binding, writer lock, 단계별 적용·영수증·재개·복구.
- 도구 자체 서명·배포·installerDigest 검증은 유지.
- Bundle에서 JavaScript, 셸 명령, 플러그인을 내려받아 임의 실행하지 않는다.

### B. Backbone Release Bundle

- 불변 manifest와 checksum으로 묶인 migration/배포 자산, 검증 증거 참조.
- Console/Core 등 대상 이미지와 소스 revision, 정책·카탈로그 전이.
- 기존의 검토된 단계 유형만 선택하는 선언형 적용 계획.
- migration SQL은 특권 실행 자산이다. 서명만으로 안전하다고 간주하지 않고 PR 검토·격리 검증·정확한 checksum·허용 DB/역할·순서·승인을 요구한다.

### C. 채널 메타데이터

- edge/candidate/stable은 불변 릴리스 digest를 가리키는 탐색 정보다.
- 채널 메타데이터도 인증하고 세대/만료를 검증한다. 채널 포인터가 실행 권한이나 운영 승인은 아니다.
- 선택 시 exact digest로 잠근다. 실행·재개 중 채널을 다시 해석하지 않는다.
- 제품 릴리스와 Setup 릴리스는 독립 버전/발행 경로를 사용한다. 정확한 저장소·파일명은 Claude와 확정한다.

## 5. Release Bundle 계약 제안

필드명·schema 이름은 제안이며 기존 명령/기능으로 안내하지 않는다.

| 묶음 | 필수 정보 |
| --- | --- |
| 식별 | schemaVersion, kind, releaseId, productVersion, 발행 세대, 발행/만료 시각 |
| 도구 호환 | setupContract, 최소 Setup 버전, requiredCapabilities, 지원 대상 플랫폼 |
| 정확한 전이 | 허용 predecessor release/profile digest, Console/Core 이전·이후 이미지 digest와 revision |
| 정책 | 이전·이후 policyDigest/catalogDigest, 변경 검토 증거 |
| 자산 | 상대 경로·미디어 유형·크기·sha256, migration ID/DB/역할/순서/호환성/transaction 조건 |
| 복구 | 백업 요건, 이전 이미지와 스키마 호환성, 복구 절차 ID, 자동 복구 가능한 경계 |
| 검증 | 소스/PR/필수 CI/이미지 발행/OCI·AMD64·격리 RKE2 검증의 불변 증거 참조 |
| 예외 | 적용 범위·승인 참조·시작/만료 시각. 기존 예외를 자동 확장하지 않음 |
| 서명 | payload digest, 서명 알고리즘, key ID, 권한 범위와 root/위임 세대 |

사람의 운영 승인은 공개 Bundle과 분리한다. 승인 대상은 최소한 **Bundle digest + 설치 ID + cluster UID + 정확한 변경 계획 digest + 유효기간**으로 결합한다. 릴리스 발행 서명이 운영 변경 승인을 대체하지 않는다.

최소 버전만으로 호환성을 판단하지 않는다. 지원 계약·필수 기능을 함께 검사하며 알 수 없는 동작·역할·필드는 계약 규칙에 따라 거절한다. 초기 v1은 하나의 정확한 predecessor와 직선 체인으로 제한하고 임의 분기/건너뛰기·의존성 해석기를 만들지 않는다.

## 6. 서명·공급망·보존

- CLI 실행 파일 서명 키, Backbone Bundle 발행 키, 채널 승격 키, 사람 승인 키를 목적별로 분리한다. 키 보관 절차는 재사용할 수 있다.
- 최초 검증 root는 검증된 Setup 배포를 통해 신뢰한다. Bundle 안에 들어온 새 키를 그대로 root로 채택하지 않는다.
- 키 교체는 구 root가 승인한 제한된 전이와 독립 운영 절차로 수행한다. 회수 세대와 최소 허용 메타데이터 세대를 검증한다.
- 임의 URL/리다이렉트·경로 순회·symlink·중복 경로·압축 폭탄·과대 파일을 차단한다. 온라인/오프라인에 같은 검증기를 사용한다.
- 오래된 채널/Bundle 재전송과 downgrade를 거절한다. 명시적 복구 downgrade는 별도 승인 작업이며 일반 update/resume 우회 옵션이 아니다.
- 적용 시 유효기간/회수 정보를 확인한다. 오프라인 정보 신선성의 보장 한계를 명시하고 허용 신뢰 snapshot의 기한을 검사한다.
- 완료 이력 조회·무변경 재개와 새 쓰기를 구별한다. 만료돼도 기록 검증은 가능하되 만료된 승인을 이용한 후속 쓰기는 거절한다. 중단 작업의 승인 만료 시 같은 계획에 대한 새 승인을 요구한다.
- Bundle·서명·공개 신뢰 자료·OCI 이미지·소스·영수증·복구 자료를 DevOps에 보존한다. 호스트/Console/Gitea 중단에도 독립적으로 읽고 복구할 수 있어야 한다.

## 7. 실행 흐름과 원장

1. **선택/검증:** 채널 또는 오프라인 자료에서 exact Bundle을 선택하고 서명·체인·호환성을 검증한다.
2. **계획:** 실제 설치본과 predecessor를 비교하고 이미지·migration·정책 변경 및 복구 요건을 읽기 전용으로 제시한다.
3. **사전 검증:** 필수 시험·예외·백업 가능성·자원·현재 신뢰 상태 확인. 읽기 전용 단계도 비밀을 출력하지 않는다.
4. **승인:** 정확한 대상/계획에 대한 독립 승인을 받는다.
5. **적용:** 설치 원장의 writer lock 및 대상 재확인 후 백업→이미지 확보→검토된 migration/배포 순서로 실행한다. 실제 순서는 릴리스별 호환 계획에 고정한다.
6. **검증:** 실제 이미지·스키마·정책·catalog와 API/사용자 동작·기존 통합을 확인한 뒤 완료 영수증을 남긴다.
7. **재개/복구:** 같은 Bundle bytes와 원래 operation ID를 읽는다. 응답 불명은 먼저 관측하며 효과를 재생성하지 않는다. 이미지 롤백과 DB 복구를 구분한다.

원장에는 기존 installerDigest를 삭제하지 않고 **그 작업을 실행한 도구 identity**로 보존한다. 여기에 Bundle digest, contract, 승인, 전이, 각 단계의 관측/영수증을 결합한다. 기존 설치 원장을 확장하며 두 번째 권위 원장을 만들지 않는다.

다른 Setup 버전의 재개는 자동 허용하지 않는다. 지원하는 원장 schema/작업 계약과 전이 증거를 확인하고 새 실행 도구 identity를 추가 기록한다. 원래 Bundle과 과거 영수증은 바꾸지 않는다.

## 8. 점진 전환 단계

### 0 — Claude와 계약 합의

현재 진행 중인 edge.60/운영 작업과 충돌 여부를 먼저 확인한다. 이번 계획만으로 진행 중 작업을 중단·재발행·재배포하지 않는다. 담당 브랜치·기준 커밋·신뢰 root/서명 담당·계약과 검증 범위를 확정한다.

### 1 — 기존 검증 입력 정규화

내장 profile/assets를 공통 검증 모델로 변환한다. 기존 완료 원장과 정확한 predecessor 의미를 유지한다. 현재의 암묵적 전역 migration 집합은 **선택한 릴리스별 자산 집합**으로 명확히 결합한다. 변환 결과의 기존 digest/증거 대응을 시험한다.

### 2 — 외부 Bundle 읽기·검증·plan

기존 channels/registry reader와 다운로드 제한을 재사용한다. 데이터 계약, 서명/키 위임, 오프라인 가져오기, exact lock을 구현하고 쓰기 없는 plan까지 완성한다. 이 단계에서는 운영 apply를 열지 않는다.

### 3 — 격리 apply/resume/recovery

공통 엔진에 검증 완료된 Bundle만 전달한다. 실제 운영 RKE2의 격리 namespace·신원·데이터에서 시험한다. 삭제된 localhost RKE2를 복구하거나 로컬 통합 스택을 만들지 않는다. CLI 세부 문법은 합의 후 확정한다.

### 4 — 전환용 Setup 발행 및 기존 설치 연결

필수 CI·리뷰·정확한 소스 기준 패키징·전용 CLI 서명·다운로드 재검증을 거친다. 기존 내장 경로는 과거 영수증 검증/재개를 위해 유지한다. 서명된 bridge가 정확한 기존 profile digest를 첫 외부 Bundle의 predecessor에 연결하도록 한다. 기존 원장을 최신 값으로 덮어쓰지 않는다.

### 5 — 같은 Setup으로 제품 2개 버전 연속 수용

같은 전환용 Setup 바이너리/digest로 B1→B2를 순차 적용해 재패키징 없이 가능함을 입증한다. 운영 적용은 검토된 구체 릴리스·대상·승인 절차로 별도 진행한다. 초기 단계에서 내장 호환 경로 제거는 하지 않는다.

## 9. 필수 수용 시험

- 같은 Setup으로 서로 다른 서명 Bundle 2개 적용. Setup identity 불변, 제품 identity만 변경.
- CLI 변경 없이 새 Bundle을 기존 온라인/오프라인 경로에서 동일하게 검증.
- 변조 이미지/SQL/manifest/서명, 무권한 키·회수 키, 만료/재전송·downgrade, 미지원 계약/기능, predecessor 불일치 모두 쓰기 전 거절.
- 다른 설치 ID/cluster UID, 누락/변조 영수증, 출처 없는 정책·신원 변경은 거절.
- 채널이 실행 도중 변경돼도 잠긴 대상 불변. 선택 자료가 없을 때 resume이 최신 채널을 자동 선택하지 않음.
- migration 전후·배포 전후·응답 유실·프로세스 종료 주입 후 중복 효과 없이 재개. 동시 실행은 단일 writer만 허용.
- DB 성공/K8s 실패 같은 부분 적용 상태를 관측하고 검토된 경로로 복구. 분산 원자 커밋을 가정하지 않음.
- 기존 원장의 Nexus 3종, bus-inspection, Console refresh/chain, Backbone bundle 및 관련 완료 작업의 무변경 재개.
- 신원/역할/키 등록 이력은 해당 승인 전이 증거로 검증하고 회수된 권한을 재생성하지 않음.
- Console/Core/Gitea 중단에서도 보존된 산출물·암호화 백업·최소 독립 도구로 복구 시험.
- 종료 후 시험 로그·증거를 보존하고 임시 자원을 정리. 일회 작업은 지원되는 Job+TTL 등을 사용.

## 10. Claude에게 요청할 회신

1. 본 방향 동의 여부 및 현재 작업과의 충돌: edge.60의 실제 소스/발행/적용 상태를 구분해 회신.
2. 내장 profile/assets 및 채널 installerDigest 결합을 풀 정확한 수정 파일과 하위 호환 전략.
3. Release Bundle schema, canonical bytes/서명 envelope, root·위임·회수·만료·오프라인 계약 초안.
4. 기존 서명 라이브러리/OCI 서명/TUF 재사용 비교와 추천. 새 상시 서비스 없이 구현 가능한지.
5. 기존 release/selection/state/원장 schema와 bridge의 필드별 대응, digest 보존 방식.
6. 역할 분담: 개발·CI·패키징 담당, 릴리스 서명 담당, 독립 검토/승인 담당. 에이전트 이름이 아니라 실제 권한 경계로 구별.
7. 단계별 PR과 시험 증거, 실패 시 복구/중단 조건, 첫 외부 Bundle 후보.

합의 전 구현·운영 권한이 자동 부여되는 것은 아니다. 이번 산출물은 방법 협의용 계획안이며 운영 변경은 수행하지 않았다.
