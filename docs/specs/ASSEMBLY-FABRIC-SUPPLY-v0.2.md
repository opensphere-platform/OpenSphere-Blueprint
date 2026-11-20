# 어셈블리 · Fabric 협력 공급 명세 v0.2

**상태:** 초안 v0.2. v0.1(Codex 검토 세 차례, 소유자 결정 Q1 · Q2 · Q3)에 외부 검토 의견 6개(2026-11-20)를 반영했다. 결정 대장(D-번호)에는 아직 올리지 않았다. 구현 승인이 아니다.
**v0.2에서 바뀐 것(§14):** 발급을 별도 도우미 워크로드 대신 **StackGres의 SGScript**로 한다(배치 규칙이 Deployment를 금지하고, 관리 자격을 누구에게도 주지 않아도 된다). 예약은 승인 대기 만료와 실행 중 유지를 나눈다. 원장 전체 번호 대신 **대상별 fence와 계획의 점유**로 충돌을 가린다. 쉬는 로그인 역할의 연결 한도는 0이다. 보존과 복구를 구분한다. 구현 순서와 계획 단계의 선후를 바로잡았다.
**작성:** 2026-11-20 · Claude(초안 · 개정) · Codex(검토) · 외부 검토 의견, 소유자 요구 반영
**소유자 요구(2026-11-20):** 구 버전은 Fabric 단계에서 인스턴스를 만드는 것이 아니라, 지금 기준의 **어셈블리 단계에서 필요한 시스템을 구축하면 그 시스템의 필요에 따라 Fabric이 자동으로 협력(설치)하는 구조**였다. 그 개념과 실제 처리 절차를 지금 시점에서 정의한다.
**상위 기준:**
- [테넌트·어셈블리 구성 명세](TENANT-ASSEMBLY-SPEC-v0.1.md): 어셈블리, 구성요소, 연결 객체(Link), 수명주기, T-1~T-11
- [어셈블리 카탈로그](ASSEMBLY-CATALOG-v0.1.md): 어셈블리가 내놓는 리소스 유형과 용량, Governance 인계
- [OSR v0.2](OPENSPHERE-REGISTRY-OSR-v0.2.md): 클래스(provider · engine · assembly), materializer profile, 설치본 판정, 작업 영수증
- [O-2 PFSS 경계](../architecture/OPENSPHERE-PFSS-BOUNDARY-O2-v0.1.md): Plan → Claim → Instance → Binding, 공급과 배분의 분리, 서명 Grant
- 구현 기록(OpenSphere-Backbone): `docs/osr/FABRIC-INSTANCES.md`(관리자가 Fabric 화면에서 인스턴스를 만드는 경로), `docs/osr/MODULE-EXECUTOR.md`(제한 실행부), `infra/osr/006-instances.sql`(인스턴스 원장)

---

## 1. 이 문서가 정하는 것

지금(2026-11-20) 운영에 있는 것은 **공급의 절반**이다.
- 관리자가 스토어에서 Fabric 서비스(PostgreSQL)를 켜고, Fabric 화면에서 인스턴스(독립 SGCluster)를 하나씩 만든다.
- 원장에는 누가 어떤 계획 · 승인으로 만들었는지(`created_by`, 계획 digest, 승인 기록)가 남는다.
- 남지 않는 것은 **무엇을 위해, 누가 쓰는지**(업무 소유자 · 목적 · 소비 관계)다. 접속 정보를 다른 앱에 주는 길도 없다.

이 명세는 나머지 절반을 정한다.

1. 어셈블리(목적을 가진 시스템)가 **자기에게 필요한 Fabric 자원을 선언**하는 형식(§5)
2. 그 선언을 받아 **필요한 Fabric 서비스 켜기 · 인스턴스 · DB · 접속 자격 인도 · 엔진 설치를 하나의 계획으로 만들고, 승인받아 순서대로 실행**하는 절차(§6~§7)
3. 수동 경로(Fabric 화면)와 자동 경로(어셈블리)가 **같은 원장 · 같은 예약 · 같은 실행부**를 쓰게 하는 규칙(§8)
4. 등급(크기) 정의의 소유, 한도의 실제 집행, 실행부 권한의 확장 범위(§5.2, §9)

## 2. 구 버전에서 확인한 의도

조사 노트: OpenSphere 작업 공간 `research_notes/Assembly Fabric 협력 구 버전/old-intent.md`(파일 · 줄 근거 포함).

| 세대 | 기간 | 시스템이 필요를 적는 곳 | 반응한 것 | 만든 것 | 결과 |
|---|---|---|---|---|---|
| G0 | 2026-06 | `PostgresClaim` facade | 템플릿 → Git → Argo CD | DB 하나 | PoC |
| G1 | 2026-06~07 | 상위 서비스가 자기 namespace에 `PostgresClaim` | Foundation 컨트롤러 | 공유 클러스터 하나 + Claim마다 DB · 역할 · Secret | 일부 코드 |
| **G2** | 2026-08-06~10-20 | **제품 번들이 자기 의존 Claim을 스스로 렌더**(Keycloak · LiteLLM · Langfuse · Mattermost · Novu). 서비스 계약의 **의존 그래프**가 자식 Claim을 자동 생성 | Foundation 컨트롤러 → Crossplane → StackGres | PostgreSQL은 기본 **Claim마다 전용 SGCluster**(plan `postgresql-dev-single`, 삭제 시 Retain). 접속은 StackGres binding Secret을 워크로드 env로 | 운영됨. 2026-08-09 레드팀 Overall FAIL, 10-20 삭제 |
| G3 | 2026-10-20~23 | 범용 Claim `{module, request.type: Instance/Database, placement}` | 관리자가 승인한 데이터베이스 정책 + Provider 렌더러 | **공유 인스턴스 안에 Claim마다 DB · 역할 · Secret.** 전용 인스턴스는 관리자만 배정(MFA) | 랩 시험까지. 운영 증거 없음 |

**소유자 기억과 맞는 것:** G2에서는 제품을 켜면 그 제품의 번들이 필요한 DB · 버킷 · 캐시 Claim을 스스로 만들었다. 관리자가 Fabric에서 인스턴스를 하나씩 만드는 방식이 아니었다. 실제 공급까지 확인되는 것은 PostgreSQL이다. 아카이브 끝 시점에 Valkey · RustFS 소비 Claim은 Pending으로 멈췄고, OpenSearch는 Claim 계약이 없었다.

**기억과 다른 것:** Claim이 Fabric **엔진(operator · Provider) 자체를 켜지는 않았다.** 엔진이 꺼져 있으면 Claim은 `ModuleDisabled`로 멈췄다.

**버린 이유에서 배울 것(G2 레드팀 · O-2):**
- Claim에 요청자 · 수혜 단위 · 한도 · 결재 참조가 없었다.
- 번들이 Claim을 마음대로 렌더해 typed API를 우회할 수 있었고, Ready 판정이 실제 상태와 맞지 않았다.
- 관리자 명령 하나가 배치 · 한도 · 데이터 삭제를 모두 정했다.
- 한도(quotaGi)는 DB 주석에 적힌 표식뿐이었다.

이 명세는 G2의 **"시스템이 필요를 선언하면 Fabric이 따라온다"**를 되살린다. 위 네 가지는 지금 구조(OSR 서명 · 원장 · Core 승인 기록 · 제한 실행부 · 관리자 OTP)로 막는다.

## 3. 개념

