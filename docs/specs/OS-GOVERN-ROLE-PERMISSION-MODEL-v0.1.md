# OS Govern 역할·권한 모델 v0.1

- 날짜: 2026-11-21. 근거: 소유자 Telegram 52871·52873. 유사성 비교가 아니라 OS Govern이 적용할 명시적 역할 모델을 정의한다.
- 상태: 이번 요구에 따른 설계 기준. 로컬 더미는 이 모델의 브라우저 내 실행 구현이며 운영 IAM/PDP/제품 집행 구현이 아니다. 기존 공급 v0.7 실행 기준선·업스트림 선정은 변경하지 않는다.

## 1. Liferay 재조사와 정정

기준은 Portal CE `7.4.3.120-ga120` 고정 소스다. 공식 최신 문서는 버전 차이를 구분한다.

- 역할은 권한의 묶음이고 역할 종류는 배정 문맥을 정한다. Regular(1), Site(2), Organization(3)은 실제 구분이다.
- **이전 검토의 Account·Asset Library를 같은 내부 역할 상수 체계로 보지 말라는 설명은 정정한다.** 현행 `portal-kernel/.../model/role/RoleConstants.java`에는 Account(6), Depot(5), Publications(7), Provider(4)도 있다. deprecated `model/RoleConstants.java`만 보면 불완전하다. Account/Depot의 특수 관리 경로까지 세 핵심 유형과 같다는 뜻은 아니다.
- `ResourceConstants`와 `ResourcePermissionImpl`은 COMPANY/GROUP/GROUP_TEMPLATE/INDIVIDUAL 네 자원 범위를 정의한다. 역할 종류와 자원 범위는 별도 축이다. Regular는 모든 자원 자동 허용이 아니며 개별 자원 허용도 가능하다.
- GROUP_TEMPLATE는 역할을 배정받은 그룹 문맥에 상대적인 범위이지 사이트 템플릿이 아니다.
- 기본 허용은 합산한다. 특정 규칙의 체크 해제가 다른 허용을 취소하지 않는다.
- `ModelResourcePermissionFactory`는 추가 로직의 첫 non-null 결정, Owner, 일반 PermissionChecker 순이다. 모듈 선언만으로 서비스 검사가 삽입되지 않는다. Blogs 원격 서비스의 단건 검사와 filterFind/filterCount 호출은 별개다.
- 동적 모듈은 자원/행위를 등록하고 실제 검사기를 연결한다. 표시 메타데이터, 허용 데이터, 업무 실행·조회 집행은 구별한다.

## 2. OS Govern의 정식 역할 유형

| 안정 유형 | 표시 이름 | 역할 배정 문맥 | 유효성 |
|---|---|---|---|
| REGULAR | 테넌트 역할 (Regular) | 정확히 한 테넌트 | 테넌트 안에서 유효. 실제 접근은 권한 규칙의 자원 범위로 제한 |
| SITE | 업무 공간 역할 (Site) | 정확히 한 업무 공간 | 해당 공간의 현재 유효 구성원에게만 부여. 같은 역할을 여러 공간에 독립 배정 가능 |
| ORGANIZATION | 조직 역할 (Organization) | 정확히 한 조직 | 해당 조직의 현재 유효 구성원에게만 부여. 조직 소유 자원과 연결하며 조직과 공간을 동일시하지 않음 |

이 세 유형을 이번 OS Govern 모델로 **도입한다**. 비슷한 후보라는 표현으로 대체하지 않는다. Site는 OS Govern의 업무 공간 객체를 뜻하고 Liferay 포틀릿/페이지 시스템이나 OpenSphere Workspace 실행면 전체를 복제하지 않는다. Organization은 소속 구조, 업무 공간은 협업/자원 문맥이다. 조직 소속만으로 공간 멤버십이 생기지 않는다. 조직 하위 상속·중첩 그룹·팀·Account/Depot 전용 역할은 v0.1 지원 범위에 포함하지 않는다. 다른 문맥 유형을 미지원 이름으로 조용히 수용하지 않는다.

## 3. 객체와 관계

