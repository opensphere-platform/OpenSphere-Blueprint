# 실행 원형 계약 · 나란히 비교 — E2a(v0.1, 초안)

**상태:** 대체됨 — [v0.2](PACKAGE-EXECUTION-ARCHETYPE-E2A-v0.2.md)(D-94). 아래는 초안 원문이다. §9의 결정과 설계 합의가 E2a의 첫 합격 기준이다.
**작성:** 2026-11-23 · Claude
**잇는 문서:**
- [실행 분리 계획 v0.2](PACKAGE-EXECUTION-DECOUPLING-PLAN-v0.2.md)(D-92). §3.1 원형 · §3.2 보안 경계 · §4 E2a
- [Codex 검토](PACKAGE-EXECUTION-DECOUPLING-PLAN-v0.1-REVIEW-CODEX.md)
- [패키지 확장 구조 v0.2](PACKAGE-EXTENSIBILITY-PLAN-v0.2.md)

**역할:** 사양 · 검수 · 운영 반영은 Claude, 구현은 Codex, 결정은 소유자다.

## 1. E2a가 하는 것과 하지 않는 것

**한다**
1. 패키지 번들에 **실행 문서**(새 레이어) 형식을 정한다. 첫 원형은 `stateful-engine`이다.
2. Node · Rust 두 판정기가 그 문서를 같은 사례로 같게 판정한다.
3. 번들 생성 · 서명 · 원장 기록 · Setup 봉인 사본에 넣는다.
4. **원형 렌더러**를 만든다. 기존 OpenSearch · RustFS 렌더러와 나란히 놓고 결과가 같음을 증명한다.

**하지 않는다(E2b 이후)**
- 승인 · 계획 · 실행부 · 웹훅 · 원장 함수의 동작은 바꾸지 않는다. **실제로 객체를 만드는 것은 E2a 뒤에도 기존 Rust 렌더러다.**
- 계획에 실행 문서 digest를 묶는 것은 E2b다. 형식만 §7에서 미리 정한다.
- 운영 OpenSearch · RustFS 패키지를 실행 문서가 든 판으로 다시 게시하지 않는다. 그것은 E3다.
- `claim-job`(E4)과 `operator-cr`(E5)는 다루지 않는다.

**Backbone 갱신은 1회다.** 새 판정기를 담은 Core · Setup 봉인 사본을 낸다. 원장 이행은 없다(§5).

## 2. 이름: `runtime`이 아니라 `execution`

D-92와 Codex 검토는 이 레이어를 "runtime 레이어"라고 불렀다. 그런데 코드에는 그 이름이 이미 쓰이고 있다.
- 모듈 디스크립터에 `runtime` 객체(images · health · ready · resources · securityContext)가 있다. 판정기가 core · ui · assembly에는 이것을 거절하고, provider.opensearch는 쓴다.
- "layer"는 Console 섹션(023 `osr.layer_settings`)의 이름이기도 하다.

그래서 다음 이름을 권고한다(**Q1**).

| 항목 | 값 |
|---|---|
| 번들 part | `execution` |
| media type | `application/vnd.opensphere.execution.v1+json` |
| 문서 schema | `opensphere.module-execution/v1` |
| 원천 파일 | `modules/<id>/execution.json`. `extension.json`과 같이 있으면 `bundle.mjs`가 넣는다 |
| 원형 id | `stateful-engine/1`. 원형 이름 + 원형 판(정수) |

## 3. 실행 문서 형식(`stateful-engine/1`)

### 3.1 원칙

- **닫힌 형식이다.** 모든 객체가 `additionalProperties: false`다. 임의 YAML · Kubernetes 조각 · hostPath · 특권 · 추가 컨테이너 · 추가 kind를 받지 않는다.
- 문서는 **엔진마다 다른 것만** 적는다. 객체 뼈대 · 이름 · 라벨 · 보안 설정은 **원형이 고정한다**(§3.3).
- 이미지는 문서에 없다. **배치 규칙(프로필)의 `image`만 쓴다**(**Q2**). 이미지 digest는 지금처럼 신뢰 맥락의 프로필 지문 아래에 둔다.
- 치환은 정해진 자리표만 쓴다. `${instance.name}` · `${instance.namespace}` · `${preset.<키>}` 셋이다. 자격 템플릿에서만 `${credential.<키>}` · `${bcrypt12(credential.<키>)}`를 더 쓴다. 식이나 조건은 없다. 호스트가 글자 그대로 바꿔 넣는다.

