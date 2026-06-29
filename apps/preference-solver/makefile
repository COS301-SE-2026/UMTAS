SRC_DIR := src
BUILD_DIR := build
LIB_DIR := lib

CXX := g++
CFLAGS := -Wall -Wextra -I $(LIB_DIR)


SRC_FILES := $(wildcard $(SRC_DIR)/*.cpp)
OBJS := $(patsubst $(SRC_DIR)/%.cpp,$(BUILD_DIR)/%.o,$(SRC_FILES))

OPEN_GA_URL:= https://github.com/Arash-codedev/openGA/archive/v1.0.5.zip
OPEN_GA_HEADER:= $(LIB_DIR)/openGA.hpp


TARGET := $(BUILD_DIR)/app

all :$(TARGET)

$(TARGET):$(OBJS)
	@mkdir -p $(BUILD_DIR)
	$(CXX) $(CFLAGS) -o $@ $^

$(BUILD_DIR)/%.o: $(SRC_DIR)/%.cpp
	@mkdir -p $(BUILD_DIR)
	$(CXX) $(CFLAGS) -c $< -o $@

clean c:
	rm -rf $(BUILD_DIR)
    
run r:
	./$(TARGET)


$(OPEN_GA_HEADER):
	@mkdir -p $(LIB_DIR)
	curl -L $(OPEN_GA_URL) -o $(LIB_DIR)/openGA.zip
	unzip -q $(LIB_DIR)/openGA.zip -d $(LIB_DIR)
	cp $(LIB_DIR)/openGA-1.0.5/src/openGA.hpp $(OPEN_GA_HEADER)
	rm -rf $(LIB_DIR)/openGA-1.0.5 $(LIB_DIR)/openGA.zip
	
download d: $(OPEN_GA_HEADER)

bear : clean 
	bear -- make all
    