# 실행 원형 계약 · 나란히 비교 — E2a(v0.2)

**상태:** 소유자 결정(2026-11-23, D-94, "수정안대로"). [v0.1](PACKAGE-EXECUTION-ARCHETYPE-E2A-v0.1.md)에 [Codex 검토](PACKAGE-EXECUTION-ARCHETYPE-E2A-v0.1-REVIEW-CODEX.md)를 반영했다.
**작성:** 2026-11-23 · Claude
**잇는 문서:** [실행 분리 계획 v0.2](PACKAGE-EXECUTION-DECOUPLING-PLAN-v0.2.md)(D-92) §3.1 · §3.2 · §4 E2a
**역할:** 사양 · 검수 · 운영 반영은 Claude, 구현은 Codex, 결정은 소유자다.
**기준 코드:** Backbone main 0aec0e3

## 1. E2a가 하는 것과 하지 않는 것

**한다**
1. 패키지 번들에 **실행 문서**(`execution` part)를 정한다. 첫 원형은 `stateful-engine/1`이다.
2. 배치 규칙(프로필)에 닫힌 **실행 제약**을 더한다. 실행 문서는 그 안에서만 값을 정한다.
3. Node · Rust 두 판정기가 같은 사례를 같게 판정한다. 번들 · 서명 · 원장 기록 · Setup 봉인 사본에 넣는다.
4. **E3 전까지 운영 게시를 막는다.** 게시 도구가 막고, 운영자 원천 대조도 검사한다.
5. **원형 렌더러**를 만든다. 기존 OpenSearch · RustFS 렌더러와 나란히 놓고 결과와 동작이 같음을 증명한다.

**하지 않는다(E2b 이후)**
- 승인 · 계획 · 실행부 · 웹훅 · 원장 함수의 동작은 바꾸지 않는다. **E2a 뒤에도 실제로 객체를 만드는 것은 기존 Rust 렌더러다.**
- 계획에 실행 문서 digest를 묶는 일(E2b)은 하지 않는다. 형식만 §8에서 미리 정한다.
- 운영 OpenSearch · RustFS 패키지와 운영 프로필의 새 판 게시(E3)는 하지 않는다.
- TLS 인증서 용도를 형식으로 나누는 일은 하지 않는다. 이것은 E6 전제다(§3.5).
- 자격 문법의 Valkey 확장(SHA-256 ACL, ACL 영속화, TLS `PING` 준비 검사)은 하지 않는다. E6 사양에서 정한다.

**Backbone 갱신은 1회다.** 새 판정기가 등록하는 모든 경로(Core · Console BFF · carrier)와 Setup 봉인 사본에 들어간다. 원장 이행은 없다(§5).

## 2. 이름

| 항목 | 값 |
|---|---|
| 번들 part | `execution` |
| media type | `application/vnd.opensphere.execution.v1+json` |
| 문서 schema | `opensphere.module-execution/v1` |
| 원천 파일 | `modules/<id>/execution.json` |
| 원형 id | `stateful-engine/1`(원형 이름/원형 판) |

`runtime`은 쓰지 않는다. 이유는 둘이다.
- 디스크립터의 `runtime` 객체와 겹친다. OpenSearch와 RustFS가 둘 다 이 객체를 쓰고, 판정기는 `core.backbone` · `ui` · `assembly`에 이 객체가 있으면 거절한다.
- "layer"는 Console 섹션의 이름이기도 하다.

## 3. 형식

### 3.1 원칙

- **닫힌 형식이다.** 모든 객체가 `additionalProperties: false`다. 임의 YAML · Kubernetes 조각 · hostPath · 특권 · 추가 컨테이너 · 추가 kind를 받지 않는다.
- **엔진마다 다른 것만** 문서에 적는다. 객체 뼈대 · 이름 · 라벨 · 보안 설정은 원형이 고정한다(§3.4).
- **이미지는 프로필의 `image`에서만 온다.** 문서에는 이미지 필드가 없다.
- **명령 · env 이름 · 마운트 경로 · config 파일 · envFrom 허용 범위는 프로필의 `execution` 제약이 정한다**(§3.3). 프로필은 운영자가 서명하는 신뢰 자료이고 Backbone 코드가 아니다.
- **생략은 생략이다.** 문서에 없는 선택 필드는 렌더 결과에서도 빠진다. false나 빈 배열로 채우지 않는다. 지금 OpenSearch 객체에는 `command` · `readOnlyRootFilesystem` · `envFrom`이 없다.
- **자리표는 정해진 것뿐이다.**
  - 어디서나: `${instance.name}` · `${instance.namespace}` · `${preset.<키>}`
  - 자격 템플릿에서만: `${credential.<키>}` · `${bcrypt(credential.<키>)}`
  - 식이나 조건은 없다. 호스트가 글자 그대로 바꿔 넣는다.
  - 치환한 **뒤에** 경로 · 이름 · 중복 · 예약 경로를 다시 검사한다.
