#ifndef _NET_MONITOR_H
#define _NET_MONITOR_H

// #include <linux/types.h>

struct net_event {
    __u32 pid;
    __u64 rtt;
};

#endif