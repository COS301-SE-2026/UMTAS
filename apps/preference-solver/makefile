SRC_DIR := src
BUILD_DIR := build
LIB_DIR := lib

CXX ?= c++
PKG_CONFIG ?= pkg-config
BREW ?= brew

LOCAL_ORTOOLS_DIR := $(LIB_DIR)/ortools
LOCAL_ORTOOLS_HEADER := $(LOCAL_ORTOOLS_DIR)/include/ortools/sat/cp_model.h
ORTOOLS_TARBALL_URL := https://github.com/google/or-tools/releases/download/v9.11/or-tools_x86_64_AlmaLinux-8.10_cpp_v9.11.4210.tar.gz

ORTOOLS_PREFIX ?= $(shell $(PKG_CONFIG) --variable=prefix ortools 2>/dev/null || $(BREW) --prefix or-tools 2>/dev/null)
ABSEIL_PREFIX ?= $(shell $(PKG_CONFIG) --variable=prefix absl_raw_hash_set 2>/dev/null || $(BREW) --prefix abseil 2>/dev/null)
PROTOBUF_PREFIX ?= $(shell $(PKG_CONFIG) --variable=prefix protobuf 2>/dev/null || $(BREW) --prefix protobuf 2>/dev/null)

ifeq ($(strip $(ORTOOLS_PREFIX)),)
    ORTOOLS_PREFIX := $(LOCAL_ORTOOLS_DIR)
endif

dependency_include = $(if $(strip $($(1)_PREFIX)),-I$($(1)_PREFIX)/include)
dependency_lib = $(if $(strip $($(1)_PREFIX)),-L$($(1)_PREFIX)/lib -L$($(1)_PREFIX)/lib64)
comma := ,
dependency_rpath = $(if $(strip $($(1)_PREFIX)),-Wl$(comma)-rpath$(comma)$($(1)_PREFIX)/lib$(comma)-rpath$(comma)$($(1)_PREFIX)/lib64)

DEPENDENCY_CFLAGS ?= $(shell $(PKG_CONFIG) --cflags ortools protobuf absl_raw_hash_set 2>/dev/null)
DEPENDENCY_LIBS ?= $(shell $(PKG_CONFIG) --libs ortools protobuf absl_raw_hash_set 2>/dev/null)

CFLAGS ?= -std=c++17 -g -DOR_PROTO_DLL= -I$(LIB_DIR) \
    $(call dependency_include,ORTOOLS) $(call dependency_include,ABSEIL) \
    $(call dependency_include,PROTOBUF) $(DEPENDENCY_CFLAGS)

LDFLAGS ?= $(if $(strip $(DEPENDENCY_LIBS)),$(DEPENDENCY_LIBS),\
    $(call dependency_lib,ORTOOLS) -lortools $(call dependency_lib,ABSEIL) \
    -labsl_raw_hash_set -labsl_raw_logging_internal \
    -labsl_log_internal_check_op -labsl_log_internal_message) \
    $(call dependency_rpath,ORTOOLS) $(call dependency_rpath,ABSEIL)