### 3.2 필드

```json
{
  "schema": "opensphere.module-execution/v1",
  "module": "provider.opensearch",
  "version": "0.3.0",
  "archetype": "stateful-engine/1",
  "profile": "provider.opensearch-instance",
  "engine": {
    "name": "opensearch",
    "uid": 1000,
    "port": 9200,
    "command": null,
    "readOnlyRootFilesystem": false,
    "readiness": { "path": "/_plugins/_security/health", "periodSeconds": 5 },
    "env": [
      { "name": "DISABLE_INSTALL_DEMO_CONFIG", "value": "true" },
      { "name": "OPENSEARCH_JAVA_OPTS", "value": "-Xms${preset.heap} -Xmx${preset.heap}" }
    ],
    "envFromCredentials": false,
    "mounts": [
      { "from": "data", "subPath": "data", "path": "/usr/share/opensearch/data" },
      { "from": "tls", "path": "/usr/share/opensearch/config/tls" },
      { "from": "config", "file": "opensearch.yml", "path": "/usr/share/opensearch/config/opensearch.yml" },
      { "from": "credentials", "file": "internal_users.yml", "path": "/usr/share/opensearch/config/opensearch-security/internal_users.yml" }
    ],
    "scratch": []
  },
  "config": {
    "opensearch.yml": { "format": "json", "value": { "cluster.name": "${instance.name}", "...": "..." } }
  },
  "credentials": [
    { "key": "password", "generate": { "alphabet": "alnum", "length": 32 } },
    { "key": "internal_users.yml", "template": "... ${bcrypt12(credential.password)} ..." }
  ],
  "presets": [
    { "id": "small",  "requests": { "cpu": "500m", "memory": "1Gi" }, "limits": { "cpu": "2", "memory": "2Gi" }, "values": { "heap": "512m" } },
    { "id": "medium", "requests": { "cpu": "1", "memory": "2Gi" },    "limits": { "cpu": "4", "memory": "4Gi" }, "values": { "heap": "1g" } }
  ]
}
```

위 값은 형식을 보이는 예다. 정확한 값은 지금 코드(`osr_storage_provider.rs` `render_instance` · `sizing` · `populate_auth`)에서 옮기고, §6의 비교로 증명한다.

| 필드 | 뜻 | 호스트 한도(계약 원천 `host-contract.json`의 `archetypes`) |
|---|---|---|
| `module` · `version` | `bundle.mjs`가 채운다. 디스크립터와 같아야 한다 | — |
| `archetype` | 원형 id/판 | 호스트가 아는 원형 · 판만 |
| `profile` | 이 문서를 쓰는 실행 배치 규칙 id | 신뢰 맥락에 있어야 한다. `appliesTo`에 이 모듈, `storage.mode`는 `foundation-profile`이어야 한다. `resources`가 원형이 만드는 kind를 모두 담아야 한다 |
| `engine.name` | 컨테이너 이름이자 `app.kubernetes.io/name` 값 | `^[a-z][a-z0-9-]{1,30}$` |
| `engine.uid` | runAsUser · runAsGroup · fsGroup | 1000~65535 |
| `engine.port` | 서비스와 컨테이너 포트(이름 `https`) | 1024~65535 |
| `engine.command` | 진입 명령(없으면 이미지 기본) | 문자열 최대 8개, 셸 해석 없음 |
| `engine.readOnlyRootFilesystem` | 루트 읽기 전용 | 참 · 거짓 |
| `engine.readiness` | HTTPS GET 경로 · 주기. 실패 한도 3은 원형이 고정한다 | 경로 `^/[A-Za-z0-9/_.-]{0,120}$`, 주기 1~60초 |
| `engine.env` | 이름 · 값(자리표 허용) | 최대 32개. 이름 `^[A-Z][A-Z0-9_]{0,62}$`. `OSR_` · `KUBERNETES_`로 시작하면 안 된다 |
| `engine.envFromCredentials` | 자격 Secret 전체를 환경변수로(RustFS) | 참 · 거짓 |
| `engine.mounts` | `from`은 다섯 가지다. `data`(PVC, `subPath` 필수), `tls`(데이터 PVC의 `tls` 하위 경로, 읽기 전용, `file` 선택), `config`(문서의 `config` 파일), `credentials`(자격 Secret의 키 하나), `scratch`(아래 `scratch` 이름) | 최대 16개. 경로는 절대경로이고 `..`가 없다. `/proc` · `/sys` · `/dev` · `/var/run/secrets` 아래는 안 된다. 경로가 겹치면 안 된다 |
| `engine.scratch` | 추가 emptyDir(이름 · 크기 한도) | 최대 4개, 각 1Gi 이하 |
| `config` | 파일 이름 → `format`(`json` · `text`) + 값. 있으면 ConfigMap `<name>-engine` 하나로 나간다 | 합계 64KiB 이하 |
| `credentials` | 자격 Secret `<name>-engine-auth`의 키 목록. `generate`(무작위: 알파벳 · 길이)나 `template`(앞 키를 자리표로) 둘 중 하나 | 최대 8개. `generate`는 길이 16~128, 알파벳은 `alnum` · `hex`만 |
| `presets` | 크기 프리셋. requests · limits · 자리표 값 | 1~4개. limits는 CPU 8, 메모리 32Gi 이하. requests ≤ limits |