```
 어셈블리 정의 (서명된 OSR assembly artifact, 실행하지 않음)
   └─ 구성요소마다 requires: [ Fabric 요구 ]
            │  해석 (Core, 결정적, 잠금 파일 고정)
            ▼
 어셈블리 계획 (불변, 단계 DAG)
   ├─ ① 서비스 켜기         Fabric 서비스 설치(없을 때만)       provider.postgres
   ├─ ② 공급               인스턴스 생성(필요할 때만)            SGCluster mail-postgres
   ├─ ③ 발급               Claim → 공급 결과(SGScript)          DB mail_store · 역할 mail_stalwart_a/_b
   ├─ ④ 받을 곳 준비        엔진 namespace · 인도 허용 표시       os-backbone-mod-engine-stalwart
   ├─ ⑤ 인도               Binding · Link                       접속 Secret → 엔진 namespace
   ├─ ⑥ 엔진 · 초기화
   └─ 적합성 시험
```

| 용어 | 정의 | 지금 구현 |
|---|---|---|
| **Fabric 서비스** | 스토어에서 켜는 공유 서비스 패키지(OSR `provider`). 켜면 공유 설정과 **등급 카탈로그**가 생긴다. 클러스터를 만들지 않는다. 바탕 operator(StackGres)는 HISS 기반이고 서비스 켜기의 사전조건이다 | `provider.postgres` 설치 |
| **인스턴스** | 실제로 도는 엔진 하나. PostgreSQL이면 SGCluster 하나(독립 클러스터) | Fabric 화면의 인스턴스 |
| **등급(Plan)** | 인스턴스의 CPU · 메모리 · 복제 수 묶음. **Fabric 서비스 패키지가 서명해 내놓는다** | 지금은 `size-small` 하나 |
| **Claim(요구)** | 어셈블리 구성요소의 Fabric 요구 하나가 원장에 들어간 것. 요청자 · 어셈블리 · 구성요소 · 목적 · 한도 · 계획 digest를 갖는다 | 없음(신설) |
| **공급 결과** | Claim을 충족하려고 인스턴스 안에 만든 것: DB · 역할(버킷 · 인덱스 · 키 공간). O-2의 Grant(Governance가 서명하는 배분 증명)와 다른 것이다 | 없음(`db.connection.issue` 예정) |
| **Binding** | 공급 결과의 접속 정보(주소 · 역할 · 자격 참조). 자격 원문은 담지 않는다 | 없음 |
| **연결 객체(Link)** | 구성요소 → Fabric 자원의 선언된 의존. Binding을 감싸고 네트워크 허용 · 삭제 보호 · 회전의 근거가 된다(테넌트 명세 §6) | 없음 |
| **예약** | 그 계획이 쓸 용량(인스턴스 수 · 발급 수 · 연결 예산 · 볼륨)을 원장에 잡아 두는 것. 승인을 기다리는 동안은 `pending`(10분 만료), 승인 뒤에는 `held`(시간으로 풀리지 않음)다(§8.2) | 없음(신설) |
| **대상 fence · 점유** | 대상(설치본 · 인스턴스 · Claim)마다 Core가 갖는 변경 번호와, 지금 그 대상을 바꾸고 있는 계획 ID. 계획은 승인 때 대상을 점유하고 끝날 때 놓는다(§8.3) | 설치본 fence만 있음 |

> **이름 정리:** 지금 문서 · 화면의 "배치 규칙"(OSR materializer profile: 만들 수 있는 객체 종류 · 최대 개수 · 권한)은 **설치 허용 범위**로 부른다. "배치(placement)"는 Claim의 공급 결과를 **어느 인스턴스에 둘지**만 뜻한다. 코드 · 계약 식별자(`profile`, `provider.stackgres-pg`)는 그대로 두고, 문서 · 화면 말만 바꾼다(§11 Q6).

## 4. 원칙

| ID | 원칙 |
|---|---|
| **AF-1** | **필요는 어셈블리 정의에만 적는다.** 엔진 패키지가 스스로 Claim을 렌더하지 않는다(G2 우회 차단). 엔진 디스크립터에는 "받을 수 있는 인도 형태"만 적는다 |
| **AF-2** | **해석은 Core가 결정적으로 하고 결과를 고정한다.** 같은 정의 · 같은 잠금 파일 · 같은 대상 fence 값이면 같은 계획이 나온다. 계획에 없는 객체는 실행부가 만들지 않는다 |
| **AF-3** | **어셈블리 계획 하나에 인증 앱 코드 한 번(소유자 결정 2026-11-20).** 서비스 설치 · 인스턴스 생성 · 발급 · 인도 · 엔진 설치가 각각 단계로 화면에 보이고, 승인은 그 단계 목록 전체의 digest에 묶인다. 승인한 계획 밖의 동작은 하나도 실행되지 않는다. 재개 · 취소 · 해체 · 계획 변경은 각각 새 승인이다 |
| **AF-4** | **Fabric 서비스 켜기도 계획에 들어간다(소유자 결정 2026-11-20).** 필요한 서비스가 꺼져 있으면 ①단계로 함께 계획한다. 이것이 "Fabric이 자동으로 협력한다"의 뜻이다. 단, 그 서비스가 채널 목록에서 해석되고 설치 가능 판정을 받았으며, 바탕 operator와 저장 프로필이 준비된 경우만이다 |
| **AF-5** | **원장 · 예약 · 실행부는 하나.** 수동 경로와 자동 경로는 같은 인스턴스 계획 형식 · 같은 원장 · 같은 예약 · 같은 실행부를 쓴다 |
| **AF-6** | **쓰이는 자원은 지울 수 없다.** 소유자가 누구든 살아 있는 Claim · Binding · Link 또는 진행 중인 예약이 가리키는 인스턴스와 공급 결과는 지우기를 거절한다(T-4). 어셈블리 소유 자원은 어셈블리 해체로만 지운다 |
| **AF-7** | **데이터는 자동으로 지우지 않는다.** 실패 보상과 해체는 **접근**(역할 · 자격 · 연결 · 네트워크 허용)만 거둬들인다. DB와 PV는 남는다. 영구 삭제는 별도 결정이다(D-33, §7.5) |
| **AF-8** | **한도는 실제로 지키는 것만 약속한다.** 지킬 수 없는 한도는 제공하지 않는다고 적는다(§9). 표식만 남기는 한도는 두지 않는다 |
| **AF-9** | **실행부는 원장에 쓰지 않는다.** 실행부 → Core 결과 보고 → Console이 원장에 투영한다(MODULE-EXECUTOR §3). 두 DB는 operationId · 계획 ID · 최종 영수증으로 맞춘다(OSR §11) |
| **AF-10** | **결과를 모르면 멈춘다.** `unknown`은 자동 재실행 · 예약 해제 · 보상을 하지 않고 운영자 확인을 기다린다 |
| **AF-11** | **관리 자격은 누구에게도 주지 않는다.** DB · 역할을 만드는 SQL은 StackGres 운영자가 SGScript로 실행한다. 실행부 · Console · Core는 인스턴스의 superuser 자격을 읽지 않는다(§9.2) |

## 5. 선언 형식

### 5.1 어셈블리 정의의 Fabric 요구

[테넌트·어셈블리 명세 §5.2](TENANT-ASSEMBLY-SPEC-v0.1.md)의 `components[].claim`을 다음으로 구체화한다.

```yaml
kind: AssemblyDefinition
metadata: { name: mail, version: "1.0" }
spec:
  components:
    - name: stalwart
      engine: { module: engine.stalwart, version: ">=0.11 <0.12" }
      requires:
        - name: store                       # 어셈블리 안에서의 요구 이름
          service: { module: provider.postgres, version: ">=26.11 <27" }
          kind: database                    # database | instance | bucket | index | keyspace
          plan: { min: pg.small }           # 등급 하한(서비스의 등급 카탈로그 안에서)
          storage: { sizeGiB: 20, maxGiB: 200 }
          connections: 20                   # 이 Claim의 새 연결 상한(로그인 역할 둘의 합, §9.1)
          access: owner                     # read | write | owner
          placement: { allow: [assembly, dedicated, shared], suggest: assembly }   # 고르는 것은 설치 관리자(§6.2)
          deliver: { form: env-secret }     # 엔진이 받을 수 있는 인도 형태(§7.4)
```

