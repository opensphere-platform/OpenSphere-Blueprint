# O-2 PFSS 경계 계약 설계 초안 v0.1

**상태:** 설계 초안이다. 구현 승인이 아니다. §8의 결정 사항은 보스 답변 뒤 확정한다.
**작성:** 2026-11-17 · Claude(설계 검토 AI)
**상위 기준:** [OpenSphere 계층 구조 기준선 v0.2](OPENSPHERE-LAYER-BASELINE-v0.2.md) §9 O-2. 관련 결정:
- D-5: 배분 단위
- D-19, D-23: Governance는 사원 영역에 있고, Backbone은 설치·운영·복구만 한다
- D-20: drift 처리
- D-25: 비용은 보여 주기(showback)
**기존 구현 근거:** `OpenSphere-Archive/OpenSphere-shell-foundation`의 다음 파일.
- `deploy/foundation-contracts.yaml`
- `backend/control-plane/reconcile_claim.go`, `reconcile_database_claim.go`, `database_tenants.go`

---

## 1. 문제

PFSS(Foundation)는 DB, 객체 저장, 캐시, 검색, 디렉터리 같은 공유 자원을 실제로 만들고 권한을 투영한다. 기준선 v0.2부터는 이 PFSS를 **두 주체가 함께 움직인다.**

- **Backbone(admin 영역):** 엔진을 설치하고, 용량을 마련하고, 복구한다.
- **Governance(사원 영역):** 어느 사원·부서·프로젝트·서비스에 얼마를 줄지 정한다.

지금 구현은 이 둘이 섞여 있다.

| 현재 구현 | 문제 |
|---|---|
| `FoundationClaim`에 요청자, 수혜 단위, quota, 결재 참조가 없다 | 누구 몫인지, 왜 생겼는지 알 수 없다 |
| 관리자 명령이 Claim의 배치(`placement.set`), quota(`quotaGi` mark), 데이터 삭제(`postgres.database.drop`)를 모두 결정한다 | B-2(Backbone은 사원 권한 내용에 관여하지 않음)와 충돌한다 |
| Claim은 Foundation 네임스페이스에서 도메인 번들과 관리자가 만든다 | 사원 영역의 배분 요청이 들어올 입구가 없다 |
| `context.approvalRef`는 Provider 채택 승인이다 | 사원 신청의 결재와 구별할 필드가 없다 |

## 2. 원칙: 공급과 배분을 나눈다

| 구분 | 질문 | 주체 | 예 |
|---|---|---|---|
| **공급** | 무엇을 얼마나 **제공할 수 있는가** | **Backbone** | PostgreSQL 공유 클러스터 A를 설치한다. 저장 2,000Gi, 연결 500, DB 50개까지 사원 영역에 내놓는다 |
| **배분** | 그중 **누구에게 얼마를 주는가** | **Governance** | 프로젝트 X에 DB 1개, 50Gi, 연결 20을 준다. 기한은 2027-06-30이다 |
| **집행** | 실제로 만들고 지키는가 | **PFSS** | DB와 역할을 생성하고, Secret과 Binding을 발급하고, quota를 강제하고, 사용량을 측정한다 |

**우선순위:** Backbone의 공급 한도가 Governance의 배분보다 우선한다. 배분이 공급을 넘으면 PFSS는 접수하지 않는다. 반대로 Backbone은 배분 내용(누가 받는가)을 읽거나 바꾸지 않는다. 볼 수 있는 범위는 §8 결정 Q-D에서 정한다.

## 3. 두 종류의 배분을 구별한다

Governance가 내리는 배분이 모두 PFSS를 지나는 것은 아니다.

| 종류 | 대상 | 경로 | 예 |
|---|---|---|---|
| **인프라 배분** | PFSS가 만드는 엔진 자원 | Governance → **PFSS Claim** → 엔진 | 프로젝트 DB, 부서 버킷, 검색 인덱스, VM |
| **앱 자격** | Workspace 앱 안의 계정·역할·한도 | Governance → **앱 어댑터**(프로비저닝 계약, 기준선 §6) | 메일함 용량, ERP 역할, 메신저 채널 권한 |

이 문서는 **인프라 배분**의 경계만 다룬다. 앱 자격은 Governance 최소 설계에서 다룬다.

Workspace 앱 **자체**가 쓰는 자원(예: 메신저 서버의 DB)도 PFSS Claim이다. 이것을 누가 만드는지는 §8 결정 Q-A에서 정한다.

## 4. 객체와 소유자

