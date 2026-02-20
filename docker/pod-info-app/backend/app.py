from flask import Flask, request, jsonify
import psycopg2
import os
import time
from kubernetes import client, config

app = Flask(__name__)

# Retry DB connection until Postgres is ready
def get_db_conn():
    while True:
        try:
            conn = psycopg2.connect(
                host=os.getenv('DB_HOST', 'postgres'),
                database=os.getenv('DB_NAME', 'pod_db'),
                user=os.getenv('DB_USER', 'postgres'),
                password=os.getenv('DB_PASS', 'postgres')
            )
            print("Connected to Postgres")
            return conn
        except Exception as e:
            print(f"Postgres not ready yet: {e}")
            time.sleep(2)

conn = get_db_conn()

# Kubernetes client (in-cluster)
def get_k8s_client():
    try:
        config.load_incluster_config()
        return client.CoreV1Api()
    except Exception as e:
        print(f"Failed to load in-cluster config: {e}")
        return None

v1 = get_k8s_client()

# Health endpoint for probes
@app.route('/health', methods=['GET'])
def health():
    return jsonify({'status': 'ok'})

# Auto-collect pod info at startup
def auto_collect():
    cur = conn.cursor()
    try:
        cur.execute("""
            INSERT INTO pod_info.pod_info (pod_name, pod_ip, namespace)
            VALUES (%s, %s, %s)
        """, (os.getenv('HOSTNAME'), '127.0.0.1', 'default'))
        conn.commit()
        print("Auto-collected pod info at startup")
    except Exception as e:
        print(f"Error auto-collecting pod info: {e}")
    finally:
        cur.close()

auto_collect()

# Manual collect endpoint
@app.route('/collect', methods=['POST'])
def collect():
    try:
        namespace = request.args.get('namespace')
        if v1 is None:
            return jsonify({'status': 'error', 'message': 'Kubernetes client not available'}), 500

        if namespace:
            pods = v1.list_namespaced_pod(namespace=namespace).items
        else:
            pods = v1.list_pod_for_all_namespaces().items

        cur = conn.cursor()
        try:
            for pod in pods:
                pod_name = pod.metadata.name
                pod_ip = pod.status.pod_ip or 'N/A'
                pod_ns = pod.metadata.namespace or 'default'
                cur.execute("""
                    INSERT INTO pod_info.pod_info (pod_name, pod_ip, namespace)
                    VALUES (%s, %s, %s)
                """, (pod_name, pod_ip, pod_ns))
            conn.commit()
        finally:
            cur.close()
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)}), 500
    return jsonify({'status': 'ok', 'count': len(pods)})

# Get pods endpoint
@app.route('/pods', methods=['GET'])
def get_pods():
    cur = conn.cursor()
    ns = request.args.get('namespace')
    try:
        if ns:
            cur.execute(
                "SELECT pod_name, pod_ip, namespace, collected_at FROM pod_info.pod_info WHERE namespace=%s",
                (ns,)
            )
        else:
            cur.execute(
                "SELECT pod_name, pod_ip, namespace, collected_at FROM pod_info.pod_info"
            )
        rows = cur.fetchall()
        result = [
            {'pod_name': r[0], 'pod_ip': r[1], 'namespace': r[2], 'collected_at': r[3].isoformat()}
            for r in rows
        ]
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)}), 500
    finally:
        cur.close()
    return jsonify(result)

@app.route('/pods', methods=['POST'])
def add_pod():
    payload = request.get_json(silent=True) or {}
    pod_name = payload.get('pod_name')
    pod_ip = payload.get('pod_ip')
    namespace = payload.get('namespace')

    if not pod_name or not pod_ip or not namespace:
        return jsonify({'status': 'error', 'message': 'pod_name, pod_ip, and namespace are required'}), 400

    cur = conn.cursor()
    try:
        cur.execute("""
            INSERT INTO pod_info.pod_info (pod_name, pod_ip, namespace)
            VALUES (%s, %s, %s)
        """, (pod_name, pod_ip, namespace))
        conn.commit()
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)}), 500
    finally:
        cur.close()
    return jsonify({'status': 'ok'})

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)
