---
title: SOLE ATELIER Try-On
emoji: 👟
colorFrom: gray
colorTo: blue
sdk: gradio
sdk_version: 5.49.1
app_file: app.py
pinned: false
license: other
short_description: 사진 속 인물의 신발만 바꾸는 AI 가상 실착
---

# SOLE ATELIER 가상 실착 Space

`black-forest-labs/FLUX.1-Kontext-dev` 로 사진 속 인물의 신발을 교체합니다.
SOLE ATELIER 쇼핑몰의 `/api/tryon` 라우트가 `@gradio/client` 로 `/infer` 를 호출합니다.

## 올리는 법

1. Hugging Face 에서 새 Space 를 만듭니다 — SDK `Gradio`, 하드웨어 `ZeroGPU`.
2. 이 폴더의 `app.py` · `requirements.txt` · `README.md` 를 올립니다.
3. 쇼핑몰의 환경변수에 아래를 넣습니다.

```
HF_SPACE_ID=<계정>/sole-atelier-tryon
HF_TOKEN=hf_...
```

ZeroGPU 무료 사용에는 이메일 인증과 계정 생성 30일 경과 조건이 있습니다. 조건을 못 갖추면
쇼핑몰의 AI 탭은 "준비 중"으로 표시되고 합성 실착 탭만 노출됩니다.

## 한계

프롬프트 기반이라 **설명에 맞는 비슷한 신발**이 생성되지, 판매 중인 그 상품이 그대로 나오지는
않습니다. 쇼핑몰 화면에도 같은 내용을 고지하고 있습니다.
