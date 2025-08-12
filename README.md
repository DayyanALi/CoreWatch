CoreWatch
CoreWatch is a lightweight, real-time system monitoring tool built with eBPF to track network traffic and disk I/O at high precision.
It provides detailed metrics for:

📡 Network Traffic: Bytes received and sent over the network interface.

💾 Disk I/O: Bytes read from disk and written to disk.

Data is collected in kernel space using eBPF programs and visualized in an interactive web dashboard.

Features
Network Traffic Monitoring
Tracks total bytes received and sent.

Displays per-second rates in KiB/s.

Provides total traffic over the last minute.

Disk I/O Monitoring
Monitors bytes read and written to disk.

Uses precise block layer hooks for accurate measurement.

Graphs activity over the last 60 seconds.

Dashboard
Real-time graphs for all four metrics:

Bytes Received

Bytes Sent

Bytes Read

Bytes Written

Per-second and total counters for each metric.

Modern dark-themed UI with responsive design.

Architecture
CoreWatch is composed of two main parts:

eBPF Observers

Network Observer: Hooks into XDP / TC to measure incoming and outgoing packets.

Disk Observer: Hooks into block layer tracepoints to measure read/write byte counts.

Dashboard

Backend: Python + Eventlet for real-time WebSocket communication.

Frontend: JavaScript/React (or chosen framework) to render live charts.