- Subject: 테넌트 소속 사람/서비스의 안정 ID·활성 상태. 인사 정본을 역할별로 복제하지 않는다.
- Organization: 안정 ID·상위 참조·구성원. v0.1 판정은 정확한 조직만 사용하고 하위 조직 자동 전파 없음.
- Site: 안정 ID·이름·명시 멤버십. 한 조직에 강제 종속하지 않음.
- ResourceType: 공급 주체(Fabric/assembly), 안정 자원 유형 ID, 지원 행위 ID·표시 이름·조회/집행 능력·계약 버전. 페이지/업무 루트/개별 데이터도 별도 유형으로 보호한다.
- ResourceInstance: 테넌트·유형·안정 ID·실제 공간/조직·소유자/원작성자. 클라이언트가 보낸 범위 대신 이 객체 메타데이터로 판정한다.
- RoleDefinition: 안정 ID·테넌트·이름·종류·설명. 종류는 생성 후 불변. 일반 역할에 자동 Administrator 우회 없음.
- RoleVersion: 역할 ID·revision·허용 규칙·작성자·승인자·발행 시각. 초안은 접근을 주지 않으며 발행본은 불변.
- PermissionRule: 자원 유형 + 허용 행위 집합 + 자원 범위 + 필요 대상 참조. 허용 없음과 명시 금지는 구별.
- RoleAssignment: 주체 + 발행 역할 버전 + 배정 문맥 + 유효 기간 + 사유 + 승인·회수 상태. 한 정의를 A/B 공간에 독립 배정한다.
- Decision: 주체·실제 자원·행위·정책 revision·유효 배정 ID·매칭 규칙·최종 결과/근거. 역할 변경으로 기존 배정을 최신 revision에 자동 연결하지 않음.

제공 프로파일은 권한·용량·접속·수명 조건의 재사용 명세로 역할이 아니다. 프로파일이 참조할 역할/배정과 공급 계약은 명시적으로 연결해야 한다. 기존 규칙/프로파일 원장을 임의 흡수하거나 승인 없는 기존 권한 변경을 하지 않는다. 운영 원장은 기반 IGA와 매핑해 단일 정본을 정하며 별도 경쟁 역할 엔진을 미리 선정하지 않는다.

## 4. 자원 권한 범위

| 안정 범위 | 의미 | 제약 |
|---|---|---|
| TENANT | 테넌트 안의 해당 유형 전체 | REGULAR에만 허용. 테넌트 밖으로 확장 불가 |
| CONTEXT | 명시한 특정 공간 또는 조직의 해당 유형 전체 | REGULAR는 명시 공간/조직 선택 가능. 문맥 역할은 배정 문맥과 일치할 때만 적용 |
| ASSIGNED_CONTEXT | 역할을 실제 배정받은 문맥의 해당 유형 전체 | SITE/ORGANIZATION만 가능. A 배정이 B 권한으로 전용되지 않음 |
| INDIVIDUAL | 정확한 자원 인스턴스 | REGULAR도 가능. 문맥 역할이면 개별 객체가 그 배정 문맥에 속해야 함 |

CONTEXT의 참조에는 종류와 ID를 모두 저장한다. 표시 이름이 같은 조직/공간도 다른 객체다. SITE는 실제 resource.siteId, ORGANIZATION은 resource.organizationId와 비교한다. 자원 식별자는 문자열 전방 일치로 추정하지 않는다.

## 5. 판정·관리 규칙

1. 신원·테넌트·활성 주체·유효 자원/행위를 확인한다. 알 수 없는 주체/자원/행위는 허용하지 않는다.
2. 전사 필수 금지·자기승인 금지 등 업무 불변식을 먼저 적용한다. 소유자·운영 관리자도 자동 우회하지 못한다.
3. 필요한 판단 의존성 오류는 ERROR로 기록하고 접근 차단한다. 허용과 혼동하지 않는다.
4. 발행본을 참조하는 승인 배정 중 기간·테넌트·현재 멤버십·문맥이 유효한 것만 모은다.
5. 해당 자원·행위·범위에 매칭되는 허용을 합산한다. 없으면 NOT_APPLICABLE 후 기본 불허다. 하나를 회수해도 다른 유효 허용이 있으면 유지된다.
6. 역할 발행/배정 승인은 작성자와 승인자를 구분하고 입력 snapshot이 바뀌면 재계산한다. 이것은 더미의 모의 절차이며 브라우저가 보안 경계라는 주장이 아니다.

의도적인 Liferay 차이: 필수 금지 우선 합성, 관리자 하드코딩 우회 없음, Guest·Owner 자동 권한 없음, 새 행위 자동 부여 없음, 불변 역할 버전·명시 이전. Liferay의 first-decision-wins 확장을 그대로 적용하지 않는다. 비트마스크나 OSGi를 채택하지 않고 안정 행위 ID를 보존한다.

## 6. 동적 등록·집행과 공급

Fabric/어셈블리 양쪽이 자원·행위·집행/조회/수명/변경 계약을 등록한다. 역할 편집기는 등록된 행위만 제시하고 새 행위는 기존 역할에 자동 추가하지 않는다. 등록이 권한 부여나 제품 지원 실증을 의미하지 않는다. 모의 카탈로그에 없는 행위·미지원 범위는 발행 단계에서 차단한다.

