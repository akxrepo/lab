sample app for testing 3-tier app

db schema
```
CREATE TABLE pod_info (
    id SERIAL PRIMARY KEY,
    pod_name VARCHAR(255),
    pod_ip VARCHAR(50),
    namespace VARCHAR(50),
    collected_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```