- `service.module`은 OSR 모듈 ID다. 해석할 수 없는 서비스 · 범위를 요구하는 정의는 **설치 전 해석 단계**에서 거절한다(오프라인 의존 해석). 설치 뒤 의존 모듈이 실질 상태를 잃으면 OSR §9 10단계(`DependencyNotSubstantive`)로 판정한다. 둘은 다른 검사다.
- 크기 · 등급은 하한과 상한만 적는다. 실제 값은 계획 검토 화면에서 관리자가 범위 안에서 고르고, 그 선택은 잠금 파일에 고정된다.

### 5.2 Fabric 서비스가 내놓는 것 (패키지 디스크립터)

```yaml
offers:
  plans:                                    # 등급 카탈로그(패키지 서명 안)
    - { id: pg.small,  rank: 1, cpu: "1", memory: 2Gi, replicas: 1 }
    - { id: pg.medium, rank: 2, cpu: "2", memory: 4Gi, replicas: 1 }
    - { id: pg.ha,     rank: 3, cpu: "2", memory: 4Gi, replicas: 2 }
  kinds: [instance, database]
  limits: { instances: 10, claimsPerInstance: 10, connectionsPerInstance: 90, storageGiB: { min: 10, max: 200 } }
```

- 등급은 **패키지(Provider) 소유**다. 관리자가 등급을 만들지 않는다(G3과 같다).
- 패키지의 선언은 권한이 아니다. **실제 허용 = 패키지 선언 ∩ Backbone이 서명한 설치 허용 범위 ∩ 공급 한도**다(OSR v0.2의 교집합 원칙).
- 등급은 `rank`로 **전순서**를 갖는다. "가장 큰 등급"은 `rank`가 가장 큰 것이다.
- 지금의 `size-small`은 `pg.small`이 된다.

### 5.3 잠금 파일

해석 결과는 계획 안의 잠금 파일로 고정한다.

```yaml
lock:
  definition: { module: assembly.mail, digest: sha256:… }
  services:   [{ module: provider.postgres, version: 26.1119.2301.1, digest: sha256:…, installed: true }]
  engines:    [{ module: engine.stalwart, version: 0.11.4, digest: sha256:… }]
  profiles:   [{ id: provider.stackgres-pg, version: 0.4.0, fingerprint: sha256:… }]   # 설치 허용 범위
  renderer:   { artifact: backbone-module-executor, version: …, digest: sha256:… }
  choices:    [{ require: stalwart.store, placement: assembly, plan: pg.small, sizeGiB: 20, connections: 20 }]
  targets:                                  # 해석할 때 읽은 대상별 fence(§8.3)
    - { kind: installation, id: inst-provider-postgres, fence: 2 }
    - { kind: instance, name: mail-postgres, fence: null }   # 아직 없음
```

## 6. 해석

### 6.1 해석 규칙 (요구 → 단계 DAG)

해석은 **누적**한다. 요구마다 필요한 단계를 모두 더하고, 같은 단계는 하나로 합친다(서비스 켜기 · 인스턴스 생성은 여러 요구가 함께 기댄다).

| 순서 | 판단 | 더하는 단계 |
|---|---|---|
| 1 | 서비스가 설치되어 있지 않다 | ① 서비스 켜기(스토어 설치와 같은 계획 형식). 사전조건: 바탕 operator Ready, 저장 프로필 존재 |
| 2 | 자리 정하기(§6.2) 결과 새 인스턴스가 필요하다 | ② 인스턴스 생성(등급 = 그 인스턴스를 쓰는 요구들의 `plan.min` 중 rank 최대, 볼륨 = §9.1의 식) |
| 3 | 언제나 | ③ Claim 기록과 발급(SGScript로 DB · 로그인 역할 둘, T-3) |
| 4 | 구성요소마다 | ④ 받을 곳 준비: 엔진 설치본 namespace를 만들고(없으면) 인도 허용 표시(§9.2)와 Secret 쓰기 권한 연결을 붙인다. 엔진 워크로드는 아직 없다 |
| 5 | 언제나 | ⑤ 인도(Binding · Link, 접속 Secret, 네트워크 허용) |
| 6 | 구성요소마다 | ⑥ 엔진 설치(materializer profile) · 초기화 |
| 7 | 마지막 | 적합성 시험 |

의존: ①→②→③, ④ → ⑤(③과 ④ 모두 끝난 뒤) → ⑥ → 시험. 같은 층의 단계(예: 두 구성요소의 ③, 또는 ③과 ④)는 서로 기대지 않는다.

### 6.2 자리 정하기 (placement)

**자리는 설치하는 관리자가 고른다(소유자 결정 2026-11-20).** 어셈블리 정의는 허용하는 자리(`allow`)와 제안(`suggest`)만 적는다. 관리자는 계획 검토 화면에서 요구마다(또는 어셈블리 전체에 한 번) 허용된 자리 가운데 하나를 고르고, 그 선택은 잠금 파일 `choices`에 고정된다. 화면은 처음에 제안값을 골라 둔다. 자리를 바꾸면 계획을 다시 만든다.


| 값 | 결과 |
|---|---|
| `assembly` | 이 어셈블리가 소유한 그 서비스의 인스턴스 `<어셈블리>-<서비스>`가 있으면 그 안에 발급한다. 없으면 ②로 만든다. 한 어셈블리 안의 구성요소들이 인스턴스 하나를 함께 쓰고, DB와 역할은 Claim마다 따로다 |
| (공통) 기존 인스턴스의 여유 부족 | 고른 자리에 이미 있는 인스턴스가 등급 · 남은 발급 수 · 연결 예산 · 볼륨 가운데 하나라도 모자라면 **계획을 만들지 않고 "인스턴스 여유 부족"으로 멈춘다.** v0.2는 자동 확장을 하지 않는다. 다른 자리를 고르거나, 확장은 별도 계획으로 한다(§11.3 Q9) |
| `dedicated` | 이 요구만을 위한 인스턴스 `<어셈블리>-<요구>`를 ②로 만든다 |
| `shared` | 관리자가 **공용**으로 표시한 인스턴스에서 고른다. 후보는 "등급 rank ≥ 요구 하한, 남은 발급 수 · 연결 예산 · 볼륨 여유가 충분"인 것이고, **남은 발급 수가 가장 많은 것, 같으면 인스턴스 이름 사전순**으로 고른다. 후보가 없으면 계획을 만들지 않고 "공용 인스턴스 없음"으로 멈춘다(자동으로 만들지 않는다) |

- 정의가 `allow`에 넣지 않은 자리는 고를 수 없다. 공용 인스턴스가 하나도 없으면 화면에서 `shared`를 고를 수 없게 하고 이유를 적는다.
- 인스턴스 이름이 이미 다른 소유자의 것이면 계획 단계에서 거절한다.
- 같은 정의 · 같은 잠금 파일 · 같은 대상 fence 값이면 같은 결과가 나와야 한다(AF-2). 시험 벡터로 고정한다.

## 7. 처리 절차

### 7.1 어셈블리 계획의 상태

```
Draft → Resolved → AwaitingApproval → Reserved → Running ─┬→ Succeeded → (Active)
   │        │              │              │              ├→ Blocked(단계 · 사유) ─→ Running(재개) | Cancelled(보상)
   └────────┴──────────────┴──────────────┘              └→ RecoveryRequired(unknown)
            Superseded (새 계획으로 대체) · Cancelled
```

