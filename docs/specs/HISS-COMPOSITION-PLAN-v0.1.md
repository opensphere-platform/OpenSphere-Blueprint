# HISS 구성 계획 v0.1

**상태:** 기록용 — 정본은 [v0.2](HISS-COMPOSITION-PLAN-v0.2.md)(스토어 경로 · 설치 시점, D-88). v0.1 — **소유자 결정 반영(2026-11-23, "권장대로")**. Q-H1~Q-H6은 모두 권장안으로 정해졌고 결정 대장 D-87에 올렸다. 설계 근거는 D-86(네 면 아래의 바닥)이고, 이 문서는 그 위에 세부 항목 · 배치 · 이전 판 소스 활용 · 단계를 더한다.
**작성:** 2026-11-22 · Claude. 근거 조사는 셋이다.
- 설계 문서(Blueprint)
- 운영 RKE2 실측(읽기 전용)
- 이전 판 소스(OpenSphere-Archive · Template)

**소유자 요구(2026-11-22):**
- Fabric 화면에 추이 차트가 없는 것은 HISS가 없기 때문이다.
- HISS의 세부 항목과 배치, 이전 판 소스의 활용을 포함한 종합 구성 계획을 세운다.
- HISS는 **메인 메뉴에서 구분해** 운영한다.

**상위 기준**
- [네 면 구조](../overview/FOUR-PLANES.md) §2.1: HISS의 정의, 인도 지점 넷, 운영 규칙
- [기준선 결정 대장](../architecture/OPENSPHERE-LAYER-BASELINE-v0.2.md) D-54 · D-86, 열린 결정 O-10 · O-11
- [OSR v0.2](OPENSPHERE-REGISTRY-OSR-v0.2.md): `hiss` 클래스와 고권한 profile 요건
- 구현 기록(OpenSphere-Backbone)
  - `docs/console/FABRIC-INSTANCE-DETAIL.md`: Fabric 세부 화면 기준. 모니터링 탭의 추이 차트를 HISS로 미뤄 두었다.
  - `docs/hiss/STACKGRES-OPERATOR.md`, `infra/hiss/*`

---

## 1. 요약

1. **HISS = Host Infrastructure Service Stack.** 네 면(Backbone · Fabric · Governance · Workspace)이 모두 그 위에서 돈다. 사용 면이 없고 주인은 Backbone 하나다(D-86).
2. **지금 운영에는 HISS가 흩어져 있다.**
   - RKE2가 깐 것: Cilium · Traefik · CoreDNS · metrics-server
   - Setup이 깐 것: Longhorn · MetalLB
   - 운영자가 kubectl로 깐 것: StackGres operator · edge TLS

   모두 따로 놓였고, 한 곳에서 보고 · 검증하고 · 바꾸는 표면이 없다.
3. **차트가 없는 직접 원인:** 시계열 지표를 모으는 관측 바닥이 없다. metrics-server는 지금 값만 준다. 각 PostgreSQL 구성원에 지표 수집기(postgres-exporter, 9187)가 돌지만 아무도 읽지 않는다.
4. **계획의 뼈대**
   - **메인 메뉴 "HISS"를 따로 둔다.** 레일 순서는 홈 · HISS · Fabric · … · 설정이다.
   - **세부 항목 열 영역**을 감지 · 채택 · 관리 세 등급으로 나눠 관리한다(§4).
   - **관측 바닥을 첫 관리 항목으로 세운다**(§6). 이것이 Fabric 차트를 연다.
   - **이전 판 Cluster Manager의 카탈로그 · 검증 기준 · 경보 규칙 · 화면 구조를 데이터로 재사용**하고, 런타임은 버린다(§8).
5. **결정(2026-11-23):** §10의 여섯 가지를 모두 권장안으로 정했다(D-87). 다음은 H1(메뉴 · 감지)과 H2(관측 바닥)다.

---

## 2. 정의와 경계 (D-86 요약 + 이 계획이 더하는 것)