- **자격(Q3):** 지금 `populate_auth`는 엔진마다 손으로 쓴 코드다. RustFS는 접근 키 쌍, OpenSearch는 비밀번호 + bcrypt(12) `internal_users.yml`이다.
  - 이것을 위의 작은 문법(무작위 생성 + 템플릿 + bcrypt12)으로 옮긴다.
  - 그래야 E6 Valkey(비밀번호 + ACL 파일)를 호스트 변경 없이 표현할 수 있다.
  - 지금 두 엔진을 이 문법으로 옮길 수 없으면 Codex가 무엇이 안 되는지 보고한다. **탈출구 필드를 더하지 않고** 문법을 다시 합의한다.

### 3.3 원형이 고정하는 것(문서로 바꿀 수 없음)

- **객체와 이름:**
  - Secret `<name>-engine-auth`(immutable, 라벨 `opensphere.io/osr-engine-auth=<engine.name>`)
  - ConfigMap `<name>-engine`(`config`가 있을 때만)
  - Service `<name>`(ClusterIP, 포트 `https`)
  - StatefulSet `<name>`
  - 만드는 순서는 위 순서이고, 지울 때는 거꾸로다.
- **설치 때 객체:** 공용 ConfigMap `storage-instance-tls`(`instance-tls.sh`). 스크립트 내용은 호스트 것이다.
- **StatefulSet**
  - 복제 1. PVC 보존 정책은 지울 때 Delete, 줄일 때 Retain이다.
  - 서비스 계정 토큰 없음, `enableServiceLinks: false`, 종료 유예 30초.
  - linux/amd64 노드 선택. runAsNonRoot + seccomp RuntimeDefault, 권한 상승 없음, capabilities 모두 제거.
  - 초기화 컨테이너 `instance-tls`. 호스트가 고정한 TLS 도우미 이미지 · 명령 · 리소스를 쓴다.
  - 볼륨 `scripts` · `scratch`(Memory 1Mi).
  - PVC 템플릿 `data`(RWO). 저장 클래스와 크기는 `storageProfile` · `sizeGiB`에서 온다(10~200GiB, 지금과 같음).
- **라벨 · 주석:** `osr-instance` · `osr-managed` · `app.kubernetes.io/name`, `osr-installation`, `osr-plan-digest`, `osr-operation`
- **namespace:** `os-backbone-mod-<module>`
- **상태 판정**
  - 준비: `observedGeneration == generation`이고 ready · updated 복제가 모두 1이다.
  - 기동 문제: image-pull-auth · image-pull · crash-loop · unschedulable 네 가지다.
  - 소유 판정: StatefulSet이 컨트롤러로 소유한 Pod만 센다.
  - 삭제 완료: StatefulSet · Pod · PVC `data-<name>-0`이 모두 없어야 한다.

## 4. 두 판정기