| 상태 | 들어가는 조건 | 나가는 조건 |
|---|---|---|
| Draft | 관리자가 어셈블리 정의를 고름 | 해석 성공 → Resolved, 실패 → 거절 사유 |
| Resolved | 잠금 파일 · 단계 DAG 확정, 대상별 fence 기록 | 관리자 검토 시작 |
| AwaitingApproval | 계획 digest 확정, 예약 `pending`(10분, §8.2). 관리자가 등급 · 크기를 바꾸면 새 Draft | 승인 → Reserved. 예약 만료, 또는 대상 fence가 해석 때와 다르거나 다른 계획이 점유 중이면 Superseded |
| Reserved | Core 승인 기록이 예약 ID를 담고 대상을 점유(§8.3), Console이 예약을 `held`로 바꿈(§8.2) | 실행 시작 |
| Running | 실행부가 단계를 차례로 실행 | 전부 성공 → Succeeded. 실패는 §7.3의 단계별 규칙. 결과 불명 → RecoveryRequired |
| Blocked | 단계 실패(`refused`). 점유 · `held` 예약 유지 | 관리자 재개(같은 계획, 새 승인) 또는 취소(보상 실행 후 Cancelled, 점유 · 예약 해제) |
| RecoveryRequired | 단계 결과 `unknown`. 점유 · 예약 유지(어떤 만료로도 풀리지 않음) | 운영자 확인 기록 후에만 Blocked 또는 Running |
| Succeeded | 적합성 시험 통과. 예약은 실제 사용으로 바뀌고 점유를 놓음 | 어셈블리 상태 Active, Governance 인계(§7.6) |

### 7.2 어셈블리 추가

| 단계 | 누가 | 하는 일 | 기록 |
|---|---|---|---|
| 1 선택 | 테넌트 관리자 권한을 가진 관리자(§11 Q7) | 스토어의 어셈블리 정의(`assembly.mail`)를 고른다 | — |
| 2 해석 | Core | §6 규칙으로 잠금 파일 · 단계 DAG를 만든다 | Core 계획(`opensphere.osr-assembly-plan/v1`, 불변) |
| 3 검토 | 관리자 | 요구마다 자리(§6.2) · 등급 · 크기를 허용 범위 안에서 고르고, 단계 목록을 본다: 켜질 서비스, 만들 인스턴스 · 등급 · 볼륨, 발급할 DB · 역할, 생길 연결과 네트워크 허용, 설치할 엔진. 고칠 때마다 계획을 다시 만든다 | — |
| 4 예약 | Console | 승인을 묻기 직전에 용량을 `pending`으로 예약(10분). 예약하지 못하면 코드를 묻지 않는다 | 원장 예약 |
| 5 승인 | 관리자 본인 | 인증 앱 코드 한 번(옆 패널, AF-3). 승인 기록은 계획 digest와 예약 ID를 담고, 같은 트랜잭션에서 Core가 대상 점유를 얻는다(§8.3). 점유를 얻지 못하면 승인하지 않는다 | Core 승인 기록 · 점유 |
| 6 실행 | 실행부 | 단계마다: Core에서 승인된 계획을 직접 받음 → Core에서 단계 시작을 얻음(예약 `held` 기록 · 점유 · 기대 fence 확인, §8.3) → 적용 → 확인 → Core에 결과 보고 | Core 단계 결과 |
| 7 투영 | Console | Core의 단계 결과를 원장에 옮긴다(인스턴스 · Claim · 공급 결과 · Binding · Link) | 원장 |
| 8 시험 | 실행부 · Core | 정의의 적합성 시험 | 어셈블리 Active / Degraded |
| 9 인계 | Core · Console | 리소스 유형 · 용량 · 정의 generation을 Governance에 인계(D-82, 카탈로그 §1) | 인계 기록 |

계획은 불변이다. 요구 추가 · 제거, 엔진 · 서비스 버전 올리기, 등급 변경은 **새 어셈블리 계획**(현재 상태와의 차이)으로 하고 같은 승인을 다시 받는다.

### 7.3 실패와 보상

- 단계 실패는 테넌트 명세 §7.1의 구분을 따른다.

| 실패한 단계 | 처리 |
|---|---|
| ①② 서비스 켜기 · 인스턴스(Provisioning) | Blocked. 재개 또는 취소(보상) |
| ③④⑤ 발급 · 받을 곳 준비 · 인도(Binding) | 실패한 단계만 같은 계획 안에서 다시 시도(같은 멱등 키), 3회 실패하면 Blocked |
| ⑥ 초기화(Initializing) | 그 구성요소만 다시 초기화(같은 계획, 멱등 단계). 3회 실패하면 Blocked |
| 적합성 시험(Verifying) | Initializing으로 되돌리고 보고. 3회 실패하면 Blocked |

- 이미 끝난 단계의 결과는 원장에 남는다. 다시 시도는 같은 단계 멱등 키(§7.7)로만 한다.
- **재개:** 같은 계획을 이어서 실행한다. 이 계획이 점유한 대상은 다른 계획이 바꿀 수 없으므로, 이 계획이 스스로 올린 fence는 충돌이 아니다(§8.3). 점유하지 않은 대상(예: 공용 인스턴스의 남은 여유)이 바뀌어 단계 시작이 거절되면 그때만 새 계획을 만든다.
- **취소(보상):** 끝난 단계를 역순으로 되돌리되 **접근만** 거둔다. 인도 철회(Secret 삭제 · 네트워크 허용 철회) → 역할 비활성 · 세션 종료 → Claim 해제 → 새로 만든 인스턴스는 정지(SGCluster 삭제, PV만 남음). 데이터는 지우지 않는다(AF-7). 테넌트 명세 §7.1의 "단계 롤백(Claim 회수)"은 이 보상을 뜻하도록 함께 고친다.
- 결과가 `unknown`이면 RecoveryRequired로 두고 보상도 하지 않는다(AF-10). 예약과 점유는 유지하고, 시간으로 풀리지 않는다.
- 실행부가 적용에 성공했지만 보고가 끊기면, 실행부는 표식(ConfigMap)으로 같은 operation을 이어 확인 · 보고한다. Core가 기록했는데 Console 투영이 끊기면 Console이 Core의 기록을 다시 읽어 이어 간다(MODULE-EXECUTOR §3과 같다).

### 7.4 인도 (Binding · Link)

- **형태:** 엔진 namespace에 Secret `<어셈블리>-<구성요소>-<요구>`(host · port · database · username · password · sslmode · CA). 엔진 materializer profile이 env로 연결한다.
- **자격 원문:** 실행부가 발급 단계에서 무작위로 만든다. 같은 값을 인스턴스 namespace의 발급용 Secret(SGScript가 읽는 것, §9.2)과 엔진 namespace의 접속 Secret에만 쓴다. 메모리에만 두고 원장 · Core · Console · 로그 · 결과 보고에는 남기지 않는다(보고에는 Secret의 이름 · UID · resourceVersion만 싣고, 내용이나 그 digest는 싣지 않는다). 실행부가 원문을 잠깐 본다는 것은 v0.2가 받아들인 위험이다. 관리 자격(superuser)보다 범위가 훨씬 좁고, 노출 경로는 §9.2의 시험으로 막는다.
- **쓰기 주체와 범위:** 실행부. ④단계에서 실행부가 붙인 인도 허용 표시가 가리키는 namespace의, 계획이 적은 Secret 이름 하나만 쓸 수 있다(§9.2).
- **네트워크:** 연결 객체에서 "엔진 namespace의 그 워크로드 → 인스턴스 5432"만 허용하는 정책을 양쪽 namespace에 만든다(T-5).
- **로그인 역할 둘:** Claim마다 로그인 역할 `<역할>_a` · `<역할>_b`(같은 NOLOGIN 소유 역할의 멤버)를 둔다. 쓰는 쪽은 `CONNECTION LIMIT n`, 쉬는 쪽은 `CONNECTION LIMIT 0`이다. 0은 새 연결을 막고 열린 세션은 끊지 않는다.
- **회전:** ① 쉬는 쪽에 새 비밀번호, 한도 n → ② Secret을 새 쪽으로 갱신 → ③ 엔진 재시작 · 접속 확인 → ④ 옛 쪽 한도 0(새 연결 차단, 열린 세션은 자연히 줄어듦) → ⑤ 정해진 시간 뒤 옛 쪽 `NOLOGIN` · 남은 세션 종료. **①~④ 사이에는 두 역할의 한도 합이 2n이다.** 회전 밖에서는 합이 n이고, 회전 중의 n만큼 더 큰 몫은 §9.1의 회전 여유로 예산에 잡는다. 회전 때문에 엔진이 끊기지 않게 하려고 받아들인 것이다. Link가 수행하며, 한 인스턴스에서 동시에 하나의 회전만 한다(테넌트 명세 §9.3).
- **폐기:** 두 로그인 역할 `NOLOGIN` · 세션 종료 · Secret 삭제를 각각 확인한다.
- KMS 참조(`kms://…`)는 trust 어셈블리가 생긴 뒤 같은 Link 안에서 바꾼다.