| HISS에 두는 것 | Fabric에 남는 것 |
|---|---|
| 노드 · K8s 제어면 · KVM 노드 | KubeVirt의 VM(엔진 설비만 HISS) |
| CNI · 영역 사이 차단 정책 | 영역 안 네트워크 정책 |
| 저장 엔진 · 외부 Ceph 연결 | 공유 서비스의 데이터 볼륨과 그 내용 |
| ingress 컨트롤러 · 인증서 · DNS 엔진 | 공개 도메인 노출 조건(O-10) |
| 내부 CA · **클러스터 건강 관측 바닥** | 관측 서비스(Grafana · Loki · Tempo, 테넌트용) |
| 호스트 전제조건 진단 · 실검증 | — |

**인도 지점:** D-86의 넷(네임스페이스 · StorageClass · IngressClass · ClusterIssuer)에 하나를 더하자고 제안한다.

- **⑤ 관측 바인딩(제안):** 위의 면이 "내 지표는 이 포트 · 이 경로에 있다"고 선언하면, HISS 관측 바닥이 그것을 모아 두고 Backbone이 정해진 질의로만 읽게 한다.
- 이전 판의 `hiss-observability-binding` CRD와 provider의 `hiss/consumer.cjs`가 같은 생각이었다.
- 이것이 없으면 Fabric 서비스마다 자기 관측 스택을 들고 와야 하고, D-86의 "관측 바닥은 HISS"와 어긋난다.

**관측의 두 층** (D-86을 구체화한 것)
- **HISS 관측 바닥:** 클러스터 · 노드 · 컨테이너 · 볼륨 · Fabric 엔진의 건강 지표와 경보. 사람에게 나눠 주지 않는다. Backbone(Console)만 읽는다.
- **Fabric 관측 서비스:** 테넌트가 자기 앱의 로그 · 트레이스 · 대시보드를 쓰는 곳(Grafana · Loki · Tempo). 공급 · 배분 대상이다.

---

## 3. 현황 (운영 RKE2 실측, 2026-11-22)

| 영역 | 구성요소 · 판 | 놓은 주체 | 분류 제안 | 상태 |
|---|---|---|---|---|
| 클러스터 | RKE2 v1.37.0+rke2r1, 제어면 3 · ingress 1 · 작업 7 | 설치(Setup) | 감지 | 제어면 메모리 66~74% |
| 네트워크 | Cilium v1.20.1(rke2-cilium), CiliumNetworkPolicy 7개 | RKE2 번들 | 감지 | — |
| 네트워크 | MetalLB 0.15.2(VIP 10.10.1.80) | 설치 때 | 채택 | HISS 표식 없음 |
| 네트워크 | CoreDNS 1.14.7 | RKE2 번들 | 감지 | — |
| 입구 | Traefik v3.7.13 DaemonSet(HelmChartConfig) | RKE2 번들 + 소유자 설정 | 채택 | — |
| 인증서 | edge TLS(lego v5.6.0 CronJob, `os-hiss-edge-tls`) | 운영자 kubectl | 관리 | **40시간 전 수동 Job 2개가 Init:Error로 남음** |
| 인증서 | cert-manager | 없음 | — | PoC 결정으로 들이지 않음 |
| 저장 | Longhorn v1.12.1, StorageClass 4개, snapshot-controller 8.6.0 | Setup · RKE2 | 채택 | 백업 대상 없음 |
| 엔진 설비 | StackGres operator 1.19.5(`stackgres`) | 운영자 kubectl | 관리 | 라벨 `opensphere.io/hiss-base` |
| 관측 | rke2-metrics-server v0.9.0 | RKE2 번들 | 감지 | 지금 값만 |
| 관측 | OpenObserve v1.1.2 + OTel collector(`os-backbone-observability`) | Backbone | 범위 밖(Backbone 소속) | 로그 파이프라인만 |
| 관측 | Prometheus · Alertmanager · kube-state-metrics · node-exporter | **없음** | 관리(신규) | — |
| 백업 | RKE2 etcd 스냅샷, Longhorn 백업, Velero | etcd만 RKE2 기본 | 채택 · 관리 | 외부 사본 없음 |

