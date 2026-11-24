# 중립 다중 스토어 v0.1

**상태:** 초안(2026-11-24). 소유자 "권장안으로 작성"에 따라 권장안으로 썼다. Codex 검토 뒤 소유자 승인을 받아 결정 대장에 올린다(D-99 예정).
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
| **제품(호스트) 설치본** | 믿을 스토어와 스토어별 허용 범위, 배치 규칙(프로필) | 운영자 신뢰 맥락 | OpenSphere 운영 설치본, Triangles의 다른 제품 |

## 3. 결정(권장안)

| # | 결정 | 이유 |
|---|---|---|
| S99-1 | **Universe를 Triangles 공식 기본 스토어로 한다.** OpenSphere 자체 패키지도 공급자 `triangles`로 Universe에 낸다. `opensphere-platform`은 Backbone 개발 · 빌드에만 남긴다 | 회사 제품이 같은 스토어를 공유한다. OpenSphere만의 스토어를 따로 두면 두 번 관리한다 |
| S99-2 | **스토어 계정은 GitHub 조직으로 한다.** 지금 `triangles-store`는 사용자 계정이다(§7.1) | 구성원 권한, 2단계 인증 강제, 조직 단위 GHCR 패키지 관리 |
| S99-3 | **목록과 번들은 공개하고 신뢰는 서명으로 지킨다.** 판매용 비공개 패키지가 생기면 그것만 별도 비공개 스토어로 둔다. Universe Git 저장소(심사 기록)는 비공개여도 된다 | 설치본마다 읽기 토큰을 나눠 줄 필요가 없다. 체급이 낮은 제품도 자격 없이 읽는다. 비밀은 보안 수단이 아니다 |
| S99-4 | **설치본에 스토어를 더하는 것은 운영자 신뢰 맥락 서명 + 소유자 MFA**로 한다. 지금 릴리스 키를 더하는 절차와 같은 무게다 | 스토어 추가는 "이 설치본이 무엇을 믿는가"를 바꾸는 신뢰 결정이다 |
| S99-5 | **패키지 id는 `<공급자>/<이름>`**, 예: `triangles/provider.postgres`. 공급자 이름 `^[a-z][a-z0-9-]{1,38}$`는 스토어 등록부에 키와 함께 등록한다 | OCI 저장소 경로와 그대로 맞고, 도메인 소유 증명이 필요 없다. 이름 · 키 결합은 등록부가 보증한다 |
| S99-6 | **순서:** 다중 스토어 단위를 B단계 게시보다 먼저 넣는다. OpenSearch · RustFS 새 판은 **Universe에 바로 게시**한다 | 지금 스토어에 게시하면 키 · 목록 · 게시 절차를 곧 두 번 한다. 대가는 P1 지연이다 |

## 4. 스토어 원본: 설치본의 스토어 목록

설치본(원장)은 스토어 목록을 가진다. 각 항목:

| 필드 | 뜻 |
|---|---|
| `storeId` | 설치본 안에서의 이름(`^[a-z][a-z0-9-]{1,38}$`). 예: `universe` |
| `registry` | `https://ghcr.io`(지금은 GHCR만, 원칙상 OCI 배포 규격이면 된다) |
| `namespace` | 그 스토어의 이름 공간. 예: `triangles-store` |
| `catalogRepository` | 목록 저장소(이름 공간 안의 상대 경로). 예: `catalog` |
| `rootKey` | 스토어 기준 공개 키(지문 고정) |
| `channels` | 이 설치본이 따르는 채널. 예: `["edge"]` |
| `scope` | 이 스토어가 낼 수 있는 것: 공급자 목록, 클래스, 레이어(OpenSphere 제품 부분). 기본은 비어 있음 = 아무것도 안 됨 |
| `credential` | 비공개 스토어일 때만, 그 스토어 전용 읽기 자격의 참조 |
| `state` | active · suspended · removed |

**절차**
- **더하기:** 운영자가 신뢰 맥락(스토어 항목 + 기준 키 지문 + 범위)에 서명 → 소유자가 MFA로 적재. 지금 `apply-osr-trust` 경로를 넓힌다.
- **범위 바꾸기:** 더하기와 같다. 좁히기는 즉시 적용한다(새 계획 거절). 넓히기는 다시 서명한다.
- **멈추기(suspended):** 새 등록 · 설치 · 갱신을 거절한다. 이미 설치된 것은 그대로 둔다. 소유자 MFA.
- **지우기(removed):** 그 스토어에서 온 설치본이 남아 있으면 거절한다(`osr_store_in_use`).
- **기준 키 회수:** 그 스토어의 목록 · 등록부를 더 받지 않는다. 이미 설치된 판은 키 · 번들 회수 규칙(계약 v1 §8)을 따른다.

**읽기 구성요소(`backbone-registry-reader`)** 는 스토어 목록을 원장에서 읽고 스토어마다 목록을 받아 Console에 넘긴다. 레지스트리 · 이름 공간 · 자격은 코드 상수가 아니라 이 데이터다.

## 5. 신뢰 모델

TUF(The Update Framework)의 역할 개념에 맞춘다. 라이브러리를 들이는 것이 아니라 형식을 그 개념으로 정리한다.