- **정규 JSON 바이트로 낸다.** 게시기는 `execution` 레이어를 정규 JSON(정해진 키 순서 · 공백 없음)으로 쓴다. 판정기는 레이어 바이트가 그 문서의 정규 직렬화와 같지 않으면 거절한다. 그래야 원장의 `jsonb`를 E2b가 다시 직렬화해 서명 digest를 확인할 수 있다.

### 3.2 실행 문서(`stateful-engine/1`)

| 필드 | 뜻 | 형식 · 한도 |
|---|---|---|
| `schema` · `module` · `version` | `bundle.mjs`가 module · version을 채운다 | 디스크립터와 같아야 한다 |
| `archetype` | `stateful-engine/1` | 호스트 계약이 아는 원형 · 판만 |
| `profile` | 이 문서를 쓰는 실행 프로필 id | §4 관계 판정 |
| `engine.name` | 컨테이너 이름이자 `app.kubernetes.io/name` | `^[a-z][a-z0-9-]{1,30}$` |
| `engine.uid` | runAsUser · runAsGroup · fsGroup | 1000~65535 |
| `engine.port` | 서비스 · 컨테이너 포트(이름 `https`, TCP) | 1024~65535 |
| `engine.command` | (선택) 진입 명령 | 프로필이 허용한 명령과 정확히 같아야 한다 |
| `engine.readOnlyRootFilesystem` | (선택) true만 쓸 수 있다 | 없으면 필드도 없다 |
| `engine.readiness` | HTTPS GET `path` · `periodSeconds`. 실패 한도 3은 원형이 고정한다 | 경로 `^/[A-Za-z0-9/_.-]{0,120}$`, 주기 1~60 |
| `engine.env` | 이름 · 값(자리표 허용), 순서 그대로 | 최대 32개. 이름은 프로필 허용 목록 안이어야 한다. `OSR_` · `KUBERNETES_`로 시작하면 안 된다 |
| `engine.envFromCredentials` | (선택) 자격 Secret 전체를 envFrom으로 | 프로필이 허용할 때만 |
| `engine.mounts` | 아래 `from` 다섯 가지, 순서 그대로 | 최대 16개. 경로는 프로필이 허용한 뿌리 아래의 절대경로다. `..`가 없고 겹치지 않는다. `/proc` · `/sys` · `/dev` · `/var/run/secrets`는 언제나 거절한다 |
| `engine.scratch` | 추가 emptyDir: `name` · `sizeLimit` · `medium`(`disk` 또는 `memory`) | 최대 4개, 각 1Gi 이하. 이름은 원형 예약어(`scripts` · `scratch` · `data` · `config` · `users`)와 겹치면 안 된다 |
| `config` | 파일 이름 → `{format: "json" 또는 "text", value}`. 있으면 ConfigMap `<name>-engine` 하나가 된다. `json`은 정규 직렬화한 **문자열**로 들어간다 | 파일 이름은 프로필 허용 목록 안이어야 한다. 합계 64KiB 이하 |
| `credentials` | 자격 Secret `<name>-engine-auth`의 키 목록(§3.5) | 최대 8개 |
| `presets` | `id` · `requests` · `limits` · `values`(자리표 값) | 1~4개. limits는 CPU 8, 메모리 32Gi 이하. requests ≤ limits. 모든 프리셋의 `values` 키가 같아야 한다 |

**`mounts.from`**

| from | 렌더 결과 |
|---|---|
| `data` | PVC `data`, `subPath` 필수 |
| `tls` | PVC `data`의 `tls` 하위 경로, 읽기 전용. `file`이 있으면 `tls/<file>` 파일 하나다. RustFS가 인증서 파일 둘을 서로 다른 이름으로 마운트할 때 쓴다 |
| `config` | 볼륨 `config`(ConfigMap `<name>-engine`, `defaultMode: 420`). `file`의 subPath 마운트, 읽기 전용 |
| `credentials` | 볼륨 `users`(Secret `<name>-engine-auth`). 그 `file` 키 **하나만** 투영하고 `defaultMode: 420`이다. 읽기 전용 |
| `scratch` | `engine.scratch`의 이름 |