**소스의 현재 모습**
- OSR 계약에 `hiss` 클래스는 있지만, 배치 규칙(profile)은 하나도 없다.
- 스토어 그룹에 `hiss`는 있지만 설치할 수 없는 클래스다(`osr_store.rs` `installable_class`).
- Console에는 HISS 경로와 레일 항목이 없다(`examples.ts` Area: home · configuration · fabric · other).
- HISS 더미 화면(`console/dummy/.../hiss.*`)은 예시 값이고, 실제와 다르다.
  - 더미에 있지만 실제로 없는 것: ingress-nginx · cert-manager · kube-prometheus-stack · kured
  - 더미의 표기: Canal · RKE2 1.33

---

## 4. 세부 항목 (HISS 카탈로그)

**세 등급** (이전 판 Cluster Manager의 DetectOnly / HelmManaged에 "채택"을 더한 것)
- **감지:** 다른 주체(RKE2 번들 등)가 소유한다. HISS는 판 · 상태 · 실검증 결과만 읽고, 절대 다시 설치하지 않는다.
- **채택:** 설치 때 놓였지만 이제 HISS가 책임진다. 현재 값을 정의로 옮겨 적고, 그다음부터 차이를 비교 · 계획 · 승인으로 바꾼다.
- **관리:** HISS 정의(저장소의 고정 chart · 매니페스트 + digest)에서 계획 → 승인 → 적용 → 실검증한다.

| # | 영역 | 항목 | 등급 | Ready 실검증(이전 판 기준을 옮긴다) |
|---|---|---|---|---|
| H-1 | 클러스터 · 노드 | K8s API(판 범위 ≥1.30 <1.38), 노드 · 역할 · taint · 용량, 제어면 건강 | 감지 | API 응답, 노드 Ready, 제어면 Pod |
| H-2 | 호스트 전제조건 | iSCSI · 커널 모듈 · 시간 동기 · 디스크 여유 | 감지 | 노드별 진단 Job(읽기만) |
| H-3 | 네트워크 · 칸막이 | Cilium, 기본 차단 정책, 영역 사이 정책 | 감지(CNI) · 관리(정책) | 임시 Pod 2개 사이 허용 · 차단 확인 |
| H-4 | 부하 분산 | MetalLB 주소 풀 · L2 광고 | 채택 | VIP 응답 |
| H-5 | 입구 · 인증서 · DNS | Traefik(IngressClass), edge TLS(lego), 내부 CA, DNS는 기록만(소유자 관리) | 채택 · 관리 | 임시 Ingress로 HTTPS 응답 · 인증서 만료일 |
| H-6 | 저장 | Longhorn, StorageClass(인도 지점), 스냅샷 컨트롤러, 외부 Ceph(O-11 뒤) | 채택 · (관리) | **64Mi 임시 PVC + Pod로 할당 · 마운트 · 읽기쓰기**, provisioner와 CSIDriver의 정확한 일치 |
| H-7 | 엔진 설비 | StackGres operator(지금), KubeVirt 엔진 · 기타 CRD를 가진 operator(나중) | 관리 | operator Ready + CRD 판 + 의존하는 Fabric 서비스 수 |
| H-8 | **관측 바닥** | 지표 저장 · 수집기 · kube-state-metrics · node-exporter · 경보 | **관리(신규)** | 수집 대상 up 비율, 경보 규칙 적재, 질의 응답 |
| H-9 | 플랫폼 백업 | RKE2 etcd 스냅샷의 외부 사본, Longhorn 백업 대상 | 채택 · 관리 | 사본 크기 · 항목 수가 0이면 실패, 격리 복구 시험 |
| H-10 | 위로 넘기는 것 | 네임스페이스 · StorageClass · IngressClass · ClusterIssuer · (제안) 관측 바인딩 | 계약 | 각 인도물의 실검증 결과를 위의 면이 읽는다 |

