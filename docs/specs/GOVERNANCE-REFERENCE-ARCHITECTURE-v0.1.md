# Governance 참고 아키텍처 v0.1

> **2026-11-20 후속 방향:** [OS Govern 업스트림 기반 개발 전략](OS-GOVERN-UPSTREAM-STRATEGY-v0.1.md)을 함께 읽는다. 전면 자체 구현보다 기반 제품 재사용·확장을 우선 평가하며 midPoint 참고 전용·도입 배제는 재검토 대상이다. 기존 논리 구성요소는 새로 만들 코드 목록이 아니다. 제품 선정·D-4 정식 대체·운영 전환은 아직 확정하지 않았다.

**상태:** 초안. 결정 대장(D-번호)에 반영되지 않은 조사·제안이다. 제품 선정이 아니다.
**작성:** 2026-11-17 · Claude(설계 검토 AI), 사용자 질문 반영
**질문:** 테넌트로 구성된 제품을 거버넌스로 제어하는 데 참고할 만한 표준화된 제품이 있는가?
**상위 기준:**
- [테넌트·어셈블리 구성 명세](TENANT-ASSEMBLY-SPEC-v0.1.md)
- [테넌트 내부 통신 규칙](TENANT-COMMUNICATION-RULES-v0.1.md)
- [OPENSPHERE-GOVERNANCE-MIN-DESIGN-v0.1.md](../architecture/OPENSPHERE-GOVERNANCE-MIN-DESIGN-v0.1.md): §9 판단 엔진 비교, §13 G0~G4 단계
- OpenSphere `policies/AUTHORIZATION-GOVERNANCE-TOOLS-RESEARCH-2026-11-13.md`(옛 `governance/`): 도구 조사 1.2.0

---

## 1. 답

**이 전부를 하나로 해 주는 제품은 없다.** 영역별로 잘 정리된 참고 대상은 있다.

- **개념 모델로는 클라우드 랜딩존이 가장 가깝다.** AWS Control Tower, Azure Landing Zones, Google Cloud의 조직·폴더·프로젝트 구조가 여기에 해당한다. 테넌트를 공장처럼 찍어 내고, 계층을 따라 정책을 상속하며, 가드레일을 예방형과 탐지형 두 종류로 둔다. 같은 문제를 이미 풀었다.
- **구현은 부품을 조합한다.** 조합·수명주기, 권한 판단, 집행, 워크로드 신원은 각각 성숙한 오픈소스 부품이 있다.
- **Governance가 직접 만들 것**은 정의, 할당, 결재, 승격, 대조로 좁힌다. 나머지는 부품에 맡긴다.

## 2. 개념 모델: 랜딩존 대응표

| OpenSphere 개념 | AWS | Azure | Google Cloud |
|---|---|---|---|
| 테넌트 구성(Genesis) | Control Tower Account Factory | 랜딩존 구독 발급(subscription vending) | Project Factory |
| 테넌트(회사) → 영역 → 어셈블리 → 자원 | Organizations → OU → 계정 → 리소스 | 관리 그룹 → 구독 → 리소스 그룹 → 리소스 | 조직 → 폴더 → 프로젝트 → 리소스 |
| 예방 가드레일 | SCP | Azure Policy(deny) | Organization Policy |
| 탐지 가드레일 | AWS Config 규칙 | Azure Policy(audit) | Security Command Center |
| 신원 거버넌스 | IAM Identity Center + Access Analyzer | Entra ID Governance(액세스 검토, 권한 관리) | Cloud IAM + Policy Intelligence |
| 비용 배분 | 비용 할당 태그, Cost Explorer | Cost Management | Billing 내보내기 |

**OpenSphere가 그대로 가져올 원칙**

| 원칙 | 의미 | OpenSphere 적용 |
|---|---|---|
| **공장** | 테넌트·계정은 손으로 조립하지 않고 정해진 틀에서 찍어 낸다 | 어셈블리 정의 카탈로그 + Genesis 절차(구성 명세 §5, §8) |
| **계층 상속** | 상위에 건 정책이 하위에 자동 적용되고, 하위는 더 좁힐 수만 있다 | 테넌트(회사) → 영역 → 어셈블리 → 자원. 조직 계층(AD)과 교차 |
| **두 종류 가드레일** | 예방(아예 못 하게)과 탐지(했으면 찾아서 고침)를 같이 둔다 | 예방 = admission·PDP 거부, 탐지 = 대조·drift 회수(D-20) |
| **관리 계정 분리** | 거버넌스를 집행하는 계정은 업무 계정과 분리한다 | 회사 관리 콘솔 별도 세션, 배분 구역(D-49, D-84), 제어 신호 전용 경로(TC-C3) |