### 3.3 프로필의 실행 제약(materializer-profile 스키마 확장)

프로필 스키마에 선택 필드 `execution`을 더한다. 닫힌 형식이다.

```json
"execution": {
  "archetypes": ["stateful-engine/1"],
  "commands": [["/usr/bin/rustfs"]],
  "envNames": ["RUSTFS_ADDRESS", "RUSTFS_CONSOLE_ENABLE", "RUSTFS_VOLUMES", "RUSTFS_OBS_LOG_DIRECTORY", "RUSTFS_TLS_PATH"],
  "envFromCredentials": true,
  "mountRoots": ["/data", "/logs", "/opt/tls"],
  "configFiles": [],
  "credentialKeys": ["RUSTFS_ACCESS_KEY", "RUSTFS_SECRET_KEY"]
}
```

- 위 값은 형식을 보이는 예다. 실제 값은 지금 코드에서 옮긴다.
- 실행 문서는 이 범위 안에서만 값을 정한다.
- 운영 프로필의 새 판은 E3에서 낸다. E2a는 **시험 프로필**(시험 키 · 격리 신뢰 맥락)로 증명한다.
- `execution`이 없는 프로필은 실행 문서를 받지 않는다. 기존 프로필의 판정은 바뀌지 않는다.

### 3.4 원형이 고정하는 것(문서로 바꿀 수 없음)

- **객체 · 이름 · 순서**
  - Secret `<name>-engine-auth`: immutable, 라벨 `opensphere.io/osr-engine-auth=<engine.name>`
  - ConfigMap `<name>-engine`: `config`가 있을 때만
  - Service `<name>`: ClusterIP, 포트 `https`
  - StatefulSet `<name>`
  - 만드는 순서는 위 순서다. 지울 때는 거꾸로다.
- **설치 객체:** 공용 ConfigMap `storage-instance-tls`(`instance-tls.sh`)
- **StatefulSet**
  - 복제 1. PVC 보존은 지울 때 Delete, 줄일 때 Retain.
  - 서비스 계정 토큰 없음, `enableServiceLinks: false`, 종료 유예 30초, linux/amd64 노드 선택.
  - runAsNonRoot, seccomp RuntimeDefault, 권한 상승 없음, capabilities 모두 제거.
  - 초기화 컨테이너 `instance-tls`. TLS 도우미 이미지 · 명령 · 리소스는 호스트가 고정한다.
  - 볼륨 `scripts` · `scratch`(Memory 1Mi).
  - PVC 템플릿 `data`(RWO). 저장 클래스와 크기는 `storageProfile` · `sizeGiB`로 정한다(10~200GiB).
- **라벨 · 주석:** `osr-instance` · `osr-managed` · `app.kubernetes.io/name` · `osr-installation` · `osr-plan-digest` · `osr-operation`
- **namespace:** 운영에서는 `os-backbone-mod-<module>`이다. 격리 설치본에서는 호스트가 접두사를 주입한다(§6.3).
- **상태 판정:** 화면 상태와 실행 완료는 따로 판정한다.
  - **준비:** `observedGeneration == generation`이고 ready · updated 복제가 1이다.
  - **복구 완료:** 준비 조건에 더해 이미지 · 리비전 · Pod Ready · PVC Bound를 본다. 지금 조건 그대로다.
  - **기동 문제:** image-pull-auth · image-pull · crash-loop · unschedulable.
  - **소유:** StatefulSet이 컨트롤러로 소유한 Pod만 센다.
  - **삭제 완료:** StatefulSet · Pod · PVC `data-<name>-0`이 모두 없다.
  - **`foundation.block-rwo`:** 복구 삭제를 거절한다. 지금 동작 그대로다.
- **Secret 생성 경계:** immutable Secret을 만든 직후 응답이 사라지면, 다음 생성의 `409`를 `unknown`으로 처리한다. 지금 동작 그대로다.

### 3.5 자격 문법과 TLS

**자격 키 종류**(각 키는 하나만 쓴다. `template`은 자기보다 앞 키만 참조한다)

