# Tools
BPF_CLANG := clang
CC        := gcc

# BPF compile flags (CO-RE)
BPF_CFLAGS := -O2 -g -Wall -target bpf -I./bpf

# Use pkg-config to find libbpf
LIBBPF_CFLAGS := $(shell pkg-config --cflags libbpf)
LIBBPF_LDFLAGS := $(shell pkg-config --libs libbpf)

# Sources
BPF_SRCS     := $(wildcard bpf/*.bpf.c)
BPF_OBJS     := $(BPF_SRCS:%.bpf.c=%.bpf.o)
OBSERVER_SRC := observer.c
OBSERVER_BIN := observer

.PHONY: all clean

all: $(BPF_OBJS) $(OBSERVER_BIN)

bpf/%.bpf.o: bpf/%.bpf.c vmlinux.h bpf/common.h
	@echo ">> Compiling BPF program $<"
	$(BPF_CLANG) $(BPF_CFLAGS) -c $< -o $@

$(OBSERVER_BIN): $(OBSERVER_SRC)
	@echo ">> Compiling userspace observer $@"
	$(CC) -O2 -g -Wall $(OBSERVER_SRC) \
	    $(LIBBPF_CFLAGS) \
	    -o $(OBSERVER_BIN) \
	    $(LIBBPF_LDFLAGS)

clean:
	@echo ">> Cleaning up"
	rm -f bpf/*.bpf.o $(OBSERVER_BIN)