**가져오지 않을 것:** 클라우드 랜딩존은 공급사(클라우드)가 신뢰 기반이라는 전제 위에 서 있다. OpenSphere는 Backbone을 신뢰 기반 밖으로 밀어내는 것이 목표다(네 면 구조, T-1). 그래서 **키와 첫 소유자 자격의 위치**는 랜딩존을 따르지 않는다.

## 3. 부품 지도

| 기능 | 참고 대상 | 네 면 위치 | OpenSphere에서의 쓰임 |
|---|---|---|---|
| 자원 조합·수명주기 | **Crossplane**(XRD, Composition, Usage) | Fabric | 어셈블리 = Composite Resource, 삭제 보호 = Usage. 이미 배포 지원 계열에 보유 |
| | KubeVela(OAM), Kratix(Promise) | Fabric | "플랫폼이 파는 조합 상품" 모델 참고 |
| K8s 테넌트 경계 | **Capsule**(Tenant CRD), vCluster | Fabric | 테넌트 = 네임스페이스 묶음 + 정책, 또는 가상 클러스터(T-Q2) |
| 권한 판단(PDP) | **OpenFGA**, **SpiceDB**(Zanzibar 방식), Cedar, Cerbos, OPA | Governance가 정의, Fabric이 실행 | 기존 비교 후보 그대로(D-26, 최소 설계 §9) |
| 판단 질의 표준 | **OpenID AuthZEN** | 계약 | PDP 교체 가능성 확보 |
| 집행(admission) | **Kyverno**, Gatekeeper | Fabric | 연결 그래프 밖 리소스, 미서명 이미지, 영역 경계 위반 거부 |
| 워크로드 신원 | **SPIFFE/SPIRE** | Fabric(trust 핵심 어셈블리) | 연결 전용 신원, mTLS(통신 규칙 §3) |
| 키·비밀 | OpenBao, cert-manager | Fabric(trust) | 테넌트 KMS·CA(T-Q3) |
| 신원 거버넌스 모델 | **midPoint**(공개 IGA 중 가장 완결된 모델), SailPoint(상용 기준) | 참고서 | 역할 모델, 재인증 캠페인, 직무 분리(SoD), 정책 규칙. D-4로 정본에서는 제외했지만 모델 참고서로는 가치가 크다 |
| 카탈로그·소유 | Backstage | Workspace 표면 | 어셈블리·사원 앱의 소유자, 의존 관계, 승격 이력 |
| 프로비저닝 계약 | SCIM 2.0 | 계약 | 어댑터 계약(기준선 §6) |

> **라이선스:** 위 제품의 라이선스는 이 문서에서 확정하지 않는다. 원문을 확인해 라이선스 대장(D-73)에 올린 뒤 선정한다. 키·비밀 저장은 특히 확인이 필요하다. HashiCorp Vault는 BSL로 바뀌었고, OpenBao는 그 공개 포크다.

## 4. Governance가 직접 만드는 것과 맡기는 것

| 구분 | 내용 | 근거 |
|---|---|---|
| **직접 만든다** | 정의(revision·서명), 할당 원장, 셀프 신청·결재(위험 등급), 재검토, 권한 대조·drift 회수, 사원 앱 승격 관문, showback 집계. 연결 결재(T-6)와 어셈블리 구성은 D-82로 테넌트 관리자 몫 | OpenSphere 고유의 업무 의미이고, 시장 제품을 정본으로 쓰지 않기로 했다(D-4) |
| **부품에 맡긴다** | 권한 판단 실행(PDP), 집행(admission·네트워크), 워크로드 신원, 자원 조합, 키 관리 | 성숙한 부품이 있고, 직접 만들면 위험만 커진다 |
| **계약만 정한다** | AuthZEN 질의, SCIM 투영, CloudEvents, RFC 8693 위임 토큰 | 부품 교체 가능성 |

이 구분으로 Governance는 **판단을 정의하는 곳**이 되고, 집행은 Fabric에서 한다(네 면 구조의 PDP / PEP 분리).

## 5. 계층과 권한 모델 (관계 기반 스케치)

테넌트 구조는 관계 기반 권한(Zanzibar 방식)과 잘 맞는다.

```
tenant:example                      (회사 하나 = 테넌트 하나, D-83)
  └─ area:employee                  parent: tenant:example
       ├─ assembly:mail             parent: area:employee
       │    └─ mailbox:kim          parent: assembly:mail,  owner: user:kim
       ├─ assembly:business-core    parent: area:employee
       │    └─ ledger:sales         parent: assembly:business-core
       └─ app:kim/webmail           parent: area:employee, owner: user:kim, level: 1

unit:sales-hq   member: user:kim          (AD에서 수집)
role:sales-rep  assignee: unit:sales-hq   (Governance 할당)
```

