import asyncio
import json
import time
from typing import Any, Dict

import cv2
import numpy as np
import websockets


WEBSOCKET_URL = "ws://localhost:8080/ws" #FIXME
SEND_EVERY_N_FRAMES = 30


def _encode_frame_to_jpeg_bytes(frame: np.ndarray) -> bytes:
    """
    Кодирует BGR-кадр OpenCV в JPEG-байты.
    """
    ok, buf = cv2.imencode(
        ".jpg",
        frame,
        [cv2.IMWRITE_JPEG_QUALITY, 70],
    )
    if not ok:
        return b""
    return buf.tobytes()


def _draw_ui(frame: np.ndarray, result: Dict[str, Any], fps: float | None = None) -> None:
    attention = result.get("attention", False)
    theta = result.get("theta")
    alpha = result.get("alpha")
    distance = result.get("distance")

    status = "ATTENTIVE" if attention else "NOT ATTENTIVE"

    cv2.putText(
        frame,
        status,
        (20, 40),
        cv2.FONT_HERSHEY_SIMPLEX,
        1,
        (0, 255, 0) if attention else (0, 0, 255),
        2,
    )

    y = 80
    if theta is not None and alpha is not None:
        cv2.putText(
            frame,
            f"angle: {theta:.1f} / limit: {alpha:.1f}",
            (20, y),
            cv2.FONT_HERSHEY_SIMPLEX,
            0.7,
            (255, 255, 255),
            2,
        )
        y += 30

    if distance is not None:
        cv2.putText(
            frame,
            f"distance: {distance:.2f}",
            (20, y),
            cv2.FONT_HERSHEY_SIMPLEX,
            0.7,
            (255, 255, 255),
            2,
        )
        y += 30

    if fps is not None:
        cv2.putText(
            frame,
            f"FPS: {fps:.1f}",
            (20, y),
            cv2.FONT_HERSHEY_SIMPLEX,
            0.7,
            (0, 255, 255),
            2,
        )


async def run_client():
    cap = cv2.VideoCapture(0)
    if not cap.isOpened():
        print("Cannot open webcam")
        return

    # Оценка FPS
    last_time = time.time()
    fps = None

    # Последний известный результат пайплайна
    result: Dict[str, Any] = {}

    frame_id = 0

    async with websockets.connect(WEBSOCKET_URL) as ws:
        while True:
            ret, frame = cap.read()
            if not ret:
                break

            frame_id += 1

            # Отправляем только каждый N-й кадр
            if frame_id % SEND_EVERY_N_FRAMES == 0:
                # Уменьшаем кадр перед отправкой
                frame_small = cv2.resize(frame, (640, 360))

                jpg_bytes = _encode_frame_to_jpeg_bytes(frame_small)
                if not jpg_bytes:
                    continue

                # Отправляем бинарный JPEG по WebSocket
                await ws.send(jpg_bytes)

                try:
                    message = await ws.recv()
                except websockets.ConnectionClosed:
                    print("WebSocket connection closed")
                    break

                try:
                    # Сервер отправляет JSON-текст
                    result = json.loads(message)
                except json.JSONDecodeError:
                    print("Invalid JSON from server")
                    result = {}

                # Обновляем FPS только по реально обработанным кадрам
                now = time.time()
                dt = now - last_time
                if dt > 0:
                    fps = 1.0 / dt
                last_time = now

            _draw_ui(frame, result, fps=fps)

            cv2.imshow("Attention Desktop Client", frame)
            if cv2.waitKey(1) & 0xFF == 27:
                break

    cap.release()
    cv2.destroyAllWindows()


if __name__ == "__main__":
    asyncio.run(run_client())