**변하지 않는 규칙** (FOUR-PLANES §2.1 그대로)
- Ready는 실검증으로만 판정한다. 검증 계약이 바뀌면 이전 성공은 무효다.
- 접수(202)를 완료로 보지 않는다.

---

## 5. 배치

### 5.1 클러스터 안 배치

- **namespace:** `os-hiss-<영역>` 하나씩 둔다.
  - 예: `os-hiss-observability`, `os-hiss-edge-tls`(있음), `os-hiss-engine-stackgres`(지금 `stackgres`, 이름 바꾸기는 하지 않고 채택만)
  - 라벨 `opensphere.io/hiss=<영역>`으로 소속을 표시한다.
- **노드:** HISS 워크로드는 작업 노드에만 둔다. 제어면(메모리 66~74%)과 ingress 노드(2Gi)에는 놓지 않는다.
  - DaemonSet(node-exporter)만 예외로 모든 노드에 두고, 메모리 한도를 작게 고정한다.
- **클러스터 범위 이름:** ClusterRole · 정책 · CRD 소유자 이름은 `os-hiss-` 접두로 짓는다. 공용 객체와 Backbone 객체(`osr-*`)는 건드리지 않는다.
- **권한:** 설치 권한과 실행 권한을 나눈다.
  - 설치(Setup · 운영자): RBAC · Secret · CRD를 쓴다.
  - 실행(HISS 런타임): 자기 namespace의 최소 권한만 갖는다.

  이전 판 Setup-CLI의 `hiss-*` 프로필(Namespace · SA · RBAC 54개를 바이트 sha256으로 고정)이 이 분리를 했다.

### 5.2 메인 메뉴 배치 (소유자 요구: 메인 메뉴에서 구분)

**레일**
- 홈
- **HISS**(새로 둠)
- OpenSphere Fabric(있음)
- Governance · Workspace(나중)
- 설정(톱니, Backbone 자신)

이렇게 나누는 이유:
- HISS는 사용 면이 없어 Fabric 아래에 두면 공급 대상처럼 보인다.
- 설정(톱니)은 Backbone 자신의 설정이라 클러스터 바닥과 섞이면 안 된다.
- 레일의 위치가 네 면 구조와 같아진다(바닥 → 공급 → 배분 → 사용).

**HISS 메뉴 구성**
- 각 화면이 답하는 질문을 정한다(Fabric 세부 화면 기준과 같은 방식).
- 값은 모두 실제이고, 못 읽으면 "읽지 못함"이다.

| 메뉴 | 답하는 질문 | 주된 원천 |
|---|---|---|
| 개요 | 바닥이 지금 정상인가, 무엇을 확인해야 하는가 | 항목별 Ready · 실검증 · 경보 |
| 클러스터 · 노드 | 노드와 제어면이 건강하고 여유가 있는가 | 노드 · metrics · 관측 바닥 |
| 네트워크 · 칸막이 | 영역 사이가 막혀 있고, 막혀야 할 것만 막혔는가 | Cilium · 정책 · 실검증 |
| 입구 · 인증서 · DNS | 밖에서 들어오는 길과 인증서가 유효한가 | Traefik · edge TLS · 만료일 |
| 저장 | 볼륨을 만들고 쓸 수 있는가, 복제본이 건강한가 | Longhorn · StorageClass · 실검증 |
| 엔진 설비 | Fabric 서비스가 기대는 operator가 준비됐는가 | operator · CRD · 의존 서비스 |
| 관측 바닥 | 지표가 모이고 있는가, 경보가 무엇인가 | 수집 대상 · 경보 규칙 · 보존 |
| 플랫폼 백업 | 클러스터를 잃으면 되살릴 사본이 있는가 | etcd 사본 · Longhorn 백업 |
| 위로 넘기는 것 | 위의 면에 무엇을 어떤 조건으로 넘기는가 | 인도 지점 다섯 |
| 변경 · 이력 | 누가 무엇을 계획 · 승인 · 적용했는가 | HISS 계획 기록 |

