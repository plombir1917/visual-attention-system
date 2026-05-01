import json
import os
from typing import Any, Dict

import cv2
import numpy as np
from fastapi import FastAPI, WebSocket, WebSocketDisconnect

from core.attention_pipeline import AttentionPipeline


app = FastAPI()

# Инициализируем пайплайн один раз на процесс
pipeline = AttentionPipeline(os.getenv("MODEL_PATH", "src/checkpoints/best_model.pt"))


def _decode_jpeg_bytes_to_bgr(data: bytes) -> np.ndarray:
    """
    Принимает JPEG-байты и возвращает BGR ndarray (как из OpenCV).
    """
    img_array = np.frombuffer(data, dtype=np.uint8)
    img_bgr = cv2.imdecode(img_array, cv2.IMREAD_COLOR)
    return img_bgr


@app.websocket("/attention")
async def attention(ws: WebSocket):
    """
    WebSocket-эндпоинт:
    - основной путь: client → binary: JPEG
    - fallback: client → text: base64/JSON
    - server → JSON: результат AttentionPipeline.process_frame
    """
    await ws.accept()

    try:
        while True:
            message = await ws.receive()

            frame = None

            # Основной путь — бинарные JPEG-байты
            data_bytes = message.get("bytes")
            if data_bytes is not None:
                frame = _decode_jpeg_bytes_to_bgr(data_bytes)
            else:
                # Fallback: текстовый режим (оставлен на всякий случай)
                text = message.get("text")
                if not text:
                    await ws.send_json({"error": "empty_image"})
                    continue

                # Возможность передавать либо "сырой" base64, либо JSON {"image": "..."}
                import base64

                try:
                    data = json.loads(text)
                    frame_b64 = data.get("image", "")
                except json.JSONDecodeError:
                    frame_b64 = text

                if not frame_b64:
                    await ws.send_json({"error": "empty_image"})
                    continue

                try:
                    img_bytes = base64.b64decode(frame_b64)
                except Exception:
                    await ws.send_json({"error": "decode_failed"})
                    continue

                frame = _decode_jpeg_bytes_to_bgr(img_bytes)

            if frame is None:
                await ws.send_json({"error": "decode_failed"})
                continue

            result: Dict[str, Any] = pipeline.process_frame(frame)

            # Преобразуем numpy-объекты к сериализуемому виду
            gaze_vector = result.get("gaze_vector")
            if gaze_vector is not None:
                result["gaze_vector"] = gaze_vector.tolist()

            await ws.send_json(result)
    except WebSocketDisconnect:
        # Клиент отключился — просто выходим из обработчика
        return


# Для запуска:
#   python -m uvicorn api.attention_service:app --host 0.0.0.0 --port 8765