| 종류 | 형식 |
|---|---|
| `generate` | `{bytes: 16~64, encoding: "base64url-nopad" 또는 "hex"}`. 지금 두 엔진은 32바이트, base64url-nopad 43자다 |
| `literal` | 고정 문자열. 예: RustFS의 `osr_admin` |
| `template` | `{format: "json" 또는 "text", value}`. 자리표 `${credential.<키>}` · `${bcrypt(credential.<키>)}`를 쓴다. `json`은 정규 직렬화한다. 예: OpenSearch의 `internal_users.yml` 구조 |
| `bcrypt` | 자리표로만 쓴다. `$2a$`, cost 12 고정 |

- **웹훅 판정:** 지금 웹훅은 비밀값을 지운 뒤 판정한다. 원형 자격도 같은 방식을 쓴다. 키 집합 · 라벨 · immutable은 판정하고, 값은 형식(길이 · 인코딩 · bcrypt 접두사)만 본다. C3에서 같게 판정되는지 증명한다.
- **TLS:** E2a의 `instance-tls.sh`는 **지금 바이트 그대로**다. 스크립트는 엔진 이름(초기화 컨테이너 인자)으로 인증서 용도를 고르고 PVC의 `provider:DNS`를 검사한다. 여기에는 엔진 분기가 남아 있다.
  - 인증서 용도를 형식 인자로 나누는 변경은 따로 낸다. 기존 PVC로 다시 기동하는 시험을 함께 한다.
  - 이 변경은 **E6의 전제**다.

## 4. 두 판정기

- **Node:** `infra/contracts/osr/tools/verify.mjs`에 `executionProblem`을 둔다.
- **Rust:** `osr_verify.rs` `release_with`에 둔다.
  - **7단계(확장 판정 다음):** 정확한 media type, 불투명 금지, 정규 바이트, 스키마, module · version이 디스크립터와 같은지, 원형 id/판, 디스크립터 class(`provider` · `engine`만), 문서 안의 참조(마운트 → config · 자격 키 · scratch, 자리표, 프리셋 값 키, 템플릿 순서), §3.2의 한도.
  - **8단계(프로필 검증 다음):** 이미 검증한 **같은 프로필의 id · version · fingerprint**에 연결한다. 다음을 확인한다.
    - `appliesTo`와 `storage.mode`
    - 이미지
    - 원형이 만드는 kind · 개수가 `resources` 한도 안인지
    - 쓰기 권한(`rbac`)
    - `execution` 제약(§3.3)
- **Setup:** `make-osr-contract-assets.mjs`로 봉인 사본을 다시 만든다.
- **호스트 계약:** `host-contract.json`에 `archetypes`를 더하고 E0 생성기로 Node · Rust · Setup에 낸다. 원형 판, 허용 class, §3.2 한도, 예약 경로 · 예약 이름이 들어간다.
- **같은 사례:** `tests/osr/execution-cases.json`을 두 판정기가 같이 돌린다. 맞는 OpenSearch · RustFS와 규칙마다 어긴 사례를 넣는다. 계약 벡터에도 넣는다.
- **혼재 사례:** 같은 서명 번들을 옛 판정기는 받고, 새 판정기는 잘못된 `execution` 때문에 거절한다. 실행 문서가 없는 기존 번들은 두 판 모두에서 판정 결과가 그대로다.

## 5. 서명 · 원장 · 게시 차단

- **서명:** `artifacts`에 `execution` part가 자동으로 들어간다. 새 코드는 필요 없다.
- **원장**
  - 이행은 없다. `release_documents`가 `+json` part를 기록한다.
  - 저장이 실패해도 등록이 `200 formal`을 돌려줄 수 있다. 그래서 합격 기준은 **원장을 다시 읽어 대조하는 것**이다. bundleDigest · part · media type · digest · 문서를 본다. 문서 누락 · 저장 실패 · 재등록도 시험한다.
- **게시 차단(E3까지)**
  - 게시 도구(`publish-module.mjs` 등)가 `execution` part가 든 번들을 **운영 대상으로는 게시하지 않는다.** 시험 키 · 격리 대상에는 허용한다.
  - 운영자 원천 대조(`operator.mjs`)는 `execution`의 누락 · 추가 · 변경을 검사한다.
  - 등록하는 모든 경로(Core · Console BFF · carrier · Setup 봉인 사본)가 새 판정기로 운영에 들어가기 전에는 차단을 풀지 않는다. 푸는 것은 E3 결정이다.
- **E2b 규칙(미리 정함):** E2b에서 실행 문서를 읽을 때는 저장된 문서를 그 자리에서 다시 판정한다. 정규 직렬화로 digest도 확인한다.

