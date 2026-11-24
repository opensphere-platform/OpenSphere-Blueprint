# 패키지 작성 · 품질 표준 v0.1

**상태:** 승인(2026-11-24, D-99). Codex 검토(#88, `reply-088.txt`)를 반영했다([중립 다중 스토어 v0.1](NEUTRAL-MULTI-STORE-v0.1.md)과 함께 D-99 예정).
**작성:** Claude. 구현 관점 검토는 Codex.
**짝 문서:** [중립 다중 스토어 v0.1](NEUTRAL-MULTI-STORE-v0.1.md)(스토어 · 신뢰 · 형식), [OS 통합 패키지 계약 v1](OS-INTEGRATION-CONTRACT-v1.md)(OpenSphere 제품 부분의 규칙)

## 0. 배경

소유자(2026-11-24): 다중 스토어가 되면 표준화된 패키지 가이드라인과 품질 검사가 필요하다. SDK · MCP 등을 GitHub 서비스로 처리하는 방법을 검토하라.

이 문서가 정하는 것:
- 패키지 작성자가 따를 **가이드라인**
- 스토어가 매길 **품질 등급**과 그 검사
- 작성 · 검사 도구(**SDK · CLI · MCP**)
- 그것을 돌리는 **GitHub 서비스 구성**

## 1. 원칙

1. **같은 원천 · 같은 판정 결과.** 작성자 PC · 작성자 CI · Universe 심사 · Backbone 등록이 같은 원천의 규칙과 같은 공유 사례로 판정해 같은 결과를 낸다(Node · Rust는 같은 규칙을 각자 구현). SDK의 판정기는 Backbone 저장소에서 생성해 내고, 사본을 따로 고치지 않는다(Setup 봉인 사본과 같은 방식).
   - **판정은 셋으로 나뉜다:** 작성 검증(작성자 로컬), 스토어 증거 검증(Universe 봇), 설치본 권한 판정(설치본 Core). **SDK에서 임시 프로필로 통과한 것은 운영자 프로필 승인이 아니다.**
   - 중립 판정과 OpenSphere 제품 판정은 입력 · 결과를 나눈다.
2. **개인 키는 GitHub 밖.** 스토어 기준 키 · 목록 키 · 공급자 릴리스 키는 CI · 봇 · 저장소에 두지 않는다. GitHub는 빌드 · 검사 · 증명 · 배포를 맡고, 신뢰 결정(서명)은 키를 가진 사람이 한다(지금 운영 원칙과 같음).
3. **등급은 스토어가 서명한 사실.** 스토어 화면의 품질 등급은 스토어가 서명한 목록에 적힌 값으로만 보인다. 패키지가 스스로 주장하는 값은 쓰지 않는다.
4. **외부 코드는 일회용 환경에서만.** 외부 기여 PR의 코드는 GitHub 호스티드 러너의 일회용 클러스터에서만 돌린다. 운영 RKE2에 붙은 셀프 호스티드 러너(지금 Backbone CI)에서는 외부 코드를 돌리지 않는다.
5. **거절 사유는 가이드로 이어진다.** 판정기의 거절 사유 코드마다 가이드 항목이 하나 있다. 사유 코드 없는 거절은 두지 않는다.

## 2. 가이드라인

Universe 문서 사이트(GitHub Pages, `triangles-store.github.io/universe` 가칭)에 둔다. 원천은 Universe 저장소 `docs/`이고 PR로 고친다.

| 문서 | 내용 | 근거 |
|---|---|---|
| G-1 작성 가이드 | 디스크립터 v2(중립 핵심 · 제품 부분), id `<공급자>/<이름>`, 판 규칙(날짜형 판, 호환 범위 `compatibilityVersion`), 의존성 표기 | 다중 스토어 §6 |
| G-2 화면 가이드(OpenSphere) | A2UI 카탈로그 `opensphere.carbon/v1`, 데이터 원천, 고정 호스트 동작, 한도, UI 모듈은 마지막 수단 | 계약 v1 §6 · 부록 A |
| G-3 실행 · 보안 가이드(OpenSphere) | 원형 선택, non-root · capabilities 없음, 고정 digest, Job 이미지 규칙, 회수 판정(로그인 거절만 성공), 준비 판정 | 계약 v1 §7 |
| G-4 문서 · 설명 가이드 | listing 필수 항목과 길이, 매뉴얼 다섯 문서(overview · install · operations · troubleshooting · commands), 문체, 지원 연락처, 판 기록 | 계약 v1 §2 · §3 |
| G-5 공급망 가이드 | SBOM(SPDX 또는 CycloneDX), 빌드 증명, 라이선스 허용 목록, 취약점 기준 | §4 |
| G-6 지원 중단 정책 | 판 회수, 대체 판 안내, 공지 기간, 회수 때 설치본에서 일어나는 일 | 계약 v1 §8 |
| G-7 거절 사유 색인 | 판정기 사유 코드 → 가이드 항목 · 고치는 법 | 원칙 5 |

- 가이드와 판정기가 어긋나면 판정기가 정본이다. 어긋남은 가이드 버그로 고친다.
- 계약 v1 · 모듈 명세가 바뀌면 가이드도 같은 PR 묶음으로 바꾼다.

## 3. 품질 등급

| 등급 | 조건 | 누가 |
|---|---|---|
| **검증됨**(verified) | SDK 판정 통과, Node · Rust 두 판정기 결과 일치, §4 자동 검사 통과, 빌드 증명이 허용된 재사용 워크플로에서 나옴 | Universe 봇(자동) |
| **검토됨**(reviewed) | 검증됨 + Universe 심사자의 검토 기록(`reviews/<package>/<version>.md`), 매뉴얼 · listing · 권한 요청이 목적에 맞는지 | 사람(CODEOWNERS 심사자) |
| **인증됨**(certified) | 검토됨 + 격리 설치 시험 영수증(§5): 설치 · 인스턴스 Ready · 발급 · 회수 · 재시작 이음 · 갱신 때 인스턴스 유지 | 자동 + 사람 |

- 채널마다 요구 등급을 스토어 정책(`store.json`)으로 정한다. 권장 기본: `edge`는 검증됨 이상, `stable`은 인증됨.
- 등급은 목록 항목에 `quality: {level, reportDigest}`로 적고 목록 키가 서명한다. 보고서 본문은 GHCR에 같은 digest로 둔다.
- 설치본은 스토어 범위(`scope`)에 "최소 등급"을 둘 수 있다. 등급이 낮은 판은 등록하지 않는다.
- **적용 시점:** 등급을 채널 승인 기준으로 쓰는 것은 PQ2 · PQ3의 빌드 증명과 서명 목록의 `quality` 결합이 검증된 뒤다. `stable`에 인증됨을 요구하는 것은 실제로 인증 영수증을 낼 수 있게 된 뒤다(PQ6).

## 4. 자동 검사(검증됨의 조건)

| 묶음 | 검사 |
|---|---|
| 형식 | 스키마, 정규 바이트, 두 판정기 일치(거절 이유까지), 공유 사례 |
| 신뢰 사슬 | 공급자가 등록부에 있고 클래스 범위 안, 릴리스 서명 확인, 같은 판 다른 digest 없음 |
| 빌드 증명 | Artifact Attestation 검증 정책에 고정: 호출자 저장소 · 커밋, 재사용 워크플로 경로와 승인된 워크플로 커밋(`triangles-store/actions/.github/workflows/package.yml@<고정 sha>`), predicate, subject digest, **셀프 호스티드 러너 금지**. 오프라인 릴리스 · 목록 서명과 OIDC 기반 빌드 증명은 다른 것이다. 근거: [gh attestation verify](https://cli.github.com/manual/gh_attestation_verify) |
| 공급망 | SBOM 있음, 라이선스 허용 목록 안, 이미지 · Job 이미지가 digest로 고정, 취약점 기준(스토어 정책판에 고정): 수정 가능하고 영향이 확인된 Critical은 새 판 차단, High는 30일 안 수정 계획 · 만료 뒤 차단. 수정 없음 · 비적용은 (이미지 · SBOM · 취약점 · 만료 · 판정자)를 묶은 예외. 새 등록 기준과 이미 설치된 판의 회수 결정은 따로 |
| 문서 | listing · 매뉴얼 필수 항목, 길이 한도, 링크는 https만, 거절 사유 없는 빈 문서 없음 |
| 화면(OpenSphere) | A2UI 카탈로그 · 구조 · 한도 · 원천 · 동작 규칙(계약 v1 §6.3) |
| 실행(OpenSphere) | 실행 문서가 원형 한도 안, 프로필 제약을 만족할 수 있는 형태, 회수 verify가 v2 |
| 크기 | 번들 · part · 미디어 한도 |

## 5. 설치 시험(인증됨의 조건)

- **기본: GitHub 호스티드 러너(AMD64) 안의 일회용 kind 클러스터.** 시험용 키 · 시험용 신뢰 상태만 쓴다(운영 키 금지).
  - Core · Console · 실행부 · 웹훅은 보호 경로가 만든 시험 OCI digest로 띄운다. 설치 흐름은 **실제 Core · 원장 · 웹훅**을 지난다. 원장은 SQLite · 모의 API가 아니라 일회용 PostgreSQL에 Core · Services 역할과 전체 이행 순서를 재현한다.
  - 인증은 fixture 발행자 · 시험 사용자, 목록은 그 실행에서 발급한 시험 키로 서명한 닫힌 fixture 스토어.
  - 한 번에 다시 돌릴 수 있는 시험: 설치 → Ready → 발급 · 읽기 · 쓰기 → 회수 뒤 인증 거절 → 재시작 이음 → A→B 갱신(StatefulSet · PVC UID 유지).
- **네트워크:** 운영 렌더는 `CiliumNetworkPolicy`를 쓴다. 인증됨은 **지원 판으로 고정한 Cilium을 올린 kind**에서 CEL/VAP · 웹훅 TLS · 예상 egress를 실제 집행할 때만 준다. 기본 CNI의 시험은 smoke로만 기록하고 등급과 구분한다. 시험에 실행부의 API · DNS · DB 통신, 임의 Pod의 접근 거부, Job의 API 토큰 부재를 넣는다. 근거: [kind — 기본 CNI 끄기](https://kind.sigs.k8s.io/docs/user/configuration/#disable-default-cni)
- **저장:** 로컬 동적 provisioner를 고정해 시험 프로필의 저장 키(`foundation.block-rwo` 등)에 대응시키고 PVC/PV 바인딩 · 삭제를 실측한다. 이 결과는 일회용 PV에 한정되고 운영 CSI · HA의 증거가 아니다.
- **무거운 operator 전제(StackGres 등) · 여러 노드:** 같은 인증 절차의 별도 범위로 정한다. Triangles 패키지에 한해 사람 검토 뒤 격리 환경에서 돌린다. 외부 기여 PR이 그 환경을 쓰지 않는다.
- **제출 코드와 권한 분리:** 외부 코드가 도는 작업에는 PAT · App 쓰기 토큰 · 목록 키 · 운영 네트워크 자격을 두지 않는다. 신뢰된 후속 작업이 정확한 digest와 증거만 받아 품질 check를 기록한다. PR이 고친 워크플로 · 스크립트의 출력을 인증 근거로 믿지 않는다.
- **영수증:** 시험한 git head · 번들 digest · Backbone 시험판 digest · Cilium 판 · 단계별 결과. 계약 v1 §9와 같은 형식.
- PQ6 전에 작은 kind 리허설로 CNI · DB · 웹훅 · PVC 전제를 확인한다. 지금 격리 시험 도구(`tests/osr/operator_cr_native.py` 등)는 가동 중인 RKE2 · 노드 적재 이미지 · port-forward에 기대므로 그대로 kind에서 돌지 않는다.

## 6. SDK · CLI

- **배포처: 소유자 결정(Q-7, 2026-11-24): npmjs.org 공개 scope + npm provenance, 패키지 이름 `@triangles-store/store-sdk`.** npm 조직 `triangles-store`는 소유자 계정 `triangles-devops`가 owner다(2026-11-24 확인). npm 조직 `triangles`는 Triangles와 관계없다(소유자 확인). 게시는 npm Trusted Publishing(GitHub Actions OIDC)으로 하고 오래 가는 게시 토큰을 두지 않는다. GitHub Packages의 npm은 공개 패키지도 설치에 인증을 요구하고, scope가 계정 이름과 같아야 한다(`@triangles-store/...`). 근거: [GitHub Packages npm](https://docs.github.com/en/packages/working-with-a-github-packages-registry/working-with-the-npm-registry)
  - (가) npmjs.org 공개 scope(`@triangles-store`) + npm provenance — 인증 없이 설치, 표준 경로. npm 조직 계정이 필요하다(권장)
  - (나) GitHub Release의 검증 가능한 tarball + 빌드 증명 — 계정 추가 없음, 설치가 불편하다
  - (다) GitHub Packages npm — 설치마다 토큰이 필요하다
- CLI `tstore`, `gh` 확장 `gh store`(CLI를 감쌈)
- **담는 것**

| 기능 | 내용 |
|---|---|
| `init` | 템플릿으로 패키지 뼈대 |
| `check` | 판정 + 자동 검사(§4) 중 로컬에서 되는 것. 체크아웃의 스크립트 · hook을 실행하지 않고, YAML/JSON의 외부 경로를 따라가지 않는다 |
| `bundle` | 번들 빌드(정규 바이트). Backbone 폴더 구조 · OCI 저장소 규칙 · 빌더 · 출처 생성은 독립 compiler 입력으로 받는다. 배포 위치 · 출처는 데이터로 읽되 검증 결과 · 공급자 이름에 결합한다 |
| `preview` | A2UI 화면 미리 보기(아래) |
| `explain <사유 코드>` | 거절 사유 → 가이드 항목 |
| `payload` | 공급자가 서명할 페이로드 생성(서명은 하지 않음) |
| `submit` | Universe에 PR(채널 목록 항목) |

- **담지 않는 것:** 개인 키 · 키 생성 · 서명. 지금 `lib.mjs`의 키 생성 · 서명 함수는 운영자 전용 모듈로 떼어 낸다. SDK는 공개 키 검증과 서명할 페이로드 생성만 내보낸다.
- **배포판에 명시적으로 넣는 것:** 스키마 · 호스트 계약 · 생성 카탈로그 · 라이선스 · 대표 공유 사례. **Backbone 밖 빈 디렉터리에 `npm pack` 결과를 설치해 시험한다.** JSON import attributes를 지원하는 Node 판을 설치 시험으로 고정한다. Setup과 SDK는 각각 같은 원천에서 생성한다.
- **같은 원천 생성:** SDK 판은 그 Backbone 판 · 계약 판을 밝힌다. Universe 봇은 스토어 정책이 정한 SDK 판으로 다시 판정한다.
- **Rust 판정기:** 보호 main에서 같은 `osr_verify` 진입점으로 검증 전용 CLI를 빌드해 AMD64 공개 OCI digest로 낸다. 네트워크 · DB · 클러스터 자격을 받지 않는다. v2 사례 · Node/Rust 비교 · SPDX · 빌드 출처 · 이미지 digest를 같은 실행 영수증에 남긴다. Backbone CI는 지금처럼 Gitea(보호 경로)다. **Gitea 산출물에 GitHub 빌드 증명 표지를 붙일 수는 없다.** GitHub 증명이 필요하면 보호된 GitHub 워크플로에서 승인된 원천 커밋 · 산출물 digest를 재현 · 고정하는 방식을 따로 검증한다.
- **미리 보기:** Angular를 SDK 본체에 넣지 않는다. Console 렌더러의 보호 빌드에서 **작은 독립 정적 미리 보기 앱**을 만들어 선택 설치로 낸다. 렌더러를 두 벌로 다시 쓰지 않는다(계약 · 접근성 · 표시 한도가 갈라짐).
  - 시험 호스트를 주입한다(`console/opensphere/src/testing/a2ui-fixture.ts`와 같은 방식). 승인 · MFA · 네트워크 · 실제 라우팅은 기록용 어댑터로 바꾼다.
  - 작성자가 넘긴 패키지 JS/HTML을 미리 보기 앱의 origin에서 실행하지 않는다. 임의 주소 · 명령 · 실설치 자격을 받지 않는다.
  - Console과 미리 보기의 시각 비교는 같은 문서 · 카탈로그 digest로 따로 회귀 시험한다.

## 7. MCP

| MCP | 용도 | 권한 |
|---|---|---|
| **GitHub 공식 MCP 서버** | 작성자의 AI 에이전트가 저장소 · PR · Actions를 다룬다 | 작성자 본인 권한. 읽기 전용 모드 · 도구 선택으로 좁혀 쓰기를 권한다 |
| **Store SDK MCP**(새로 만듦) | 판정, 거절 사유 설명, A2UI 미리 보기 결과, Universe 목록 검색, 품질 등급 미리 계산, **뼈대 초안을 구조화해 돌려주기** | 로컬 stdio, **읽기만**, 키 없음. SDK와 같은 코드 |
| **OpenSphere 지식 MCP**(이미 있음, I4) | 설치된 패키지의 매뉴얼 · 지식을 운영자가 질의 | 설치본 안, 기존 권한 |

- Store SDK MCP는 파일을 쓰지 않고 PR을 열지 않는다. 파일 쓰기(`init`)와 제출(`submit`)은 사람이 실행하는 CLI다.
- `preview` 도구는 임의 주소 · 명령 · 실설치 자격을 받지 않는다.
- SDK 판과 같이 나온다. 원격 호스팅은 하지 않는다(작성 중인 비공개 코드를 밖으로 보내지 않음).

## 8. GitHub 서비스 구성

| 저장소 · 서비스 | 내용 |
|---|---|
| `triangles-store/Universe` | 스토어 원본(다중 스토어 §7.2) + `docs/`(가이드) |
| `triangles-store/package-template` | **저장소 템플릿**: 디스크립터 · 매뉴얼 · listing · A2UI 화면 · 실행 문서 예 · 시험 뼈대 · devcontainer · 재사용 워크플로 호출 |
| `triangles-store/actions` | **재사용 워크플로 · composite action**: `package.yml`(판정 → 빌드 → SBOM · 취약점 → 빌드 증명 → GHCR 게시), `certify.yml`(§5) |
| `triangles-store/store-sdk` | SDK · CLI · Store SDK MCP. 원천은 Backbone에서 생성 |
| Universe 봇(**GitHub App**) | Universe PR에 check run · 품질 보고 댓글 · 라벨. 권한: Universe의 PR · checks 쓰기, contents 읽기, GHCR 읽기. 병합 · 서명 권한 없음 |
| **Artifact Attestations** | 빌드 증명. 허용 워크플로 정체성이 지금 `trustedBuilders`를 대신한다 |
| **Rulesets** · 브랜치 보호 · **CODEOWNERS** | `channels/` · `publishers/` · `keys/` 변경은 심사자 승인 필수, 강제 push 금지 |
| **Environments**(필수 승인자) | GHCR 게시 단계 |
| **GitHub Pages** | 가이드 사이트 |
| **Codespaces / devcontainer** | SDK · 미리 보기 렌더러가 든 개발 환경 |
| **Issue forms** · **Private vulnerability reporting** | 패키지 제출 양식, 보안 신고 |
| **Dependabot** · **CodeQL** | SDK · Job 이미지 코드 |

**흐름**
1. 작성자가 템플릿으로 저장소를 만들고 `package.yml`을 호출한다.
2. CI가 판정 · 빌드 · SBOM · 빌드 증명 · GHCR 게시를 한다. 공급자는 GitHub 밖에서 릴리스 서명을 붙인다.
3. `tstore submit`이 Universe에 채널 목록 PR을 연다.
4. Universe 봇이 독립적으로 다시 판정 · 증명 검증 · 자동 검사를 하고 보고서를 단다(검증됨).
5. 심사자가 검토 기록을 남긴다(검토됨). 필요하면 `certify.yml`(인증됨).
6. 병합 뒤 운영자가 GitHub 밖에서 목록에 서명하고, CI가 GHCR에 게시한다.

## 9. 비용 · 계정 제약

- **Artifact Attestations:** 공개 저장소는 모든 플랜에서 된다. 비공개 · internal 저장소의 증명 생성은 GitHub Enterprise Cloud가 필요하다(공식 문서). 그래서 작성자 저장소 · 패키지 저장소를 공개로 두는 다중 스토어 S99-3과 맞물린다. Universe Git 저장소가 비공개인 것과, 각 작성자 저장소에서 증명을 낼 수 있는지는 별개다. 근거: [artifact attestations 사용](https://docs.github.com/en/actions/how-tos/secure-your-work/use-artifact-attestations/use-artifact-attestations)
- **Actions 시간:** 공개 저장소는 호스티드 러너 무료, 비공개는 분 과금. 설치 시험(§5)은 시간이 커서 인증됨 요청 때만 돌린다.
- **조직 계정**(다중 스토어 S99-2): App 설치 · Rulesets · CODEOWNERS 팀 · 조직 패키지 관리에 필요하다.

## 10. 결정(권장안)

| # | 결정 |
|---|---|
| Q-1 | 품질 등급 셋(검증됨 · 검토됨 · 인증됨), 채널 기본 요구: `edge` 검증됨 · `stable` 인증됨 |
| Q-2 | 판정 코드는 Backbone 저장소가 정본이고 SDK는 생성물이다. 검증됨은 두 판정기 일치가 조건 |
| Q-3 | 개인 키는 GitHub 밖. 봇 · CI는 서명하지 않는다 |
| Q-4 | 외부 코드는 호스티드 러너 일회용 클러스터에서만. 운영 RKE2 러너는 쓰지 않는다 |
| Q-5 | 빌드 증명은 GitHub Artifact Attestations, 허용 워크플로 정체성으로 `trustedBuilders`를 대신한다 |
| Q-6 | Store SDK MCP는 로컬 stdio · 읽기 전용 · 키 없음 · 파일 쓰기 · 제출 없음. 원격 호스팅 없음 |
| Q-7 | **SDK 배포처: npmjs.org `@triangles-store/store-sdk` + npm provenance, 게시는 Trusted Publishing**(소유자 결정 2026-11-24) |
| Q-8 | **SDK 라이선스: Apache-2.0**(소유자 결정 2026-11-24). SDK 패키지에만 적용한다. Backbone 본체 소스는 지금처럼 비공개다. SDK에 들어가는 생성물(스키마 · 판정기 · 공유 사례 · 카탈로그)은 SDK 배포판 안에서 Apache-2.0으로 낸다. 상류 A2UI 카탈로그 등 제3자 부분은 원래 라이선스 고지를 함께 넣는다 |

## 11. 구현 순서(다중 스토어 MS 단위와 함께)

| 단위 | 내용 | 함께 가는 MS |
|---|---|---|
| PQ1 | SDK 생성 파이프라인(Backbone → `store-sdk`), `check` · `bundle` · `explain` · `payload`. 먼저 Backbone 밖에 설치되는 작은 SDK와 두 판정기의 같은 사례를 증명 | MS3a · MS3b(판정 v2) |
| PQ2 | 재사용 워크플로 `package.yml` · 빌드 증명 · SBOM · 취약점 | MS7(Universe 초기화) |
| PQ3 | Universe 봇(App) · 자동 검사 · 품질 보고 · 등급 서명 필드 | MS7 |
| PQ4 | 가이드 사이트 G-1~G-7, 사유 코드 색인 | PQ1 |
| PQ5 | 템플릿 저장소 · devcontainer · `preview` | PQ1 |
| PQ6 | `certify.yml`(일회용 kind + 고정 Cilium 설치 시험). 앞서 작은 kind 리허설 | P1 이후 |
| PQ7 | Store SDK MCP | PQ1 |

## 12. 열린 질문의 답(#88 I)

1. **Rust 판정기 이미지:** 보호 main에서 검증 전용 CLI를 빌드해 공개 OCI digest로 낸다(§6).
2. **미리 보기:** Console 렌더러 보호 빌드의 독립 정적 앱(§6).
3. **취약점 기준:** 스토어 정책판에 고정(§4).
4. **품질 보고서:** 공개 보고서에는 digest · 도구/정책판 · 시험 요약 · 예외 만료만 넣고, 지원 중인 판과 폐기 뒤 정한 기간(예: 1년) 보존한다. 보안 신고 · 세부 빌드 로그 · 내부 주소 · 계정 자료는 제한된 저장소에 짧게 따로 보존한다. 회수 · 대체된 판도 공개 영수증으로 추적한다.
5. **다른 제품의 검사:** 제품별 **별도 check**로 한다. 중립 판정과 독립된 제품 check 이름과 고정 OCI를 운영자 데이터로 등록한다. 제출자가 Universe 봇 프로세스 안에 검증 플러그인을 넣을 수 없다. 다른 제품이 선언하지 않은 항목을 그 제품에 강요하지 않는다.

## 13. 소유자 결정

- **Q-7(2026-11-24):** SDK는 npmjs.org 공개 scope + npm provenance로 낸다(권장안). npm 조직 계정은 소유자가 만든다.
- **Q-8(2026-11-24):** SDK 라이선스는 Apache-2.0.
- Q-1~Q-6: 권장안대로 승인(D-99, 2026-11-24).