```
 Backbone(admin 신원)                         PFSS(실행)                          Governance(사원 영역 서비스 신원)
 ─────────────────────                        ─────────                           ────────────────────────────────
 FoundationModel   설치/비활성      ──▶  엔진 Operator·Operand
 Instance          클러스터 생성·배치 ──▶  SGCluster 등
 Profile(서명)     기술 규격           ──▶  렌더 규칙
 SupplyPool  [신규] 사원 영역 공급 한도 ──▶  접수 상한 검사 ◀── 읽기(Supply 카탈로그) ── Offering [신규] 서비스 메뉴
                                                                                     Allocation [신규] 단위×풀 quota
                                                                                     Grant      [신규] 서명된 배분 증명
                                           FoundationClaim(확장) ◀── 생성·삭제 ─────── (Grant마다 1개)
                                           FoundationBinding    ── 상태·사용량 ──▶  사용량·showback·drift
```

| 객체 | 범위 | writer | 내용 |
|---|---|---|---|
| FoundationModel, Instance, Profile | 클러스터 | Backbone | 기존 그대로 |
| **SupplyPool** (신규, 클러스터 범위 CR) | 클러스터 | Backbone | 모델, 대상 Instance 목록, 제공 Profile, 한도(저장·연결·개수 등), 과할당 비율(§8 Q-C), 상태(Open / Draining / Closed) |
| **Offering** (신규, Governance 원장) | 사원 영역 | Governance | 어느 풀의 어느 Profile을 어느 단위 유형에 기본 quota 얼마로 제공하는가, 위험 등급, 결재 정책 |
| **Allocation** (신규, Governance 원장) | 사원 영역 | Governance | 단위 × 풀 × quota × 기한 × 결재 이력 |
| **Grant** (신규, 서명 객체) | 사원 영역 | Governance | Allocation의 서명된 요약. PFSS가 오프라인으로 검증한다(§8 Q-B) |
| FoundationClaim (확장) | 사원 영역 네임스페이스 | Governance 서비스 신원(배분 Claim) / Backbone(플랫폼 Claim) | §5 |
| FoundationBinding | Claim 네임스페이스 | PFSS만 | 기존 + 사용량 요약 |

**쓰기 권한(K8s RBAC + admission):**
- Governance 서비스 신원은 **사원 영역 네임스페이스의 FoundationClaim 생성·삭제만** 할 수 있다. Model, Instance, Pool, Binding, Secret에는 쓸 수 없다.
- Backbone은 Pool의 한도와 상태를 바꿀 수 있다. 하지만 **Governance가 만든 Claim의 spec을 수정할 수 없다.** 비상 절차(break-glass, 기준선 O-6)는 별도로 정하고 기록한다.
- admission에서 Claim의 `origin`(platform | allocation)과 생성자 신원이 일치하는지 검사한다.

## 5. FoundationClaim 확장 스키마 (초안)

기존 필드(model, module, request, profileRef, parameters, context)는 유지하고 두 블록을 추가한다.

```yaml
spec:
  origin: allocation            # platform | allocation  (생성자 신원과 일치해야 함)
  poolRef: { name: pg-shared-a, uid: <SupplyPool UID> }
  governance:                   # origin=allocation일 때 필수, platform이면 금지
    grant:                      # Governance 서명 증명 (원문 비밀 없음)
      grantId: <uuid>
      revision: 3               # Allocation 개정 번호
      issuedAt: 2026-11-17T09:00:00Z
      validUntil: 2027-06-30T00:00:00Z
      digest: sha256:...        # 아래 필드 전체의 정규화 해시
      signature: <base64>       # Governance 서명 키 (공개키는 설치 시 Backbone이 PFSS에 등록)
      keyId: gov-2026-11
    beneficiary:                # 누구 몫인가
      unitType: project         # person | department | team | project | service
      unitId: <AD objectGUID 또는 Governance 프로젝트 UUID>
    requester:                  # 누가 요청했는가
      subjectId: <AD objectGUID>
      kind: human               # human | agent
      agentId: <uuid>           # kind=agent일 때
    approvalRef:                # 사원 영역 결재 (기존 context.approvalRef = Provider 채택 승인과 별개)
      approvalId: <uuid>
      policyRevision: 12        # 적용된 Governance 정의 revision
      decision: auto            # auto | approved
    quota:                      # 모델별 스키마. 예: postgres
      storageGi: 50
      connections: 20
    purpose: "프로젝트 X 분석 DB"   # 표시용, 권한 근거 아님
  platform:                     # origin=platform일 때 필수
    installedBy: <Backbone operationId>
    serves: { product: workspace-messenger, component: db }
```