**항목 세부 화면** (예: 저장 → Longhorn)
- Fabric의 13개 탭은 쓰지 않는다. 접속 · 세션 · 역할 탭이 HISS에는 없기 때문이다.
- 대신 탭 다섯을 기준으로 둔다: **상태 · 구성 · 실검증 · 변경 · 문서.**
- 탭의 순서 · 질문 · "읽지 못함" 규칙은 `FABRIC-INSTANCE-DETAIL.md`와 같은 방식으로 문서화한다.

### 5.3 Fabric과 이어지는 곳

- Fabric 세부 화면의 모니터링 탭은 **관측 바인딩(⑤)**으로 HISS 관측 바닥을 읽는다.
- 브라우저가 임의의 질의(PromQL)를 보내지 않는다. Core가 **이름 붙은 질의 목록**만 받는다.
  - 예: `pg.connections`, `pg.tps`, `pg.replication_lag`, `container.cpu`, `container.memory`, `volume.used`
  - 인스턴스 이름과 기간만 인자로 받는다.
- 데이터 볼륨 탭의 "Longhorn 복제본 건강"(지금 "HISS가 읽음"으로 비워 둔 칸)도 같은 경로로 채운다.

---

## 6. 관측 바닥 설계 (H-8, 첫 관리 항목)

### 6.1 엔진 선택 (결정 Q-H1)

| 안 | 내용 | 장점 | 단점 |
|---|---|---|---|
| **A. kube-prometheus-stack(권장)** | Prometheus Operator + Prometheus + Alertmanager + kube-state-metrics + node-exporter. Grafana는 끈다 | 이전 판이 87.19.1로 고정 · 검증했다. 경보 PromQL 13개를 그대로 쓴다. StackGres `prometheusAutobind`(PodMonitor)가 그대로 맞는다 | CRD(monitoring.coreos.com)가 클러스터에 생긴다. 구성요소가 많다 |
| B. VictoriaMetrics single + vmagent | CRD 없이 정적 수집 설정 | 가볍다 | PodMonitor 자동 연결이 없어 수집 대상을 따로 관리해야 한다. 이전 판 자산을 덜 쓴다 |
| C. OpenObserve에 metrics 추가 | 이미 있는 Backbone 관측에 지표 파이프라인 | 새 구성요소가 적다 | Backbone 소속이라 HISS 경계와 어긋난다(D-86). collector가 로그 전용 96MiB 구성이다 |

### 6.2 안 A의 구성

- **놓는 곳:** `os-hiss-observability`, 작업 노드
- **보존:** 지표 15일 · Longhorn PVC 30Gi(시작값, 조정 가능)
- **자원(시작값):**
  - Prometheus 1 CPU · 3Gi
  - kube-state-metrics · operator 각 0.2 CPU · 256Mi
  - node-exporter 50m · 64Mi(노드마다)
- **수집 대상**
  - kubelet / cAdvisor: 컨테이너 CPU · 메모리
  - kube-state-metrics
  - node-exporter
  - Longhorn manager 지표
  - Traefik 지표
  - Fabric 엔진 지표: postgres-exporter 9187. 이후 OpenSearch · RustFS가 선언하는 포트
- **Fabric 쪽에 필요한 변경**(관측 바인딩)
  - 배치 규칙(예: `provider.stackgres-pg` 다음 판)에 `observability.metrics: [{port, path}]`를 선언한다.
  - 실행부가 설치본 경계 정책(`osr-boundary`)에 "라벨 `opensphere.io/hiss=observability` namespace에서 그 포트로만" 허용을 함께 렌더링한다.
  - 웹훅 비교 대상이 되므로, 배치 규칙 서명과 신뢰 세대 갱신이 필요하다.
- **경보**
  - 이전 판 `his-core-alerts.js`의 규칙을 PrometheusRule로 옮긴다: NodeNotReady · EtcdSlow · KubeApiErrors · VolumeFillingUp · LonghornVolumeDegraded/Faulted · PdbBlocking 등.
  - Alertmanager가 받는 곳은 일단 Console의 HISS 개요(경보 목록)다. 메일 · 메신저는 나중이다.
