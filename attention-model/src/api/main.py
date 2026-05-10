"""
Unified entry point — runs both servers concurrently in one asyncio event loop:
  - gRPC  on $GRPC_PORT  (default 50051) — used by attention-service
  - HTTP  on $HTTP_PORT  (default 8765)  — WebSocket endpoint for local dev / testing
"""
import asyncio
import logging
import os

import grpc
import uvicorn

from attention.v1 import attention_pb2_grpc
from api.attention_service import app, pipeline  # pipeline loaded once at import
from api.grpc_server import AttentionModelServicer, _GRPC_PORT
from core.attention_pipeline import AttentionPipeline

logger = logging.getLogger(__name__)

_HTTP_PORT = int(os.getenv("HTTP_PORT", "8765"))


async def _run_grpc(pipeline: AttentionPipeline) -> None:
    server = grpc.aio.server()
    attention_pb2_grpc.add_AttentionModelServicer_to_server(
        AttentionModelServicer(pipeline), server
    )
    listen_addr = f"[::]:{_GRPC_PORT}"
    server.add_insecure_port(listen_addr)
    logger.info("gRPC listening on %s", listen_addr)
    await server.start()
    await server.wait_for_termination()


async def _run_http() -> None:
    config = uvicorn.Config(app, host="0.0.0.0", port=_HTTP_PORT, log_level="info")
    server = uvicorn.Server(config)
    logger.info("HTTP/WS listening on port %d", _HTTP_PORT)
    await server.serve()


async def main() -> None:
    await asyncio.gather(_run_grpc(pipeline), _run_http())


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
    asyncio.run(main())
