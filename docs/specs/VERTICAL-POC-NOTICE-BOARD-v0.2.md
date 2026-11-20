# 공지 게시판 수직 PoC 명세 v0.2

- 상태: 소유자 결정 반영, 2026-11-21. §12의 N1~N3도 결정됨(기준 도메인 `dev.opensphere.co.kr`, DNS → 클러스터 망 공인 주소 175.45.161.138 → 입구 노드 10.10.1.37, 공인 와일드카드 ACME DNS-01 · Technitium).
- v0.1과 다른 점: 소유자 지시 "정공법으로 간다. 다만 필요한 Fabric은 계획대로 모두 구현하지 않고 간략 버전으로, 필요 최소 기능만". v0.1 §10의 지름길 권고(Backbone Auth에 사원 계정, 단일 입구 경로 나누기, `/workspace/apps/` 경로)를 모두 버린다.
- 소유자 결정(2026-11-21): 주소 = 소유자 도메인의 하위 주소, 앱 입구 = Traefik 노드 443, 사원 신원 = Samba AD까지, Keycloak = 26.8.2 이상.
- 규범: [ASSEMBLY-FABRIC-SUPPLY-v0.7](ASSEMBLY-FABRIC-SUPPLY-v0.7.md)(AF7), [TENANT-ASSEMBLY-SPEC-v0.1](TENANT-ASSEMBLY-SPEC-v0.1.md)(TAS), [ASSEMBLY-CATALOG-v0.1](ASSEMBLY-CATALOG-v0.1.md)(CAT), [FOUR-PLANES](../overview/FOUR-PLANES.md)(FP), 결정 대장([OPENSPHERE-LAYER-BASELINE-v0.2](../architecture/OPENSPHERE-LAYER-BASELINE-v0.2.md) 부록 A).

## 0. 무엇을 "있어야 할 것"으로 보는가

공지 게시판 하나를 사원이 쓰려면 설계상 다음이 모두 있어야 한다. 이 PoC는 이것을 하나도 건너뛰지 않고, 각각을 **최소판**으로 만든다.

| 계층 | 있어야 할 것 | 근거 | 최소판에서 빠지는 것 |
|---|---|---|---|
| HISS | 앱 입구(Traefik 443), 주소(DNS), TLS | FP §2 | 여러 입구 노드 · 부하 분산 |
| Fabric | PostgreSQL(있음), **Samba AD**, **Keycloak** 서비스 · 인스턴스 | FP §3 표, D-3, D-56 | 세부 화면(13개 탭), 복제 · 백업 · 갱신 |
| 테넌트(Genesis) | 회사 하나, 핵심 어셈블리 identity · governance, 부트스트랩 계정 · 인도 코드 | TAS §4.1 · §8, D-83, D-85 | trust · channel 어셈블리, 영역 KMS, 복구 키 |
| 어셈블리 | 공지 게시판 어셈블리(정의 · 계획 · 승인 · 실행 · 적합성 시험 · 해체) | AF7 §7 | 단계 DAG · 재개 · 보상, 서비스 켜기 포함 |
| Governance | 리소스 유형 인계, 배정 · 회수 기록 | D-82, D-84 | 결재 흐름 · 위험 등급 · 재검토 |
| 입구 | 회사 관리 콘솔(구성 구역 · 배분 구역), Workspace, 앱 앞 SSO 프록시 | D-84, FP §6.2 | 신청 · 결재함 · 위임 관리 |

## 1. 완료 기준 (사람이 하는 일로)

