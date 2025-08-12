#include <time.h>
#include <stdio.h>
#include <dirent.h>
#include <string.h>
#include <signal.h>
#include <unistd.h>
#include <sys/resource.h>
#include <bpf/libbpf.h>
#include <net/if.h>      
#include <errno.h> 
#include <bpf/bpf.h>
#include <linux/if_link.h>
#include <stdlib.h>   
#include <stdbool.h>
#include <signal.h>
#include <unistd.h>   

#define MAX_METRICS 8

// Metric types
enum metric_type {
    MT_DOUBLE_MAP,
};

struct metric {
    const char *name;       
    const char *map1;
    const char *map2;      
    int fd1, fd2;
    enum metric_type type;
};

static struct metric metrics[MAX_METRICS] = {
    // name                map1               map2                 fd1 fd2         type
    { "bytes_sent", "bytes_sent_map", NULL, -1, -1,  MT_DOUBLE_MAP},
    { "bytes_recv", "bytes_recv_map", NULL, -1, -1, MT_DOUBLE_MAP },
    { "bytes_read",    "bytes_read_per_sec",  NULL, -1, -1, MT_DOUBLE_MAP },
    { "bytes_written", "bytes_write_per_sec", NULL, -1, -1, MT_DOUBLE_MAP },

};
static int n_metrics = 6;

static volatile sig_atomic_t exiting = 0; 
static const char *iface_global = "wlp9s0";

static void handle_sig(int sig) { exiting = 1; }

static void cleanup_tc_cmd(void) {
    char cmd[256];
    snprintf(cmd, sizeof(cmd),
             "tc filter delete dev %s egress protocol all prio 1 handle 1 bpf",
             iface_global);
    int rc = system(cmd);
    fprintf(stderr, "cleanup tc cmd rc=%d\n", rc);
}
static void bump_memlock_rlimit(void) {
    struct rlimit r = { RLIM_INFINITY, RLIM_INFINITY };
    if (setrlimit(RLIMIT_MEMLOCK, &r))
        perror("setrlimit");
}

int main(int argc, char **argv)
{
    DIR *d;
    struct dirent *entry;
    FILE *out = fopen("metrics.log", "a");
    if (!out) {
        perror("fopen metrics.log");
        return 1;
    }

    bump_memlock_rlimit();
    atexit(cleanup_tc_cmd);
    signal(SIGINT, handle_sig);
    signal(SIGTERM, handle_sig);

    d = opendir("bpf");
    if (!d) {
        perror("opendir bpf");
        return 1;
    }

    printf("Loading BPF objects and attaching probes:\n");
    while ((entry = readdir(d))) {
        size_t len = strlen(entry->d_name);
        if (len > 6 && strcmp(entry->d_name + len - 6, ".bpf.o") == 0) {
            char path[256];
            snprintf(path, sizeof(path), "bpf/%s", entry->d_name);
            printf("  -> %s\n", path);

            struct bpf_object *obj = bpf_object__open_file(path, NULL);
            if (libbpf_get_error(obj)) {
                fprintf(stderr, "Error: open %s\n", path);
                continue;
            }
            if (bpf_object__load(obj)) {
                fprintf(stderr, "Error: load %s\n", path);
                bpf_object__close(obj);
                continue;
            }

            for (int i = 0; i < n_metrics; i++) {
                if (metrics[i].fd1 < 0) {
                    int fd = bpf_object__find_map_fd_by_name(obj, metrics[i].map1);
                    if (fd >= 0) metrics[i].fd1 = fd;
                }
            }

            const char *iface = "wlp9s0";
            int ifindex = if_nametoindex(iface);
            if (ifindex == 0) {
                fprintf(stderr, "ERROR: unknown interface \"%s\"\n", iface);
                return 1;
            }

            struct bpf_program *prog;
            bpf_object__for_each_program(prog, obj) {
                const char *sec = bpf_program__section_name(prog);
                if (strcmp(sec, "xdp") == 0) {
                    struct bpf_link *link = bpf_program__attach_xdp(prog, ifindex);
                    if (libbpf_get_error(link)) {
                        fprintf(stderr,
                            "ERROR: failed to attach XDP prog %s to %s\n",
                            bpf_program__name(prog), iface);
                    } else {
                        printf("XDP prog %s attached to %s\n",
                               bpf_program__name(prog), iface);
                    }
                }
                else if (strcmp(sec, "tc") == 0) {
                    // 1) Create (or verify) the clsact hook on ingress
                    struct bpf_tc_hook hook = {
                        .sz           = sizeof(hook),
                        .ifindex      = ifindex,
                        .attach_point = BPF_TC_EGRESS,
                    };
                    int err = bpf_tc_hook_create(&hook);
                    if (err && err != -EEXIST) {
                        fprintf(stderr, "ERROR: tc hook create on %s failed: %d\n",
                                iface, err);
                        continue;
                    }

                    struct bpf_tc_opts opts = {
                        .sz       = sizeof(opts),
                        .handle   = 1,
                        .priority = 1,                 
                        .prog_fd  = bpf_program__fd(prog),
                    };
                    err = bpf_tc_attach(&hook, &opts);
                    if (err && err != -EEXIST) {
                        fprintf(stderr, "ERROR: tc attach %s failed: %d\n",
                                bpf_program__name(prog), err);
                    } else {
                        printf("TC prog %s attached to %s egress (or already exists)\n",
                            bpf_program__name(prog), iface);
                    }

                } else {
                    struct bpf_link *link = bpf_program__attach(prog);
                    if (libbpf_get_error(link)) {
                        fprintf(stderr, "WARN: failed to auto‐attach %s\n",
                                bpf_program__name(prog));
                    }
                }
            }
        }
    }
    closedir(d);

    printf("Observer running, collecting metrics every second...\n");
    while (!exiting) {
        sleep(1);
        time_t now = time(NULL);
        for (int i = 0; i < n_metrics; i++) {
            struct metric *m = &metrics[i];
            if (m->type == MT_DOUBLE_MAP) {
                if (m->fd1 < 0) continue;
                __u64 key = 0, next, value;
                while (bpf_map_get_next_key(m->fd1, &key, &next) == 0) {
                    if (bpf_map_lookup_elem(m->fd1, &next, &value) == 0) {
                        fprintf(out, "%ld %s{pid=\"%llu\"} %llu\n", now, m->name, next, value);
                        fflush(out);
                        // printf("%s{pid=\"%u\"} %llu\n", m->name, next, value);
                    }
                    // clear for next interval
                    bpf_map_delete_elem(m->fd1, &next);
                    key = next;
                }
            }
        }
    }

    printf("Exiting.\n");
    return 0;
}