자원 사용과 권한 편집·배정·위임은 별도 행위다. 운영 역할 관리 API 자체에도 관리 권한 검사·상한·직무분리가 필요하다. UI의 작성자/승인자 선택은 실제 로그인 신원이나 관리 PEP의 구현이 아니다.

단건·생성·상태 변경·목록·총개수·검색·집계·내보내기·기존 세션을 각각 시험한다. 외부 제품 ACL/RLS/어댑터가 원격 판정/강제 조건을 집행할 수 없으면 그 기능을 보장한다고 표시하지 않는다. 실제 결과 불명은 회수 완료로 표시하지 않는다. 브라우저 원장에서 회수 완료는 **모의 배정만 비활성화**한 결과다.

## 7. 저장·수용 기준

설계 저장은 기존 PostgreSQL 관계형 참조/상태 + 규칙 JSONB를 우선 매핑한다. 브라우저 더미는 전용 버전 키를 사용하고 기존 프로파일/배정 키를 보존한다. 계약/역할 발행본/배정의 참조 무결성·감사·멱등성과 독립 복구를 운영 구현 시 강제한다.

- RP-01: 세 역할 종류를 생성하고 이름·종류·행위·범위·발행 버전·배정 근거를 확인한다.
- RP-02: 같은 SITE 역할을 A공장 공간과 B공장 공간에 독립 배정. B 배정 이전 A만 허용; 멤버십을 잃으면 기본 불허.
- RP-03: ORGANIZATION 역할은 정확한 조직 소유 자원에만 적용. 공간의 이름/멤버십으로 조직을 추정하지 않음.
- RP-04: REGULAR라도 특정 공간/개별 자원만 허용 가능. TENANT 허용과 개별 허용의 합산·체크 해제·잔여 부여 근거 설명.
- RP-05: 미지원 행위, 잘못된 문맥, 교차 테넌트, 만료/비활성, 자기승인, 승인 후 입력 변경 차단.
- RP-06: 발행본 변경은 새 revision; 기존 배정은 유지. 새 모듈/행위 추가가 구 역할을 확대하지 않음.
- RP-07: 허용이 있어도 필수 금지·자기승인·오류 차단. 운영 집행 미연결을 명시.
- RP-08: 원장 저장/복원, 역할 목록→권한→배정→판정/개인 근거 경로와 Carbon v12·반응형·키보드 검증.

## 8. 검토 근거

공식 문서: [역할 이해](https://learn.liferay.com/w/dxp/security-and-administration/users-and-permissions/roles-and-permissions/understanding-roles-and-permissions), [역할 권한 정의](https://learn.liferay.com/w/dxp/security-and-administration/users-and-permissions/roles-and-permissions/defining-role-permissions), [배정](https://learn.liferay.com/w/dxp/security-and-administration/users-and-permissions/roles-and-permissions/assigning-users-to-roles), [사이트 팀](https://learn.liferay.com/w/dxp/sites/site-membership/creating-teams-for-sites).

고정 소스(7.4.3.120-ga120):
- [RoleConstants (현행)](https://github.com/liferay/liferay-portal/blob/7.4.3.120-ga120/portal-kernel/src/com/liferay/portal/kernel/model/role/RoleConstants.java)
- [ResourceConstants](https://github.com/liferay/liferay-portal/blob/7.4.3.120-ga120/portal-kernel/src/com/liferay/portal/kernel/model/ResourceConstants.java)
- [ResourcePermissionImpl](https://github.com/liferay/liferay-portal/blob/7.4.3.120-ga120/portal-impl/src/com/liferay/portal/model/impl/ResourcePermissionImpl.java)
- [ModelResourcePermissionFactory](https://github.com/liferay/liferay-portal/blob/7.4.3.120-ga120/portal-kernel/src/com/liferay/portal/kernel/security/permission/resource/ModelResourcePermissionFactory.java)
- [AdvancedPermissionChecker](https://github.com/liferay/liferay-portal/blob/7.4.3.120-ga120/portal-impl/src/com/liferay/portal/security/permission/AdvancedPermissionChecker.java)
- [Blogs 권한 선언](https://github.com/liferay/liferay-portal/blob/7.4.3.120-ga120/modules/apps/blogs/blogs-service/src/main/resources/resource-actions/default.xml)
- [Blogs 원격 서비스](https://github.com/liferay/liferay-portal/blob/7.4.3.120-ga120/modules/apps/blogs/blogs-service/src/main/java/com/liferay/blogs/service/impl/BlogsEntryServiceImpl.java)
- [PortletConfigurationExtender](https://github.com/liferay/liferay-portal/blob/7.4.3.120-ga120/modules/apps/portal/portal-spring-extender-impl/src/main/java/com/liferay/portal/spring/extender/internal/configuration/PortletConfigurationExtender.java)