| # | 누가 | 어디서 | 하는 일 | 보이는 결과 |
|---|---|---|---|---|
| 1 | 플랫폼 운영자 | Backbone Console · Fabric | Samba AD · Keycloak 서비스 켜기(PG는 켜져 있음) | Fabric 목록에 두 서비스가 "켜짐" |
| 2 | 플랫폼 운영자 → 소유자 | Backbone Console · 회사 · 소유자 터미널 | 회사 만들기(Genesis, MFA). 인도 코드는 **소유자 터미널에 한 번만** 나온다 | 회사 상태 Active. Fabric에 소유자 "회사: identity"인 AD 인스턴스 · Keycloak 인스턴스 · PG가 생김 |
| 3 | 회사 소유자 | 회사 관리 콘솔 | 인도 코드로 부트스트랩 계정 로그인 → 비밀번호 · MFA 등록 → 내장 AD에 실명 소유자 만들기 → 실명으로 다시 로그인 | 부트스트랩 계정이 자동으로 닫힘(D-85). 이후 사원 계정은 AD에 있다 |
| 4 | 테넌트 관리자 | 회사 관리 콘솔 · 구성 구역 | 사원 계정 하나 만들기, 카탈로그에서 "공지 게시판" 고르고 계획(PG 자리 · 단계)을 보고 MFA로 승인 | 어셈블리 진행 → Active. Fabric에 소유자 "어셈블리: 공지 게시판"인 PG 자원 |
| 5 | (자동) | — | Core가 정하고 실행부가 단계 실행 → Active 때 `portal.notice-board`를 Governance에 인계 | 사람이 kubectl을 쓰지 않는다. 배분 구역에 리소스가 나타남 |
| 6 | Governance 소유자 | 회사 관리 콘솔 · 배분 구역 | `portal.notice-board`를 사원에게 배정 | 배정 기록(누가 · 누구에게 · 언제) |
| 7 | 사원 | Workspace | 사원 계정(AD)으로 로그인 → "공지 게시판" 타일 → 글 쓰기 · 읽기 | 플랫폼 HTTPS 주소(§6)에서 열림. 사원 PC에서 실행하는 것 없음 |
| 8 | Governance 소유자 | 배분 구역 | 배정 회수 | 사원 Workspace에서 사라지고 직접 주소도 거절 |
| 9 | 테넌트 관리자 | 구성 구역 | 어셈블리 해체(MFA) | 엔진 정지 · 인도 철회 · 접근 폐기 · 데이터 보존(AF-7) |

1~9를 운영에서 한 번 끝까지 돌리면 PoC 완료다. 화면은 이름 · 목록 · 핵심 동작만 있으면 된다.

## 2. 주소와 입구 (HISS)

### 2.1 앱 입구

- 운영 클러스터의 rke2-traefik(v3.7, IngressClass `traefik`)는 **이미 워커 7대의 hostPort 443**에 떠 있다(2026-11-21 확인). 다만 입구 전용 노드 `rke2-ingress-1`(10.10.1.37, taint `node-role.kubernetes.io/ingress`)에는 뜨지 않고, 마스터 10.10.1.31에도 없다.
- 정공법: Traefik을 **입구 노드에만** 둔다(HelmChartConfig로 nodeSelector `node-role.kubernetes.io/ingress=true` + 그 taint 허용). 워커의 443은 닫힌다. 공개 DNS는 입구 노드를 가리킨다(§12 N2).
- Backbone 관리 Console은 지금처럼 NodePort 31443(nginx)에 남는다. 회사 관리 콘솔 · Workspace · 사원 앱은 31443에 섞지 않는다(D-84: 별도 주소 · 세션).
- 노출은 플랫폼이 한다: Ingress는 어셈블리 계획의 "노출" 단계가 만들고, 엔진 설치 허용 범위는 Ingress를 금지한다(§5).

### 2.2 주소 (기준 도메인 `<base>` = 소유자 도메인의 하위 주소, §12 N1)

| 주소 | 무엇 | 세션 · 로그인 |
|---|---|---|
| `id.<base>` | 테넌트 Keycloak(사원 신원) | Keycloak 자체 |
| `admin.<base>` | 회사 관리 콘솔(구성 구역 · 배분 구역) | OIDC 클라이언트 `company-console`, MFA 필수 |
| `workspace.<base>` | Workspace | OIDC 클라이언트 `workspace` |
| `board.<base>` | 공지 게시판(회사 앱) | 앱 게이트웨이(§6), OIDC 클라이언트 `app-gateway` |

- 공지 게시판은 테넌트 관리자가 설치하고 Governance가 배분하는 **회사 앱**(FP §6.1 3단계: 서비스 신원 · Governance 배분)이므로 회사 도메인 쪽 주소를 쓴다. 사원 개인 앱 도메인(`*.회사-apps.net`, FP §6.3)은 이 PoC에 필요 없다.
- 쿠키는 모두 호스트 한정(`Domain` 속성 없음), `Secure` · `HttpOnly` · `SameSite=Lax`.

