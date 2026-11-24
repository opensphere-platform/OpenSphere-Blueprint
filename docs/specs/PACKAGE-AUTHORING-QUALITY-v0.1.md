# 패키지 작성 · 품질 표준 v0.1

**상태:** 초안(2026-11-24). 소유자 "권장안으로 작성"에 따라 권장안으로 썼다. Codex 검토 뒤 소유자 승인을 받는다([중립 다중 스토어 v0.1](NEUTRAL-MULTI-STORE-v0.1.md)과 함께 D-99 예정).
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

1. **같은 원천.** 작성자 PC · 작성자 CI · Universe 심사 · Backbone 등록이 **같은 판정 코드**로 판정한다. SDK의 판정기는 Backbone 저장소에서 생성해 내고, 사본을 따로 고치지 않는다(Setup 봉인 사본과 같은 방식).
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

## 4. 자동 검사(검증됨의 조건)

| 묶음 | 검사 |
|---|---|
| 형식 | 스키마, 정규 바이트, 두 판정기 일치(거절 이유까지), 공유 사례 |
| 신뢰 사슬 | 공급자가 등록부에 있고 클래스 범위 안, 릴리스 서명 확인, 같은 판 다른 digest 없음 |
| 빌드 증명 | Artifact Attestation이 허용 워크플로(`triangles-store/actions/.github/workflows/package.yml@<고정 ref>`)에서 나왔고 번들 digest와 맞음 |
| 공급망 | SBOM 있음, 라이선스 허용 목록 안, 이미지 · Job 이미지가 digest로 고정, 알려진 취약점이 기준 이하(심각도 · 기한은 스토어 정책) |
| 문서 | listing · 매뉴얼 필수 항목, 길이 한도, 링크는 https만, 거절 사유 없는 빈 문서 없음 |
| 화면(OpenSphere) | A2UI 카탈로그 · 구조 · 한도 · 원천 · 동작 규칙(계약 v1 §6.3) |
| 실행(OpenSphere) | 실행 문서가 원형 한도 안, 프로필 제약을 만족할 수 있는 형태, 회수 verify가 v2 |
| 크기 | 번들 · part · 미디어 한도 |

## 5. 설치 시험(인증됨의 조건)

- **기본: GitHub 호스티드 러너 안의 일회용 클러스터**(kind 또는 k3d). 시험용 키 · 시험용 신뢰 상태만 쓴다(운영 키 금지).
  - Backbone 시험판(Core · 실행부 · 웹훅 · 원장)을 그 클러스터에 띄우고, 패키지를 시험 스토어에서 설치한다.
  - `stateful-engine` 원형 패키지는 이것으로 충분하다.
- **무거운 operator 전제(StackGres 등):** Triangles 패키지에 한해, 사람 검토를 마친 뒤 격리 환경에서 돌린다. 외부 기여 PR이 직접 그 환경을 쓰게 하지 않는다.
- **영수증:** 시험한 git head · 번들 digest · Backbone 시험판 digest · 단계별 결과. 계약 v1 §9와 같은 형식.

## 6. SDK · CLI

- **배포:** `@triangles/store-sdk`(npm, GitHub Packages), CLI `tstore`, `gh` 확장 `gh store`(CLI를 감쌈)
- **담는 것**

| 기능 | 내용 |
|---|---|
| `init` | 템플릿으로 패키지 뼈대 |
| `check` | 판정 + 자동 검사(§4) 중 로컬에서 되는 것 |
| `bundle` | 번들 빌드(정규 바이트) |
| `preview` | A2UI 화면 미리 보기(Console 렌더러와 같은 카탈로그 · 렌더러 원천) |
| `explain <사유 코드>` | 거절 사유 → 가이드 항목 |
| `payload` | 공급자가 서명할 페이로드 생성(서명은 하지 않음) |
| `submit` | Universe에 PR(채널 목록 항목) |

- **담지 않는 것:** 개인 키 · 서명 기능 · 목록 서명.
- **같은 원천 생성:** Backbone 저장소의 판정기 · 스키마 · 카탈로그 · 공유 사례에서 SDK 판을 생성한다. SDK 판은 그 Backbone 판 · 계약 판을 밝힌다. Universe 봇은 스토어 정책이 정한 SDK 판으로 다시 판정한다.
- **Rust 판정기:** 봇은 Rust 판정기도 돌린다(컨테이너 이미지, GHCR, digest 고정). 작성자 로컬은 Node만으로도 되지만, 검증됨 등급은 두 판정기 일치가 조건이다.

## 7. MCP

| MCP | 용도 | 권한 |
|---|---|---|
| **GitHub 공식 MCP 서버** | 작성자의 AI 에이전트가 저장소 · PR · Actions를 다룬다 | 작성자 본인 권한. 읽기 전용 모드 · 도구 선택으로 좁혀 쓰기를 권한다 |
| **Store SDK MCP**(새로 만듦) | 뼈대 만들기, 판정, 거절 사유 설명, A2UI 미리 보기, Universe 목록 검색, 품질 등급 미리 계산 | 로컬 stdio, 읽기만, 키 없음. SDK와 같은 코드 |
| **OpenSphere 지식 MCP**(이미 있음, I4) | 설치된 패키지의 매뉴얼 · 지식을 운영자가 질의 | 설치본 안, 기존 권한 |

- Store SDK MCP는 SDK 판과 같이 나온다(npm). 원격 호스팅은 하지 않는다(작성 중인 비공개 코드를 밖으로 보내지 않음).

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

- **Artifact Attestations:** 공개 저장소는 모든 플랜에서 된다. 비공개 · internal 저장소는 GitHub Enterprise Cloud가 필요하다는 문서가 있다(최신 문서와 표현이 엇갈려 계정을 정할 때 다시 확인). 그래서 작성자 저장소 · 패키지 저장소를 공개로 두는 다중 스토어 S99-3과 맞물린다.
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
| Q-6 | Store SDK MCP는 로컬 stdio · 읽기 전용 · 키 없음. 원격 호스팅 없음 |

## 11. 구현 순서(다중 스토어 MS 단위와 함께)

| 단위 | 내용 | 함께 가는 MS |
|---|---|---|
| PQ1 | SDK 생성 파이프라인(Backbone → `store-sdk`), `check` · `bundle` · `explain` · `payload` | MS3(판정 v2) |
| PQ2 | 재사용 워크플로 `package.yml` · 빌드 증명 · SBOM · 취약점 | MS7(Universe 초기화) |
| PQ3 | Universe 봇(App) · 자동 검사 · 품질 보고 · 등급 서명 필드 | MS7 |
| PQ4 | 가이드 사이트 G-1~G-7, 사유 코드 색인 | PQ1 |
| PQ5 | 템플릿 저장소 · devcontainer · `preview` | PQ1 |
| PQ6 | `certify.yml`(일회용 클러스터 설치 시험) | P1 이후 |
| PQ7 | Store SDK MCP | PQ1 |

## 12. 열린 질문(Codex 검토 · 소유자)

1. Rust 판정기를 봇에서 돌릴 컨테이너 이미지의 빌드 · 서명 경로(Backbone CI 산출물을 GHCR에 공개할지)
2. A2UI 미리 보기 렌더러를 Console에서 떼어 SDK로 낼 때 Angular 의존을 어떻게 줄일지
3. 취약점 기준(심각도 · 유예 기간)과 예외 승인 절차
4. 품질 보고서의 보존 기간과 공개 범위
5. 다른 제품이 자기 제품 부분 검사를 봇에 꽂는 방식(제품별 검사 플러그인 vs 제품별 별도 check)
