# Nexus 원 감사17건의 후속 대장

기준일: 2026-11-17. 원 감사 기준선은965c78e다. 아래는 Setup49/51/52 및 현행 소스·수용 기록을 대조한 **Jupiter 후속 판정**이며 외부 감사인의 종결 승인이나 독립 재감사 결과가 아니다.

원본 `RedTeam-Audit-OS-Nexus-v0.1.md`·finding CSV·답변·재반박·재평가는 DevOps의 `Projects/OpenSphere/Reviews/nexus-design-20261116/`에 보존한다. Blueprint의 [전체 설계 레드팀 보고서](../reviews/OPENSPHERE-DESIGN-REDTEAM-REVIEW-v0.1.md)는 별도 보고서이며, 같은 R-번호라도 같은 항목으로 병합하지 않는다.

**판정 규칙:** 조치/거절/실증된 범위를 쓴다. 주변 조건·잔여 위험이 있으면 부분 조치로 둔다. 새 후속 근거가 없으면 해결됨으로 올리지 않는다. 원 보고서의 과거 주장을 지우지 않는다.

| 원 Nexus ID | 쟁점 | 후속 조치·증거 | 잔여 판단 |
|---|---|---|---|
| R-01 | 공개 internal·클러스터 도달·secret 공급 | 관리 nginx의 `/internal` 차단, 실제 경계404, callback 확인·기존 HMAC 보존(Setup49). 원 표현의 “인터넷/모든 Pod”는 재평가에서 범위를 정정 | **부분 조치.** R2D2 프로세스 안의 자격 참조+토큰 집중과 허용된 내부 경로는 별도 신뢰 경계. 모든 내부 peer 차단/공급자 키 비접근 완료 아님 |
| R-02 | 변경 경로와 대장 누락 | 고정 mutator 사전 등록·권한/감사, 변경 별도 예산. 이후43파일/305단서 AST 검토 및 누락 조회 인계까지 확대(49/52) | **합의 범위 조치·검증.** 동적/외부 엔진/SQL 의미·전기능 업무 검수까지 전수 증명한 것은 아님 |
| R-03 | 자체 가입·Core 진입 신뢰·네트워크 | GoTrue 자체 가입 비활성, 실제 고정 operator 확인·격리 Auth 거절. 공개 가입 경로 기존 차단 유지 | **부분 조치.** trial 비활성 등 성립 조건 정정. 모든 Core/Auth/PG 네트워크·입구가 전면 개편됐다는 주장 없음 |
| R-04 | 거친 Management 게이트·위임/descriptor 과장 | 새 업무별 세분화 인가를 추가하지 않는다고 명시. 위임 허용 scope·현재 회원·인계 시 회수 거절, final Owner 검증, policy 표와 지문 | **의미 정정+범위 조치.** UI metadata나 descriptor는 capability 아님. 전사 Governance PDP 구현으로 닫지 않음 |
| R-05 | Console 침해 시 승인자 사칭·자격 집중 | Core 발급 challenge·독립 사용자 P256 서명·운영자 통제 키 등록/회수·최종 현재키/역할/revision 확인. 실제15항목, CLI Keychain 서명·원문 증거/오프라인 확인 | **보호 승인 범위 조치·검증.** Console의 일반 세션·모델 자격 집중 전부 제거 아님. Core/operator/host/서명 클라이언트 침해 저항 증명 아님 |
| R-06 |4초 취소·영구 pending·결과 불명 | 변경 future에 짧은 query 취소 미적용, Magpie2분 경과 pending→unknown 및 원래 lease만 정착.52에서 상태 조회도 native 조정 의미 유지 | **범위 조치·실증.** unknown은 실패·재시도 권한 아님. Magpie 범용 자동 복구 완료 아님 |
| R-07 |Auth HTTP 동안 PG 점유·refresh 경합·예산 | 트랜잭션 밖 Auth·native refresh 단일 writer/불명 claim, effect4/delegate2 분리. 지연 시험 점유3→0·두 Console refresh1 | **부분 조치.** 전체 부하/공정성·운영 처리량/SLA는 미측정. DB pool 확대가 해결이라는 주장 없음 |
| R-08 |통지 토큰으로 임의 수신자 위장 | 기존 관계·신원/세대 통지 계약과 HMAC/source 이벤트는 존재. 최소 Nexus 조치가 이 지적 전체를 닫았다는 증거는 없음 | **추가 검증 필요.** 임의 수신자·operation 관계·내부 토큰 침해 반례를 별도 확인. 통지를 승인으로 신뢰 금지 |
| R-09 |결정/실행/내부 호출 감사 상관 누락 | observation `x-nexus-decision-id`, 효과 전 필수 감사, 보호 승인 원문·Core 원장 보존, 실제 응답/감사 상관 시험 | **부분 조치.** 모든 내부 인증 실패·secret 공급·최종 효과까지 완전 상관된 분산 trace가 입증된 것은 아님. result 감사 best-effort 유지 |
| R-10 |source_confirmed 고정값·수기 stage·검사 부족 | UI를 source 목록/연결 현황으로 한정. AST drift guard와 실제 위임/status/실패 시험 추가. 현재 metadata·정책 지문과 증거 범위 표시 | **표시/검사 보완.** 목록38행·source hash를 업무별 통제 완전성/성공률로 바꾸지 않음 |
| R-11 |Auth 프록시 throttle·pgcrypto CPU 추정 | 원 감사도 성립 조건·추정 부분 구분 필요. 이번 후속에서 전체 proxy/rate-limit/DB function 자원 통제가 해결됐다는 전용 증거는 없음 | **미종결·별도 검증.** 실제 부하 시험·정책을 확인하기 전 악용 성공/해결 어느 쪽도 단정 금지 |
| R-12 |레거시 Broker 토큰·샌드박스 권한 | native 고정 변경 경로 사전 감사·위임 거절은 보완. native OpenShell 고정 실행 수용 범위와 레거시 Broker 전면 제거는 다름 | **부분 조치/재확인.** 모든 legacy token·생성 상한·소유권 문제 종결로 표현하지 않음 |
| R-13 |도구 토큰 강도·공유 | status/knowledge 등 별도 토큰 plane의 허용 행위는 구분. 이번 최소 조치가 모든 기존 토큰의 최소 길이/회전을 입증하지 않음 | **미종결.** 자격 분리·강도·회전 native 검증 필요 |
| R-14 |Realtime WS 인증/프록시 Host | 데이터/stream native 전용 경로 유지. 외부 Auth·RLS·native 의미를 관리 dispatcher로 대체하지 않음 | **미종결.** 당시 hardcoded Host/WS 신원·정상 권한 조합의 최신 별도 재검증 필요 |
| R-15 |Magpie 원본 query 전달 | Magpie pending/unknown 수정은 query 허용 범위 축소와 별개 | **미종결.** 허용 parameter 계약·오류/secret 유출 반례를 별도 확인 |
| R-16 |실행 시 reviewer 관리자 재확인 | 보호 승인 최종 guard의 현재 역할/키 세대/revision 검증·회수 반례 시험. enrollment는 역할 부여와 분리 | **보호된 경로 조치.** 전 호출 경로/전 업무 권한으로 확대하지 않음 |
| R-17 |비정형 감사 | 신규 사전 감사/서명 증거/상관 필드·거절 분류를 보완 | **부분 조치.** 모든 역사 문자열/모든 내부 이벤트를 구조화했다는 증거 없음 |

## 원 Blueprint 레드팀 서술을 읽는 방법

[전체 설계 레드팀 보고서](../reviews/OPENSPHERE-DESIGN-REDTEAM-REVIEW-v0.1.md)의 “Nexus 높음 결함 미해결” 서술은 그 보고서의 시점과 입력에 근거한다. 후속49/52의 internal/가입 차단·보호 승인·위임/감사·세션 개선을 함께 읽어야 한다. **그 문장을 지우거나 나머지 신뢰 모델·키·특권·부트스트랩 지적까지 해결됐다고 바꾸지 않는다.**

## 남은 검증의 우선순위

1. internal 자격 공급·통지 수신 관계·legacy Broker 등 토큰 유출 가정의 최종 효과 경계.
2. Auth/data/WS·동적/외부 엔진 경로별 실제 허용/거절·회수·감사 근거.
3. 사전 감사와 확정 효과의 상관 추적, 운영 부하·공정성·reviewer 작업 비용.
4. 운영 승인·영역 Grant·tenant KMS·설치/복구 자격 및 공급망/노드 권한의 분리 실증.

이는 후속 검증 목록이며 이번 문서 반영이 공격 시험·정책 변경·운영 배포를 승인한 것이 아니다.