### 2.3 TLS

- 인증서 출처는 §12 N3. 어느 쪽이든 인증서는 `kube-system`의 Traefik 기본 TLSStore 하나(와일드카드 `*.<base>`)로 건다. 엔진 namespace에 인증서 Secret을 두지 않는다.

## 3. Fabric 최소판: Samba AD · Keycloak

PG처럼 **서비스 켜기 + 인스턴스 만들기 + 목록**만 만든다. 세부 화면(13개 탭)은 이후. 각 서비스는 서명된 provider 모듈과 materializer profile 하나를 갖는다(OSR v0.2 §3). 실행부 경계(`os-backbone-mod-*`, 웹훅 대조)는 PG와 같다.

### 3.1 `provider.samba-ad` · profile `provider.samba-ad-dc` 0.1.0

| 항목 | 최소판 |
|---|---|
| 이미지 | Samba 4.2x AD DC 이미지를 CI(운영 RKE2 러너, amd64)로 만들고 digest로 고정. ARM 빌드 없음 |
| 서비스 켜기 | 이미지 digest와 profile을 신뢰 목록에 적재. 클러스터 범위 객체를 만들지 않는다 |
| 인스턴스 | StatefulSet 1(DC 하나, 복제는 이후), PVC 1, Service(LDAPS 636만, 클러스터 안), NetworkPolicy(636은 Claim한 namespace만) |
| 프로비저닝 | 첫 기동 때 `samba-tool domain provision`(realm `CORP.<base>` 대문자, NetBIOS `CORP`, 내장 DNS). xattr는 `xattr_tdb`로(SYS_ADMIN 없이). **Administrator 비밀번호는 컨테이너 안에서 무작위로 만들고 어디에도 내보내지 않는다**(D-85의 "보여 주지 않음". 영역 KMS 봉인은 이후) |
| LDAPS 인증서 | 테넌트 CA가 생기기 전이므로 인스턴스마다 자체 CA로 발급하고, CA 인증서(공개)만 인도 Secret에 넣는다 |
| 인도 단위(Claim) | `directory-bind`: 서비스 계정 하나 + OU 하나. 실행부가 비밀번호를 만들어 ① AD 쪽 계정 생성 Secret(AD namespace, 마운트용) ② 인도 Secret(소비자 namespace: `url` · `baseDN` · `bindDN` · `password` · `caCert`)을 쓴다. 실행부는 Secret을 쓰기만 하고 읽지 않는다(지금 binding writer와 같음) |
| 권한 | Claim 계정에 그 OU의 사용자 만들기 · 비밀번호 설정 권한만 위임(`samba-tool dsacl`). 도메인 관리자 권한 없음 |

### 3.2 `provider.keycloak` · profile `provider.keycloak` 0.1.0

| 항목 | 최소판 |
|---|---|
| 이미지 | `quay.io/keycloak/keycloak:26.8.2`(이상), digest 고정. 소유자 지시: 26.8.2 미만 금지 |
| 서비스 켜기 | 이미지 digest와 profile 적재. **Keycloak Operator를 쓰지 않는다**(CRD · ClusterRole이 필요해 실행부 경계를 넓혀야 함). Keycloak은 상태를 DB에 두므로 Deployment로 표현해도 "상태 저장 엔진을 Deployment 하나로"(OSR v0.2)에 걸리지 않는다 |
| 인스턴스 | Deployment 1, Service, NetworkPolicy. DB는 **Fabric PG Claim**(소유자 `instance:keycloak/<이름>`, 기존 공용 PG 자리 또는 새 인스턴스) — Fabric 안의 의존도 AF-I4 발급 경로를 그대로 탄다 |
| 인도 단위 | `realm`: realm 하나 + OIDC 클라이언트들. 첫 설정은 `--import-realm`(기동 때 없는 realm만 가져옴)으로, 비밀 값은 realm 파일의 `${ENV}` 자리표시에 Secret env로 넣는다. 실행부가 Keycloak 관리 API를 부르지 않는다 |
| 관리 경로 | realm 안의 서비스 계정 클라이언트 `tenant-admin-api`(realm-management 중 users · groups 관리만). 회사 관리 콘솔만 이 자격을 받는다 |
| 노출 | `id.<base>` Ingress는 Genesis 계획의 노출 단계가 만든다. Keycloak 관리 콘솔(`/admin`)은 Ingress에서 막는다 |

