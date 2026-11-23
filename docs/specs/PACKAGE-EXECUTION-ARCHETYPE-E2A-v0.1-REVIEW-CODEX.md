# E2a 실행 원형 계약 v0.1 — Codex 검토와 Claude 판단

**대상:** [PACKAGE-EXECUTION-ARCHETYPE-E2A-v0.1.md](PACKAGE-EXECUTION-ARCHETYPE-E2A-v0.1.md)(Blueprint b3d0c9e)
**검토:** 2026-11-23 · Codex. 소유자가 "Codex 검토 먼저"를 정해, Claude가 Codex 세션에 요청했다(채널 #26). 기준 코드는 Backbone main 0aec0e3이다.
**정리 · 판단:** Claude. 결정은 소유자가 내린다.

## 총평(Codex)

E2a 방향에 동의한다. 다만 착수 전에 고칠 것이 넷 있다.
1. 자격 문법
2. TLS 초기화 계약
3. 운영 게시 조건
4. C3 · C5의 증거 기준

**Claude 판단:** 모두 수용한다. 넷 다 코드 대조로 나온 사실이고, 초안에서 제가 놓친 것이다.

## 1. 사실 정정

| 항목 | Codex | Claude 판단 |
|---|---|---|
| §2 `runtime` | 디스크립터 `runtime`을 거절하는 대상은 정확히 `core.backbone` · `ui` · `assembly`다. OpenSearch와 RustFS는 **둘 다** `runtime`을 쓴다 | 수용. 고쳐 쓴다 |
| §3.3 객체 뼈대 | Secret → (ConfigMap) → Service → StatefulSet 순서, 역순 삭제, 복제 1, PVC 정책, 고정 namespace가 코드와 맞다 | 확인 |
| §5 원장 이행 | 이행은 필요 없다. 다만 문서 저장이 실패해도 등록이 `200 formal`을 돌려줄 수 있다. OCI는 원본 바이트를 해시하고 원장은 `jsonb`로 보관한다 | 수용. E2a-1 합격 기준을 바꾼다. 원장을 **다시 읽어** bundleDigest · part · media type · digest · 문서를 대조한다. 문서 누락 · 저장 실패 · 재등록도 시험한다. `execution`은 **정규 JSON 바이트**로만 낸다. 게시기와 판정기가 이를 강제해야 E2b가 다시 직렬화해 digest를 확인할 수 있다 |
| §5 판 혼재 | 옛 판도 모르는 JSON part의 무결성 · 서명은 확인한다. 의미 판정 없이 등록할 수 있다. 등록은 Core만 하는 것이 아니다. **Console BFF 직접 등록**과 **carrier 경로**도 한다 | 수용. 게시 선행 조건을 "Core"에서 "등록을 하는 모든 경로(Core · Console BFF · carrier · Setup 봉인 사본)"로 넓힌다 |
| §5 게시기 | E2a-1이 `modules/<id>/execution.json`을 main에 넣으면 그때부터 운영 게시기가 그 part를 올릴 수 있다 | 수용. **E3 전까지 게시 도구가 `execution` part를 막는다.** 운영자 원천 대조에 `execution`의 누락 · 추가 · 변경 검사를 넣는다 |

## 2. 실행 문서 형식(§3.2)

- **정확한 재현에 필요한 것(Codex):** 공통 렌더러로 두 엔진을 표현할 수 있다. 다만 다음을 계약에 적어야 한다.
  - OpenSearch는 `command` · `readOnlyRootFilesystem` · `envFrom` **필드를 아예 생략한다**(false나 빈 값이 아니다).
  - `users` 볼륨은 키 하나만 투영하고 `defaultMode: 420`이다.
  - `opensearch.yml` 안 JSON 문자열의 직렬화 규칙.
  - RustFS는 TLS 파일 둘을 서로 다른 이름으로 마운트한다.
  - `logs`는 디스크형 emptyDir 100Mi다.
- **범위가 넓다(Codex):** `command` · `env` · `config` · 마운트 경로 · Secret 전체 `envFrom`은 개수 · 길이 한도만으로는 넓다. **신뢰 프로필과 묶은 허용 항목**으로 좁히고, 치환한 뒤에 경로 · 중복 · 호스트 예약 경로를 검사해야 한다.
- **TLS 도우미(Codex):** 지금 스크립트는 엔진 이름으로 인증서 용도를 고르고, PVC의 `provider:DNS`를 검사한다. C1의 기준은 지금 스크립트 바이트로 둔다. 인증서 용도를 형식으로 나누는 변경은 기존 PVC 재기동 시험과 함께 따로 다룬다.

**Claude 판단:** 모두 수용한다. 두 가지를 덧붙인다.
- **허용 항목은 배치 규칙(프로필)에 둔다.** 프로필은 운영자가 서명하는 신뢰 자료이고 Backbone 코드가 아니다. 그래서 엔진별 허용 범위를 프로필에 두어도 "Backbone 이미지 교체 0회" 목표(E6)와 어긋나지 않는다.
  - 프로필 스키마에 닫힌 `execution` 제약을 더한다. 허용 명령, env 이름, 마운트 경로 뿌리, config 파일 이름, `envFrom` 허용 여부가 들어간다.
  - 운영 프로필의 새 판은 E3에서 낸다. E2a는 시험 프로필로 증명한다.
- **TLS 스크립트에는 아직 엔진 분기가 남는다.** E6 Valkey는 이 분기 없이 들어와야 한다. 그래서 "인증서 용도의 형식화"를 **E6 전제**로 기록한다(새 결정 Q6).

## 3. 자격 문법(Q3)

- **지금 문법으로는 그대로 옮길 수 없다(Codex).**
  - 두 엔진 모두 **무작위 32바이트 → 패딩 없는 base64url 43자**를 쓴다.
  - RustFS는 고정 사용자 `osr_admin`이 필요하다.
  - OpenSearch는 같은 비밀번호로 `$2a$12$` 해시를 만들어 정확한 `internal_users.yml` JSON 구조에 넣는다.
  - 웹훅은 비밀값을 지운 뒤에 판정한다. 이 규칙도 함께 정의해야 한다.
- **Valkey 문장은 빼야 한다(Codex).** E6에서 따로 정할 것이 셋 있다. ACL의 SHA-256 형식, 변경을 영속화할 ACL 파일, TLS로 인증한 `PING` 준비 검사다. 지금의 HTTPS GET 준비 검사와 bcrypt 문법으로는 부족하다.

**Claude 판단:** 수용한다. 문법을 다음 넷으로 바꾼다.
- `generate`: 바이트 수 + 인코딩(`base64url-nopad`, `hex`)
- `literal`
- `template`: 정해진 자리표만 쓰고, JSON 구조로 직렬화한다.
- `bcrypt`: `$2a$`, cost 12 고정

Valkey를 위한 확장(SHA-256 ACL, exec 또는 TCP 준비 검사)은 E6 사양에서 정한다. 초안의 "Valkey도 호스트 변경 없이"라는 문장은 지운다.

## 4. 비교 기준(C1~C6)

| 기준 | Codex 추가 | Claude 판단 |
|---|---|---|
| C1 | 필드 생략, 배열 순서, ConfigMap 안 문자열까지 대조한다 | 수용 |
| C2 | 갱신 · 내리기 · 복구를 더한다. 원래 작업의 소유권 · Secret UID가 다르면 거절되는지도 본다 | 수용 |
| C4 | 화면 상태와 실행 완료 판정을 따로 비교한다. 복구 완료에는 현재 세대 외에도 이미지 · 리비전 · Pod Ready · PVC Bound 조건이 있다. `foundation.block-rwo`는 비교 자료에 두고, 복구 삭제가 거절되는 지금 동작도 고정한다 | 수용 |
| C3 | 운영에서는 필요한 필드만 읽고, Secret은 메타데이터 응답만 받는다. 메타데이터만으로는 Secret `judge()` 통과를 증명할 수 없다. 같은 승인 계획의 격리 객체를 서버 dry-run으로 얻고, 시험 Secret을 웹훅의 실제 변환 경로에 넣어 허용 · 거절과 사유를 비교한다. dry-run도 웹훅을 거치면 Core에 감사 기록이 남는다. 그러니 **격리 Core와 시험 원장**에서 한다 | 수용. 운영 스냅샷은 실제 객체 모양을 확인하는 참고 자료로 격을 낮춘다(Q4 수정) |
| C5 | 운영과 겹치지 않는 설치본에서는 호스트가 시험 namespace와 TLS 이름을 함께 정해야 한다. 지금 렌더러는 모듈별 고정 namespace를 검사한다. 확인할 것은 다음이다: 실제 이미지 digest, TLS 검증, 맞는 자격의 로그인과 틀린 자격의 거절, 소량 읽기 · 쓰기, 같은 PVC · Secret으로 재기동, 시험 자원 정리 | 수용. namespace는 클러스터 범위 이름이라 격리 설치본이 운영 `os-backbone-mod-*`와 겹칠 수 있다. 그래서 **호스트가 namespace 접두사를 주입**하게 한다. 운영 값은 지금 고정값 그대로다(새 결정 Q7) |
| C6 | 혼재 사례를 넣는다. 같은 서명 번들을 옛 판은 받고, 새 판은 잘못된 `execution` 때문에 거절한다 | 수용 |

## 5. 판정기 위치 · 구현 단위(§4 · §8)

- **E2a-1 → E2a-2 순서에 동의한다(Codex).**
- 7단계는 정확한 media type · 스키마 · 디스크립터 일치 · 참조를 판정한다.
- 8단계는 이미 검증한 **같은 프로필의 id · version · fingerprint**에 연결해 다음을 확인한다: 이미지 · 저장 · API 그룹 · kind · 개수 · 쓰기 권한.
- E2a-1에는 게시 차단과 원장 다시 읽기 시험까지 넣는다. E2a-2는 렌더링 · 상태 · 격리 기동을 증명한다.

**Claude 판단:** 수용

## 6. 과소평가한 위험(Codex)

- 가장 큰 위험은 기존 인스턴스의 TLS · 자격 · 복구 소유권이 새 원형으로 넘어갈 때 어긋나는 것이다.
- 예: immutable Secret을 만든 직후 응답이 없어지면, 지금 경로는 다음 생성의 `409`를 `unknown`으로 처리한다. C1의 바이트 동일성으로는 이것을 잡지 못한다.
- 대응
  - E2a에서는 이 동작을 비교 시험에 고정한다.
  - E2b · E3 전환 시험에서는 기존 Secret UID · TLS · PVC를 그대로 두고, 원래 작업의 복구 경로가 이어지는지 확인한다.

**Claude 판단:** 수용. C2에 "응답 유실 → 409 → unknown"을 넣는다. E2b 합격 기준에도 같은 줄을 넣는다.

## 7. 수정한 결정 요청

| # | v0.1 권고 | Codex | 수정 권고 |
|---|---|---|---|
| Q1 | 레이어 이름 `execution` | 동의 | 그대로 |
| Q2 | 이미지는 프로필에서만 | 동의, 명령 · 설정 범위도 프로필에 | 이미지는 프로필에서만 온다. **명령 · env 이름 · 마운트 경로 · config 파일 · envFrom 허용도 프로필의 닫힌 `execution` 제약으로 묶는다** |
| Q3 | 무작위 + 템플릿 + bcrypt12, Valkey까지 | 수정 | `generate`(바이트 + base64url-nopad/hex) · `literal` · JSON 구조 `template` · `bcrypt`($2a$, 12). 웹훅의 비밀값 제거 판정도 정의한다. **Valkey는 E6에서 정한다** |
| Q4 | Claude가 운영 객체를 받아 비밀값을 지움 | 수정 | Claude는 운영에서 **필요한 필드와 Secret 메타데이터만** 읽는다(모양 참고). Secret `judge` 증거는 **격리 Core · 시험 원장의 서버 dry-run과 실제 웹훅 변환**으로 만든다 |
| Q5 | 판정기를 담은 Core · Setup만 | 수정 | **등록하는 모든 경로**(Core · Console BFF · carrier · Setup 봉인 사본)가 새 판정기를 쓰기 전에는 `execution` 번들을 운영에 게시하지 않는다. **E3 전까지 게시 도구가 `execution` part를 막는다.** 운영자 원천 대조에 `execution` 검사를 넣는다. 운영 패키지 재게시는 E3에서 한다 |
| Q6(새) | — | TLS 스크립트 엔진 분기 | E2a는 지금 스크립트 바이트를 고정한다. 인증서 용도의 형식화는 기존 PVC 재기동 시험과 함께 따로 낸다. **E6 전제**다 |
| Q7(새) | — | 시험 namespace | 격리 설치본에서는 호스트가 namespace 접두사와 TLS 이름을 주입한다. 운영 값은 지금 고정값이다. 운영과 클러스터 범위 이름이 겹치지 않게 한다 |

소유자가 이 수정안을 정하면 Claude가 사양을 v0.2로 고치고 Codex에 E2a-1부터 지시한다.