| TUF 역할 | 여기서 | 키 보관 |
|---|---|---|
| root | 스토어 기준 키. 목록 키 · 등록부 서명 키를 위임하고 교체한다 | 오프라인(소유자) |
| targets(위임) | **공급자 등록부**: 공급자 이름 → 릴리스 공개 키 · 허용 클래스. 스토어 기준 키가 서명 | 오프라인 서명, 공개 게시 |
| snapshot · timestamp | **채널 목록**: 번호는 늘어나기만 함 · 유효 기간. 목록 키가 서명 | 운영자 서명, CI 게시(지금과 같음) |
| 대상 서명 | 패키지 판의 릴리스 서명. 공급자 키가 서명 | 공급자 |

- **설치본이 확인하는 사슬:** 설치본이 믿는 스토어 기준 키 → 그 스토어의 공급자 등록부 → 공급자 키 → 번들 서명. 목록 항목의 공급자가 등록부에 없거나 클래스 범위 밖이면 거절한다.
- **같은 공급자를 두 스토어가 다른 키로 등록하면** 설치본은 그 공급자의 패키지를 어느 쪽에서도 받지 않는다(`osr_publisher_key_conflict`). 같은 키면 하나로 알아본다.
- **같은 패키지 판(`<공급자>/<이름>` + 판)이 두 스토어에 다른 번들 digest로 나오면** 거절한다.
- **운영자 프로필은 그대로다.** 스토어 · 공급자 서명으로 프로필을 만들거나 넓힐 수 없다. 프로필은 `<공급자>/<이름>`에 묶인다.
- **빌더 증명(`trustedBuilders`)** 은 공급자 등록부의 공급자 항목으로 옮긴다(공급자마다 자기 CI).

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

- **v1 번들은 그대로 읽는다.** v1 디스크립터는 "공급자 `triangles` · 제품 `opensphere` 대상"으로 해석해 판정한다. 새로 게시하는 것은 v2다.
- 두 판정기 · Setup 봉인 사본 · 공유 사례에 v2를 함께 넣는다(계약 v1 §1).

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

| 단위 | 내용 |
|---|---|
| MS1 | 원장: 스토어 목록 · 스토어별 신뢰 세대 · 공급자 등록부 · 설치본의 출처(`storeId`, `package`) |
| MS2 | 읽기 구성요소 · Core 레지스트리: 상수 제거, 스토어 목록 데이터로 읽기, 스토어별 자격(공개는 익명) |
| MS3 | 판정: 목록 v2 · 공급자 등록부 · 디스크립터 v2(중립/제품 부분), v1 호환 해석. Node · Rust · Setup 봉인 사본 · 공유 사례 |
| MS4 | 신뢰 맥락: 스토어 추가 · 범위 · 멈추기 · 지우기, 소유자 MFA 적재(`apply-osr-trust` 확장) |
| MS5 | 패키지 id `<공급자>/<이름>`: 원장 키 · 프로필 결합 · 화면 경로 · Shell 명령 id 접두사(`triangles/provider.postgres.status` 대신 표시용 짧은 이름은 따로) |
| MS6 | Console: 스토어 관리 화면(목록 · 범위 · 상태, 변경은 MFA), 스토어 상세에 "출처 스토어 · 공급자" 표시, 스토어별 거름 |
| MS7 | Universe 초기화: 저장소 구조 · 게시 CI · 스토어 기준 키 · 목록 키 · 공급자 `triangles` 키 발급(소유자 오프라인) |

- 이 변경 뒤 새 스토어 · 공급자 · 패키지는 Backbone을 다시 빌드하지 않는다.
- 호스트 계약 · 판정기에 공급자 이름이나 스토어 이름을 박지 않는다.

## 9. 전환

- **운영 설치본은 두 스토어로 시작한다.**
  - `opensphere-legacy`: 지금 `opensphere-platform` 스토어. 기존 기준 키 그대로, 범위는 지금 활성 레거시 판(PostgreSQL · Samba AD · Keycloak)만, 상태 suspended(새 판 없음).
  - `universe`: 새 스토어. 이것이 첫 다중 스토어 실증이 된다.
- 새 판(OpenSearch · RustFS 0.3.0, PostgreSQL A2UI 판, Valkey, Gitea)은 Universe에만 게시한다.
- 레거시 판이 새 판으로 바뀌면(E5b-2 · E7b · P2) `opensphere-legacy`를 지운다. D-96: 데이터 이행은 없다.
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

## 12. 열린 질문(Codex 검토 · 소유자)

1. 공급자 키를 스토어가 위임하는 방식이 충분한가, 공급자 등록부에 공급자 자신의 서명(자기 키 소유 증명)도 요구할까
2. 비공개 스토어의 읽기 자격을 설치본에 어떻게 넣을까(Secret 참조, 원장에는 참조만)
3. Shell 명령 id에 공급자가 들어가면 CLI가 길어진다. 설치본 안에서 겹치지 않을 때만 짧은 이름을 허용할까
4. 목록 · 등록부의 유효 기간(지금 목록은 30일) 기본값
5. GHCR 밖의 OCI 레지스트리(사설 Harbor 등)를 처음부터 받을까, GHCR만으로 시작할까(권장: GHCR만, 원칙은 열어 둠)