### 3.3 Backbone Console 화면

- Fabric 목록에 "Samba AD" · "Keycloak" 행 추가(로고는 logos.opl.io.kr). 각 서비스: 켜짐 여부, 인스턴스 목록(이름 · 소유자 · 상태 · 쓰는 곳), 인스턴스 만들기(MFA). PG 화면과 같은 틀을 쓴다.

## 4. 테넌트와 Genesis (최소판)

### 4.1 회사 만들기

- 한 설치 = 한 회사(D-14). Backbone Console에 "회사" 화면을 두고, 회사가 없을 때만 "회사 만들기"를 보인다(MFA). 입력: 회사 표시 이름, 기준 도메인 `<base>`.
- Genesis는 **OSR 계획 하나**다(Core가 정하고 실행부가 실행, 웹훅이 대조). 단계:

| 단계 | 내용 |
|---|---|
| G1 | 테넌트 namespace 집합: `os-tenant-identity`, `os-tenant-governance`(이름은 실행부 경계 안에 들도록 `os-backbone-mod-tenant-*`로 둘 수 있다, 구현 때 웹훅 규칙과 맞춘다) |
| G2 | identity 어셈블리: Samba AD 인스턴스(자리 `assembly`), `directory-bind` Claim → Keycloak namespace로 인도 |
| G3 | Keycloak 인스턴스 + 그 PG Claim, realm `company` 가져오기: LDAP 연동(WRITABLE, 사용자 OU = G2 OU, LDAPS + 인도된 CA), OTP 정책, 역할 `tenant-admin` · `governance-owner` · `employee`, 클라이언트 `company-console` · `workspace` · `app-gateway` · `tenant-admin-api` · `osr-core`(audience) |
| G4 | **부트스트랩 계정** `bootstrap-owner`: LDAP과 연결되지 않은 로컬 계정, 역할 `tenant-admin` · `governance-owner`, 필수 동작 비밀번호 변경 · OTP 등록. 처음 비밀번호 = 인도 코드. realm 파일에는 **해시(pbkdf2-sha512)만** 들어간다(SCRAM verifier와 같은 원칙) |
| G5 | governance 어셈블리: 전용 PG(D-57, 새 인스턴스), 회사 관리 콘솔 · Workspace 엔진 설치(§7) |
| G6 | 노출: `id.` · `admin.` · `workspace.` Ingress |
| G7 | Core에 테넌트 발급자(issuer `https://id.<base>/realms/company`, JWKS) 등록. 이후 테넌트 쪽 승인은 이 발급자의 토큰으로만 받는다(§8) |

- 인도 코드는 **소유자 터미널에서만** 만든다: 소유자가 `genesis-code` 명령을 실행하면 코드를 만들고 화면에 한 번 보여 주고, 해시만 Core에 넘긴다(회사가 직접 설치하는 경우의 D-85 경로. 지금 서명 키 적재와 같은 방식). 나는 코드를 보지 않는다.

### 4.2 첫 로그인 (D-85)

1. 소유자가 `admin.<base>` → Keycloak 로그인 → `bootstrap-owner` + 인도 코드 → 새 비밀번호 · MFA 등록.
2. 회사 관리 콘솔 첫 화면이 "실명 소유자 만들기"만 보여 준다: 이름 · 아이디 → Keycloak 관리 API → LDAP WRITABLE로 AD에 생성, 역할 두 개 부여.
3. 실명 계정으로 다시 로그인(첫 로그인 때 비밀번호 · MFA 등록)하면 콘솔이 `bootstrap-owner`를 비활성으로 바꾼다. 이후 다시 여는 길(복구 키 M-of-N, D-42)은 이 PoC에 없다(§10).

