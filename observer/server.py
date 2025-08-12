# app.py

import eventlet
eventlet.monkey_patch()

import time
from flask import Flask, render_template
from flask_socketio import SocketIO
from process_data import read_metrics, aggregate

app = Flask(__name__, static_folder="static", template_folder="static")
socketio = SocketIO(app,
                    cors_allowed_origins="*",
                    async_mode="eventlet")

@app.route("/")
def index():
    return render_template("index.html")

def generate_metrics():
    """Background task: read log, aggregate, and emit once per second."""
    while True:
        df      = read_metrics()
        metrics_sent = aggregate(df, 'bytes_sent')
        metrics_recv = aggregate(df, 'bytes_recv')
        metrics_read = aggregate(df, 'bytes_read')
        metrics_written = aggregate(df, 'bytes_written')
        
        socketio.emit("metrics", metrics_sent)
        socketio.emit("metrics", metrics_recv)
        socketio.emit("metrics", metrics_read)
        socketio.emit("metrics", metrics_written)
        socketio.sleep(1)

@socketio.on("connect")
def handle_connect():
    print("Client connected")
    global _thread
    try:
        _thread
    except NameError:
        _thread = socketio.start_background_task(generate_metrics)

@socketio.on("disconnect")
def handle_disconnect():
    print("Client disconnected")

if __name__ == "__main__":
    socketio.run(app,
                 host="0.0.0.0",
                 port=5000,
                 debug=True,
                 use_reloader=False)