**PFSS 검증 순서(접수와 30초 주기 재조정 모두에서):**
1. `origin`과 생성자 신원이 일치하는가.
2. Grant 서명이 맞는가. `keyId`가 유효하고, `validUntil`이 지나지 않았고, `digest`가 spec과 같은가.
3. `poolRef`의 Pool이 Open이고, 요청 Profile이 그 Pool에서 제공되는가.
4. quota가 Pool 한도 안에 있는가. Pool 전체 배분 합계도 과할당 비율 안에 있는가(§8 Q-C).
5. 배치(어느 Instance에 둘지)는 **PFSS가 Pool 안에서 결정**한다. 지금의 `placement.set` 관리자 명령은 **Pool 구성**(어떤 Instance가 어떤 Pool에 속하는가)으로 옮긴다. dedicated 클러스터는 "단위 하나만 쓰는 Pool"로 표현한다.

실패하면 Claim 상태를 `Rejected(사유)` 또는 `Pending(사유)`로 표시한다. Binding은 발급하지 않는다. 이미 Bound인 Claim의 Grant가 만료되면 `Released` 절차(§6)로 간다.

## 6. 수명주기

| 사건 | Governance | PFSS | Backbone |
|---|---|---|---|
| 신청·승인 | Allocation과 Grant 생성 → Claim 생성 | 검증 → 자원 생성 → Binding 발급 | 관여 없음 |
| quota 변경 | Allocation 개정 → Grant revision 증가 → Claim 갱신 | 변경 적용. 기존처럼 연결 세션은 유지 | 관여 없음 |
| 회수·만료·퇴사 | Claim 삭제 | login role 비활성, Secret 삭제, 데이터는 `released` 표시로 보존(기존 동작) | 관여 없음 |
| **데이터 삭제(purge)** | §8 Q-E | 실행 | §8 Q-E |
| Pool 축소·폐쇄 | 공지를 받아 이전하거나 회수 | Bound Claim이 남아 있으면 폐쇄를 거절(UID precondition 유지) | Pool을 Draining으로 표시 → 남은 Claim이 0이 된 뒤 Closed |
| Governance 장애 | — | 기존 Binding은 계속 동작. 새 Claim은 서명 검증만으로 접수 가능(오프라인 검증의 이점). 만료된 Grant는 그대로 만료 처리 | 관여 없음 |
| Backbone 장애 | 정상 동작 | 정상 동작(PFSS 컨트롤러는 Backbone 프로세스가 아님) | — |

## 7. 사용량·drift

**사용량:**
- PFSS는 Claim마다 사용량(저장, 연결, 객체 수 등)을 Binding status에 주기적으로 기록한다.
- Governance는 이것을 `beneficiary`별로 모아 showback과 quota 경고에 쓴다.

**drift(D-20):**
- PFSS는 엔진의 실제 객체 목록(`osp_*` DB·역할, 버킷, ACL)과 Claim을 대조한다. 엔진 객체에는 `origin`과 `grantId` 표시를 남긴다(기존 COMMENT mark 방식을 확장).
- **Claim이 없는 allocation 객체 = 초과 권한**이므로 자동 회수한다. 데이터 삭제가 아니라 접근 차단이다.
- **Claim은 있는데 객체가 없음 = 부족 권한**이므로 재생성하고 보고한다.
- `origin=platform` 객체는 Governance 대조 대상에서 제외한다.

## 8. 결정이 필요한 사항

| ID | 질문 | 권고안 |
|---|---|---|
| Q-A | Workspace 앱 **자체**의 자원(메신저 서버 DB 등)은 누가 Claim하는가 | 권고는 Backbone(플랫폼 Claim)이었다. **결정은 Governance(D-30)**, §8.2 참조 |
| Q-B | PFSS가 Governance 배분을 어떻게 믿는가 | **서명된 Grant의 오프라인 검증 + 주기 재검증.** Governance 장애 때도 기존 Binding과 검증이 유지된다. 공개키는 설치 시 Backbone이 등록하고, 키 교체는 Governance와 Backbone의 합의 절차로 한다 |
| Q-C | 배분 합계가 공급을 넘을 수 있는가(과할당) | **Backbone이 Pool마다 비율을 정한다.** 저장은 1.0(과할당 없음), 연결은 1.5처럼 정하고, 실제 사용량은 PFSS가 강제한다 |
| Q-D | Backbone이 단위별 사용량을 볼 수 있는가 | **Pool 단위 합계만 본다.** 누가 얼마를 쓰는지는 사원 영역 정보다(B-3). 용량 계획에는 Pool 합계와 추세로 충분하다 |
| Q-E | 사원 영역 데이터의 영구 삭제(purge)는 누가 결정하는가 | **Governance가 결정한다(보존 정책 + 결재). PFSS가 실행한다.** Backbone은 빈 Pool만 폐쇄할 수 있다. 지금의 `postgres.database.drop` 관리자 명령은 platform Claim에만 쓰도록 좁힌다 |

### 8.1 보스 결정 (2026-11-17)

