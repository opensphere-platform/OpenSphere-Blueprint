# 어셈블리 · Fabric 협력 공급 명세 v0.1

**상태:** 초안. Codex 검토 두 차례와 소유자 결정 셋(Q1 · Q2 · Q3, 2026-11-20)을 반영했다. 결정 대장(D-번호)에는 아직 올리지 않았다. 구현 승인이 아니다.
**작성:** 2026-11-20 · Claude(초안) · Codex(검토), 소유자 요구 반영
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
   ├─ ③ 발급               Claim → 공급 결과                    DB mail_store · 역할 mail_stalwart
   ├─ ④ 인도               Binding · Link                       접속 Secret → 엔진 namespace
   └─ ⑤ 엔진 · 초기화 · 적합성 시험
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
| **예약** | 계획 검토가 끝나 승인을 묻기 직전에, 그 계획이 쓸 용량(인스턴스 수 · 발급 수 · 연결 예산 · 볼륨)을 원장에 잡아 두는 것. 만료 시각이 있다 | 없음(신설) |

> **이름 정리:** 지금 문서 · 화면의 "배치 규칙"(OSR materializer profile: 만들 수 있는 객체 종류 · 최대 개수 · 권한)은 **설치 허용 범위**로 부른다. "배치(placement)"는 Claim의 공급 결과를 **어느 인스턴스에 둘지**만 뜻한다. 코드 · 계약 식별자(`profile`, `provider.stackgres-pg`)는 그대로 두고, 문서 · 화면 말만 바꾼다(§11 Q6).

## 4. 원칙

| ID | 원칙 |
|---|---|
| **AF-1** | **필요는 어셈블리 정의에만 적는다.** 엔진 패키지가 스스로 Claim을 렌더하지 않는다(G2 우회 차단). 엔진 디스크립터에는 "받을 수 있는 인도 형태"만 적는다 |
| **AF-2** | **해석은 Core가 결정적으로 하고 결과를 고정한다.** 같은 정의 · 같은 잠금 파일 · 같은 원장 generation이면 같은 계획이 나온다. 계획에 없는 객체는 실행부가 만들지 않는다 |
| **AF-3** | **어셈블리 계획 하나에 인증 앱 코드 한 번(소유자 결정 2026-11-20).** 서비스 설치 · 인스턴스 생성 · 발급 · 인도 · 엔진 설치가 각각 단계로 화면에 보이고, 승인은 그 단계 목록 전체의 digest에 묶인다. 승인한 계획 밖의 동작은 하나도 실행되지 않는다. 재개 · 취소 · 해체 · 계획 변경은 각각 새 승인이다 |
| **AF-4** | **Fabric 서비스 켜기도 계획에 들어간다(소유자 결정 2026-11-20).** 필요한 서비스가 꺼져 있으면 ①단계로 함께 계획한다. 이것이 "Fabric이 자동으로 협력한다"의 뜻이다. 단, 그 서비스가 채널 목록에서 해석되고 설치 가능 판정을 받았으며, 바탕 operator와 저장 프로필이 준비된 경우만이다 |
| **AF-5** | **원장 · 예약 · 실행부는 하나.** 수동 경로와 자동 경로는 같은 인스턴스 계획 형식 · 같은 원장 · 같은 예약 · 같은 실행부를 쓴다 |
| **AF-6** | **쓰이는 자원은 지울 수 없다.** 소유자가 누구든 살아 있는 Claim · Binding · Link 또는 진행 중인 예약이 가리키는 인스턴스와 공급 결과는 지우기를 거절한다(T-4). 어셈블리 소유 자원은 어셈블리 해체로만 지운다 |
| **AF-7** | **데이터는 자동으로 지우지 않는다.** 실패 보상과 해체는 **접근**(역할 · 자격 · 연결 · 네트워크 허용)만 거둬들인다. DB와 PV는 남는다. 영구 삭제는 별도 결정이다(D-33, §7.5) |
| **AF-8** | **한도는 실제로 지키는 것만 약속한다.** 지킬 수 없는 한도는 제공하지 않는다고 적는다(§9). 표식만 남기는 한도는 두지 않는다 |
| **AF-9** | **실행부는 원장에 쓰지 않는다.** 실행부 → Core 결과 보고 → Console이 원장에 투영한다(MODULE-EXECUTOR §3). 두 DB는 operationId · 계획 generation · 최종 영수증으로 맞춘다(OSR §11) |
| **AF-10** | **결과를 모르면 멈춘다.** `unknown`은 자동 재실행 · 예약 해제 · 보상을 하지 않고 운영자 확인을 기다린다 |

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
          connections: 20                   # 이 Claim 역할의 동시 연결 상한
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
  ledger:     { generation: 1842 }          # 해석할 때 읽은 원장 상태