### 7.5 해체 (역순, 단계마다 확인)

| 단계 | 하는 일 | 확인 | 실패 시 |
|---|---|---|---|
| 1 결정 | 해체 계획 승인. Governance에 새 배분 차단 통지, 기존 배분 회수 확인 | 인계 기록 갱신 | 멈춤 |
| 1a 동결 | 새 쓰기를 막고 기존 세션을 정리(테넌트 명세 §10의 2단계) | 엔진 읽기 전용 · 세션 정리 | 멈춤 |
| 1b 반출 확인 | 반출이 필요한 데이터의 반출 완료 기록을 확인(같은 §10의 3단계). 반출하지 않기로 했다면 그 결정 기록 | 기록 | 멈춤 |
| 2 엔진 정지 | 엔진 워크로드 제거 | Pod 0 | 멈춤, Blocked |
| 3 인도 철회 | Secret 삭제, 네트워크 허용 철회 | 객체 없음 | 멈춤 |
| 4 접근 폐기 | 역할 `NOLOGIN` → 그 역할의 세션 종료 → 확인 | 활성 세션 0 | 멈춤 |
| 5 Claim 해제 | Claim · Binding · Link 해제 기록, DB는 `released`로 보존 | 원장 | — |
| 5a 보존 기록 | 남길 데이터의 대응을 원장에 기록: 원래 인스턴스 이름 · UID, PVC · PV 이름, DB 이름, PostgreSQL 판, StackGres 판, 저장 클래스와 회수 정책, 암호화 키 참조(있으면) | 기록 | 멈춤 |
| 6 인스턴스 정지 | **이 어셈블리 계획이 만든 인스턴스만**, 다른 살아 있는 Claim이 없을 때 SGCluster 삭제. StackGres가 PVC를 지우고 Retain PV만 남는다(격리에서 확인한 StackGres 1.19 · `backbone-longhorn` 동작) | SGCluster · PVC 없음, PV Released, 5a 기록과 PV 일치 | 멈춤 |
| 7 서비스 | 다른 소유자가 없으면 "내릴 수 있음"으로 표시만 한다. 자동으로 내리지 않는다 | — | — |

- **보존과 복구는 다르다.** PV가 남는다는 것은 데이터가 지워지지 않았다는 뜻일 뿐, 되살릴 수 있다는 뜻이 아니다. 해체가 끝나면 상태를 **"데이터 보존 확인, 복원 미검증"**으로 적는다. 복원은 백업 · 복원 설계에서 정하고 검증한다(§11.3 Q10).
- 해체 후 같은 이름으로 다시 만들어도 **새 빈 볼륨**이다. 남은 PV를 다시 붙이는 일은 운영자 절차다.
- 해체는 **이 어셈블리 계획이 만든 것만** 되돌린다. 어셈블리 전에 있던 인스턴스(수동 · 공용)와 그 안의 다른 데이터는 해체 대상이 아니다. 데이터를 가진 인스턴스를 자동으로 지우는 기능으로 넓혀 읽지 않는다.
- 영구 삭제(남은 DB · PV 파기)는 D-33의 결정이다. 어셈블리 해체 승인에 포함하지 않는다.

### 7.6 Governance 인계

- 인계하는 것: 리소스 유형(카탈로그 §2), 용량, 어셈블리 정의 generation, 활성 조건(Active일 때만 새 배분 가능).
- 어셈블리가 Degraded면 새 배분을 막고 기존 배분은 유지한다. 해체 결정 시 새 배분을 막고, 기존 배분은 Governance가 회수한 뒤 해체 2단계로 간다.

### 7.7 계획 스키마의 필수 항목 (`opensphere.osr-assembly-plan/v1`)

| 항목 | 내용 |
|---|---|
| 식별 | 계획 ID, 어셈블리 이름 · UID · 정의 generation, 계획 generation, 이전 계획(대체한 것) |
| 잠금 파일 | §5.3 전체(정의 · 서비스 · 엔진 · 설치 허용 범위 · 렌더러 digest, 선택값, 대상별 fence) |
| 예약 · 점유 | 예약 ID, 항목별 몫(회전 여유 포함), 점유할 대상 목록 |
| 단계 | 단계 ID, 종류(①~⑥ · 시험), 의존 단계 ID, 대상(설치본 ID · 인스턴스 이름 · 이미 있는 대상은 UID), **대상별 기대 fence**(이 계획의 앞 단계가 올릴 몫을 미리 셈한 값), 만들 객체 목록(apiVersion · kind · namespace · name), Claim ID · Binding ID · Link ID, **멱등 키 = 계획 ID + 단계 ID** |
| 승인 | 승인 기록 참조(계획 digest · 예약 ID). 사람 정보 · 코드는 담지 않는다 |
| 영수증 | 단계마다 Core 결과(activated · refused · unknown)와 실행부 보고 digest. 최종 영수증은 모든 단계 결과의 digest |

Claim · 공급 결과 · Binding · Link는 원장에서 ID로 서로를 가리킨다: Link(구성요소 → Claim) → Claim(요구, 계획 단계) → 공급 결과(인스턴스 UID, DB · 역할 이름) → Binding(주소, Secret namespace · 이름 · UID).

## 8. 수동 경로와 함께 쓰기

### 8.1 소유와 보호

| | 수동(Fabric 화면) | 자동(어셈블리) |
|---|---|---|
| 만드는 사람 | 관리자, 인증 앱 코드 | 어셈블리 계획 승인 |
| 원장 `owner` | `admin:<계정>` | `assembly:<이름>` |
| `shared` 표시 | 관리자가 켤 수 있다(공용 인스턴스) | 없음 |
| 지우기 | Fabric 화면에서. **살아 있는 Claim이 하나라도 있으면 거절**(AF-6) | 어셈블리 해체로만 |
| 화면 | Fabric → PostgreSQL 목록에 둘 다 보이고 소유자 · 사용 중인 Claim 수 열로 구분 | 어셈블리 화면에서 자기 자원 |

### 8.2 예약

- 원장에 설치본별 **용량 장부**를 둔다: 인스턴스 수, 인스턴스별 발급 수 · 연결 예산 · 볼륨.
- 수동 인스턴스 계획과 어셈블리 계획 모두 같은 장부를 쓴다. 원장(Console DB)과 Core 승인 기록(Core DB)은 다른 DB이므로 한 트랜잭션으로 묶지 않는다. 대신 상태 전이로 묶는다.
  1. Console이 원장에 예약 `pending`(계획 digest, **만료 10분**)을 만든다. 장부가 모자라면 여기서 거절하고 코드를 묻지 않는다. 10분은 **승인을 기다리는 시간**에만 적용된다.
  2. Core 승인 기록은 그 예약 ID와 만료 시각을 담는다. Core는 예약 ID 없는 보호 계획, 또는 승인 시각이 만료 시각을 지난 계획을 승인하지 않는다. **만료는 Core의 승인 시각으로 판정한다.**
  3. Console이 Core의 승인을 읽어 예약을 `held`로 바꾸고, Core에 "이 계획의 예약은 held"를 기록한다(멱등). 이 단계가 끊기면 Console이 Core 기록을 다시 읽어 이어 간다. 승인 시각이 만료 전이면, `held`로 바꾸는 일이 만료 뒤로 늦어져도 `held`로 바꾼다(Console의 시계가 아니라 Core 기록을 따른다). 승인이 없이 만료됐다면 예약을 풀고 계획은 Superseded다.
  4. **`held`에는 만료 시각이 없다.** 설치가 10분을 넘어도, Blocked여도, RecoveryRequired여도 시간으로 풀리지 않는다. 풀리는 것은 Succeeded(실제 사용으로 바뀜) · Cancelled(보상이 끝난 뒤) · 운영자가 RecoveryRequired를 정리하며 명시적으로 푼 경우뿐이다.

