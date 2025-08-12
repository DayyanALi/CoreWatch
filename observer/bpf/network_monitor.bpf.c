#define __TARGET_ARCH_x86

#include "../vmlinux.h"                
#include <bpf/bpf_helpers.h>
#include <bpf/bpf_tracing.h>
#include <bpf/bpf_core_read.h>
#include <bpf/bpf_endian.h>            

#define ETH_P_IP 0x0800
#define TC_ACT_OK 0

char LICENSE[] SEC("license") = "GPL";

struct {
    __uint(type, BPF_MAP_TYPE_HASH);
    __uint(max_entries, 3600);       
    __type(key,   __u64);            
    __type(value, __u64);            
} bytes_sent_map SEC(".maps");


struct {
    __uint(type, BPF_MAP_TYPE_HASH);
    __uint(max_entries, 3600);       
    __type(key,   __u64);            
    __type(value, __u64);            
} bytes_recv_map SEC(".maps");


SEC("tc")
int tc_egress(struct __sk_buff *skb) {
    u64 ts_ns = bpf_ktime_get_ns();
    u64 ts_s  = ts_ns / 1000000000;               

    u64 *cnt = bpf_map_lookup_elem(&bytes_sent_map, &ts_s);
    u64 bytes = skb->len;

    if (cnt) {
        u64 updated = *cnt + bytes;
        bpf_map_update_elem(&bytes_sent_map, &ts_s, &updated, BPF_ANY);
    } else {
        bpf_map_update_elem(&bytes_sent_map, &ts_s, &bytes, BPF_ANY);
    }
    return TC_ACT_OK;
}


SEC("xdp")
int count_all_bytes(struct xdp_md *ctx) {
    void *data     = (void *)(long)ctx->data;
    void *data_end = (void *)(long)ctx->data_end;
    u64 bytes = data_end - data;
    if (bytes == 0)
        return XDP_PASS;

    u64 ts_ns = bpf_ktime_get_ns();
    u64 ts_s  = ts_ns / 1000000000ULL;    

    u64 *cnt = bpf_map_lookup_elem(&bytes_recv_map, &ts_s);
    if (cnt) {
        u64 updated = *cnt + bytes;
        bpf_map_update_elem(&bytes_recv_map, &ts_s, &updated, BPF_ANY);
    } else {
        bpf_map_update_elem(&bytes_recv_map, &ts_s, &bytes, BPF_ANY);
    }

    return XDP_PASS;
}