```

## 6. 해석

### 6.1 해석 규칙 (요구 → 단계 DAG)

해석은 **누적**한다. 요구마다 필요한 단계를 모두 더하고, 같은 단계는 하나로 합친다(서비스 켜기 · 인스턴스 생성은 여러 요구가 함께 기댄다).

| 순서 | 판단 | 더하는 단계 |
|---|---|---|
| 1 | 서비스가 설치되어 있지 않다 | ① 서비스 켜기(스토어 설치와 같은 계획 형식). 사전조건: 바탕 operator Ready, 저장 프로필 존재 |
| 2 | 자리 정하기(§6.2) 결과 새 인스턴스가 필요하다 | ② 인스턴스 생성(등급 = 그 인스턴스를 쓰는 요구들의 `plan.min` 중 rank 최대, 볼륨 = §9.1의 식) |
| 3 | 언제나 | ③ Claim 기록과 발급(DB · 연결 전용 역할, T-3) |
| 4 | 언제나 | ④ 인도(Binding · Link, 접속 Secret, 네트워크 허용) |
| 5 | 구성요소마다 | ⑤ 엔진 설치(materializer profile) · 초기화 |
| 6 | 마지막 | 적합성 시험 |

의존: ①→②→③→④→⑤→시험. 같은 층의 단계(예: 두 구성요소의 ③)는 서로 기대지 않는다.

### 6.2 자리 정하기 (placement)

**자리는 설치하는 관리자가 고른다(소유자 결정 2026-11-20).** 어셈블리 정의는 허용하는 자리(`allow`)와 제안(`suggest`)만 적는다. 관리자는 계획 검토 화면에서 요구마다(또는 어셈블리 전체에 한 번) 허용된 자리 가운데 하나를 고르고, 그 선택은 잠금 파일 `choices`에 고정된다. 화면은 처음에 제안값을 골라 둔다. 자리를 바꾸면 계획을 다시 만든다.


| 값 | 결과 |
|---|---|
| `assembly` | 이 어셈블리가 소유한 그 서비스의 인스턴스 `<어셈블리>-<서비스>`가 있으면 그 안에 발급한다. 없으면 ②로 만든다. 한 어셈블리 안의 구성요소들이 인스턴스 하나를 함께 쓰고, DB와 역할은 Claim마다 따로다 |
| (공통) 기존 인스턴스의 여유 부족 | 고른 자리에 이미 있는 인스턴스가 등급 · 남은 발급 수 · 연결 예산 · 볼륨 가운데 하나라도 모자라면 **계획을 만들지 않고 "인스턴스 여유 부족"으로 멈춘다.** v0.1은 자동 확장을 하지 않는다. 다른 자리를 고르거나, 확장은 별도 계획으로 한다(§11.2 Q9) |
| `dedicated` | 이 요구만을 위한 인스턴스 `<어셈블리>-<요구>`를 ②로 만든다 |
| `shared` | 관리자가 **공용**으로 표시한 인스턴스에서 고른다. 후보는 "등급 rank ≥ 요구 하한, 남은 발급 수 · 연결 예산 · 볼륨 여유가 충분"인 것이고, **남은 발급 수가 가장 많은 것, 같으면 인스턴스 이름 사전순**으로 고른다. 후보가 없으면 계획을 만들지 않고 "공용 인스턴스 없음"으로 멈춘다(자동으로 만들지 않는다) |

- 정의가 `allow`에 넣지 않은 자리는 고를 수 없다. 공용 인스턴스가 하나도 없으면 화면에서 `shared`를 고를 수 없게 하고 이유를 적는다.
- 인스턴스 이름이 이미 다른 소유자의 것이면 계획 단계에서 거절한다.
- 같은 정의 · 같은 잠금 파일 · 같은 원장 generation이면 같은 결과가 나와야 한다(AF-2). 시험 벡터로 고정한다.

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
| Resolved | 잠금 파일 · 단계 DAG 확정, 원장 generation 기록 | 관리자 검토 시작 |
| AwaitingApproval | 계획 digest 확정, 예약 `pending`(§8.2). 관리자가 등급 · 크기를 바꾸면 새 Draft | 승인 → Reserved. 예약 만료 · 원장 generation 변경이면 Superseded |
| Reserved | Core 승인 기록이 예약 ID를 담고, Console이 예약을 `held`로 바꿈(§8.2) | 실행 시작 |
| Running | 실행부가 단계를 차례로 실행 | 전부 성공 → Succeeded. 실패는 §7.3의 단계별 규칙. 결과 불명 → RecoveryRequired |
| Blocked | 단계 실패(`refused`) | 관리자 재개(같은 계획, 새 승인) 또는 취소(보상 실행 후 Cancelled) |
| RecoveryRequired | 단계 결과 `unknown` | 운영자 확인 기록 후에만 Blocked 또는 Running |
| Succeeded | 적합성 시험 통과 | 어셈블리 상태 Active, Governance 인계(§7.6) |

### 7.2 어셈블리 추가

| 단계 | 누가 | 하는 일 | 기록 |
|---|---|---|---|
| 1 선택 | 테넌트 관리자 권한을 가진 관리자(§11 Q7) | 스토어의 어셈블리 정의(`assembly.mail`)를 고른다 | — |
| 2 해석 | Core | §6 규칙으로 잠금 파일 · 단계 DAG를 만든다 | Core 계획(`opensphere.osr-assembly-plan/v1`, 불변) |
| 3 검토 | 관리자 | 요구마다 자리(§6.2) · 등급 · 크기를 허용 범위 안에서 고르고, 단계 목록을 본다: 켜질 서비스, 만들 인스턴스 · 등급 · 볼륨, 발급할 DB · 역할, 생길 연결과 네트워크 허용, 설치할 엔진. 고칠 때마다 계획을 다시 만든다 | — |
| 4 예약 | Console | 승인을 묻기 직전에 용량을 `pending`으로 예약(만료 10분). 예약하지 못하면 코드를 묻지 않는다 | 원장 예약 |
| 5 승인 | 관리자 본인 | 인증 앱 코드 한 번(옆 패널, AF-3). 승인 기록은 계획 digest와 예약 ID를 함께 담는다 | Core 승인 기록 |
| 6 실행 | 실행부 | 단계마다: Core에서 승인된 계획을 직접 받음 → Core에서 단계 시작과 fence를 원자적으로 얻음(§8.3) → 적용 → 확인 → Core에 결과 보고 | Core 단계 결과 |
| 7 투영 | Console | Core의 단계 결과를 원장에 옮긴다(인스턴스 · Claim · 공급 결과 · Binding · Link) | 원장 |
| 8 시험 | 실행부 · Core | 정의의 적합성 시험 | 어셈블리 Active / Degraded |
| 9 인계 | Core · Console | 리소스 유형 · 용량 · 정의 generation을 Governance에 인계(D-82, 카탈로그 §1) | 인계 기록 |

계획은 불변이다. 요구 추가 · 제거, 엔진 · 서비스 버전 올리기, 등급 변경은 **새 어셈블리 계획**(현재 상태와의 차이)으로 하고 같은 승인을 다시 받는다.

### 7.3 실패와 보상

- 단계 실패는 테넌트 명세 §7.1의 구분을 따른다.

| 실패한 단계 | 처리 |
|---|---|
| ①② 서비스 켜기 · 인스턴스(Provisioning) | Blocked. 재개 또는 취소(보상) |
| ③④ 발급 · 인도(Binding) | 실패한 Link만 같은 계획 안에서 다시 시도, 3회 실패하면 Blocked |
| ⑤ 초기화(Initializing) | 그 구성요소만 다시 초기화(같은 계획, 멱등 단계). 3회 실패하면 Blocked |
| 적합성 시험(Verifying) | Initializing으로 되돌리고 보고. 3회 실패하면 Blocked |

- 이미 끝난 단계의 결과는 원장에 남는다. 다시 시도는 같은 단계 멱등 키(§7.7)로만 한다.
- **재개:** 같은 계획을 이어서 실행한다. 원장 generation이 바뀌었으면 재개하지 않고 새 계획을 만든다.
- **취소(보상):** 끝난 단계를 역순으로 되돌리되 **접근만** 거둔다. 인도 철회(Secret 삭제 · 네트워크 허용 철회) → 역할 비활성 · 세션 종료 → Claim 해제 → 새로 만든 인스턴스는 정지(SGCluster 삭제, PV만 남음). 데이터는 지우지 않는다(AF-7). 테넌트 명세 §7.1의 "단계 롤백(Claim 회수)"은 이 보상을 뜻하도록 함께 고친다.
- 결과가 `unknown`이면 RecoveryRequired로 두고 보상도 하지 않는다(AF-10). 예약은 유지한다.
- 실행부가 적용에 성공했지만 보고가 끊기면, 실행부는 표식(ConfigMap)으로 같은 operation을 이어 확인 · 보고한다. Core가 기록했는데 Console 투영이 끊기면 Console이 Core의 기록을 다시 읽어 이어 간다(MODULE-EXECUTOR §3과 같다).

### 7.4 인도 (Binding · Link)

- **형태:** 엔진 namespace에 Secret `<어셈블리>-<구성요소>-<요구>`(host · port · database · username · password · sslmode · CA). 엔진 materializer profile이 env로 연결한다.
- **자격 원문:** 인스턴스의 발급 도우미(§9.2)가 만들고 그 Secret에만 쓴다. 공용 실행부 · 원장 · Core · Console · 로그는 원문을 받지 않는다. Binding에는 주소와 Secret 참조(namespace · 이름 · UID)만 둔다.
- **쓰기 주체:** 발급 도우미. 계획이 이름으로 적은 엔진 namespace 하나에, 그 계획의 Secret 이름 하나만 쓸 수 있다(§9.2).
- **네트워크:** 연결 객체에서 "엔진 namespace의 그 워크로드 → 인스턴스 5432"만 허용하는 정책을 양쪽 namespace에 만든다(T-5).
- **회전:** 같은 역할의 비밀번호를 바꾸면 옛 자격이 즉시 무효가 되므로, Claim마다 **로그인 역할 두 개**(`<역할>_a` · `<역할>_b`, 같은 NOLOGIN 소유 역할의 멤버)를 번갈아 쓴다. 쉬는 쪽에 새 비밀번호 → Secret 갱신 → 엔진 재시작 · 접속 확인 → 옛 쪽 `NOLOGIN` · 세션 종료. Link가 수행한다(테넌트 명세 §9.3).
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
| 6 인스턴스 정지 | 어셈블리 소유 인스턴스만, 다른 살아 있는 Claim이 없을 때 SGCluster 삭제. **StackGres가 PVC를 지우고 Retain PV만 남는다** | SGCluster · PVC 없음, PV Released | 멈춤 |
| 7 서비스 | 다른 소유자가 없으면 "내릴 수 있음"으로 표시만 한다. 자동으로 내리지 않는다 | — | — |

- 해체 후 같은 이름으로 다시 만들어도 **새 빈 볼륨**이다. 남은 PV를 다시 붙이는 복원은 이 명세의 범위가 아니고 운영자 절차다(백업 · 복원 설계에서 정한다).
- 영구 삭제(남은 DB · PV 파기)는 D-33의 결정이다. 어셈블리 해체 승인에 포함하지 않는다.

### 7.6 Governance 인계

- 인계하는 것: 리소스 유형(카탈로그 §2), 용량, 어셈블리 정의 generation, 활성 조건(Active일 때만 새 배분 가능).
- 어셈블리가 Degraded면 새 배분을 막고 기존 배분은 유지한다. 해체 결정 시 새 배분을 막고, 기존 배분은 Governance가 회수한 뒤 해체 2단계로 간다.

### 7.7 계획 스키마의 필수 항목 (`opensphere.osr-assembly-plan/v1`)

| 항목 | 내용 |
|---|---|
| 식별 | 계획 ID, 어셈블리 이름 · UID · 정의 generation, 계획 generation, 이전 계획(대체한 것) |
| 잠금 파일 | §5.3 전체(정의 · 서비스 · 엔진 · 설치 허용 범위 · 렌더러 digest, 선택값, 원장 generation) |
| 예약 | 예약 ID, 항목별 몫 |
| 단계 | 단계 ID, 종류(①~⑤ · 시험), 의존 단계 ID, 대상(설치본 ID · 인스턴스 이름 · 이미 있는 대상은 UID · fence), 만들 객체 목록(apiVersion · kind · namespace · name), Claim ID · Binding ID · Link ID, **멱등 키 = 계획 ID + 단계 ID** |
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
  1. Console이 원장에 예약 `pending`(계획 digest, 만료 10분)을 만든다. 장부가 모자라면 여기서 거절하고 코드를 묻지 않는다.
  2. Core 승인 기록은 그 예약 ID를 담는다. Core는 예약 ID 없는 보호 계획을 승인하지 않는다.
  3. Console이 Core의 승인을 읽어 예약을 `held`로 바꾼다. 이 단계가 끊기면 Console이 Core 기록을 다시 읽어 이어 간다(멱등). 예약이 이미 만료됐으면 `held`로 바꾸지 않고, 계획은 실행을 시작할 수 없다(Superseded).
  4. 단계 결과가 원장에 투영되면 예약이 실제 사용으로 바뀐다. 취소 · 거절이면 풀고, `unknown`이면 유지한다.

### 8.3 실행 직전 재검사

- **예약 확인:** Console은 예약을 `held`로 바꾼 뒤 Core에 "이 계획의 예약 ID는 held"를 기록한다(멱등). Core의 단계 시작 경로는 그 기록이 없거나 예약 만료 시각이 지났으면 시작을 거절한다. 실행을 허용하는 쪽(Core)이 예약 확정을 직접 확인한다.
- fence의 정본은 Core가 갖는다. 실행부는 단계를 시작할 때 Core의 시작 경로(지금 `executor_start`)로 **"이 계획의 대상(설치본 · 인스턴스 이름)의 fence가 계획에 적힌 값과 같으면 하나 올리고 시작을 기록"**을 원자적으로 얻는다. Console이 넘기는 값은 믿지 않는다(MODULE-EXECUTOR §3).
- 얻지 못하면 그 단계를 `refused`(StalePlan)로 보고한다. 같은 인스턴스를 두 계획이 동시에 만들거나 지우는 일은 이 fence로 하나만 통과한다.

## 9. 한도와 실행부 권한

### 9.1 실제로 지키는 한도

| 한도 | 어떻게 지키나 | v0.1 |
|---|---|---|
| 인스턴스 수 | 예약 + 설치 허용 범위의 `max` + 실행부 재검사 | 지킨다 |
| 인스턴스 볼륨 | SGCluster 볼륨 크기(PVC). 크기 = max(등급 기본값, 그 인스턴스를 쓰는 Claim `sizeGiB` 합 × 1.2), 설치 허용 범위의 상한 안. 합이 상한을 넘으면 해석 단계에서 거절 | 지킨다(인스턴스 전체) |
| 인스턴스당 발급 수 | 예약 + 실행부 재검사 | 지킨다 |
| Claim 역할의 새 연결 수 | 로그인 역할의 `CONNECTION LIMIT`(PostgreSQL이 새 연결을 거절한다. superuser · 이미 열린 세션에는 적용되지 않으므로 Claim 역할은 superuser가 아니다) + 인스턴스 연결 예산(`connectionsPerInstance`) 예약 | 지킨다(새 연결 기준) |
| **DB별 저장량** | PostgreSQL에 DB 단위 크기 제한이 없다. PVC 크기는 DB별 한도가 아니다 | **제공하지 않는다.** 요구의 `sizeGiB`는 인스턴스 볼륨 합산에만 쓰고, 화면에 "DB별 저장 한도 없음"으로 적는다. DB별 한도가 필요하면 `dedicated`를 쓴다 |

### 9.2 발급 · 인도의 권한 경계

발급 · 인도는 지금 실행부(설치본 namespace 안의 객체만)를 넘어선다. 인스턴스의 관리 자격을 공용 실행부에 주지 않는다.

| 구성 | 내용 |
|---|---|
| **발급 도우미** | 인스턴스마다 하나, 그 인스턴스 namespace 안에서 도는 작은 워크로드(Fabric 서비스 패키지가 렌더, 설치 허용 범위가 허용). 인스턴스 관리 자격 Secret을 읽을 수 있는 것은 이 도우미뿐이다 |
| 받는 요청 | 실행부에게서 operationId · 단계 ID만 받는다. 도우미는 **Core에서 그 operation의 승인된 계획을 직접 읽어**(실행부와 같은 방식, 도우미 전용 서비스 토큰) Claim ID · 대상 인스턴스 UID · fence · 역할 이름 · DB 이름을 확인한다. 계획에 없는 요청은 거절한다 |
| 하는 일 | 고정 템플릿 문장만: CREATE ROLE … NOLOGIN(소유) · LOGIN CONNECTION LIMIT n(로그인 둘), CREATE DATABASE … OWNER, ALTER ROLE … NOLOGIN, pg_terminate_backend(그 역할의 세션만). 식별자는 규칙(`^[a-z][a-z0-9_]{2,40}$`)을 통과한 계획 값만. 임의 SQL · superuser · CREATEROLE 부여 없음 |
| 접속 Secret | 도우미가 만든 비밀번호를 **대상 엔진 namespace의 Secret 하나**에 쓴다. 쓸 수 있는 곳은 실행부가 엔진 설치 단계(승인된 계획)에서 그 namespace에 붙인 주석 `opensphere.io/osr-binding-allow=<Secret 이름 목록>`과 라벨 `opensphere.io/osr-binding-source=<인스턴스 UID>`가 가리키는 이름뿐이다. ValidatingAdmissionPolicy가 요청자(도우미 ServiceAccount) · 대상 namespace의 라벨과 주석 · Secret 이름을 대조한다. 도우미 권한: 그 라벨을 가진 namespace의 Secret create · patch · delete(get · list 없음) |
| 네트워크 | 양쪽 namespace의 NetworkPolicy는 실행부가 Link 짝대로 만든다(지금도 있는 권한) |

- 승인된 계획이 대상을 정하고, 대상 namespace의 허용 표시도 그 계획을 실행한 실행부가 붙인다. 도우미는 Core의 계획과 namespace의 허용 표시가 모두 맞을 때만 쓴다. 표시만 위조하거나 계획만 위조해서는 쓸 수 없다.
- 이 권한은 서명된 설치 허용 범위 개정(예: `provider.stackgres-pg` 0.4.0)과 운영자가 적용하는 ClusterRole · 경계 정책 개정으로만 생긴다. 실행부와 도우미가 스스로 만들지 않는다(MODULE-EXECUTOR §4).

## 10. 지금 구현에서 바뀌는 것 (OpenSphere-Backbone)

| 단계 | 내용 | 기존 위치 |
|---|---|---|
| AF-I1 | 원장: `osr.instances`에 `owner` · `plan` · `shared`, 새 표 `osr.claims` · `osr.provisioned` · `osr.bindings` · `osr.links` · `osr.reservations`, 원장 generation | `infra/osr/006-instances.sql` 다음 변경 |
| AF-I2 | 등급 카탈로그: `provider.postgres` 디스크립터 `offers.plans`, 렌더러가 등급별 SGInstanceProfile. 수동 인스턴스 만들기 화면에 등급 고르기 | 렌더러, Fabric 화면 |
| AF-I3 | 설치 허용 범위 0.4.0: 등급별 객체 수, 발급 도우미 워크로드와 그 권한(§9.2), 경계 정책 개정, Core의 도우미 읽기 경로 | 배치 규칙 0.3.0 |
| AF-I4 | 발급 · 인도(수동 경로 먼저, AF-I5 예약 · 재검사가 먼저 끝난 뒤): Fabric 화면 "접속 정보 발급"(`db.connection.issue`) = Claim(owner admin) → 공급 결과 → Binding. 같은 실행부 동작을 어셈블리가 재사용 | 실행부, FABRIC-INSTANCES §7 |
| AF-I5 | 예약 · 재검사: 수동 인스턴스 계획에도 적용 | Console · Core · 실행부 |
| AF-I6 | 어셈블리 정의 `requires` · 잠금 파일 · 해석기(시험 벡터) · `osr-assembly-plan/v1` · 상태 머신 | OSR 계약, Core |
| AF-I7 | 실행부 단계 실행 · 재개 · 보상 · 해체 | 실행부 |
| AF-I8 | 화면: 어셈블리 계획 검토 → 옆 패널 승인, Fabric 화면 소유자 · 사용 Claim 열, 쓰이는 자원 지우기 막기 | Console |
| AF-I9 | 격리 시험: 만들기 → 시험 → 실패 주입 → 재개 · 취소 → 해체 → 데이터 보존 확인 → 운영 | 격리 환경 |

AF-I1~I5는 어셈블리 없이도 수동 경로를 완성한다(접속 정보 발급, 등급, 예약). 그다음 AF-I6~I9가 자동 경로를 얹는다.

- 순서(Codex 의견 반영): AF-I1 → AF-I5(예약 · 재검사) → AF-I4(발급) → AF-I2 · I3. 사용 중 자원 지우기 막기와 실패 · 재개 · 보존 시험은 각 기능을 처음 낼 때 함께 넣는다(마지막에 몰지 않는다).
- **첫 작은 납품:** 기존 PostgreSQL 인스턴스 하나에 소유자 · 목적을 기록한 DB와 접속 자격 하나를 발급해 시험용 소비자에 연결한다. 원장에 관계가 남는지, 사용 중 인스턴스 지우기가 거절되는지, 접근을 거둬도 데이터가 남는지 확인한다.

## 11. 소유자 결정

### 11.1 정해진 것 (2026-11-20)

| ID | 질문 | 결정 | 비고 |
|---|---|---|---|
| Q1 | 발급 자리 | **설치하는 관리자가 고른다.** 정의는 허용 자리와 제안만 적는다(§6.2) | Claude는 `assembly` 기본값을, Codex도 동의했다. 소유자는 정의가 정할 일이 아니라 설치 관리자의 선택이라고 정했다. 화면 제안값으로만 남긴다 |
| Q2 | 꺼진 서비스 켜기 | **어셈블리 계획에 포함**(AF-4) | 단계로 따로 보여 준다 |
| Q3 | 승인 단위 | **계획 하나에 코드 한 번**(AF-3) | Codex는 보호 동작마다 코드를 권했다. 소유자는 계획 단위를 골랐다. 모든 보호 동작이 승인 화면과 digest에 이름으로 드러나는 것이 조건이다 |

### 11.2 아직 정하지 않은 것 (권고대로 진행 예정, Codex 동의)

| ID | 질문 | 권고 |
|---|---|---|
| Q4 | 등급의 소유 | 패키지 서명 카탈로그, 설치 허용 범위와 교집합 |
| Q5 | 해체 시 데이터 | 보존(역할 비활성 · DB released · PV Retain). 영구 삭제는 D-33, 복원은 운영자 절차 |
| Q6 | 이름 | "배치 규칙" → "설치 허용 범위", "배치"는 발급 자리만(문서 · 화면, 식별자는 유지) |
| Q7 | 어셈블리를 고르는 화면과 권한 | 화면은 지금 Console 스토어, 권한은 "테넌트 관리자" 역할로 분리해 지금은 Console 관리자에게 준다. 회사 관리 콘솔(D-82 · D-84)이 생기면 화면을 옮긴다 |
| Q8 | DB별 저장 한도 | v0.1에서는 제공하지 않음(§9.1). 필요하면 `dedicated`. 화면은 공용 자리를 고르기 전에 이 사실을 보여 준다 |
| Q9 | 기존 인스턴스의 여유가 모자랄 때 | v0.1은 멈추고 알린다(자동 확장 없음). 확장은 별도 계획으로 승인(Codex 질문) |
| Q10 | 첫 출시의 완료 기준에 실제 복원(남은 PV에서 데이터 되살리기) 성공을 넣을지 | 넣지 않는다. 복원은 백업 · 복원 설계에서 다룬다. 단 해체 후 PV가 남는 것은 시험으로 확인한다(Codex 질문) |

## 12. 다른 문서에 반영할 것

- 테넌트·어셈블리 명세 §7.1: Provisioning 실패 시 "단계 롤백(Claim 회수)" = 접근 보상(§7.3)으로 뜻을 적고, Binding · Initializing · Verifying 실패 처리를 §7.3 표와 맞춘다. T-6의 "어셈블리 승인으로 갈음"이 연결에만 해당함을 적는다. §10 해체 절차와 §7.5의 단계 번호를 맞춘다.
- MODULE-EXECUTOR: 단계 시작의 원자적 fence, 발급 도우미와 그 Core 읽기 경로.
- OSR v0.2: assembly artifact에 `requires` · 잠금 파일, 디스크립터 `offers`, 설치 허용 범위의 인도 권한.
- 용어 대응표: 설치 허용 범위 · 배치 · Claim · 공급 결과 · Binding · Link.
- OpenSphere-Backbone `FABRIC-INSTANCES.md` §7: "접속 정보 발급"을 AF-I4로 연결.

## 13. 이 명세가 하지 않는 것

- Governance 배분(사원 · 부서에게 나눠 주기)은 어셈블리 카탈로그와 O-2가 정한다. 이 명세는 어셈블리가 Fabric에서 **받는** 쪽과 인계만 다룬다.
- 백업 · 복원, 남은 PV 재사용, 인스턴스 크기 · 버전 바꾸기의 실행 절차는 별도다(바꾸기 요청은 새 계획으로 받는다는 원칙만 정한다).
- 영역(사원 · 고객) 경계 기술(T-Q2)은 다루지 않는다. 지금은 한 영역으로 본다.
- PostgreSQL 밖의 서비스(RustFS · Valkey · OpenSearch)는 같은 틀을 쓰되, 각 서비스의 발급 템플릿과 한도는 그 패키지에서 정한다.
