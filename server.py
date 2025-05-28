from flask import Flask, request, jsonify, send_from_directory
import json
import os

app = Flask(__name__)

# 获取网站数据
@app.route('/api/sites', methods=['GET'])
def get_sites():
    try:
        print('正在读取网站数据...')
        with open('sites.json', 'r', encoding='utf-8') as f:
            data = json.load(f)
        print('成功读取网站数据')
        return jsonify(data)
    except FileNotFoundError:
        print('读取网站数据失败，返回空数组')
        return jsonify([])

# 保存网站数据
@app.route('/api/sites', methods=['POST'])
def save_sites():
    try:
        print('正在保存网站数据...')
        data = request.get_json()
        with open('sites.json', 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
        print('成功保存网站数据')
        return jsonify({"success": True})
    except Exception as e:
        print('保存网站数据失败:', str(e))
        return jsonify({"error": "保存失败"}), 500

# 提供静态文件
@app.route('/')
def index():
    return send_from_directory('.', 'index.html')

@app.route('/<path:path>')
def static_files(path):
    return send_from_directory('.', path)

if __name__ == '__main__':
    print('服务器运行在 http://localhost:5000')
    print('按 Ctrl+C 停止服务器')
    app.run(debug=True, port=5000) 