- **Node:** `infra/contracts/osr/tools/verify.mjs`에 `executionProblem`
- **Rust:** `osr_verify.rs` `release_with`의 확장 판정 다음 단계에 `execution_problem`
- **Setup:** `make-osr-contract-assets.mjs`로 봉인 사본을 다시 만든다.
- **판정 내용**
  - schema
  - module · version이 디스크립터와 같은지
  - 원형 id/판
  - §3.2의 한도
  - 프로필 관계(신뢰 맥락에 있음, `appliesTo`, 저장 방식, kind 한도)
  - `mounts`가 가리키는 `config` 파일 · 자격 키 · scratch가 실제로 있는지
  - 자리표가 정해진 것뿐인지, `${preset.X}`의 X가 모든 프리셋에 있는지
  - 자격 템플릿이 자기보다 앞의 키만 쓰는지
- **불투명 금지:** `execution` part가 `+json`이 아니면 거절한다. 디스크립터의 `class`가 원형이 허용한 것(`provider` · `engine`)이 아니어도 거절한다.
- **같은 사례:** `tests/osr/execution-cases.json`을 두 판정기가 같이 돌린다(`extension-cases.json`과 같은 방식). 사례는 맞는 OpenSearch · RustFS 둘과 §3.2 규칙마다 어긴 사례 하나 이상이다. 계약 벡터(`vectors/release.json`)에도 넣는다.
- **기존 번들은 결과가 그대로여야 한다.** 실행 문서가 없는 번들의 판정 결과가 바뀌지 않는다는 것을 벡터 비교로 보인다.

## 5. 서명 · 원장

- 서명 payload의 `artifacts`에 `execution` part가 자동으로 들어간다(`bundle.mjs` `signaturePayload`). 새 코드는 필요 없다.
- 원장은 **이행이 필요 없다.**
  - `osr_install::release_documents`가 `descriptor`를 뺀 `+json` 레이어를 모두 `osr.release_documents`에 넣는다.
  - `osr.artifacts`가 part · digest · media type을 남긴다.
  - E2a는 이 기록을 읽는 운영 경로를 만들지 않는다. 읽는 쪽(계획 · 승인)은 E2b에서 만든다.
- **판 혼재 규칙:** 지금 Core는 모르는 JSON part를 받아들이고 무시한다. 그래서 다음을 지킨다.
  - **E2a Core가 운영에 들어가기 전에는 실행 문서가 든 번들을 운영에 게시하지 않는다.**
  - E2b에서 실행 문서를 읽을 때는 저장된 문서를 그 자리에서 다시 판정한다. 옛 Core 시절에 들어온 문서를 믿지 않기 위해서다.

## 6. 원형 렌더러와 나란히 비교

### 6.1 렌더러

- Rust 모듈 `osr_archetype`에 순수 함수로 둔다. 같은 입력(실행 문서 · 프로필 · 계획 instance · namespace · meta)을 받는다.
- 함수는 `instance_objects` · `render_instance` · `install_objects` · `execution_plan` · `presets` · `live_server`(상태) · `startup_problem` · `populate_credentials`다.
- 운영 코드 경로에서 부르지 않는다. 시험과 비교 도구(`examples/` 또는 `tests/`)만 부른다.

### 6.2 비교 기준(합격 기준)

