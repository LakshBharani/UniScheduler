# Gunicorn configuration for memory optimization
import multiprocessing

# Server socket
bind = "0.0.0.0:8080"
backlog = 2048

# Worker processes
workers = 1  # Reduced from default to save memory
worker_class = "sync"
worker_connections = 1000
max_requests = 1000
max_requests_jitter = 50
preload_app = True

# Timeout settings
timeout = 300  # 5 minutes for AI operations
keepalive = 2
graceful_timeout = 30

# Memory optimization
worker_tmp_dir = "/dev/shm"  # Use RAM for temporary files
max_requests_jitter = 50

# Logging
accesslog = "-"
errorlog = "-"
loglevel = "info"

# Process naming
proc_name = "unischeduler"

# Restart workers after this many requests
max_requests = 1000

# Restart workers after this many seconds
max_requests_jitter = 50

# Memory limit (in bytes) - 512MB
worker_memory_limit = 536870912