## 5. 엔진 설치 허용 범위 `engine.web-stateless` 0.1.0

- 허용: Deployment(최대 2), Service(최대 2), ConfigMap(최대 2), Job(1, 초기화), NetworkPolicy. Secret은 만들지 않는다(인도로 받음).
- 금지: Ingress · HTTPRoute · IngressRoute(노출은 계획의 노출 단계), ClusterRole · ClusterRoleBinding · CRD, privileged, hostPort.
- 엔진 namespace: `os-backbone-mod-engine-<엔진>-<짧은 ID>`.
- 회사 관리 콘솔 · Workspace · 공지 게시판 엔진이 모두 이 범위로 설치된다.

## 6. 공지 게시판과 앱 게이트웨이

### 6.1 어셈블리 정의 `assembly.notice-board` 0.1

```yaml
kind: AssemblyDefinition
metadata: { name: notice-board, version: "0.1" }
spec:
  components:
    - name: board
      engine: { module: engine.notice-board, version: ">=26.11" }
      requires:
        - name: store
          service: { module: provider.postgres, version: ">=26.11 <27" }
          kind: database
          plan: { min: pg.small }
          storage: { sizeGiB: 1, maxGiB: 20 }
          connections: 5
          access: owner
          placement: { allow: [assembly, shared], suggest: assembly }
          deliver: { form: env-secret }
  expose:
    - host: board                      # board.<base>
      via: app-gateway                 # 직접 노출 금지, 게이트웨이 뒤
  offers:
    - resourceType: portal.notice-board
      actions: [use]
      allocation: { units: [user] }
  conformance:
    - board-write-read
```

### 6.2 엔진 `engine.notice-board`

- 정적 화면 + PostgREST(이미 클러스터에 있는 이미지, digest 고정). 화면 · 설정은 모듈 패키지의 정적 층. 새 앱 이미지를 만들지 않는다.
- 게시판은 자기 사용자 관리가 없다. 글쓴이는 게이트웨이가 넘기는 `X-Forwarded-User`(검증된 사원 ID)로 기록한다.

### 6.3 앱 게이트웨이 (FP §6.2의 "인증은 플랫폼이 한다")

- `board.<base>` 요청은 Traefik → **앱 게이트웨이**(Workspace 엔진의 일부, §7) → 엔진 Service로 간다. 엔진 NetworkPolicy는 게이트웨이에서 오는 연결만 받는다.
- 게이트웨이는 요청마다 ① 사원 세션(OIDC `app-gateway`, 호스트 한정 쿠키) ② Governance에 그 사원의 `portal.notice-board` 배정이 active인지 ③ 어셈블리 Active를 확인한다. 하나라도 아니면 403 화면. 배정 확인은 짧게(30초) 캐시한다. 회수는 30초 안에 막힌다.
- 게이트웨이는 사원의 토큰을 엔진에 넘기지 않는다. 엔진은 `X-Forwarded-User`만 받는다.

## 7. 회사 관리 콘솔 · Workspace 엔진

- 이미지 하나 `opensphere-tenant-portal`(Rust, CI amd64)을 두 모드로 띄운다. 모드마다 Deployment · OIDC 클라이언트 · 세션이 따로다(D-84 "별도 주소 · 세션").
  - `company-console` 모드(`admin.<base>`): 구성 구역 + 배분 구역 + Governance 기록. DB = governance 전용 PG(D-57).
  - `workspace` 모드(`workspace.<base>`, `board.<base>`의 게이트웨이): 내 앱 목록, 앱 게이트웨이. Governance 기록은 회사 관리 콘솔의 내부 API로 읽기만 한다(namespace 사이 NetworkPolicy로 그 경로만 연다).
- 권한 검사: 구성 구역은 `tenant-admin`, 배분 구역은 `governance-owner`를 **따로** 검사한다. PoC에서 같은 사람이 둘 다 가져도 합치지 않는다. 회사 관리 콘솔은 MFA(`acr`에 OTP)를 요구한다.
- 이 엔진은 Backbone 소스가 아니라 **테넌트 면의 OSR 엔진 모듈**이다. Backbone Console · Core와 코드를 공유하지 않는다(경계 B-1 · B-2).

