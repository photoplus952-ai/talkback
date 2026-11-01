"""
TALKBACK image engine on Modal (free monthly credits).

Photo -> You 2.0 character with Qwen-Image-Edit-2509 (open model, Apache 2.0), which keeps the
person's identity and copies the style of reference images.

Privacy (docs/YOU20.md):
- Inputs arrive in the request body and are processed in memory only.
- Nothing about a request is written to disk or to the Volume, and nothing is logged.
- The Volume holds only the open model weights.

Called only by the Cloudflare Worker, with a shared token (Modal secret "talkback-auth").
"""

import base64
import io
import os

import modal

APP = "talkback-image"
MODEL = "Qwen/Qwen-Image-Edit-2509"
LIGHTNING_REPO = "lightx2v/Qwen-Image-Lightning"
LIGHTNING_FILE = "Qwen-Image-Edit-2509/Qwen-Image-Edit-2509-Lightning-8steps-V1.0-bf16.safetensors"

app = modal.App(APP)
weights = modal.Volume.from_name("talkback-models", create_if_missing=True)

image = (
    modal.Image.debian_slim(python_version="3.11")
    .pip_install(
        "torch==2.6.0",
        "diffusers>=0.36.0",
        "transformers>=4.51.3",
        "accelerate>=1.2.0",
        "safetensors",
        "peft>=0.15.0",
        "pillow",
        "huggingface_hub[hf_transfer]>=0.30",
        "fastapi[standard]",
    )
    .env({"HF_HOME": "/models", "HF_HUB_ENABLE_HF_TRANSFER": "1", "HF_HUB_DISABLE_TELEMETRY": "1"})
)


@app.function(image=image, volumes={"/models": weights}, timeout=60 * 60)
def download():
    """One-time: fetch the open model weights into the Volume (run by the deploy workflow)."""
    from huggingface_hub import hf_hub_download, snapshot_download

    snapshot_download(MODEL)
    try:
        hf_hub_download(LIGHTNING_REPO, LIGHTNING_FILE)
    except Exception as e:  # the fast 8-step add-on is optional
        print("lightning lora not downloaded:", type(e).__name__)
    weights.commit()


@app.cls(
    image=image,
    gpu="A100-80GB",  # H100 needs a card on file; A100-80GB runs on the free credits
    volumes={"/models": weights},
    secrets=[modal.Secret.from_name("talkback-auth")],
    scaledown_window=120,  # shut down after 2 minutes idle
    max_containers=1,
    timeout=600,
)
class Engine:
    @modal.enter()
    def load(self):
        import torch
        from diffusers import QwenImageEditPlusPipeline

        self.torch = torch
        self.pipe = QwenImageEditPlusPipeline.from_pretrained(MODEL, torch_dtype=torch.bfloat16).to("cuda")
        self.pipe.set_progress_bar_config(disable=True)
        self.fast = False
        try:
            self.pipe.load_lora_weights(LIGHTNING_REPO, weight_name=LIGHTNING_FILE)
            self.pipe.fuse_lora()
            self.fast = True
        except Exception as e:
            print("running without lightning lora:", type(e).__name__)

    def _authorized(self, auth: object) -> bool:
        token = os.environ.get("TALKBACK_TOKEN", "")
        return bool(token) and isinstance(auth, str) and auth == token

    @modal.fastapi_endpoint(method="GET")
    def warm(self):
        """Called when she opens the You 2.0 screen, so the engine is ready by the time she picks a photo."""
        return {"ok": True, "fast": self.fast}

    @modal.fastapi_endpoint(method="POST")
    def generate(self, body: dict):
        from fastapi import HTTPException
        from PIL import Image

        if not self._authorized(body.get("_auth")):
            raise HTTPException(status_code=401, detail="unauthorized")
        prompt = str(body.get("prompt") or "")
        imgs = body.get("images") or []
        count = max(1, min(int(body.get("count") or 1), 4))
        if not prompt or not imgs or len(imgs) > 3:
            raise HTTPException(status_code=400, detail="bad_request")

        pics = [Image.open(io.BytesIO(base64.b64decode(i["data"]))).convert("RGB") for i in imgs]
        out = []
        steps = 8 if self.fast else 30
        cfg = 1.0 if self.fast else 4.0
        for _ in range(count):
            result = self.pipe(
                image=pics,
                prompt=prompt,
                negative_prompt=" ",
                num_inference_steps=steps,
                true_cfg_scale=cfg,
                height=1024,
                width=768,
                generator=self.torch.Generator("cuda").manual_seed(int.from_bytes(os.urandom(4), "little")),
            ).images[0]
            buf = io.BytesIO()
            result.save(buf, format="PNG")
            out.append({"mimeType": "image/png", "data": base64.b64encode(buf.getvalue()).decode()})
            del result, buf
        del pics
        return {"images": out, "model": MODEL + (" + lightning" if self.fast else "")}