- **Console 읽기 경로**
  - Core에 읽기 전용 `GET /console-api/hiss/series/<이름>?target=…&range=…`를 둔다.
  - Core만 Prometheus에 닿게 한다(NetworkPolicy).
  - 차트는 Console이 Carbon Charts로 그린다. Grafana를 HISS에 두지 않는다(결정 Q-H4).

### 6.3 이것으로 열리는 것

PostgreSQL 모니터링 탭에 다음 추이가 들어온다. 같은 바인딩으로 Samba AD · Keycloak · OpenSearch · RustFS도 따라온다.
- 연결 수, 커밋/초, 복제 지연, 캐시 적중률
- CPU · 메모리
- 볼륨 사용량

---

## 7. 변경 경로 (설치 · 갱신 · 승인)

**지금:** StackGres operator와 edge TLS는 저장소의 검토된 정의를 운영자가 채팅 승인 뒤 kubectl로 적용했다. OSR · MFA를 거치지 않았다.

| 단계 | 경로 | 승인 |
|---|---|---|
| 1(지금 ~ H2) | 저장소 정의(`infra/hiss/<항목>/`, chart digest · 렌더 결과 고정) → 운영자 스크립트(서버 dry-run → 적용 → 실검증) | 소유자 채팅 승인. 기록은 저장소와 PROGRESS |
| 2(H3) | 같은 정의를 Console의 HISS 변경 화면에서 계획(차이) → **관리자 MFA** → HISS 전용 실행부가 적용 | 관리자 MFA. 고권한이라 검토자 승인을 더할지는 Q-H3 |
| 3(선택) | 스토어 `hiss` 클래스(OSR 배치 규칙 · 서명 · 신뢰 세대) | OSR v0.2의 고권한 profile 요건 |

**HISS 전용 실행부**
- 지금의 모듈 실행부와 분리한다. 실행부는 `os-backbone-mod-*` 전용이고, 웹훅도 그 범위만 본다.
- 권한: HISS namespace들 + 정의에 적힌 CRD · 클러스터 범위 객체 이름만. 이전 판 `hiss-runtime-owner.yaml`이 스스로 경고한 과도한 권한을 되풀이하지 않는다.

---

## 8. 이전 판 소스 활용