### 8.3 실행 직전 재검사

- **점유:** Core는 대상(설치본 · 인스턴스 · Claim)마다 fence와 점유 계획 ID를 갖는다. 승인할 때 계획이 **바꾸는 모든 대상**을 한 트랜잭션에서 점유한다. 공용 인스턴스도 발급 때 그 SGCluster(`managedSql`)를 바꾸므로 점유 대상이다. 이미 다른 계획이 점유한 대상이 있으면 승인하지 않는다(그 계획이 놓을 때까지 기다리거나 새 계획).
- **놓기:** 그 대상을 바꾸는 이 계획의 마지막 단계가 `activated`로 끝나면 그 대상을 놓는다(공용 인스턴스는 발급 · 인도가 끝나면 바로 풀린다). Blocked · RecoveryRequired인 동안 아직 남은 단계가 바꿀 대상은 계속 점유한다. 계획이 Cancelled가 되거나 운영자가 RecoveryRequired를 정리하면 모두 놓는다.
- **기대 fence:** 계획은 단계마다 대상별 기대 fence를 미리 셈해 둔다(해석 때 읽은 값 + 이 계획의 앞 단계가 그 대상을 바꾼 횟수). 이 계획이 스스로 올린 fence는 충돌이 아니다.
- **단계 시작:** 실행부는 Core의 시작 경로(지금 `executor_start`)로 다음을 원자적으로 얻는다: 예약 `held` 기록이 있음 · 대상을 이 계획이 점유 중 · 대상 fence가 그 단계의 기대 값 · 같은 단계가 아직 끝나지 않음. 통과하면 시작을 기록하고, 단계가 끝날 때 대상 fence를 올린다.
- **이어서 확인과 다시 실행은 다르다.**
  - *이어서 확인:* 시작은 기록됐지만 결과가 없는 단계(보고 유실)를 같은 멱등 키로 다시 시작하면, Core는 새 시작을 기록하지 않고 "이어서 확인"을 돌려준다. 실행부는 표식으로 그 단계의 적용 결과를 확인해 보고만 한다.
  - *다시 실행:* `refused`로 끝난 단계(§7.3의 3회 재시도)는 fence를 올리지 않았으므로 같은 기대 fence로 다시 시작한다. Core는 시도 번호를 하나 올려 기록한다(멱등 키 = 계획 ID + 단계 ID, 시도 번호는 영수증에만).
  - fence는 단계가 `activated`로 끝날 때만 오른다.
- **거절:** 조건이 하나라도 맞지 않으면 `refused`(StalePlan · NotHolder · ReservationNotHeld)로 보고한다. Console이 넘기는 값은 믿지 않는다(MODULE-EXECUTOR §3).
- 원장 전체 번호로 막지 않으므로 서로 다른 대상을 바꾸는 계획끼리는 부딪치지 않는다. 공용 인스턴스의 남은 여유(발급 수 · 연결 예산 · 볼륨)는 점유와 별개로 장부 예약이 지킨다.

## 9. 한도와 실행부 권한

### 9.1 실제로 지키는 한도

| 한도 | 어떻게 지키나 | v0.2 |
|---|---|---|
| 인스턴스 수 | 예약 + 설치 허용 범위의 `max` + 실행부 재검사 | 지킨다 |
| 인스턴스 볼륨 | SGCluster 볼륨 크기(PVC). 크기 = max(등급 기본값, 그 인스턴스를 쓰는 Claim `sizeGiB` 합 × 1.2), 설치 허용 범위의 상한 안. 합이 상한을 넘으면 해석 단계에서 거절 | 지킨다(인스턴스 전체) |
| 인스턴스당 발급 수 | 예약 + 실행부 재검사 | 지킨다 |
| Claim의 동시 연결 수 n | 쓰는 쪽 로그인 역할 `CONNECTION LIMIT n`, 쉬는 쪽 0(§7.4). 회전 밖에서는 합 n, 회전 중에는 최대 2n. PostgreSQL은 이 한도를 새 연결에서 **근사적으로** 집행하고(같은 순간의 연결은 넘치지 않는 쪽으로 둘 다 거절될 수 있다), superuser와 이미 열린 세션에는 적용하지 않는다. 그래서 Claim 역할은 superuser가 아니다 | 지킨다(새 연결 기준, 근사) |
| 인스턴스 연결 예산 | `max_connections` ≥ Σ(Claim n) + 회전 여유(그 인스턴스 Claim n 가운데 최대값, 한 번에 회전 하나) + 운영 몫(`superuser_reserved_connections`, StackGres · Patroni · 감시 연결). 예약 장부가 이 식으로 남은 몫을 셈한다 | 지킨다 |
| **DB별 저장량** | PostgreSQL에 DB 단위 크기 제한이 없다. PVC 크기는 DB별 한도가 아니다 | **제공하지 않는다(Q8).** 요구의 `sizeGiB`는 인스턴스 볼륨 합산에만 쓰고, 화면에 "DB별 저장 한도 없음"으로 적는다. DB별 한도가 필요하면 `dedicated`를 쓴다 |

### 9.2 발급 · 인도의 권한 경계

v0.1의 "발급 도우미"(인스턴스마다 도는 별도 워크로드)는 버린다. 지금 배치 규칙(`provider.stackgres-pg` 0.3.0)은 Deployment · StatefulSet을 금지하고, 그 워크로드가 관리 자격을 갖게 되기 때문이다. 대신 **StackGres가 이미 가진 기능**을 쓰고, 모자란 부분만 좁게 더한다.

**발급(인스턴스 namespace 안)**

| 구성 | 내용 |
|---|---|
| SQL 실행 | StackGres **SGScript**. 실행부가 SGScript 객체를 만들고 SGCluster의 `managedSql`에 연결하면, StackGres 운영자가 클러스터 안에서 자기 권한으로 실행한다. 구 버전 G2도 같은 방식으로 DB · 역할을 만들었다 |
| 문장 | 고정 템플릿만: CREATE ROLE … NOLOGIN(소유), CREATE ROLE … LOGIN CONNECTION LIMIT n / 0(로그인 둘), CREATE DATABASE … OWNER, ALTER ROLE … CONNECTION LIMIT / NOLOGIN / PASSWORD, pg_terminate_backend(그 역할의 세션만). 식별자는 규칙(`^[a-z][a-z0-9_]{2,40}$`)을 통과한 계획 값만. 임의 SQL · superuser · CREATEROLE 부여 없음. Console과 실행부가 각각 템플릿 밖의 문장을 거절한다 |
| 비밀번호 | 비밀번호가 든 문장은 SGScript 본문에 넣지 않고 인스턴스 namespace의 Secret에 넣어 `scriptFrom.secretKeyRef`로 참조한다 |
| 한 번만 실행 | StackGres는 스크립트 항목을 `id` · `version`으로 기록하고 판이 바뀔 때만 다시 실행한다. 멱등은 이 기록에 맡기고, 역할 문장은 DO 블록으로 존재를 확인한다. `CREATE DATABASE`는 트랜잭션 안에서 실행할 수 없으므로 `wrapInTransaction` 없이 따로 둔 항목으로 실행한다 |
| 관리 자격 | 아무도 읽지 않는다. StackGres가 만든 superuser Secret에 대한 `get`이 필요 없도록, 설치 허용 범위 0.4.0에서 실행부의 Secret 권한을 **create · update · delete로 줄이고 get을 뺀다**(0.3.0은 get · create · update) |
| 허용 범위 개정 | 0.4.0: 리소스 목록에 `SGScript`(Claim 수만큼), Secret 수 상한을 Claim 수에 맞게. 실행부 경계 정책은 SGScript 본문이 템플릿 모양인지 검사하지 못하므로, 실행부 자신의 템플릿 검사와 Core에 기록된 계획 대조가 그 몫을 한다 |

