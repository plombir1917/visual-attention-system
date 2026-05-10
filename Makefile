PROTOC        ?= protoc
PROTO_DIR     := proto
GO_OUT        := attention-service
PY_OUT        := attention-model/src

.PHONY: proto proto-go proto-py

desktop-dev:
	cd desktop-client && npm run dev

desktop-dist:
	cd desktop-client && npm run dist:win

proto: proto-go proto-py

proto-go:
	$(PROTOC) \
		--go_out=$(GO_OUT) \
		--go_opt=paths=source_relative \
		--go-grpc_out=$(GO_OUT) \
		--go-grpc_opt=paths=source_relative \
		--proto_path=. \
		$(PROTO_DIR)/attention/v1/attention.proto

proto-py:
	python3 -m grpc_tools.protoc \
		-I $(PROTO_DIR) \
		--python_out=$(PY_OUT) \
		--grpc_python_out=$(PY_OUT) \
		$(PROTO_DIR)/attention/v1/attention.proto
	@touch $(PY_OUT)/attention/__init__.py $(PY_OUT)/attention/v1/__init__.py