### 7.1 화면 (최소)

| 입구 | 화면 | 내용 |
|---|---|---|
| 회사 관리 콘솔 | 첫 화면(부트스트랩 때만) | 실명 소유자 만들기 |
| 구성 구역 | 사원 | 목록 · 만들기(AD에 생성) · 사용 중지 |
| 구성 구역 | 어셈블리 | 카탈로그, 내 어셈블리(상태 · 단계 진행), 추가(자리 → 계획 → MFA 승인), 해체(MFA) |
| 배분 구역 | 리소스 | 인계받은 리소스 유형(용량 · 어셈블리 상태), 배정 목록, 배정 · 회수 |
| Workspace | 내 앱 | 배정받은 앱 타일 → `board.<base>` |
| Backbone Console | Fabric · 회사 | §3.3, §4.1 |

## 8. 승인과 Core (테넌트 쪽 MFA)

- 어셈블리 계획은 Backbone Core가 정하고 승인 digest로 묶는다(AF-3, 지금 그대로). 바뀌는 것은 **승인자 신원**: 테넌트 계획의 승인은 Backbone Auth(Console 관리자)가 아니라 테넌트 Keycloak 토큰으로 한다.
- 회사 관리 콘솔이 승인 직전에 재인증(`prompt=login`, `max_age=0`)을 받고, 그 액세스 토큰(audience `osr-core`, `acr` = OTP, `auth_time` 5분 안, 역할 `tenant-admin`)을 계획 digest와 함께 Core에 넘긴다. Core는 G7에서 등록한 JWKS로 서명을 검증하고 스스로 판단한다. 토큰 원문은 기록하지 않고 `sub` · `jti` · `auth_time`만 남긴다.
- Backbone 관리자는 테넌트 계획을 승인할 수 없고, 테넌트 관리자는 Fabric 공급 계획을 승인할 수 없다(B-1).

## 9. Governance 인계와 배분 (최소 기록)

- 인계(AF7 §7.6): 어셈블리 Active 때 `{리소스 유형, 용량, 정의 generation, 활성 조건}`. Degraded면 새 배정을 막는다.
- 배정: `{리소스 유형, 단위 user, 대상(Keycloak sub · AD 아이디), 부여자, 시각, 상태 active · revoked}`. 자기 배정 금지(부여자 ≠ 대상).
- 앱 자신의 DB는 어셈블리 Claim이지 배분이 아니다(D-82). 서명된 Grant(D-31)는 쓰지 않는다.

## 10. 최소판의 한계 (이후 판에서)

| 기준 | 최소판 | 이후 |
|---|---|---|
| Samba AD ×2 · 복제 · 백업 | DC 하나, 백업 없음 | identity 어셈블리 정식판 |
| 영역 KMS 봉인(D-85) | Administrator 비밀번호는 내보내지 않고 버림 | trust 어셈블리 |
| 복구 키 M-of-N(D-42) | 없음. 소유자 계정을 잃으면 Genesis를 다시 | 복구 설계 |
| AF7 단계 DAG · 재개 · 보상 | 순서 고정, 실패 시 Blocked, 해체로 정리 | AF-I7 |
| 서비스 켜기 포함(AF-4) | 꺼져 있으면 멈춤 | 다음 판 |
| Governance 결재 · 위험 등급 · 재검토 | 직접 배정 · 회수만 | Governance 정식판 |
| SCIM 프로비저닝(O2 §3) | 게이트웨이 확인으로 대신 | 자체 사용자가 있는 앱부터 |
| Fabric 세부 화면 | 목록 · 만들기만 | 템플릿 13개 탭 |

## 11. 구현 순서