| # | 비교 | 방법 | 합격 |
|---|---|---|---|
| C1 | 렌더 결과 | 기존 `Provider::render_instance` · `instance_objects` · `render`(설치) · `execution_plan`의 출력을 **정답 파일**로 저장한다(`backend/server/tests/fixtures/stateful-engine/`). 경우는 두 엔진 × 프리셋 둘 × 저장 프로필 둘 × 크기 10 · 200GiB × 이름 둘이다 | 원형 출력이 정답과 **정규화 JSON 바이트까지 같다.** 기존 출력도 정답과 같다(정답 파일은 E3에서 옛 코드를 지운 뒤에도 남는다) |
| C2 | 생성 · 삭제 쓰기 목록 | `planned_writes`를 기존과 원형으로 각각 계산한다(설치 · 생성 · 삭제) | 목록 · 순서가 같다 |
| C3 | API 서버 기본값이 붙은 실제 객체 | 운영의 OpenSearch · RustFS 인스턴스 객체를 **읽기 전용으로** 받아 고정 자료로 쓴다. StatefulSet · Service · ConfigMap은 전체를, Secret은 메타데이터만 받는다. **Claude가 받아서 비밀값을 지운 뒤 넘긴다(Q4)** | `judge(기존 렌더, 실제)`와 `judge(원형 렌더, 실제)`가 둘 다 통과한다. 같은 이유로 거절되는 변형 사례 몇 개도 같게 거절된다 |
| C4 | 상태 판정 | StatefulSet · Pod 고정 자료를 쓴다. 경우는 준비됨, 세대 불일치, 기동 문제 넷, 지워지는 중, 다른 소유자의 Pod다 | `live_server` · `startup_problem` 결과가 같다 |
| C5 | 자격 | 생성된 Secret의 키 · 길이 · 알파벳을 기존과 비교하고 bcrypt12를 검증한다 | 같은 모양이다. **격리 namespace(운영과 겹치지 않는 이름)**에서 원형 렌더 객체 + 원형 자격으로 두 엔진을 실제로 띄워 준비 상태와 로그인을 확인한 뒤 회수한다 |
| C6 | 기존 번들 무영향 | 계약 벡터, 기존 Rust · Node 시험 | 모두 그대로 통과한다 |

- C1이 하나라도 다르면 문서 형식이나 원형 고정값을 고친다. **원형에 엔진 이름으로 분기하는 코드를 넣지 않는다.**
- 다른 점이 원형으로 표현할 수 없는 엔진 고유의 것이면, 고치기 전에 보고하고 §3 개정을 합의한다.

## 7. E2b가 계획에 묶을 것(형식만 미리 정함)

```json
"execution": {
  "part": "execution",
  "digest": "sha256:<실행 문서 레이어 digest>",
  "archetype": "stateful-engine/1",
  "renderer": "<원형 렌더러 판>"
}
```

- 프로필 지문 · `bundleDigest` · `setupArtifact`(실행부 digest)는 지금처럼 따로 묶는다.
- E2b의 판 혼재 시험(옛 계획 + 새 렌더러, 새 Core + 옛 실행부)은 이 필드가 **없는 계획**과 **있는 계획**을 모두 다룬다.

## 8. 구현 단위

| 단위 | 범위 | PR 합격 기준 |
|---|---|---|
| **E2a-1 계약** | 스키마(`gen-schemas.mjs` · `SCHEMA_SOURCES`), `host-contract.json`의 `archetypes`(한도 · 허용 class · 원형 판)와 생성 결과, Node · Rust 판정기, `execution-cases.json`, 계약 벡터, `bundle.mjs`, Setup 봉인 사본, `modules/provider.{opensearch,rustfs}/execution.json`(지금 동작을 옮긴 원천) | 두 판정기가 같은 사례에서 같게 판정한다. 기존 벡터는 그대로다. 시험 키로 서명한 번들을 격리 스토어에 등록하면 `osr.release_documents`에 `execution`이 남는다 |
| **E2a-2 원형 렌더러 · 비교** | `osr_archetype`, 정답 파일, C1~C6 | §6.2 전부. 비교 결과 표를 PR에 남긴다 |

**공통**
- 운영에 반영하지 않는다. 격리 설치본 · 시험 DB · 시험 키까지만 쓴다.
- 앞 단위가 병합된 뒤 그 main 기준으로 연다.
- C3 고정 자료는 Claude가 따로 넘긴다.

## 9. 결정 요청

| # | 질문 | 권고 |
|---|---|---|
| Q1 | 레이어 이름 | `execution`(§2). `runtime`은 디스크립터 필드 · 섹션 이름과 겹친다 |
| Q2 | 엔진 이미지는 어디서 오나 | 배치 규칙(프로필)의 `image`에서만. 실행 문서는 이미지를 못 정한다 |
| Q3 | 자격 생성 | 작은 일반 문법(무작위 + 템플릿 + bcrypt12). 엔진별 호스트 코드를 남기지 않는다. 안 되면 보고 후 재합의 |
| Q4 | 운영 객체 고정 자료(C3) | Claude가 운영에서 읽기 전용으로 받아 비밀값을 지운 뒤 Codex에 넘긴다 |
| Q5 | E2a 운영 반영 범위 | 판정기를 담은 Core · Setup 봉인 사본만. 운영 패키지 재게시는 E3에서 한다 |