| ID | 결정 | 권고와 같은가 |
|---|---|---|
| D-30 (Q-A) | **Workspace 앱 자체의 기반 자원도 Governance가 Claim하고 소유한다** | 권고와 다름 |
| D-31 (Q-B) | **서명된 Grant의 오프라인 검증 + 주기 재검증** | 같음 |
| D-32 (Q-C) | **과할당 비율은 Backbone이 공급 풀마다 설정**하고, 실제 사용량은 PFSS가 강제한다 | 같음 |
| D-33 (Q-E) | **사원 영역 데이터의 영구 삭제는 Governance가 결정하고 PFSS가 실행**한다. Backbone은 빈 공급 풀만 폐쇄할 수 있다. 관리자 삭제 명령은 platform Claim에만 허용한다 | 같음 |
| 미확정 (Q-D) | Backbone이 볼 수 있는 사용량 범위. 권고는 공급 풀 합계만 | 묻지 않음, 권고 유지 |

### 8.2 D-30이 바꾸는 것

Workspace 앱의 기반 자원은 **"업무 서비스" 단위(D-5)에 대한 Governance 배분**이 된다. 예: `beneficiary.unitType: service`, `unitId: workspace-messenger`. 그 결과 다음이 달라진다.

1. **설치 절차가 두 영역에 걸친다.**
   1. Backbone이 앱을 설치하려 한다.
   2. 앱의 기반 자원 요구(DB, 버킷 등)가 Governance에 **서비스 배분 요청**으로 올라간다.
   3. Governance가 결재·배분하고 Grant를 발급한다.
   4. PFSS가 자원을 만든다.
   5. Backbone이 앱 워크로드를 Binding에 연결해 기동한다.
   - Backbone은 Governance 결재가 끝날 때까지 기다린다(설치 상태 `AwaitingAllocation`).
2. **`origin=platform` Claim은 사원 영역 자체를 세우는 데 필요한 최소 구성요소로 줄어든다.**
   - **Governance 자신의 저장소**: 자기 자신에게 배분할 수 없는 순환을 피하기 위함이다.
   - **AD DC와 SSO 중계자**: Governance가 의존하는 신원 기반이다.
   - **Backbone 소유 구성요소**
   - 이 목록을 **사원 영역 부트스트랩 집합**으로 고정하고, 그 밖의 Claim은 모두 allocation으로 한다.
3. **서비스 배분의 결재선이 필요하다.** 앱 설치에 따른 기반 자원은 사람마다 신청하는 것이 아니다. 따라서 Governance 정의에 "서비스 단위 배분" 정책을 둔다. 예: 회사 IT 관리 역할의 승인, 정해진 Profile 범위 안이면 자동 승인. 그래야 설치가 막히지 않는다.
4. **삭제와 폐기:** 앱을 제거하면 Backbone은 워크로드만 내린다. 앱 데이터의 보존과 삭제는 D-33에 따라 Governance가 정한다. Backbone이 앱 제거와 함께 데이터를 지울 수 없다.

## 9. 기존 코드에 미치는 영향 (구현 시)

| 대상 | 변경 |
|---|---|
| `deploy/foundation-contracts.yaml` | FoundationClaim에 `origin`, `poolRef`, `governance`, `platform` 추가. SupplyPool CRD 신설. Binding status에 사용량 추가 |
| `reconcile_database_claim.go` 배치 순서 | 1순위 "관리자 placement"를 "Pool 구성 안에서 PFSS 결정"으로 바꾼다. "dedicated는 관리자가 준다"를 "dedicated Pool"로 바꾼다 |
| `database_tenants.go` quota mark | `quotaGi` mark를 Grant의 quota로 바꾼다. **실제 크기 강제는 현재 미확인이다**(조사에서 COMMENT 기록만 확인). 집행 방식을 정해야 한다 |
| `database_requests.go` 관리자 명령 | `placement.set`은 Pool 구성으로, `database.drop`은 platform Claim 한정으로 축소 |
| admission | origin과 생성자 일치, Governance 신원의 쓰기 범위 제한, Grant 서명 검증 |
| 엔진별 Provider(RustFS, Valkey, OpenSearch) | 같은 확장을 적용한다. 지금 Pending인 소비자 Claim 경로(v1.1)를 이 계약으로 연다 |

## 10. 이 설계가 하지 않는 것

- 앱 자격(메일함, ERP 역할 등)의 경계. Governance 최소 설계에서 다룬다.
- 판단 엔진 선정과 Governance 원장의 상세 스키마.
- 비용 단가 모델. Pool 공급 원가에서 사원 영역 단가를 매기는 방식은 showback 설계에서 다룬다.
- 기존 Foundation 코드의 실제 수정이나 운영 변경.
