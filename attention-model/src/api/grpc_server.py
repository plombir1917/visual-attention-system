import asyncio
import logging
import os

import cv2
import grpc
import numpy as np

from attention.v1 import attention_pb2, attention_pb2_grpc
from core.attention_pipeline import AttentionPipeline

logger = logging.getLogger(__name__)

_GRPC_PORT = int(os.getenv("GRPC_PORT", "50051"))
_MODEL_PATH = os.getenv("MODEL_PATH", "src/checkpoints/best_model.pt")


def _decode_jpeg(data: bytes) -> np.ndarray | None:
    arr = np.frombuffer(data, dtype=np.uint8)
    return cv2.imdecode(arr, cv2.IMREAD_COLOR)


class AttentionModelServicer(attention_pb2_grpc.AttentionModelServicer):
    def __init__(self, pipeline: AttentionPipeline) -> None:
        self._pipeline = pipeline

    async def ProcessFrames(self, request_iterator, context: grpc.aio.ServicerContext):
        async for req in request_iterator:
            frame = _decode_jpeg(req.data)
            if frame is None:
                await context.abort(grpc.StatusCode.INVALID_ARGUMENT, "failed to decode JPEG frame")
                return

            result = self._pipeline.process_frame(frame)

            gaze = result.get("gaze_vector")
            gaze_list = gaze.tolist() if gaze is not None else []

            yield attention_pb2.AttentionResponse(
                focus=bool(result.get("attention", False)),
                theta=float(result.get("theta") or 0.0),
                alpha=float(result.get("alpha") or 0.0),
                distance=float(result.get("distance") or 0.0),
                gaze_vector=gaze_list,
            )


async def serve(pipeline: AttentionPipeline) -> None:
    server = grpc.aio.server()
    attention_pb2_grpc.add_AttentionModelServicer_to_server(
        AttentionModelServicer(pipeline), server
    )
    listen_addr = f"[::]:{_GRPC_PORT}"
    server.add_insecure_port(listen_addr)
    logger.info("gRPC listening on %s", listen_addr)
    await server.start()
    await server.wait_for_termination()


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
    pipeline = AttentionPipeline(_MODEL_PATH)
    asyncio.run(serve(pipeline))
