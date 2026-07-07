SRC_DIR := src
BUILD_DIR := build
LIB_DIR := lib

CXX := g++ -std=c++17
ORTOOLS_ROOT ?= $(LIB_DIR)/or-tools

CFLAGS :=  -I $(LIB_DIR) -I $(ORTOOLS_ROOT)/include
LDFLAGS := -Wl,--allow-multiple-definition -L $(ORTOOLS_ROOT)/lib -Wl,-rpath,$(ORTOOLS_ROOT)/lib
LDLIBS := -lortools -pthread

SRC_FILES := $(wildcard $(SRC_DIR)/*.cpp)\
			 $(wildcard $(SRC_DIR)/data/API/*.cpp)\
			 $(wildcard $(SRC_DIR)/data/Events/*.cpp)\
			 $(wildcard $(SRC_DIR)/data/GA-data/*.cpp)\
			 $(wildcard $(SRC_DIR)/data/Modules/*.cpp)\
			 $(wildcard $(SRC_DIR)/filecreator/*.cpp)\
			 $(wildcard $(SRC_DIR)/GA_handler/*.cpp)\
				
OBJS := $(patsubst $(SRC_DIR)/%.cpp,$(BUILD_DIR)/%.o,$(SRC_FILES))

OPEN_GA_URL:= https://github.com/Arash-codedev/openGA/archive/v1.0.5.zip
OPEN_GA_HEADER:= $(LIB_DIR)/openGA.hpp

JSON_URL := https://github.com/nlohmann/json/releases/download/v3.11.3/json.hpp
JSON_HEADER := $(LIB_DIR)/nlohmann/json.hpp

ORTOOLS_URL := https://github.com/google/or-tools/releases/download/v9.12/or-tools_amd64_ubuntu-24.04_cpp_v9.12.4544.tar.gz
ORTOOLS_MARKER := $(ORTOOLS_ROOT)/include/ortools/sat/cp_model.h

TARGET := GA_BIN

all :$(TARGET)

$(TARGET):$(OBJS)
	@mkdir -p $(BUILD_DIR)
	$(CXX) $(CFLAGS) $(LDFLAGS) -o $@ $^ $(LDLIBS)

$(BUILD_DIR)/%.o: $(SRC_DIR)/%.cpp
	@mkdir -p $(dir $@)
	$(CXX) $(CFLAGS) -c $< -o $@


$(OPEN_GA_HEADER):
	@mkdir -p $(LIB_DIR)
	curl -L $(OPEN_GA_URL) -o $(LIB_DIR)/openGA.zip
	unzip -q $(LIB_DIR)/openGA.zip -d $(LIB_DIR)
	cp $(LIB_DIR)/openGA-1.0.5/src/openGA.hpp $(OPEN_GA_HEADER)
	rm -rf $(LIB_DIR)/openGA-1.0.5 $(LIB_DIR)/openGA.zip

$(JSON_HEADER):
	@mkdir -p $(LIB_DIR)/nlohmann
	curl -L $(JSON_URL) -o $(JSON_HEADER)
	
$(ORTOOLS_MARKER):
	@mkdir -p $(ORTOOLS_ROOT)
	curl -L $(ORTOOLS_URL) -o /tmp/or-tools.tar.gz
	tar -xzf /tmp/or-tools.tar.gz -C $(ORTOOLS_ROOT) --strip-components=1
	rm -f /tmp/or-tools.tar.gz

download d: clean_lib  $(OPEN_GA_HEADER) $(JSON_HEADER)  $(ORTOOLS_MARKER)

bear : clean 
	bear -- make all

clean c:
	rm -rf $(BUILD_DIR)

clean_lib:
	rm -rf $(LIB_DIR)
    
run r: $(TARGET)
	./$(TARGET)

