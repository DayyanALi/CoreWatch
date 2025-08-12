#include "../vmlinux.h"
#include <bpf/bpf_helpers.h>
#include <bpf/bpf_core_read.h>
#include <bpf/bpf_tracing.h>

char LICENSE[] SEC("license") = "GPL";

#ifndef REQ_OP_MASK
#define REQ_OP_MASK 0x3f
#endif
#ifndef REQ_OP_READ
#define REQ_OP_READ 0
#endif
#ifndef REQ_OP_WRITE
#define REQ_OP_WRITE 1
#endif

struct {
    __uint(type, BPF_MAP_TYPE_HASH);
    __uint(max_entries, 10240);
    __type(key,   __u64);               
    __type(value, __u64);
} bytes_read_per_sec SEC(".maps");

struct {
    __uint(type, BPF_MAP_TYPE_HASH);
    __uint(max_entries, 10240);
    __type(key,   __u64);
    __type(value, __u64);
} bytes_write_per_sec SEC(".maps");


SEC("raw_tracepoint/block_rq_complete")
int handle_block_rq_complete(struct bpf_raw_tracepoint_args *ctx)
{
    struct request *rq = (struct request *)ctx->args[0];
    __u64 bytes = (__u64)ctx->args[2]; 

    if (!rq || !bytes)
        return 0;

    unsigned int cmd_flags = BPF_CORE_READ(rq, cmd_flags);
    unsigned int op = cmd_flags & REQ_OP_MASK;

    __u64 ns = bpf_ktime_get_ns();
    __u64 sec = ns / 1000000000ULL;

    if (op == REQ_OP_READ) {
        __u64 *p = bpf_map_lookup_elem(&bytes_read_per_sec, &sec);
        if (p) {
            __u64 updated = *p + bytes;
            bpf_map_update_elem(&bytes_read_per_sec, &sec, &updated, BPF_ANY);
        } else {
            bpf_map_update_elem(&bytes_read_per_sec, &sec, &bytes, BPF_ANY);
        }
    } else if (op == REQ_OP_WRITE) {
        __u64 *p = bpf_map_lookup_elem(&bytes_write_per_sec, &sec);
        if (p) {
            __u64 updated = *p + bytes;
            bpf_map_update_elem(&bytes_write_per_sec, &sec, &updated, BPF_ANY);
        } else {
            bpf_map_update_elem(&bytes_write_per_sec, &sec, &bytes, BPF_ANY);
        }
    }
    return 0;
}