## 6. 원형 렌더러와 나란히 비교

### 6.1 렌더러

- Rust 모듈 `osr_archetype`에 순수 함수로 둔다.
- 입력은 실행 문서 · 프로필 · 계획 instance · namespace · meta다.
- 함수는 `instance_objects` · `render_instance` · `install_objects` · `execution_plan` · `presets` · `live_server` · `startup_problem` · 실행 완료 판정 · `populate_credentials`다.
- **운영 코드 경로에서 부르지 않는다.** 시험과 비교 도구만 부른다.
- **엔진 이름으로 분기하는 코드를 넣지 않는다.** 차이가 원형으로 표현되지 않으면 고치기 전에 보고하고 §3 개정을 합의한다.

### 6.2 비교 기준(합격 기준)

| # | 비교 | 합격 |
|---|---|---|
| C1 | 렌더 결과. 기존 `render_instance` · `instance_objects` · `render`(설치) · `execution_plan` 출력을 정답 파일로 둔다(`backend/server/tests/fixtures/stateful-engine/`). 경우는 두 엔진 × 프리셋 둘 × 저장 프로필 둘(`foundation.instance-rwo` · `foundation.block-rwo`) × 크기 10 · 200GiB × 이름 둘이다 | 원형 출력이 정답과 **정규화 JSON 바이트까지 같다.** 필드 생략 · 배열 순서 · ConfigMap 안 문자열을 포함한다. 기존 출력도 정답과 같다. `instance-tls.sh`는 지금 바이트와 같다 |
| C2 | `planned_writes`: 설치 · 생성 · 갱신 · 삭제 · 내리기 · 복구 | 목록 · 순서가 같다. 원래 작업과 소유권 · Secret UID가 다르면 같게 거절한다. "Secret 생성 응답 유실 → 409 → unknown"이 같다 |
| C3 | 승인 판정(`judge`) | **격리 Core · 시험 원장**에서 같은 승인 계획의 객체를 서버 dry-run으로 받는다. 시험 Secret은 웹훅의 실제 변환 경로에 넣는다. 기존 렌더와 원형 렌더의 허용 · 거절과 사유가 같다. 변형 사례도 같게 거절한다 |
| C3-참고 | 운영 객체 모양 | Claude가 운영에서 **필요한 필드만 읽기 전용으로** 받는다. Secret은 메타데이터 응답만 받는다. 실제 객체 모양을 확인하는 참고 자료이고, 판정 증거가 아니다 |
| C4 | 상태: 화면 상태와 실행 완료(생성 · 삭제 · 복구)를 따로 본다. 경우는 준비됨, 세대 불일치, 기동 문제 넷, 지워지는 중, 다른 소유자의 Pod, 복구 조건(이미지 · 리비전 · Pod Ready · PVC Bound), block-rwo 복구 삭제 거절이다 | 결과가 같다 |
| C5 | 실제 기동. 운영과 겹치지 않는 격리 설치본에서, 호스트가 주입한 namespace 접두사와 TLS 이름을 쓴다 | 두 엔진 모두 다음을 확인한 뒤 시험 자원을 정리한다: 실제 이미지 digest로 준비, TLS 검증, 맞는 자격으로 로그인, 틀린 자격 거절, 소량 읽기 · 쓰기, 같은 PVC · Secret으로 재기동 |
| C6 | 기존 번들 무영향 · 혼재 | 계약 벡터와 기존 Rust · Node 시험이 그대로 통과한다. §4의 혼재 사례가 통과한다 |

### 6.3 격리 namespace

- namespace는 클러스터 범위 이름이다. 격리 설치본이 운영 `os-backbone-mod-*`를 쓰면 운영과 겹친다.
- 그래서 렌더러가 namespace를 **호스트 입력**으로 받는다. 운영 Backbone은 지금 고정값(`os-backbone-mod-<module>`)만 준다. 격리 설치본은 운영과 다른 접두사를 주입하고, TLS 이름도 그 namespace에 맞춘다.
- 운영 경로에서 주입값이 고정값과 다르면 거절한다.
- **라벨 도메인(2026-11-23 보충):** 운영 클러스터의 전역 정책 `osr-binding-label-guard`는 `opensphere.io/osr-engine-auth` · `opensphere.io/osr-binding` 라벨이 붙은 Secret을 운영 실행부 SA만 만들게 한다. 이 정책은 운영 보안 경계라서 고치거나 예외를 두지 않는다.
  - 그래서 격리 설치본에서는 호스트가 `opensphere.io/` 라벨 · 주석 키의 **도메인도 주입**한다. 운영 값은 `opensphere.io`로 고정하고, 다르면 거절한다.
  - 격리 설치본은 같은 가드의 격리 사본(격리 이름, 격리 라벨 키 · 격리 실행부 SA 기준, 격리 namespace 한정)을 두고, 시험이 끝나면 지운다.
  - C1 바이트 비교는 운영 입력으로 한다. 격리 입력은 C5에만 쓴다.
  - 덤으로 격리 객체가 운영 실행부의 라벨 선택에 잡히지 않는다.