| 출처(OpenSphere-Archive) | 무엇 | 활용 | 이유 |
|---|---|---|---|
| `OpenSphere-shell-clusterManager/his-catalog.js` | 항목 11개의 판 범위 · 고정 판 · 감지/관리 구분 | **데이터 재사용** | 판 · 검증 기준이 검증됐다. 판은 지금 기준으로 다시 맞춘다(RKE2 1.37 · Cilium · Traefik) |
| 같은 저장소 실검증 코드 | 64Mi PVC canary, CNI · DNS canary, provisioner · CSIDriver 일치, 계약 지문으로 무효화 | **규칙 이식(Rust)** | Node 런타임은 버리고 판정 규칙만 옮긴다 |
| `his-values/*.yaml` | kube-prometheus-stack 등 chart 값 | **재사용 후 조정** | Grafana 끔, 자원 · 보존 조정 |
| `his-core-alerts.js` | 경보 PromQL 13개 이상 | **그대로 재사용** | 식이 상수로 정리돼 있다 |
| `ceph.component.ts` · `ceph-insights.component.ts` · `ceph-monitoring.catalog.ts` | 외부 Ceph 화면 정보 구조 · 대시보드 연결 | **화면 구조 재사용**(O-11 뒤) | Carbon으로 다시 그린다 |
| `his.component.ts`(1743줄) | 항목 표 · Validation canary · Helm 이력 · 관측 설치 옵션 | **화면 구성 참고** | Clarity → Carbon, 서명 subShell 구조는 버림 |
| `his-backup.js` | Longhorn BackupTarget · RecurringJob, etcd S3 스냅샷 | **규칙 이식** | H-9의 기초 |
| Template `features/fabric/hiss.*` | 9개 탭 · KPI · 인도 지점 화면 골격 | **UI 골격 재사용** | D-86에 맞춰 이미 정리됐다. 값만 실제로 바꾼다 |
| `OpenSphere-Setup-CLI/src/hiss-*` | 설치 권한과 실행 권한 분리, 바이트 고정 프로필 | **방식 이식** | §5.1 |
| `opensphere-observability-gateway`(Go 241줄) | 토큰 digest → `X-Scope-OrgID` 프록시 | **나중에 이식** | Fabric 관측 서비스(테넌트 Loki · Tempo) 단계에서 |
| `opensphere-backup` | 0바이트 백업 실패 판정, 격리 복구 검증 | **규칙 이식** | H-9 |
| `OpenSphere-shell-foundation/velero-grafana-dashboard.yaml` | upstream Velero 대시보드 | Velero 채택 시에만 | Velero는 Fabric 백업 서비스 |
| `OpenSphere-stackgres-operator` | Patroni digest 패치 overlay | 생각만(digest fail-closed) | AGPL-3.0: 패치를 배포하면 소스 공개 의무. 판도 어긋난다 |
| provider-*의 `hiss/consumer.cjs` | 위의 면이 HISS 관측을 받아 쓰는 계약 예 | **계약 이식** | §2 관측 바인딩 |
| OpenSphere-Cluster-Manager · console Beszel · Platform-Support · Pulse · OpenSphere-Legacy | 초기 읽기 전용판, 범위 밖 | 버림 | — |

**주의**
- ingress-nginx는 upstream이 2026-03에 은퇴했다. 이전 판 카탈로그의 ingress-nginx 4.15.1은 쓰지 않는다. 지금처럼 Traefik을 IngressClass로 채택한다.
- 이전 판 판을 그대로 들이지 않는다. 고정 판은 지금 의존성 정책(digest 고정 · 예외 기록)으로 다시 검토한다.

---

## 9. 단계

| 단계 | 내용 | 끝났다고 보는 기준 |
|---|---|---|
| **H0 결정** | §10의 Q-H1~Q-H6 | 소유자 결정 기록 |
| **H1 HISS 메뉴 · 감지** | 레일 "HISS", 메뉴 10개의 읽기 전용 화면. HISS 읽기 구성요소(클러스터 범위 get · list만, Secret 없음) → Console 내부 경로. 감지 · 채택 항목의 실제 판 · 상태, edge TLS 실패 Job 같은 지금 문제 표시 | 운영 Console에서 실제 값이 보이고, 더미 값이 없다 |
| **H2 관측 바닥** | 안 A를 `infra/hiss/observability/`로 정의 · 고정, 운영자 경로로 적용, 경보 규칙 적재. Core 이름 붙은 질의. `provider.stackgres-pg` 관측 바인딩(배치 규칙 다음 판 · 서명). PostgreSQL 모니터링 탭 추이 차트 | 운영 PostgreSQL 인스턴스의 연결 · CPU · 메모리 · 볼륨 추이가 화면에 나온다 |
| **H3 HISS 변경 경로** | HISS 계획 · 기록 원장, 관리자 MFA, HISS 전용 실행부. StackGres operator · edge TLS · 관측 바닥을 이 경로로 옮겨 채택 | 정의 변경 하나가 화면에서 계획 → MFA → 적용 → 실검증으로 끝난다 |
| **H4 실검증 · 플랫폼 백업** | 저장 · 네트워크 · DNS canary를 정기 실행. etcd 외부 사본 · Longhorn 백업 대상(외부 S3, Fabric RustFS는 쓰지 않는다: 층이 거꾸로 됨) | 실검증 결과가 Ready 판정에 쓰이고, 복구 시험이 한 번 돈다 |
| **H5 외부 Ceph · 엔진 설비 확장** | O-11 결정 뒤 Rook External · Ceph 화면, KubeVirt 엔진 | 결정에 따라 |

