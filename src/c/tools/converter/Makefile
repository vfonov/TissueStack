DIRSRC		=	./src/

SRCS		=	$(DIRSRC)TS_converter.c						\
			../../utils/utils.c

INCLUDE		=	-I./headers -I../../headers -I../../utils -I/usr/include/nifti -I/usr/local/bic/include

LIB_PATH	=	

LIBS		=	-lhdf5								\
			-lnetcdf 							\
			-lminc2								\
			-lpthread							\
			-lniftiio                                                       \
			-ldl								\
			-lznz								\
			-lz								\
			-lm

EXE_NAME	=	mnc2raw

FLAGS		=	-Wall -ggdb -O2 -Wno-unused-result

OBJS		=	$(SRCS:%.c=%.o)

CC		=	gcc

USE_MEMORY_MAPPING	=	no
APP_FLAGS		=

# important configuration variables with defaults
export NAME	=	tissuestack
export VERSION
export APPLICATION_PATH ?= /usr/local/$(NAME)
# the application path including the version
export APPLICATION_ROOT	=	$(APPLICATION_PATH)/$(VERSION)
# the destination for the binaries
export BINS_PATH			=	$(APPLICATION_ROOT)/bin
# the plugin path with its .so 
export PLUGINS_PATH			=	$(APPLICATION_ROOT)/plugins
# the jni shared library

# use memory mapping (turned off by default. did not really deliver gains in our case but can be turned on again with USE_MM=true)?
ifdef USE_MM
ifeq ($(USE_MM),true)
APP_FLAGS=-DUSE_MM
USE_MEMORY_MAPPING=yes
endif
endif

%.o: %.c
	@echo -e "\tCompiling $(@)."
	@$(CC) -DAPPLICATION_PATH='"$(DATA_PATH)"' -DPLUGINS_PATH='"$(PLUGINS_PATH)"' $(APP_FLAGS) \
		-c $(FLAGS) $(INCLUDE) `pkg-config --cflags gtk+-2.0` -o $@ $<

all:	compile install

prepare:
# the version has to be set for a production build (not debug build)
ifndef VERSION
	$(error VERSION IS NOT SET !!!!!!!!!!!!! Please call make like this: make VERSION=X.X !!!!!)
endif

	@echo -e "\n###################### TISSUE STACK MINC2RAW CONVERTER TOOL BUILD [Version: $(VERSION)] ###################"
	@echo -e "    BINARIES PATH:         $(BINS_PATH)"
	@echo -e "    USE MEMORY MAPPING:    $(USE_MEMORY_MAPPING)"
	@echo -e "###################### TISSUE STACK MINC2RAW CONVERTER TOOL BUILD [Version: $(VERSION)] ###################\n"

coreCompile:	$(OBJS)
	@$(CC) $(OBJS) -o $(EXE_NAME) $(INCLUDE) $(LIB_PATH) $(LIBS) $(FLAGS) `pkg-config --cflags --libs gtk+-2.0` > /dev/null
	@echo -e "\tFinished compiling converter tool."

install: compile
	@echo -e "\n\tInstalling Binaries (may require super user priviledges):"
	@echo -e "\t-----------------------------------------------\n"
	@echo -e "\tInstalling '$(EXE_NAME)' executable into: $(BINS_PATH)."
	@sudo mkdir -p $(BINS_PATH)
	@sudo cp $(EXE_NAME) $(BINS_PATH)/$(EXE_NAME)
	@echo -e "\tFinished installing '$(EXE_NAME)'."
	@echo -e "\n\tFinished installing binaries.\n"  

clean:
	@echo -e "\n\tCleaning $(EXE_NAME)...\n"
	@rm -rf *~ \#*\# $(NAME) $(EXE_NAME) core hs_err_pid*
	@rm -rf $(DIRSRC)*.o
	@rm -rf $(BUILD_PATH)
	@make --no-print-directory -C ../../utils/ clean
	@echo -e "\tFinished cleaning $(EXE_NAME).\n"

debug: FLAGS += -D_TSS_DEBUG_

debug: coreCompile

compile: prepare coreCompile

recompile: clean compile

re: clean debug install

.PHONY: all prepare compile install clean re recompile