**인도(엔진 namespace에 Secret 쓰기)**

Kubernetes RBAC은 "어떤 표시가 붙은 namespace에만"이나 "이 이름으로만 만들기"를 표현하지 못한다(create에는 resourceNames가 적용되지 않는다). 그래서 세 겹으로 한다.

| 겹 | 내용 |
|---|---|
| RoleBinding(namespace마다) | ④단계에서 실행부가 그 엔진 namespace에만 RoleBinding을 만들어, 운영자가 적용한 ClusterRole `osr-binding-writer`(secrets: create · update · delete. **get · list · watch 없음**)를 자기에게 묶는다. 실행부가 묶을 수 있는 ClusterRole 이름 목록에 `osr-binding-writer`를 더한다(지금은 `osr-profile-*`만) |
| 허용 표시 | ④단계에서 실행부가 namespace에 라벨 `opensphere.io/osr-binding-target=true`와 주석 `opensphere.io/osr-binding-allow=<Secret 이름 목록>`을 붙인다. 이 라벨 · 주석을 바꿀 수 있는 것은 실행부뿐이고(경계 정책), 실행부는 승인된 계획의 ④단계에서만 바꾼다 |
| 경계 정책(ValidatingAdmissionPolicy) | 실행부의 Secret 쓰기는 ① 대상 namespace에 그 라벨이 있고 ② Secret 이름이 그 namespace 주석의 목록에 있고(CEL의 `namespaceObject`로 주석을 읽는다. 클러스터는 Kubernetes 1.37이며 격리에서 확인한다. 안 되면 paramRef로 넘긴 허용 목록 객체를 쓴다) ③ 새로 만들 때 라벨 `opensphere.io/osr-binding=<Claim ID>`를 달고 ④ 고치거나 지울 때는 기존 객체(`oldObject`)에 그 라벨이 있을 때만 통과한다. 별도 정책이 **실행부 밖의 누구도 이 라벨을 단 Secret을 만들거나 그 라벨을 붙이지 못하게** 막는다. 그래서 그 라벨은 실행부가 만든 Secret이라는 표시가 되고, 실행부는 남이 만든 Secret을 고치거나 덮어쓸 수 없다 |

- 실행부는 엔진 namespace의 Secret을 **읽을 수 없다**(get · list 없음). 다만 update 응답은 저장된 Secret 전체를 돌려주므로, 실행부가 볼 수 있는 것은 위 경계 정책으로 고칠 수 있는 Secret, 곧 자기 라벨이 붙은(자기가 만든) Secret의 내용뿐이다. 그 응답도 로그 · 보고에 남기지 않는다.
- **노출 방지 시험(첫 납품에 포함):** 실행부 · Console · Core 로그와 Core 결과 보고에 비밀번호가 나타나지 않는지, 실행부가 엔진 namespace의 다른 Secret을 get · list · update하면 거절되는지, 허용 목록 밖 이름 · 라벨 없는 namespace에 쓰면 거절되는지, SGScript 실패 상태에 비밀번호가 실리지 않는지 확인한다.
- **격리에서 먼저 확인할 StackGres 1.19 동작:** SGScript의 실행 시점과 재실행 조건(스크립트 판이 바뀔 때), 실패 상태 보고(`status.managedSql`), 같은 문장을 다시 실행할 때의 결과(멱등이 되도록 `IF NOT EXISTS` · DO 블록), 스크립트 항목을 빼도 이미 실행한 효과가 남는지. 기대와 다르면 v0.2의 발급 방식을 다시 정한다.
- 이 권한은 서명된 설치 허용 범위 개정과 운영자가 적용하는 ClusterRole · 경계 정책 개정으로만 생긴다. 실행부가 스스로 만들지 않는다(MODULE-EXECUTOR §4).

## 10. 지금 구현에서 바뀌는 것 (OpenSphere-Backbone)

| 단계 | 내용 | 기존 위치 |
|---|---|---|
| AF-I1 | 원장: `osr.instances`에 `owner` · `plan` · `shared`, 새 표 `osr.claims` · `osr.provisioned` · `osr.bindings` · `osr.links` · `osr.reservations`(pending · held), 해체 보존 기록. Core: 대상별 fence · 점유 | `infra/osr/006-instances.sql` 다음 변경, Core DB 변경 |
| AF-I2 | 등급 카탈로그: `provider.postgres` 디스크립터 `offers.plans`, 렌더러가 등급별 SGInstanceProfile. 수동 인스턴스 만들기 화면에 등급 고르기 | 렌더러, Fabric 화면 |
| AF-I3 | 설치 허용 범위 0.4.0: SGScript, Secret get 제거, `osr-binding-writer` ClusterRole · 묶을 수 있는 이름 목록 · 경계 정책 개정(§9.2). 먼저 격리에서 SGScript 동작 확인. 등급별 객체 수는 AF-I2 때 더한다 | 배치 규칙 0.3.0, 실행부 경계 정책 |
| AF-I4 | 발급 · 인도(수동 경로 먼저): Fabric 화면 "접속 정보 발급"(`db.connection.issue`) = Claim(owner admin, 목적) → 받을 곳 준비 → SGScript 발급 → 인도 → Binding. 같은 실행부 동작을 어셈블리가 재사용 | 실행부, FABRIC-INSTANCES §7 |
| AF-I5 | 예약(pending · held) · 점유 · 기대 fence · 단계 시작 검사: 수동 인스턴스 계획에도 적용 | Console · Core · 실행부 |
| AF-I6 | 어셈블리 정의 `requires` · 잠금 파일 · 해석기(시험 벡터) · `osr-assembly-plan/v1` · 상태 머신 | OSR 계약, Core |
| AF-I7 | 실행부 단계 실행 · 재개 · 보상 · 해체 | 실행부 |
| AF-I8 | 화면: 어셈블리 계획 검토 → 옆 패널 승인, Fabric 화면 소유자 · 사용 Claim 열, 쓰이는 자원 지우기 막기 | Console |
| AF-I9 | 격리 시험: 만들기 → 시험 → 실패 주입 → 재개 · 취소 → 해체 → 데이터 보존 확인 → 운영 | 격리 환경 |

AF-I1~I5는 어셈블리 없이도 수동 경로를 완성한다(접속 정보 발급, 등급, 예약). 그다음 AF-I6~I9가 자동 경로를 얹는다.

- **순서(v0.2):** AF-I1 → AF-I5 → AF-I3(발급 · 인도에 필요한 부분) → AF-I4 → AF-I2 → AF-I6 → AF-I7 → AF-I8. AF-I4는 AF-I3의 권한 경계 없이는 만들 수 없다.
- 사용 중 자원 지우기 막기와 실패 · 재개 · 보존 시험(AF-I9의 내용)은 각 기능을 처음 낼 때 함께 넣는다(마지막에 몰지 않는다).
- **첫 작은 납품:** 기존 PostgreSQL 인스턴스 하나 → 목적 · 소유자가 있는 Claim 하나 → DB · 자격 발급(SGScript) → 시험용 소비자 namespace에 인도 → 실제 읽기 · 쓰기 → 접근 회수 → 데이터 보존 확인. 함께 확인할 것: 같은 요청 두 번(멱등), 결과 보고 유실 뒤 재개, `pending` 예약 만료, 사용 중 인스턴스 지우기 거절, §9.2의 노출 방지 시험. 이것이 통과한 뒤 서비스 자동 켜기와 여러 구성요소의 어셈블리 계획으로 넓힌다.