| 단계 | 내용 | 운영에 닿는가 |
|---|---|---|
| V1 | kubectl로 띄운 게시판 제거, 발급 회수(해제) 기능, 수동 Claim `cj25mvpabuh6` 회수 | 예(확인 후) |
| V2 | HISS: Traefik 입구 노드 배치, 공개 DNS(소유자), TLS(§12 N3) | 예(확인 후) |
| V3 | Samba AD 프로브(격리 namespace: 프로비저닝 · LDAPS · 위임 권한 · Keycloak 연동) → profile · 모듈 · 서비스 켜기 · 인스턴스 · `directory-bind` | 격리 → 운영 |
| V4 | Keycloak profile · 모듈(26.8.2+, PG Claim, realm 가져오기) · 인스턴스 | 격리 → 운영 |
| V5 | `engine.web-stateless`, Genesis 계획(G1~G7), `genesis-code` 소유자 명령, Backbone Console 회사 화면, Core 테넌트 발급자 검증 | 격리 → 운영 |
| V6 | `opensphere-tenant-portal`: 회사 관리 콘솔(첫 로그인 · 사원 · 어셈블리 · 배분) · Workspace · 앱 게이트웨이 | 격리 → 운영 |
| V7 | `engine.notice-board`, 어셈블리 정의 · 계획 · 노출 단계 · 적합성 시험 · 인계 · 해체 | 격리 → 운영 |
| V8 | §1의 1~9를 운영에서 | 예 |

- 각 단계는 격리 namespace에서 시험용 키 · 시험용 신뢰 상태로 먼저 확인하고(운영 서명 키를 쓰지 않음), 운영 반영 · 서명 · 게시는 매번 소유자 확인을 받는다.
- 클러스터 범위 객체(ClusterRole · VAP)는 격리용을 다른 이름으로 둔다.

## 12. 소유자 결정 (2026-11-21 결정됨)

| # | 항목 | 결정 |
|---|---|---|
| N1 | 기준 도메인 `<base>` | **`dev.opensphere.co.kr`** → `id.` · `admin.` · `workspace.` · `board.dev.opensphere.co.kr`. AD realm은 `CORP.DEV.OPENSPHERE.CO.KR`(클러스터 안에서만) |
| N2 | 공개 DNS 대상 | **`*.dev.opensphere.co.kr` → 175.45.161.138**: RKE2 노드가 있는 망의 공인 주소(2026-11-21 확인: 노드의 나가는 주소는 같은 대역 175.45.161.140). 그 망에서 입구 노드 `rke2-ingress-1`(10.10.1.37)의 443 · 80으로 넘어간다. Traefik은 그 노드에만 둔다. 도달 여부는 개발 위치가 아니라 클러스터 망 기준으로 본다 |
| N3 | TLS 인증서 | **공인 와일드카드, ACME DNS-01**(Let's Encrypt). `*.dev.opensphere.co.kr` 하나 |

### 12.1 N3를 하는 방법 (최소판)

- 2026-11-21: `opensphere.co.kr`의 네임서버는 소유자가 운영하는 **Technitium DNS**(`ns1.opl.io.kr`)다. `*.dev.opensphere.co.kr` A 175.45.161.138 등록됨.
- 새 구성요소(cert-manager)를 들이지 않는다. **Traefik 내장 ACME**(certResolver, DNS-01)를 쓴다. Traefik v3.7은 lego v4.35를 품고, lego는 v4.20부터 `technitium` 제공자를 지원한다(`TECHNITIUM_SERVER_BASE_URL`, `TECHNITIUM_API_TOKEN`). Traefik이 입구 노드 하나에만 뜨므로 ACME 저장 파일 하나(입구 노드의 hostPath)로 충분하다.
  - HelmChartConfig `rke2-traefik`: nodeSelector · toleration(입구 노드), `certificatesResolvers.le.acme.dnsChallenge.provider=technitium`, `entryPoints.websecure.http.tls.certResolver=le`, `tls.domains[0].main=dev.opensphere.co.kr`, `sans=*.dev.opensphere.co.kr`.
  - Technitium API 토큰은 **이 영역(`opensphere.co.kr`) 수정 권한만 가진 전용 사용자**로 만들고, **소유자가 터미널에서** `kube-system` Secret으로 적재한다. 나는 값을 보지 않는다.
- 소유자가 할 일: ① Technitium에 ACME 전용 사용자 · 영역 권한 · API 토큰 ② 그 API 주소(`TECHNITIUM_SERVER_BASE_URL`) 알려 주기 ③ 토큰 적재.
