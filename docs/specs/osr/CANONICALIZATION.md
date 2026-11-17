# OSR canonical JSON · digest · 서명 규칙

**상태:** 계약 초안(단계 1, 2026-11-18). 참조 구현은 [tools/lib.mjs](tools/lib.mjs)다.
**적용 범위:** OSR 계약의 모든 JSON 대상(디스크립터, 기여 artifact, 서명 payload, 검증 맥락 snapshot, 채널 카탈로그, 설치 계획, 영수증, profile).

## 1. canonical JSON

[RFC 8785 JSON Canonicalization Scheme(JCS)](https://www.rfc-editor.org/rfc/rfc8785)을 따르되 다음을 더 좁힌다.

| 규칙 | 내용 |
|---|---|
| 수 | **정수만** 쓴다. 범위는 ±(2^53−1)이다. 소수 · 지수 표기 · NaN · Infinity는 거절한다. `-0`은 `0`으로 적는다. 크기 · 용량은 `"50Gi"` 같은 문자열로 적는다 |
| 문자열 | UTF-8. 짝 없는 surrogate는 거절한다. 이스케이프는 JCS(ECMAScript `JSON.stringify`) 규칙을 따른다 |
| 객체 | 키를 UTF-16 code unit 순으로 정렬한다. 같은 키가 두 번 나오면 거절한다(참조 도구는 이미 파싱한 객체를 다루므로, 이 검사는 단계 2 수신부의 파서가 한다). 값이 없는 키(`undefined`)는 둘 수 없다 |
| 배열 | 순서를 그대로 둔다. 순서가 의미 없는 목록도 생산자가 정한 순서를 서명한다 |
| 공백 | 넣지 않는다 |

## 2. digest

```text
digest(x) = "sha256:" + hex( SHA-256( UTF-8( canonical(x) ) ) )
```

- 소문자 hex 64자다. 형식은 `^sha256:[0-9a-f]{64}$`이다.
- **profile 지문(fingerprint)** = profile 문서의 digest다.
- **planDigest** = 설치 계획 전체의 digest, **executionPlanDigest** = `executionPlan`의 digest다.
- **snapshotDigest** = 검증 맥락 snapshot payload의 digest다.
- 매뉴얼 · 지식 문서의 `checksum` · `sha256`은 본문 문자열 UTF-8 바이트의 SHA-256이다(canonical JSON이 아니다).

### 2.1 시험 벡터의 번들 digest

실제 GHCR 번들 digest는 OCI image index **바이트**의 SHA-256이다. 시험 벡터는 OCI 레지스트리 없이 돌아가야 하므로 index를 JSON 객체로 두고 그 canonical digest를 번들 digest로 쓴다. 각 manifest 항목은 기여 artifact 내용의 canonical digest를 직접 가리킨다. 이 대체는 **벡터 한정**이다. 단계 2의 실제 GHCR 검사에서는 index 바이트 digest와 OCI manifest · blob digest로 바꾼다. 판정 규칙(무엇을 비교하고 무엇을 거절하는가)은 같다.

## 3. 서명

| 항목 | 값 |
|---|---|
| 알고리즘 | ECDSA P-256, SHA-256 |
| 서명값 인코딩 | IEEE P1363(`r‖s`, 64바이트)를 base64url(패딩 없음)로 적는다. DER은 쓰지 않는다 |
| 서명 대상 | `payload`의 canonical JSON UTF-8 바이트 |
| 봉투 | `{ payload, signature: { alg: "ES256-P1363", keyId, value } }` ([signed-envelope](schemas/signed-envelope.schema.json)) |
| 공개 키 | JWK(`kty: EC`, `crv: P-256`) |

- 서명 키는 **검증 맥락 snapshot에서만** 찾는다. 번들 · referrer · 요청이 함께 가져온 키는 신뢰 근거가 아니다(벡터 R22).
- 키에는 용도(`release` · `catalog`)와 범위(클래스 · 채널)가 있다. 범위 밖 사용은 서명이 맞아도 거절한다.
- 키 회수는 `revokedAtGeneration ≤ trustGeneration`으로 판정한다.
- 검증 맥락 snapshot은 Backbone에 고정한 **trust anchor** 키로 서명한다. anchor는 snapshot 안에 들어 있지 않다.
- 독립 복구 요청은 설치 기록에 고정된 복구 키로 서명한다. OSR · Core가 없어도 검증할 수 있다.

## 4. 시각

- `YYYY-MM-DDTHH:MM:SSZ`(UTC, 초 단위)만 쓴다.
- 유효 구간은 `issuedAt ≤ 평가 시각 < expiresAt`이다.
- 시험 벡터의 평가 시각은 `2026-11-18T00:00:00Z`로 고정한다.
