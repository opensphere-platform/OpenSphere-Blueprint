# 중립 다중 스토어 v0.1

**상태:** 초안 2판(2026-11-24). 소유자 "권장안으로 작성"에 따라 권장안으로 썼고, Codex 검토(#87, `reply-087.txt`)를 반영했다. 소유자 승인 뒤 결정 대장에 올린다(D-99 예정).
**작성:** Claude. 구현 관점 검토는 Codex.
**짝 문서:** [패키지 작성 · 품질 표준 v0.1](PACKAGE-AUTHORING-QUALITY-v0.1.md)(가이드라인 · 품질 등급 · SDK · MCP · GitHub 구성)
**관련:** D-95(OS 통합, 재빌드 0회), D-96(데이터 보존 없음), D-98([OS 통합 계약 v1](OS-INTEGRATION-CONTRACT-v1.md) · [모듈 통합 명세](MODULE-INTEGRATION-SPECS-v0.1.md))
**기준 코드:** Backbone main `de81f3a`(운영 반영, 2026-11-24)

## 0. 배경

소유자(2026-11-24, 요지):
- 지금 스토어는 OpenSphere GitHub 저장소의 패키지 하나를 기본이자 유일한 저장소로 상정한다. OpenSphere를 크게 쓰기에는 구조적 한계가 있다.
- Triangles 입장에서도 OpenSphere보다 체급이 낮은 제품이 이 스토어를 함께 쓰려면 **중립적인 스토어 정책**과 **확장 가능한(여러 스토어를 쓰는) 스토어 정책**이 필요하다.
- 이를 위해 `triangles-store/Universe` 저장소를 만들었다.

**지금 한 저장소를 전제한 곳**(main `de81f3a`)

| 위치 | 박혀 있는 것 |
|---|---|
| Core `backend/server/src/osr_registry.rs` | 레지스트리 `ghcr.io`만, 이름 공간 `opensphere-platform/opensphere-`만 |
| `scripts/osr/catalog.mjs` | 목록 저장소 `ghcr.io/opensphere-platform/opensphere-channel-catalog` 하나, 패키지 저장소 이름 규칙 `opensphere-<class>-<slug>` 하나 |
| `infra/osr/trust/trust.json` | `authority: osr.opensphere-platform` 하나, 기준 키 하나, 빌더 하나 |
| 패키지 id(`provider.postgres` 등) | 만든 곳이 없다. 다른 스토어가 같은 id를 내면 충돌한다 |
| 디스크립터 | `plane` · `backboneCompat` · `profile` 같은 OpenSphere 전용 필드가 공통 필수 형식에 섞여 있다 |
| 읽기 자격 | GHCR 읽기 토큰 하나 |
| 원장(Codex #87 A) | `001-ledger.sql`: 점 표기 모듈 PK, (모듈, 판) 유일, 신뢰 행 하나, 전역 key id, (authority, channel, sequence). `003-installations.sql`: 모듈마다 설치본 하나. Core · Services 계획 안에도 모듈 id |
| 읽기 · 운반 | `osr_reader.rs` · `reader-manifests.mjs`(목록 저장소 하나 · 자격 하나), `osr_registry.rs`(GHCR 서비스 이름 · Basic 자격), `osr_carrier.rs`(최신 목록 하나, 모듈 이름으로 저장소 재구성) |
| 서명 · 배포 증거 | `bundle.mjs`가 OCI 저장소를 만들어 주석 · SBOM · 출처 · 릴리스 subject에 쓴다. 판정기가 subject 저장소 · builder를 대조한다. `operator.mjs` · `publish-module.mjs` · 게시 워크플로 둘 |
| 신뢰 맥락 | `trust.json` · `osr.rs` · `setup/src/osr-trust.mjs`: authority · 신뢰 세대 · 프로필 · 키 집합이 하나 |
| 화면 · 명령 | `osr_render.rs`(점 표기 → K8s 이름), `osr_extension.rs`(메뉴 slug · 소유자), `app.routes.ts`(`:module` 하나), Shell id · `command:` 원천 · 지식 · 매뉴얼 id · 의존성 · 실행 문서의 module |

## 1. 원칙

1. **스토어 추가에 Backbone 재빌드 0회**(D-95). 스토어는 설치본의 데이터다. 이 문서의 변경은 그것을 가능하게 하는 Backbone 변경 한 번이다.
2. **스토어는 배포만 보증한다.** 스토어 서명은 "이 스토어가 이 패키지 판을 이 채널로 낸다"까지만 뜻한다. 이미지 · 권한 · Job 이미지 · 실행 제약은 지금처럼 **설치본 운영자가 서명한 프로필**에서만 온다. 그래서 스토어가 늘어도 보안 경계는 넓어지지 않는다.
3. **신뢰는 스토어마다 따로.** 스토어 하나의 키가 새거나 회수돼도 다른 스토어에는 영향이 없다.
4. **제품 중립.** 스토어 · 목록 · 패키지의 공통 부분은 특정 제품의 개념(레이어 · A2UI · 원형)을 모른다. 제품마다 자기 부분만 읽는다.
5. **실패는 닫힌 쪽으로.** 어느 스토어에서 왔는지, 누가 만들었는지 판단할 수 없는 번들은 등록하지 않는다.

## 2. 역할 셋

| 역할 | 하는 일 | 서명 | 예 |
|---|---|---|---|
| **스토어** | 채널별 서명 목록, 공급자 등록부, 스토어 정책, 심사 | 스토어 기준 키 → 목록 키 | Universe(Triangles 공식), 고객사 사설 스토어 |
| **공급자** | 패키지를 만들고 판마다 서명 | 공급자 릴리스 키(스토어 등록부가 위임) | `triangles`, 협력사 |
| **제품(호스트) 설치본** | 믿을 스토어와 스토어별 허용 범위, 승인한 공급자 신원, 배치 규칙(프로필) | 운영자 신뢰 맥락 | OpenSphere 운영 설치본, Triangles의 다른 제품 |

**세 가지를 구별한다**(#87 B-1): 패키지 정체(`<공급자>/<이름>`), 그 패키지의 판(정체 + 판 + 번들 digest = 릴리스 하나), 배포 위치(어느 스토어 · 저장소). 같은 digest가 두 스토어에서 나와도 릴리스는 하나이고 **출처 영수증**이 둘이다.

## 3. 결정(권장안)

| # | 결정 | 이유 |
|---|---|---|
| S99-1 | **Universe를 Triangles 공식 기본 스토어로 한다.** OpenSphere 자체 패키지도 공급자 `triangles`로 Universe에 낸다. `opensphere-platform`은 Backbone 개발 · 빌드에만 남긴다 | 회사 제품이 같은 스토어를 공유한다. OpenSphere만의 스토어를 따로 두면 두 번 관리한다 |
| S99-2 | **스토어 계정은 GitHub 조직으로 한다.** 지금 `triangles-store`는 사용자 계정이다(§7.1) | 구성원 권한, 2단계 인증 강제, 조직 단위 GHCR 패키지 관리 |
| S99-3 | **목록과 번들은 공개하고 신뢰는 서명으로 지킨다.** 판매용 비공개 패키지가 생기면 그것만 별도 비공개 스토어로 둔다. Universe Git 저장소(심사 기록)는 비공개여도 된다 | 설치본마다 읽기 토큰을 나눠 줄 필요가 없다. 체급이 낮은 제품도 자격 없이 읽는다. 비밀은 보안 수단이 아니다 |
| S99-4 | **설치본에 스토어를 더하는 것은 운영자 신뢰 맥락 서명 + 소유자 MFA**로 한다. 지금 릴리스 키를 더하는 절차와 같은 무게다 | 스토어 추가는 "이 설치본이 무엇을 믿는가"를 바꾸는 신뢰 결정이다 |
| S99-5 | **패키지 정체는 `<공급자>/<이름>`**, 예: `triangles/provider.postgres`. 공급자 이름 `^[a-z][a-z0-9-]{1,38}$`는 스토어 등록부에 키와 함께 등록한다. **기존 모듈 id와 서명 · 승인 바이트는 그대로 두고** 새 정체를 원장에 병기한다(§6.3) | OCI 저장소 경로와 그대로 맞고, 도메인 소유 증명이 필요 없다. 기존 서명 · 승인 이력을 다시 만들지 않는다 |
| S99-6 | **순서:** 다중 스토어 단위를 B단계 게시보다 먼저 넣는다. OpenSearch · RustFS 새 판은 **Universe에 바로 게시**한다 | 지금 스토어에 게시하면 v2 디스크립터 · 위치에 묶인 SBOM · 출처 · 릴리스 서명 · 0.3.0 프로필 결합을 곧 다시 한다(#87 E). 대가: A단계에서 내린 OpenSearch · RustFS가 MS 검수까지 운영에 없다(지금 이 둘을 쓰는 설치본 · Claim은 없다). **소유자 결정 대기** |

## 4. 스토어 원본: 설치본의 스토어 목록

설치본(원장)은 스토어 목록을 가진다. 각 항목:

| 필드 | 뜻 |
|---|---|
| `storeId` | 설치본 안의 **로컬 별칭**(`^[a-z][a-z0-9-]{1,38}$`). 예: `universe`. 서명 주체는 아래 고정 스토어 정체로 확인한다 |
| `storeIdentity` | 바뀌지 않는 스토어 정체(레지스트리 + 이름 공간 + 최초 root 지문). 목록 · 등록부 서명 domain에 들어간다 |
| `registry` | `https://ghcr.io`(지금은 GHCR만, 원칙상 OCI 배포 규격이면 된다) |
| `namespace` | 그 스토어의 이름 공간. 예: `triangles-store` |
| `catalogRepository` | 목록 저장소(이름 공간 안의 상대 경로). 예: `catalog` |
| `rootKey` | 스토어 기준 공개 키(지문 고정) |
| `channels` | 이 설치본이 따르는 채널. 예: `["edge"]` |
| `scope` | 이 스토어가 낼 수 있는 것: 공급자 목록, 클래스, 레이어(OpenSphere 제품 부분), 최소 품질 등급. 기본은 비어 있음 = **두 판정기와 실제 승인에서 명시적으로 거절** |
| `floors` | 채널별 목록 번호 · 등록부 판 · root 판의 하한. root 교체나 멈춤 → 재개로 **초기화하지 않는다**. 처음 더할 때 운영자 신뢰 맥락이 최소 판(checkpoint)을 준다 |
| `credential` | 비공개 스토어일 때만, 그 스토어 전용 읽기 자격의 참조 |
| `state` | active · suspended · removed |

**절차**
- **더하기:** 운영자가 신뢰 맥락(스토어 항목 + 기준 키 지문 + 범위)에 서명 → 소유자가 MFA로 적재. 지금 `apply-osr-trust` 경로를 넓힌다.
- **범위 바꾸기:** 더하기와 같다. 좁히기는 즉시 적용한다(새 계획 거절). 넓히기는 다시 서명한다.
- **멈추기(suspended):** 새 등록 · 설치 · 갱신을 거절한다. 이미 설치된 것은 그대로 둔다. 소유자 MFA.
- **지우기(removed):** 그 스토어에서 온 설치본이 남아 있으면 거절한다(`osr_store_in_use`).
- **기준 키 회수:** 그 스토어의 목록 · 등록부를 더 받지 않는다. 이미 설치된 판은 키 · 번들 회수 규칙(계약 v1 §8)을 따른다.
- **만료:** 목록 · 등록부가 만료되면 새 등록 · 승인을 멈춘다. 이미 도는 워크로드를 멈추는 권한은 만들지 않는다.
- **비공개 스토어 자격:** 원장에는 승인된 전용 namespace의 Secret 참조만 둔다. 저장소 범위 읽기 전용 토큰, 전송 · 캐시 · 회전은 스토어별로 나눈다. 다른 호스트로의 redirect에 자격을 보내지 않는다.

**읽기 구성요소(`backbone-registry-reader`)** 는 스토어 목록을 원장에서 읽고 스토어마다 목록을 받아 Console에 넘긴다. 레지스트리 · 이름 공간 · 자격은 코드 상수가 아니라 이 데이터다.

## 5. 신뢰 모델

TUF(The Update Framework)의 역할 개념에 맞춘다. 라이브러리를 들이는 것이 아니라 형식을 그 개념으로 정리한다.

| TUF 역할 | 여기서 | 키 보관 |
|---|---|---|
| root | 스토어 기준 키. 목록 키 · 등록부 서명 키를 위임하고 교체한다 | 오프라인(소유자) |
| targets(위임) | **공급자 등록부**: 공급자 이름 → 릴리스 공개 키 · 허용 클래스. 스토어 기준 키가 서명 | 오프라인 서명, 공개 게시 |
| snapshot · timestamp | **채널 목록**: 번호는 늘어나기만 함 · 유효 기간. 목록 키가 서명 | 운영자 서명, CI 게시(지금과 같음) |
| 대상 서명 | 패키지 판의 릴리스 서명. 공급자 키가 서명 | 공급자 |

- **설치본이 확인하는 사슬:** 설치본이 믿는 스토어 root → 그 스토어의 공급자 등록부 → 공급자 키 → 번들 서명. 목록 항목의 공급자가 등록부에 없거나 클래스 범위 밖이면 거절한다.
- **키는 지문으로 비교한다.** `keyId` 문자열이 같은 것은 증거가 아니다. 알고리즘 + 공개 키 지문을 비교한다.
- **공급자 신원은 설치본이 승인한다.** 운영자 신뢰 맥락이 "공급자 이름 → 키 지문 집합"을 승인한다. 어느 스토어 등록부가 같은 이름을 다른 키로 내면 **그 스토어의 그 공급자 항목만** 거절한다(`osr_publisher_key_conflict`). 정상 스토어는 막지 않는다. 키 회전은 미리 승인한 같은 공급자 키 집합의 겹치는 기간으로 한다.
- **공급자 키 소유 증명:** 첫 등록 · 회전 때 공급자가 (공급자 이름, 스토어 정체, 공개 키 지문, nonce) 챌린지에 서명한다. 공급자 자신의 서명을 스토어 승인으로 해석하지 않는다.
- **같은 판 다른 digest:** 같은 `(정체, 판)`이 다른 번들 digest로 오면 원장 트랜잭션에서 직렬화하고 충돌로 기록한다. 먼저 왔다는 이유로 이후 자동 갱신하지 않는다. 같은 digest면 그 저장소 subject의 서명과 현재 목록 연결을 확인한 뒤 출처 영수증만 더한다.
- **root 교체:** 순차 root 판, 옛 root와 새 root 서명을 모두 요구한다. 옛 키를 잃으면 운영자 서명 + 소유자 MFA로 다시 등록하되 하한과 회수 기록은 유지한다.
- **한 묶음으로 활성화:** 목록은 등록부의 digest · 판 · 크기 한도를 담고, 목록 · 등록부가 같은 root · 스토어 정체에 묶인다. 새 root · 목록 · 등록부는 같은 검증 스냅숏으로 함께 활성화한다. 등록부 회수의 판 하한은 목록과 따로 지킨다.
- **승인 결합:** 설치 승인에는 채택 당시 출처(스토어 정체 · 목록 · 등록부 digest · 공급자 키 지문)를 묶는다. 실행 직전에도 현재 범위 · 멈춤 · 명시적 회수를 다시 확인한다. 시작된 실행의 결과 기록은 완료 증거로 닫을 수 있어야 한다.
- **롤백 방지:** 낮은 번호, 같은 번호 다른 digest의 목록을 거절하는 지금 규칙(`001-ledger.sql` 동시성 잠금)을 (스토어, 채널) 단위로 잇는다.
- **유효 기간 기본값:** 목록 7일, 등록부 30일, 오프라인 root 1년(만료 전 회전). 첫 운영에서 목록을 자주 서명할 수 없으면 30일로 시작하고, 그만큼 긴 동결 노출을 승인자가 안다. 등록부가 목록보다 먼저 만료되면 새 승인도 멈춘다.
- **운영자 프로필은 그대로다.** 스토어 · 공급자 서명으로 프로필을 만들거나 넓힐 수 없다. 공급자 등록부의 builder 위임은 출처 증명에만 쓴다.
- TUF에서 채택하는 것은 위 위협 대응(롤백 · 동결 · 키 교체 · 혼합 스냅숏)뿐이다. 근거: [TUF 명세 — 클라이언트 흐름](https://theupdateframework.github.io/specification/latest/#detailed-client-workflow)
- **빌더 증명(`trustedBuilders`)** 은 공급자 등록부의 공급자 항목으로 옮긴다(공급자마다 자기 CI). 구조는 바뀌어도 Console BFF · Core · Setup이 증명 결과를 받는 신뢰 경계는 남는다.

## 6. 형식

### 6.1 채널 목록 v2(`opensphere.channel-catalog/v1` → 중립 `store.channel-catalog/v2`)

```
schema, store (스토어 이름 공간), channel, sequence, issuedAt, expiresAt,
publishers: { digest },            // 이 목록이 기대는 공급자 등록부 판
entries: [{ package: "triangles/provider.postgres", version, bundleDigest,
            repository: "triangles/provider.postgres",   // 이름 공간 안 상대 경로
            targets: [{ product: "opensphere", contract: "^1.0" }] }]
```

- `authority` 필드는 `store`로 바뀐다. 설치본이 고정한 스토어 이름 공간과 같아야 한다.
- `targets`는 이 판을 받을 수 있는 제품과 판 범위다. 제품은 자기 이름이 없는 항목을 무시한다.

### 6.2 패키지 형식 v2: 중립 부분과 제품 부분

| 부분 | 내용 | 읽는 쪽 |
|---|---|---|
| **중립 핵심**(`descriptor` v2) | `package`(공급자/이름) · `version` · `displayName` · `description` · `license` · `owner` · `dependencies`(공급자/이름 + 판 범위) · `supplyChain` · `targets` | 모든 제품 |
| **중립 부분** | `listing` · `listing-media` · `manual` · `knowledge` · 릴리스 서명 | 모든 제품 |
| **OpenSphere 제품 부분**(`targets[product=opensphere]`) | `class` · `plane` · `backboneCompat` · `profile` · `capabilityRequests` · `contributions`, part `commands` · `extension` · `execution` · `static` | OpenSphere |
| 다른 제품 부분 | 그 제품이 정한다 | 그 제품 |

- **v1 번들은 그대로 읽는다**(#87 B-3). v1 바이트를 기존 도메인 · 기존 신뢰로 검증한 뒤, 승인된 설치본 데이터에서 v2 표시 정체를 투영한다.
  - 일반 v1을 무조건 `triangles`로 바꾸지 않는다. **명시적 매핑**(레거시 스토어 · 원래 릴리스 키 지문 · 원래 모듈 id → 정체)에 고정한다.
  - 검증된 v1 part(`commands` · `execution` · `extension` 등)의 원래 `module`은 다시 정규화하거나 서명하지 않는다.
  - 새 v2는 원래 정체 · 제품 판정 대상 · part hash를 서로 묶는다.
- **판정 결과를 둘로 낸다.** 중립 판정과 OpenSphere 제품 판정을 따로 돌려준다. 다른 제품이 중립 판정 통과를 권한 판정 통과로 혼동하지 않게 한다.
- **공유 사례(새로):** v1 별칭 위조, v1 원본 · 투영 혼용, 같은 이름 다른 공급자, 잘못된 제품 · 계약, 같은 digest의 다른 출처, 다른 공급자 의존성, 옛 `?instance=` · URL · CLI 별칭 충돌. v1 사례는 결과 코드 · 이유 · 서명 바이트 · digest가 그대로여야 한다.
- 두 판정기 · Setup 봉인 사본 · 공유 사례에 v2를 함께 넣는다(계약 v1 §1).

### 6.3 이름이 쓰이는 곳(#87 A)

- **원장:** 기존 모듈 id · 승인 JSON은 그대로 둔다. 새 정체 키와 원래 서명 id를 병기하는 열을 이행으로 먼저 채운다. 설치본 출처에 스토어 정체 · 목록 · 등록부 digest · 공급자 키 지문을 남긴다.
- **K8s 이름:** 기존 namespace는 원장에 붙여 그대로 쓴다. 새 namespace는 정체에서 만들지 않고 **고정 길이 식별자**를 준다(길이 · 문자 제한 · 충돌 회피).
- **메뉴 주소:** 정체에서 만들지 않는다. 지금처럼 확장 선언의 섹션 · 묶음 · slug와 원자적 충돌 검사를 쓴다.
- **화면 · API 경로:** 단일 `:module` 대신 공급자 · 이름을 나눈 인자. 옛 경로는 별칭으로 남긴다.
- **Shell · CLI:** 승인 · 기록 · 직접 호출은 정체 전체. 짧은 별칭은 설치본 안에서 겹치지 않음을 원장이 정했을 때만, 호출 직전 서버가 현재 활성 정체 + 번들 digest에 결합한다. 모호하면 후보를 보이고 거절한다.
- **위치가 바뀐 번들:** 같은 바이트를 다른 OCI 저장소로 옮겨도 옛 위치에 묶인 referrer(SBOM · 출처 · 서명)는 다시 쓸 수 없다. 새 위치에서 다시 만든다.

## 7. Universe 저장소

### 7.1 계정
- 지금 `triangles-store`는 **사용자 계정**이다(2026-11-24 확인, 저장소 `Universe`는 비어 있는 비공개 저장소).
- 조직으로 바꾸는 두 방법(소유자가 GitHub에서 직접):
  - (가) 사용자 계정 `triangles-store`를 조직으로 전환한다(이름 · 주소 유지). 전환 뒤 그 계정으로는 로그인할 수 없으므로 관리자 계정을 먼저 정해야 한다.
  - (나) 새 조직을 만들고 저장소를 옮긴다.
- 권장: (가). 이름이 이미 스토어 이름 공간(`ghcr.io/triangles-store/…`)으로 쓰기 좋다.

### 7.2 Git 저장소(심사 · 원본)

```
store.json                      스토어 정책: 이름 공간 · 채널 · 지원 제품 · 심사 규칙
keys/root.pub.json              스토어 기준 공개 키(교체 이력 포함)
publishers/<name>.json          공급자 항목: 릴리스 공개 키 · 허용 클래스 · 빌더 증명
channels/<channel>/entries.json 채널 목록 원본(사람이 검토하는 PR 대상)
reviews/<package>/<version>.md  심사 기록
```

- 패키지를 목록에 올리는 것 = `channels/<channel>/entries.json`을 바꾸는 PR과 검토
- 병합되면 운영자가 목록 봉투에 서명하고 CI가 GHCR에 올린다(지금 `operator.mjs catalog` → `catalog-publish.py`와 같은 분리). 개인 키는 저장소 · CI에 없다.

### 7.3 GHCR(배포)

| 저장소 | 내용 |
|---|---|
| `ghcr.io/triangles-store/catalog` | tag `<channel>`(가장 새 목록) · `<channel>-<sequence>`(바뀌지 않음) |
| `ghcr.io/triangles-store/publishers` | 스토어 기준 키가 서명한 공급자 등록부 |
| `ghcr.io/triangles-store/<공급자>/<이름>` | 패키지 번들(판 tag + digest) |

## 8. OpenSphere 반영(Backbone 한 번)

순서(#87 B-2):

| 순서 | 단위 | 내용 |
|---|---|---|
| 1 | MS1 | 원장: 스토어 목록 · 스토어 정체 · 하한 · 공급자 신원 승인 · 설치본 출처, 정체 키 병기 이행(기존 id · 서명 · 승인 바이트 유지) |
| 2 | MS3a | 중립 메타데이터: 목록 v2 · 공급자 등록부 · 디스크립터 v2 핵심, 두 판정기 · Setup 봉인 사본 · 공유 사례 |
| 3 | MS3b | 제품 투영: OpenSphere 제품 부분 판정, v1 명시 매핑 호환, 결과 둘로(중립 · 제품) |
| 4 | MS2 | 읽기 구성요소 · Core 레지스트리 · carrier: 상수 제거, 스토어 목록 데이터로 읽기, 스토어별 자격(공개는 익명), 커서 · 실패 이력 · staging에 출처. 레지스트리 · 저장소 · 토큰 발급 경로는 코드에서 나누고, 설정은 `https://ghcr.io`와 정확한 저장소 범위만 허용 |
| 5 | MS4 | 신뢰 맥락: 스토어 추가 · 범위 · 멈춤 · 지우기 · root 교체, 소유자 MFA 적재(`apply-osr-trust` 확장) |
| 6 | MS5a | 화면 · API · CLI 경로와 별칭 |
| 7 | MS5b | 승인 · 프로필 결합(정체 · 출처), 독립 검사 |
| 8 | MS6 | Console: 스토어 관리(목록 · 범위 · 상태, 변경은 MFA), 상세에 출처 스토어 · 공급자 · 품질 등급 |
| 9 | MS7 | 게시 실증: Universe 목록 · 등록부 · 번들, 두 스토어 동시 운용 |

- MS7의 Git 원본 구조 · 격리 시험 키는 호스트 단위와 나란히 준비한다.
- **MS4 전에는 격리 밖에서 새 스토어를 켜지 않는다.**
- MS 초반에 두 스토어 · 양쪽 서명의 작은 격리 실증을 한다(#87 E).
- 이 변경 뒤 새 스토어 · 공급자 · 패키지는 Backbone을 다시 빌드하지 않는다. 호스트 계약 · 판정기에 공급자 이름이나 스토어 이름을 박지 않는다.

## 9. 전환

- **운영 설치본은 두 스토어로 시작한다.**
  - `opensphere-legacy`: 지금 `opensphere-platform` 스토어. 기존 기준 키 그대로, 범위는 지금 활성 레거시 판(PostgreSQL · Samba AD · Keycloak)만, 상태 suspended(새 판 없음).
  - `universe`: 새 스토어. 이것이 첫 다중 스토어 실증이 된다.
- 새 판(OpenSearch · RustFS 0.3.0, PostgreSQL A2UI 판, Valkey, Gitea)은 Universe에만 게시한다.
- 레거시 판이 새 판으로 바뀌면(E5b-2 · E7b · P2) `opensphere-legacy`를 지운다. 지우기 전에 그 스토어를 참조하는 활성 설치본 · 계획 · 복구 · 회수 증거가 없는지 확인한다. D-96: 데이터 이행은 없다.
- `opensphere-platform`의 목록 · 패키지 저장소는 그 뒤 보관하지 않고 정리한다(소유자 확인 뒤).

## 10. 다른 제품

- 체급이 낮은 제품은 **중립 부분만** 쓴다: 스토어 목록 · 공급자 등록부 · 목록 v2 · 디스크립터 v2 핵심 · listing · manual · knowledge · 서명.
- 그 제품이 Universe에 자기 제품 이름(`product`)을 등록하면, 패키지는 `targets`로 그 제품을 대상으로 삼을 수 있다.
- 판정은 공유 라이브러리(Node 판정기의 중립 부분)를 쓴다. 제품 부분 판정은 제품마다 따로다.

## 11. 진행 중인 일과의 순서(D-98 §6.1 개정안)

1. 지금 진행: E5b-2 나머지 · C1 · E7a(그대로)
2. **MS1~MS7**(이 문서)
3. B단계: OpenSearch · RustFS 0.3.0을 **Universe에** 게시 · 설치
4. V1 Valkey · G1 Gitea(Universe 게시) → TLS · H3 · S3 → P1(Universe에서 설치 · 재빌드 0회 실증, 스토어 추가도 재빌드 0회로 실증) → P2 → E7b

## 12. 열린 질문의 답(#87 D)

1. **공급자 키 소유 증명:** 요구한다(§5).
2. **비공개 스토어 자격:** Secret 참조만 원장에(§4). 처음은 공개 Universe 익명 읽기.
3. **짧은 CLI 별칭:** 조건부로 허용(§6.3).
4. **유효 기간:** 목록 7일 · 등록부 30일 · root 1년(§5).
5. **레지스트리:** 처음은 GHCR만. 코드에서는 레지스트리 · 저장소 · 토큰 경로를 나눠 둔다(§8 MS2). 근거: [GitHub Container registry](https://docs.github.com/en/packages/working-with-a-github-packages-registry/working-with-the-container-registry)

## 13. 소유자 결정 대기

- **S99-6 시점:** B단계(OpenSearch · RustFS 새 판)를 MS 뒤에 Universe로 낼지(권장), 지금 스토어로 먼저 낸 뒤 나중에 옮길지
- S99-1~5는 권장안대로 썼다. 승인되면 D-99로 올린다