## 7. 구현 단위

| 단위 | 범위 | PR 합격 기준 |
|---|---|---|
| **E2a-1 계약** | 실행 문서 스키마, 프로필 스키마 `execution` 제약, `host-contract.json` `archetypes`와 생성 결과, Node · Rust 판정기(7 · 8단계), `execution-cases.json` · 계약 벡터, `bundle.mjs`(정규 바이트), 게시 차단, 운영자 원천 대조, Setup 봉인 사본, `modules/provider.{opensearch,rustfs}/execution.json`과 시험 프로필 | 두 판정기가 같은 사례를 같게 판정한다(혼재 사례 포함). 기존 벡터는 그대로다. 시험 키로 서명한 번들을 격리 스토어에 등록하고 **원장을 다시 읽어 대조**한다(누락 · 실패 · 재등록 포함). 운영 대상 게시가 막힌다 |
| **E2a-2 원형 렌더러 · 비교** | `osr_archetype`, namespace 주입, 정답 파일, C1~C6 | §6.2 전부. 비교 결과 표를 PR에 남긴다 |

**공통**
- 운영에 반영하지 않는다. 격리 설치본 · 시험 DB · 시험 키까지만 쓴다.
- 격리용 클러스터 범위 이름(namespace · ClusterRole · 웹훅 · 정책)은 운영과 겹치지 않게 짓는다.
- 앞 단위가 병합된 뒤 그 main 기준으로 연다.
- C3-참고 자료는 Claude가 따로 넘긴다.

## 8. E2b가 계획에 묶을 것(형식만)

```json
"execution": {
  "part": "execution",
  "digest": "sha256:<실행 문서 레이어 digest>",
  "archetype": "stateful-engine/1",
  "renderer": "<원형 렌더러 판>"
}
```

- 프로필 지문 · `bundleDigest` · `setupArtifact`는 지금처럼 따로 묶는다.
- E2b의 판 혼재 시험은 이 필드가 없는 계획과 있는 계획을 모두 다룬다.
- E2b · E3 전환 시험에서는 기존 Secret UID · TLS · PVC를 그대로 두고, 원래 작업의 복구 경로가 이어지는지 확인한다.

## 9. 결정(D-94)

| # | 결정 |
|---|---|
| Q1 | 레이어 이름은 `execution`이다 |
| Q2 | 이미지는 프로필에서만 온다. 명령 · env 이름 · 마운트 경로 · config 파일 · envFrom 허용은 프로필의 닫힌 `execution` 제약으로 묶는다 |
| Q3 | 자격은 `generate`(바이트 + 인코딩) · `literal` · JSON/텍스트 `template` · `bcrypt`($2a$, 12)로 쓴다. 웹훅의 비밀값 제거 판정을 같게 한다. Valkey 확장은 E6에서 정한다 |
| Q4 | 운영에서는 필요한 필드와 Secret 메타데이터만 읽고, 참고 자료로만 쓴다. Secret 판정 증거는 격리 Core · 시험 원장의 서버 dry-run과 실제 웹훅 변환으로 만든다 |
| Q5 | 등록하는 모든 경로(Core · Console BFF · carrier · Setup)가 새 판정기를 쓰기 전에는 운영에 게시하지 않는다. E3 전까지 게시 도구가 막고, 운영자 원천 대조가 검사한다. 운영 패키지 재게시는 E3에서 한다 |
| Q6 | E2a는 TLS 스크립트 바이트를 그대로 둔다. 인증서 용도의 형식화는 기존 PVC 재기동 시험과 함께 따로 내고, E6의 전제로 둔다 |
| Q7 | 격리 설치본에서는 호스트가 namespace 접두사와 TLS 이름을 주입한다. 운영 값은 지금 고정값이고, 클러스터 범위 이름이 운영과 겹치지 않게 한다 |
