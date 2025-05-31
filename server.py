from flask import Flask, request, jsonify, send_from_directory
import json
import os
from werkzeug.utils import secure_filename
import random
from PIL import Image

app = Flask(__name__)

# 配置文件路径
BACKGROUNDS_DIR = 'static/backgrounds'
SETTINGS_FILE = 'settings.json'
META_FILE = 'backgrounds_meta.json'

# 确保必要的目录和文件存在
os.makedirs(BACKGROUNDS_DIR, exist_ok=True)
if not os.path.exists(SETTINGS_FILE):
    with open(SETTINGS_FILE, 'w', encoding='utf-8') as f:
        json.dump({
            "backgroundType": "color",  # color 或 image
            "backgroundColor": "#1a1a1a",
            "backgroundImage": "",
            "randomBackground": False,
            "cardSize": "small",
            "clockStyle": "simple"
        }, f, ensure_ascii=False, indent=2)

# 初始化 backgrounds_meta.json
if not os.path.exists(META_FILE):
    with open(META_FILE, 'w', encoding='utf-8') as f:
        json.dump({}, f)

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

# 获取背景设置
@app.route('/api/settings', methods=['GET'])
def get_settings():
    try:
        with open(SETTINGS_FILE, 'r', encoding='utf-8') as f:
            settings = json.load(f)
        return jsonify(settings)
    except Exception as e:
        print('读取设置失败:', str(e))
        return jsonify({"error": "读取设置失败"}), 500

# 保存背景设置
@app.route('/api/settings', methods=['POST'])
def save_settings():
    try:
        settings = request.get_json()
        with open(SETTINGS_FILE, 'w', encoding='utf-8') as f:
            json.dump(settings, f, ensure_ascii=False, indent=2)
        return jsonify({"success": True})
    except Exception as e:
        print('保存设置失败:', str(e))
        return jsonify({"error": "保存设置失败"}), 500

# 工具函数：判定图片是否为亮色
def is_image_light(image_path):
    try:
        with Image.open(image_path) as img:
            img = img.convert('RGB').resize((32, 32))
            pixels = list(img.getdata())
            r = sum([p[0] for p in pixels]) / len(pixels)
            g = sum([p[1] for p in pixels]) / len(pixels)
            b = sum([p[2] for p in pixels]) / len(pixels)
            yiq = (r * 299 + g * 587 + b * 114) / 1000
            return yiq > 180
    except Exception as e:
        print('图片亮度判定失败:', e)
        return False

# 上传背景图片
@app.route('/api/backgrounds/upload', methods=['POST'])
def upload_background():
    if 'file' not in request.files:
        return jsonify({"error": "没有文件"}), 400
    file = request.files['file']
    if file.filename == '':
        return jsonify({"error": "没有选择文件"}), 400
    if file:
        filename = secure_filename(file.filename)
        file_path = os.path.join(BACKGROUNDS_DIR, filename)
        file.save(file_path)
        # 判定亮/暗并写入 backgrounds_meta.json
        is_light = is_image_light(file_path)
        try:
            with open(META_FILE, 'r', encoding='utf-8') as f:
                meta = json.load(f)
        except Exception:
            meta = {}
        meta[filename] = {"isLight": is_light}
        with open(META_FILE, 'w', encoding='utf-8') as f:
            json.dump(meta, f, ensure_ascii=False, indent=2)
        return jsonify({
            "success": True,
            "filename": filename,
            "url": f"/static/backgrounds/{filename}",
            "isLight": is_light
        })

# 获取所有背景图片及亮暗信息
@app.route('/api/backgrounds', methods=['GET'])
def get_backgrounds():
    try:
        files = os.listdir(BACKGROUNDS_DIR)
        with open(META_FILE, 'r', encoding='utf-8') as f:
            meta = json.load(f)
        backgrounds = []
        for f_name in files:
            if f_name.lower().endswith(('.png', '.jpg', '.jpeg', '.gif', '.webp')):
                backgrounds.append({
                    "url": f"/static/backgrounds/{f_name}",
                    "filename": f_name,
                    "isLight": meta.get(f_name, {}).get("isLight", False)
                })
        return jsonify(backgrounds)
    except Exception as e:
        print('获取背景图片列表失败:', str(e))
        return jsonify({"error": "获取背景图片列表失败"}), 500

# 删除背景图片
@app.route('/api/backgrounds/<filename>', methods=['DELETE'])
def delete_background(filename):
    try:
        file_path = os.path.join(BACKGROUNDS_DIR, secure_filename(filename))
        if os.path.exists(file_path):
            os.remove(file_path)
            # 同步 backgrounds_meta.json
            try:
                with open(META_FILE, 'r', encoding='utf-8') as f:
                    meta = json.load(f)
            except Exception:
                meta = {}
            if filename in meta:
                del meta[filename]
                with open(META_FILE, 'w', encoding='utf-8') as f:
                    json.dump(meta, f, ensure_ascii=False, indent=2)
            return jsonify({"success": True})
        return jsonify({"error": "文件不存在"}), 404
    except Exception as e:
        print('删除背景图片失败:', str(e))
        return jsonify({"error": "删除背景图片失败"}), 500

# 获取随机背景图片
@app.route('/api/backgrounds/random', methods=['GET'])
def get_random_background():
    try:
        files = os.listdir(BACKGROUNDS_DIR)
        image_files = [f for f in files if f.lower().endswith(('.png', '.jpg', '.jpeg', '.gif', '.webp'))]
        if not image_files:
            return jsonify({"error": "没有可用的背景图片"}), 404
        random_file = random.choice(image_files)
        return jsonify({
            "url": f"/static/backgrounds/{random_file}"
        })
    except Exception as e:
        print('获取随机背景图片失败:', str(e))
        return jsonify({"error": "获取随机背景图片失败"}), 500

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
    app.run(debug=True, port=5000, host='0.0.0.0') 