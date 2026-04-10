.DEFAULT_GOAL := help

BUN ?= bun

.PHONY: help install build typecheck test test-unit test-e2e verify clean

help:
	@printf '%s\n' \
		'Available targets:' \
		'  make install     Install workspace dependencies' \
		'  make build       Build all packages with TypeScript project references' \
		'  make typecheck   Run the workspace typecheck/build graph' \
		'  make test        Run unit and e2e tests' \
		'  make test-unit   Run package-level tests only' \
		'  make test-e2e    Run end-to-end and dist contract tests' \
		'  make verify      Build and run the full test suite' \
		'  make clean       Remove package dist artifacts'

install:
	$(BUN) install

build:
	$(BUN) run build

typecheck:
	$(BUN) run typecheck

test:
	$(MAKE) test-unit
	$(MAKE) test-e2e

test-unit:
	$(BUN) run test:unit

test-e2e:
	$(BUN) run test:e2e

verify:
	$(MAKE) build
	$(MAKE) test

clean:
	rm -rf packages/*/dist