| 질의 | 계산 |
|---|---|
| kim이 `mailbox:kim`을 읽을 수 있는가 | owner 관계 |
| kim의 웹메일 앱이 `mailbox:kim`을 읽을 수 있는가 | 앱 owner = kim ∩ 위임 범위 ∩ 앱 가드레일(1단계: 소유자 자원만) |
| 영업 담당이 `ledger:sales`를 볼 수 있는가 | role 할당 → 어셈블리 권한 상속 + 조건(근무 시간·위치 등 ABAC) |
| 누가 `assembly:mail`을 관리할 수 있는가(역질의) | 재검토·감사용 |

관계(누가 무엇에 속하는가)와 조건(언제, 어디서, 어떤 위험에서)이 섞인다. 그래서 기존 최소 설계 §9의 "요청 판단 엔진 + 관계 엔진" 조합 허용이 여기서도 유효하다.

## 6. 판단 엔진 비교에 더할 것 (D-26)

기존 후보(Cedar, Cerbos, OPA, OpenFGA, SpiceDB)와 시나리오 S1~S7은 그대로 유지한다. 테넌트·어셈블리 구조 때문에 시나리오 셋을 더한다.

| # | 시나리오 | 보는 것 |
|---|---|---|
| S8 | 테넌트(회사) → 영역 → 어셈블리 → 자원 계층 상속, 하위는 좁히기만 가능 | 계층 상속과 거부 우선 표현 |
| S9 | 사원 앱 1 → 2 → 3단계 승격 시 실행 신원·권한 전환 | 소유자 위임 → 서비스 신원 전환의 일관성 |
| S10 | 연결 객체 승인 판단(T-6): 어떤 연결이 고위험인가 | 자원 속성·연결 유형 기반 규칙 |

**PDP 어댑터 인터페이스를 AuthZEN에 맞춘다:** 최소 설계 §9의 `decide(subject, action, resource, context)`는 AuthZEN의 Access Evaluation 형태와 같은 모양이다. 필드 이름과 응답 형식을 AuthZEN에 맞추면 엔진을 교체하기 쉬워진다. `explain`과 `reverseQuery`는 AuthZEN 검색 API 계열과 엔진 고유 기능으로 보완한다.

## 7. 표준 문서

| 표준 | 쓰는 곳 |
|---|---|
| SCIM 2.0 (RFC 7643, 7644) | 프로비저닝 어댑터 계약 |
| OAuth 2.0 Token Exchange (RFC 8693) | 사용자 위임 토큰 |
| OpenID AuthZEN | PDP 질의 계약 |
| CloudEvents | 이벤트 형식 |
| SPIFFE | 워크로드 신원 형식 |
| RFC 9457 Problem Details | API 오류 형식 |
| W3C Trace Context | 추적 전파 |
| NIST SP 800-162 | ABAC 용어·모델 |
| NIST SP 800-207 | 제로 트러스트 원칙(기본 거부, 매 요청 검증) |

## 8. 최소 설계 단계(G0~G4)와의 관계

기존 Governance 최소 설계 §13에는 이미 G0~G4 단계가 있다. 이 문서는 단계를 새로 만들지 않고, 테넌트 구조로 생기는 일을 각 단계에 얹는다.

| 단계 | 기존 범위 | 더할 것 |
|---|---|---|
| G0 | 원장, 정의 revision, 신원 수집기, 감사 | 테넌트 기록 수신(Genesis 해시), 첫 소유자 인도 |
| G1 | 결재, 셀프 신청, 대표 앱 어댑터, 대조기 | —(연결 결재는 D-82로 테넌트 관리자 몫) |
| G2 | 공유 서비스 배분, 서비스 배분, showback | 테넌트에서 리소스 유형·용량 인계 수신(D-82) |
| G3 | 재검토, 판단 엔진 채택, 에이전트 단위 | S8~S10 포함 비교, AuthZEN 어댑터 |
| G4 | 외부 AD 모드, 추가 어댑터 | 사원 앱 승격 관문(1~3단계) |

## 9. 미결

| ID | 미결 |
|---|---|
| GR-Q1 | 관계 엔진(OpenFGA·SpiceDB)과 요청 판단 엔진(Cedar·Cerbos·OPA)을 조합할지, 하나로 갈지(S1~S10 결과로 판단) |
| GR-Q2 | 테넌트 경계를 Capsule로 할지 vCluster로 할지(구성 명세 T-Q2와 같음) |
| GR-Q3 | 예방 가드레일 정책을 어디에 둘지: Governance 정의에서 생성할지, Fabric 운영 정책으로 둘지 |
| GR-Q4 | Backstage를 카탈로그로 도입할지, Workspace 셀프서비스에 내장할지 |
