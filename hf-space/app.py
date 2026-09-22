"""
SOLE ATELIER — AI 가상 실착 Space

FLUX.1 Kontext 로 사진 속 인물의 신발만 바꾼다.
Next.js 앱이 @gradio/client 로 /infer 엔드포인트를 호출한다.
"""

import random

import gradio as gr
import spaces
import torch
from diffusers import FluxKontextPipeline
from PIL import Image

MAX_SEED = 2**31 - 1

pipe = FluxKontextPipeline.from_pretrained(
    "black-forest-labs/FLUX.1-Kontext-dev",
    torch_dtype=torch.bfloat16,
).to("cuda")


def _fit(image: Image.Image, longest: int = 1024) -> Image.Image:
    """긴 변을 longest 로 맞추고 8의 배수로 정렬한다."""
    image = image.convert("RGB")
    w, h = image.size
    scale = longest / max(w, h)
    if scale < 1:
        w, h = int(w * scale), int(h * scale)
    w, h = (w // 8) * 8, (h // 8) * 8
    return image.resize((max(w, 8), max(h, 8)), Image.LANCZOS)


@spaces.GPU(duration=75)
def infer(
    input_image,
    prompt: str,
    seed: int = 0,
    randomize_seed: bool = True,
    guidance_scale: float = 2.5,
    steps: int = 28,
    progress=gr.Progress(track_tqdm=True),
):
    if input_image is None:
        raise gr.Error("사진을 올려주세요.")
    if not prompt or not prompt.strip():
        raise gr.Error("프롬프트가 비어 있습니다.")

    if randomize_seed:
        seed = random.randint(0, MAX_SEED)

    image = _fit(input_image)

    result = pipe(
        image=image,
        prompt=prompt.strip(),
        guidance_scale=float(guidance_scale),
        num_inference_steps=int(steps),
        generator=torch.Generator(device="cuda").manual_seed(int(seed)),
    ).images[0]

    return result, int(seed)


with gr.Blocks(title="SOLE ATELIER Try-On") as demo:
    gr.Markdown(
        "## SOLE ATELIER — AI 가상 실착\n"
        "사진 속 인물의 신발만 바꿉니다. 생성 결과는 실제 상품과 다를 수 있습니다."
    )
    with gr.Row():
        with gr.Column():
            input_image = gr.Image(label="원본 사진", type="pil")
            prompt = gr.Textbox(label="프롬프트", lines=3)
            seed = gr.Slider(0, MAX_SEED, value=0, step=1, label="시드")
            randomize_seed = gr.Checkbox(value=True, label="시드 무작위")
            guidance_scale = gr.Slider(1.0, 6.0, value=2.5, step=0.1, label="가이던스")
            steps = gr.Slider(8, 40, value=28, step=1, label="스텝")
            run = gr.Button("생성", variant="primary")
        with gr.Column():
            output_image = gr.Image(label="결과")
            output_seed = gr.Number(label="사용한 시드")

    run.click(
        fn=infer,
        inputs=[input_image, prompt, seed, randomize_seed, guidance_scale, steps],
        outputs=[output_image, output_seed],
        api_name="infer",
    )

demo.queue(max_size=8).launch()
