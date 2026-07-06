SRC_DIR := src
BUILD_DIR := build
LIB_DIR := lib

CXX := g++ -std=c++17
CFLAGS :=  -I $(LIB_DIR)
UNAME_S := $(shell uname -s)
ifeq ($(UNAME_S),Darwin)
LDFLAGS :=
else
LDFLAGS := -Wl,--allow-multiple-definition
endif


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

TARGET := GA_BIN

all :$(TARGET)

$(TARGET): $(OPEN_GA_HEADER) $(JSON_HEADER) $(OBJS)
	@mkdir -p $(BUILD_DIR)
	$(CXX) $(CFLAGS) $(LDFLAGS) -o $@ $(OBJS)

$(BUILD_DIR)/%.o: $(SRC_DIR)/%.cpp $(OPEN_GA_HEADER) $(JSON_HEADER)
	@mkdir -p $(dir $@)
	$(CXX) $(CFLAGS) -c $< -o $@


$(OPEN_GA_HEADER): makefile
	@mkdir -p $(LIB_DIR)
	curl -L $(OPEN_GA_URL) -o $(LIB_DIR)/openGA.zip
	unzip -q $(LIB_DIR)/openGA.zip -d $(LIB_DIR)
	cp $(LIB_DIR)/openGA-1.0.5/src/openGA.hpp $(OPEN_GA_HEADER)
	perl -0pi -e 's/std::mutex mtx_rand;/inline std::mutex mtx_rand;/' $(OPEN_GA_HEADER)
	rm -rf $(LIB_DIR)/openGA-1.0.5 $(LIB_DIR)/openGA.zip

$(JSON_HEADER):
	@mkdir -p $(LIB_DIR)/nlohmann
	curl -L $(JSON_URL) -o $(JSON_HEADER)
	
download d: clean_lib  $(OPEN_GA_HEADER) $(JSON_HEADER) 

bear : clean 
	bear -- make all
    

clean c:
	rm -rf $(BUILD_DIR)

clean_lib:
	rm -rf $(LIB_DIR)
    
run r: $(TARGET)
	./$(TARGET)