## 11. 소유자 결정

### 11.1 정해진 것 (2026-11-20)

| ID | 질문 | 결정 | 비고 |
|---|---|---|---|
| Q1 | 발급 자리 | **설치하는 관리자가 고른다.** 정의는 허용 자리와 제안만 적는다(§6.2) | Claude는 `assembly` 기본값을, Codex도 동의했다. 소유자는 정의가 정할 일이 아니라 설치 관리자의 선택이라고 정했다. 화면 제안값으로만 남긴다 |
| Q2 | 꺼진 서비스 켜기 | **어셈블리 계획에 포함**(AF-4) | 단계로 따로 보여 준다 |
| Q3 | 승인 단위 | **계획 하나에 코드 한 번**(AF-3) | Codex는 보호 동작마다 코드를 권했다. 소유자는 계획 단위를 골랐다. 모든 보호 동작이 승인 화면과 digest에 이름으로 드러나는 것이 조건이다 |

### 11.2 권고 (확정 아님, 권고대로 진행 예정)

결정이 아니라 권고다. 소유자가 다르게 정하면 바꾼다.

| ID | 질문 | 권고 |
|---|---|---|
| Q4 | 등급의 소유 | 패키지 서명 카탈로그, 설치 허용 범위와 교집합 |
| Q5 | 해체 시 데이터 | 보존(역할 비활성 · DB released · PV Retain · 보존 기록). 영구 삭제는 D-33. 완료 표현은 "데이터 보존 확인, 복원 미검증" |
| Q6 | 이름 | "배치 규칙" → "설치 허용 범위", "배치"는 발급 자리만(문서 · 화면, 식별자는 유지) |
| Q7 | 어셈블리를 고르는 화면과 권한 | Fabric 공급 · 발급 · 기반 운영 화면은 Configuration 안에 둔다. 어셈블리 구성은 서버에서 **"테넌트 관리자"라는 별도 권한**으로 검사한다. 지금은 그 권한을 Console 관리자에게도 주는 임시 운영이지만, 두 권한을 코드에서 하나로 합치지 않는다. 회사 관리 콘솔(D-82 · D-84)이 생기면 어셈블리 구성 화면을 옮긴다 |
| Q8 | DB별 저장 한도 | 제공하지 않음(§9.1). 필요하면 `dedicated`. 화면은 공용 자리를 고르기 전에 이 사실을 보여 준다 |

### 11.3 소유자가 정할 것

| ID | 질문 | 권고 |
|---|---|---|
| Q9 | 기존 인스턴스의 여유가 모자랄 때 | 멈추고 알린다(자동 확장 없음). 확장은 별도 계획으로 승인 |
| Q10 | 첫 출시의 완료 기준에 실제 복원(남은 PV에서 데이터 되살리기) 성공을 넣을지 | 넣지 않는다. 완료 표현은 "데이터 보존 확인, 복원 미검증". 복원은 백업 · 복원 설계에서 검증 |

## 12. 다른 문서에 반영할 것

| 문서 | 내용 | 상태 |
|---|---|---|
| 테넌트·어셈블리 명세 | §7.1 실패 처리(접근 보상), T-6 갈음 범위, §10 해체에 보존 기록과 "복원 미검증" | v0.2와 함께 반영 |
| OSR v0.2 | assembly artifact의 `requires` · 잠금 파일, 디스크립터 `offers`, 설치 허용 범위의 인도 권한 | v0.2와 함께 참조 메모 반영, 계약 · 시험 벡터는 AF-I6 |
| 용어 대응표 | 설치 허용 범위 · 배치 · Claim · 공급 결과 · Binding · Link · 대상 fence · 점유 | v0.2와 함께 반영 |
| OpenSphere-Backbone `MODULE-EXECUTOR.md` | 단계 시작 검사(§8.3), SGScript 발급, `osr-binding-writer`, Secret get 제거 | AF-I3 · I5 구현 때 |
| OpenSphere-Backbone `FABRIC-INSTANCES.md` §7 | "접속 정보 발급"을 AF-I4로 연결 | AF-I4 구현 때 |

## 13. 이 명세가 하지 않는 것

- Governance 배분(사원 · 부서에게 나눠 주기)은 어셈블리 카탈로그와 O-2가 정한다. 이 명세는 어셈블리가 Fabric에서 **받는** 쪽과 인계만 다룬다.
- 백업 · 복원, 남은 PV 재사용, 인스턴스 크기 · 버전 바꾸기의 실행 절차는 별도다(바꾸기 요청은 새 계획으로 받는다는 원칙만 정한다).
- 영역(사원 · 고객) 경계 기술(T-Q2)은 다루지 않는다. 지금은 한 영역으로 본다.
- PostgreSQL 밖의 서비스(RustFS · Valkey · OpenSearch)는 같은 틀을 쓰되, 각 서비스의 발급 템플릿과 한도는 그 패키지에서 정한다.

## 14. v0.1 → v0.2 변경

외부 검토 의견(2026-11-20, 6개)과 그 대조에서 나온 것이다.

| # | 지적 | v0.2 |
|---|---|---|
| 1 | 발급 도우미 권한이 구현 가능한 계약이 아니다. RBAC은 namespace 표시 · 생성 이름을 제한하지 못한다. StackGres 기능을 먼저 보라 | 도우미를 버리고 SGScript로 발급(§9.2). 배치 규칙이 Deployment를 금지한다는 사실도 확인. Secret get 제거, namespace마다 RoleBinding + 허용 표시 + 경계 정책, 노출 방지 시험 |
| 2 | 10분 예약을 모든 단계에서 검사하면 긴 설치가 막힌다. unknown 예약이 만료로 풀리면 안 된다 | `pending`(승인 대기, 10분)과 `held`(시간 만료 없음)를 나눔(§8.2) |
| 3 | 자기 계획의 앞 단계가 바꾼 원장 · fence를 외부 변경으로 오판한다. 원장 전체 번호는 무관한 작업끼리도 막는다 | 대상별 fence · 점유 · 단계별 기대 fence · 같은 단계 재시도 규칙(§8.3) |
| 4 | 로그인 역할 둘의 연결 한도가 합산되지 않는다 | 쉬는 쪽 한도 0, 회전 순서, 인스턴스 연결 예산 식(§7.4 · §9.1) |
| 5 | 보존과 복구 가능성은 다르다 | 보존 기록 단계, "데이터 보존 확인, 복원 미검증", 해체 범위를 이 계획이 만든 것으로 한정(§7.5) |
| 6 | 구현 순서와 계획 단계에 선후 모순이 있다 | I1 → I5 → I3 → I4 → I2 …(§10), 계획에 ④ 받을 곳 준비를 인도 앞에 둠(§6.1) |
| — | 화면과 권한 | 테넌트 관리자 권한을 서버에서 따로 검사(Q7) |
| — | 권고와 결정의 구분 | §11을 결정 · 권고 · 소유자가 정할 것으로 나눔 |

이어서 Codex가 v0.2를 확인했다(2026-11-20). 회전 중 한도 합이 2n이 되는 점, 경계 정책이 namespace 주석을 읽는 방법(`namespaceObject`), update 응답의 노출 범위, `CREATE DATABASE`의 트랜잭션 제약, 승인 직후 만료 경합, 공용 인스턴스 점유와 놓는 시점, 이어서 확인과 다시 실행의 구분, 단계 번호를 바로잡았다.