SRC_FILES := $(wildcard $(SRC_DIR)/*.cpp)\
             $(wildcard $(SRC_DIR)/data/API/*.cpp)\
             $(wildcard $(SRC_DIR)/data/Events/*.cpp)\
             $(wildcard $(SRC_DIR)/data/GA-data/*.cpp)\
             $(wildcard $(SRC_DIR)/data/Modules/*.cpp)\
             $(wildcard $(SRC_DIR)/GA_handler/*.cpp)\
             $(wildcard $(SRC_DIR)/CP_SOLVER/*.cpp)\
             $(wildcard $(SRC_DIR)/heuristic/Decorators/*.cpp)\
             $(wildcard $(SRC_DIR)/heuristic/Handlers/*.cpp)\


OBJS := $(patsubst $(SRC_DIR)/%.cpp,$(BUILD_DIR)/%.o,$(SRC_FILES))

OPEN_GA_URL := https://github.com/Arash-codedev/openGA/archive/v1.0.5.zip
OPEN_GA_HEADER := $(LIB_DIR)/openGA.hpp

JSON_URL := https://github.com/nlohmann/json/releases/download/v3.11.3/json.hpp
JSON_HEADER := $(LIB_DIR)/nlohmann/json.hpp

TARGET := GA_BIN
COUNT_PATTERN_TEST := $(BUILD_DIR)/count-pattern-regression

DEPENDENCY_HEADERS := $(OPEN_GA_HEADER) $(JSON_HEADER)
ifeq ($(abspath $(ORTOOLS_PREFIX)),$(abspath $(LOCAL_ORTOOLS_DIR)))
    DEPENDENCY_HEADERS += $(LOCAL_ORTOOLS_HEADER)
endif

.PHONY: all download d bear clean c clean_lib run r test

all: $(TARGET)

$(TARGET): $(OBJS) | $(DEPENDENCY_HEADERS)
	@mkdir -p $(BUILD_DIR)
	$(CXX) $(CFLAGS) -o $@ $(OBJS) $(LDFLAGS)

$(BUILD_DIR)/%.o: $(SRC_DIR)/%.cpp $(DEPENDENCY_HEADERS)
	@mkdir -p $(dir $@)
	$(CXX) $(CFLAGS) -c $< -o $@

$(LOCAL_ORTOOLS_HEADER):
	@echo "OR-Tools not found on system. Downloading C++ binaries to $(LOCAL_ORTOOLS_DIR)..."
	@mkdir -p $(LOCAL_ORTOOLS_DIR)
	@set -eu; \
		archive="$(LIB_DIR)/ortools.tar.gz.tmp"; \
		trap 'rm -f "$$archive"' EXIT; \
		curl --fail --location --show-error "$(ORTOOLS_TARBALL_URL)" -o "$$archive"; \
		tar -xzf "$$archive" -C "$(LOCAL_ORTOOLS_DIR)" --strip-components=1

$(OPEN_GA_HEADER):
	@echo "Downloading OpenGA v1.0.5 header..."
	@mkdir -p $(LIB_DIR)
	@set -eu; \
		archive="$(LIB_DIR)/openGA.zip.tmp"; \
		extract_dir="$(LIB_DIR)/.openGA-download"; \
		trap 'rm -rf "$$archive" "$$extract_dir"' EXIT; \
		rm -rf "$$archive" "$$extract_dir"; \
		curl --fail --location --show-error --silent "$(OPEN_GA_URL)" -o "$$archive"; \
		mkdir -p "$$extract_dir"; \
		unzip -q "$$archive" -d "$$extract_dir"; \
		cp "$$extract_dir/openGA-1.0.5/src/openGA.hpp" "$(OPEN_GA_HEADER)"; \
		sed -i 's/\(^\|[^a-zA-Z0-9_]\)std::mutex mtx_rand;/ inline std::mutex mtx_rand;/g' "$(OPEN_GA_HEADER)"

$(JSON_HEADER):
	@echo "Downloading nlohmann/json v3.11.3 header..."
	@mkdir -p $(dir $(JSON_HEADER))
	@set -eu; \
		temporary_header="$(JSON_HEADER).tmp"; \
		trap 'rm -f "$$temporary_header"' EXIT; \
		curl --fail --location --show-error --silent "$(JSON_URL)" -o "$$temporary_header"; \
		mv "$$temporary_header" "$(JSON_HEADER)"

download: clean_lib
	$(MAKE) DEPENDENCY_HEADERS="$(DEPENDENCY_HEADERS)" $(DEPENDENCY_HEADERS)

d: download

bear: clean
	bear -- make all

clean c:
	rm -rf $(BUILD_DIR)

clean_lib:
	rm -rf $(LIB_DIR)

run r: $(TARGET)
	./$(TARGET)

valgrind: $(COUNT_PATTERN_TEST)
	valgrind --leak-check=full \
	         --show-leak-kinds=all \
	         --track-origins=yes \
	         --log-file=valgrind-unit.log \
	         ./$(COUNT_PATTERN_TEST)

$(COUNT_PATTERN_TEST): $(DEPENDENCY_HEADERS) $(filter-out $(BUILD_DIR)/main.o,$(OBJS)) tests/count-pattern-regression.cpp
	$(CXX) $(CFLAGS) -o $@ tests/count-pattern-regression.cpp $(filter-out $(BUILD_DIR)/main.o,$(OBJS)) $(LDFLAGS)

test: $(TARGET) $(COUNT_PATTERN_TEST)
	./tests/run-cli-regressions.sh
	./$(COUNT_PATTERN_TEST)