H1과 H2는 서로 기대지 않으므로 함께 진행할 수 있다. Fabric 차트를 먼저 원하면 H2를 앞에 둔다.

---

## 10. 소유자 결정 (2026-11-23 확정)

소유자가 2026-11-23에 "권장대로"라고 답해, 아래 권장안이 그대로 결정이다(D-87).

| # | 질문 | 결정 |
|---|---|---|
| Q-H1 | 관측 바닥 엔진 | **kube-prometheus-stack(Grafana 끔)**: 이전 판 자산 · StackGres 연결 · 경보 규칙 재사용 |
| Q-H2 | StackGres 같은 엔진 operator의 소속(문서 사이 모순: HISS 기반 대 Fabric 공급 면) | **HISS "엔진 설비"**: CRD가 클러스터 범위이고, Fabric 배치 규칙은 CRD를 만들 수 없다(D-54의 KubeVirt 엔진과 같은 원리). Fabric 서비스는 설비 Ready를 사전조건으로 본다 |
| Q-H3 | HISS 변경 승인 | **관리자 MFA + HISS 전용 실행부**(H3). 독립 검토자 승인은 더하지 않는다(스토어 설치와 같은 기준). H3 전까지는 정의 + 운영자 스크립트 + 소유자 승인 |
| Q-H4 | Grafana를 HISS에 둘지 | **두지 않는다.** Console이 Carbon Charts로 그리고, Grafana는 Fabric 관측 서비스(테넌트용)로만 |
| Q-H5 | 메인 메뉴 이름 | **"HISS"**(약어 그대로, 메뉴 설명은 "호스트 인프라 바닥") |
| Q-H6 | 인도 지점 ⑤ 관측 바인딩을 D-86에 더할지 | **더한다**(§2). 인도 지점은 다섯이다 |
| (기존) O-11 | 기본 저장 엔진(외부 Ceph 대 Longhorn) | 미정 유지. H5에서 정하고, 그때까지 Longhorn을 채택 항목으로 운영 |

---

## 11. 위험과 주의

- **제어면 메모리 66~74%:** 관측 구성요소는 작업 노드에만 둔다. 수집 간격 · 보존을 보수적으로 시작한다.
- **이미지 공급:** GHCR이 비공개이고 클러스터에 레지스트리 자격이 없다. 외부 이미지는 digest 고정 · 의존성 예외 기록 · 노드 캐시로 넣는다(기존 방식).
- **RKE2 번들:** metrics-server · Traefik · Cilium · CoreDNS는 RKE2 HelmChart가 소유한다. HISS가 다시 설치하거나 덮어쓰면 RKE2 갱신과 충돌한다 → 감지 · 채택만.
- **클러스터 범위 이름 충돌:** `os-hiss-` 접두. 공용 객체는 건드리지 않는다(2026-11-20 사고의 교훈).
- **AGPL:** StackGres 패치 배포는 소스 공개 의무가 있다. upstream 판을 그대로 쓴다.
- **지금 문제:** `os-hiss-edge-tls`에 Init:Error Job 2개가 남아 있다. 인증서 갱신 상태를 H1에서 먼저 보여 준다.

## 12. 문서 정리

2026-11-23에 결정 대장(D-87)과 네 면 구조 §2.1(엔진 설비 · 관측 바인딩)을 고쳤다. 남은 것은 아래다.


- 여러 문서의 용어 안내가 아직 "HISS → 기반"(D-79)이라고 말한다. D-86 기준으로 고친다.
- `OpenSphere/policies/README.md`의 6계층(Backbone · HISS · PSSS · PFSS …) 표기를 네 면 + 바닥으로 고친다.
- OSR v0.2의 `hiss` 예시(ingress-nginx · cert-manager)를 실제(Traefik · edge TLS)로 바꾼다.
- FOUR-PLANES §2.1 표에 "엔진 설비"와 "관측 바인딩"을 반영한다(Q-H2 · Q-H6 결정 뒤).
