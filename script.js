// 更新时间显示
function updateTime() {
    const now = new Date();
    const clockStyle = localStorage.getItem('clock-style') || 'simple';
    
    // 更新时间
    let timeString;
    if (clockStyle === 'time-only') {
        timeString = now.toLocaleTimeString('zh-CN', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: false
        });
    } else {
        timeString = now.toLocaleTimeString('zh-CN', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: false
        });
    }
    document.getElementById('current-time').textContent = timeString;
    
    // 更新日期
    if (clockStyle !== 'time-only') {
        const dateString = now.toLocaleDateString('zh-CN', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            weekday: 'long'
        });
        document.getElementById('current-date').textContent = dateString;
    } else {
        document.getElementById('current-date').textContent = '';
    }
}

// 每秒更新一次时间
setInterval(updateTime, 1000);
updateTime(); // 立即执行一次

// 搜索功能
const searchInput = document.getElementById('search-input');
const searchButton = document.getElementById('search-button');

function performSearch() {
    const query = searchInput.value.trim();
    if (query) {
        // 使用 Google 搜索
        window.location.href = `https://www.google.com/search?q=${encodeURIComponent(query)}`;
    }
}

// 点击搜索按钮时搜索
searchButton.addEventListener('click', performSearch);

// 按回车键时搜索
searchInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        performSearch();
    }
});

// 页面加载完成后自动聚焦到搜索框
window.addEventListener('load', () => {
    searchInput.focus();
});

// 网站卡片管理
const STORAGE_KEY = 'navigation_sites';
const CARD_SIZE_KEY = 'card_size';
const CLOCK_STYLE_KEY = 'clock_style';
const BACKGROUND_KEY = 'background';
const sitesContainer = document.getElementById('sites-container');
const addSiteBtn = document.getElementById('add-site-btn');
const settingsBtn = document.getElementById('settings-btn');
const addSiteModal = document.getElementById('add-site-modal');
const settingsModal = document.getElementById('settings-modal');
const closeBtns = document.querySelectorAll('.close-btn');
const saveSiteBtn = document.getElementById('save-site-btn');

// 添加一个变量来跟踪正在编辑的卡片索引
let editingCardIndex = null;

// 从服务器获取网站数据
async function fetchSitesFromServer() {
    try {
        const response = await fetch('/api/sites');
        if (!response.ok) {
            throw new Error('服务器响应错误');
        }
        const sites = await response.json();
        return sites;
    } catch (error) {
        console.error('从服务器获取数据失败:', error);
        return null;
    }
}

// 保存网站数据到服务器
async function saveSitesToServer(sites) {
    try {
        const response = await fetch('/api/sites', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(sites),
        });
        if (!response.ok) {
            throw new Error('服务器响应错误');
        }
        return await response.json();
    } catch (error) {
        console.error('保存到服务器失败:', error);
        return null;
    }
}

// 从本地存储加载网站
function loadSitesFromCache() {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
}

// 保存网站到本地存储
function saveSitesToCache(sites) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sites));
}

// 加载卡片大小设置
function loadCardSize() {
    return localStorage.getItem(CARD_SIZE_KEY) || 'small';
}

// 保存卡片大小设置
function saveCardSize(size) {
    localStorage.setItem(CARD_SIZE_KEY, size);
}

// 加载时钟样式设置
function loadClockStyle() {
    return localStorage.getItem(CLOCK_STYLE_KEY) || 'full';
}

// 保存时钟样式设置
function saveClockStyle(style) {
    localStorage.setItem(CLOCK_STYLE_KEY, style);
}

// 加载背景设置
function loadBackground() {
    return JSON.parse(localStorage.getItem(BACKGROUND_KEY) || '{"type": "color", "value": "#1a1a1a"}');
}

// 保存背景设置
function saveBackground(background) {
    localStorage.setItem(BACKGROUND_KEY, JSON.stringify(background));
}

// 应用卡片大小
function applyCardSize(size) {
    sitesContainer.className = `sites-container ${size}`;
    const cards = document.querySelectorAll('.site-card');
    cards.forEach(card => {
        card.className = `site-card ${size}`;
    });
    // 确保添加卡片也应用正确的大小
    const addCard = document.getElementById('add-site-btn');
    if (addCard) {
        addCard.className = `site-card add-card ${size}`;
    }
}

// 应用时钟样式
function applyClockStyle(style) {
    const timeDisplay = document.querySelector('.time-display');
    timeDisplay.className = `time-display ${style}`;
    updateTime();
}

// 应用背景设置
function applyBackground(background) {
    if (background.type === 'image') {
        document.body.style.background = `url(${background.value}) center/cover no-repeat fixed`;
    } else {
        document.body.style.background = background.value;
    }
}

// 加载网站数据（优先从服务器获取）
async function loadSites() {
    const serverSites = await fetchSitesFromServer();
    const cacheSites = loadSitesFromCache();

    if (serverSites && serverSites.length > 0) {
        // 如果服务器有数据，更新缓存
        saveSitesToCache(serverSites);
        return serverSites;
    } else if (cacheSites.length > 0) {
        // 如果服务器没有数据但缓存有，使用缓存
        return cacheSites;
    } else {
        // 如果都没有数据，使用默认数据
        const defaultSites = [
            { name: 'Google', url: 'https://www.google.com', icon: 'ri-google-fill' },
            { name: 'GitHub', url: 'https://www.github.com', icon: 'ri-github-fill' },
            { name: 'YouTube', url: 'https://www.youtube.com', icon: 'ri-youtube-fill' },
            { name: '哔哩哔哩', url: 'https://www.bilibili.com', icon: 'ri-bilibili-fill' },
            { name: '知乎', url: 'https://www.zhihu.com', icon: 'ri-zhihu-fill' },
            { name: '微博', url: 'https://www.weibo.com', icon: 'ri-weibo-fill' }
        ];
        // 保存默认数据到服务器和缓存
        await saveSitesToServer(defaultSites);
        saveSitesToCache(defaultSites);
        return defaultSites;
    }
}

// 保存网站数据（同时保存到服务器和缓存）
async function saveSites(sites) {
    await saveSitesToServer(sites);
    saveSitesToCache(sites);
}

// 拖拽排序功能
let isReordering = false;
let longPressTimer = null;
let draggedCard = null;
let draggedCardIndex = null;
let originalOrder = [];
let cardPositions = new Map(); // 存储卡片位置信息

// 获取卡片在网格中的位置
function getCardPosition(card) {
    const rect = card.getBoundingClientRect();
    const containerRect = sitesContainer.getBoundingClientRect();
    const gridGap = 24; // 与 CSS 中的 gap 值保持一致
    const cardWidth = rect.width + gridGap;
    const cardHeight = rect.height + gridGap;
    
    const col = Math.round((rect.left - containerRect.left) / cardWidth);
    const row = Math.round((rect.top - containerRect.top) / cardHeight);
    
    return { row, col };
}

// 获取卡片在网格中的索引
function getCardGridIndex(card) {
    const { row, col } = getCardPosition(card);
    const cardsPerRow = Math.floor(sitesContainer.clientWidth / (card.getBoundingClientRect().width + 24));
    return row * cardsPerRow + col;
}

// 更新卡片位置
function updateCardPositions() {
    cardPositions.clear();
    const cards = Array.from(sitesContainer.children).filter(card => !card.classList.contains('add-card'));
    cards.forEach(card => {
        cardPositions.set(card, getCardPosition(card));
    });
}

// 长按开始计时
function startLongPress(card) {
    if (longPressTimer || isReordering) return;
    
    longPressTimer = setTimeout(() => {
        enterReorderMode();
        longPressTimer = null;
    }, 500); // 500ms 长按触发
}

// 取消长按
function cancelLongPress() {
    if (longPressTimer) {
        clearTimeout(longPressTimer);
        longPressTimer = null;
    }
}

// 进入排序模式
function enterReorderMode() {
    isReordering = true;
    sitesContainer.classList.add('reordering');
    document.getElementById('reorder-complete').classList.add('show');
    
    // 保存原始顺序
    originalOrder = Array.from(sitesContainer.children)
        .filter(card => !card.classList.contains('add-card'))
        .map(card => card.dataset.index);
    
    // 记录初始位置
    updateCardPositions();
}

// 退出排序模式
function exitReorderMode() {
    isReordering = false;
    sitesContainer.classList.remove('reordering');
    document.getElementById('reorder-complete').classList.remove('show');
    
    // 保存新的顺序
    const newOrder = Array.from(sitesContainer.children)
        .filter(card => !card.classList.contains('add-card'))
        .map(card => card.dataset.index);
    
    if (JSON.stringify(originalOrder) !== JSON.stringify(newOrder)) {
        saveNewOrder(newOrder);
    }
}

// 保存新的顺序
async function saveNewOrder(newOrder) {
    const sites = await loadSites();
    const reorderedSites = newOrder.map(index => sites[index]);
    await saveSites(reorderedSites);
    await renderSites();
}

// 右键菜单功能
let contextMenu = document.getElementById('context-menu');
let currentCard = null;

// 显示右键菜单
function showContextMenu(e, card) {
    e.preventDefault();
    currentCard = card;
    
    // 设置菜单位置
    contextMenu.style.left = `${e.clientX}px`;
    contextMenu.style.top = `${e.clientY}px`;
    contextMenu.classList.add('show');
}

// 隐藏右键菜单
function hideContextMenu() {
    contextMenu.classList.remove('show');
    currentCard = null;
}

// 渲染网站卡片
async function renderSites() {
    const sites = await loadSites();
    const addCard = document.getElementById('add-site-btn');
    sitesContainer.innerHTML = '';
    
    sites.forEach((site, index) => {
        const card = document.createElement('div');
        card.className = `site-card ${loadCardSize()}`;
        card.dataset.index = index;
        card.draggable = true;
        
        // 添加删除按钮
        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'delete-btn';
        deleteBtn.innerHTML = '×';
        deleteBtn.addEventListener('click', async (e) => {
            e.stopPropagation(); // 阻止事件冒泡，防止触发卡片点击
            if (confirm(`确定要删除 ${site.name} 吗？`)) {
                sites.splice(index, 1);
                await saveSites(sites);
                await renderSites();
            }
        });
        
        const content = `
            <i class="${site.icon}"></i>
            <span>${site.name}</span>
        `;
        
        card.innerHTML = content;
        card.appendChild(deleteBtn);
        
        // 右键菜单事件
        card.addEventListener('contextmenu', (e) => {
            if (isReordering) return;
            showContextMenu(e, card);
        });
        
        // 长按事件
        card.addEventListener('mousedown', () => startLongPress(card));
        card.addEventListener('mouseup', cancelLongPress);
        card.addEventListener('mouseleave', cancelLongPress);
        card.addEventListener('touchstart', () => startLongPress(card));
        card.addEventListener('touchend', cancelLongPress);
        card.addEventListener('touchcancel', cancelLongPress);
        
        // 拖拽事件
        card.addEventListener('dragstart', (e) => {
            if (!isReordering) return;
            draggedCard = card;
            draggedCardIndex = Array.from(sitesContainer.children).indexOf(card);
            card.classList.add('dragging');
            e.dataTransfer.effectAllowed = 'move';
            
            // 设置拖拽时的预览图像
            const dragImage = card.cloneNode(true);
            dragImage.style.position = 'absolute';
            dragImage.style.top = '-1000px';
            document.body.appendChild(dragImage);
            e.dataTransfer.setDragImage(dragImage, 0, 0);
            setTimeout(() => document.body.removeChild(dragImage), 0);
            
            // 记录所有卡片的初始位置
            updateCardPositions();
        });
        
        card.addEventListener('dragend', () => {
            if (!isReordering) return;
            card.classList.remove('dragging');
            draggedCard = null;
            draggedCardIndex = null;
        });
        
        card.addEventListener('dragover', (e) => {
            if (!isReordering || !draggedCard) return;
            e.preventDefault();
            
            const targetCard = e.currentTarget;
            if (targetCard === draggedCard) return;
            
            const draggedIndex = Array.from(sitesContainer.children).indexOf(draggedCard);
            const targetIndex = Array.from(sitesContainer.children).indexOf(targetCard);
            
            // 计算移动方向
            const direction = draggedIndex < targetIndex ? 1 : -1;
            
            // 移动卡片
            if (direction === 1) {
                targetCard.parentNode.insertBefore(draggedCard, targetCard.nextSibling);
            } else {
                targetCard.parentNode.insertBefore(draggedCard, targetCard);
            }
            
            // 更新所有卡片的位置
            updateCardPositions();
        });
        
        // 点击卡片跳转
        card.addEventListener('click', (e) => {
            if (isReordering) return;
            window.location.href = site.url;
        });
        
        sitesContainer.appendChild(card);
    });

    // 重新添加添加卡片
    if (addCard) {
        addCard.className = `site-card add-card ${loadCardSize()}`;
        sitesContainer.appendChild(addCard);
    }
}

// 完成按钮点击事件
document.getElementById('reorder-complete').addEventListener('click', exitReorderMode);

// 点击外部退出排序模式
document.addEventListener('click', (e) => {
    if (isReordering && !e.target.closest('.site-card') && !e.target.closest('#reorder-complete')) {
        // 移除点击外部退出排序模式的功能
        return;
    }
});

// 显示添加网站模态框
addSiteBtn.addEventListener('click', () => {
    document.getElementById('modal-title').textContent = '添加网站';
    document.getElementById('save-site-btn').textContent = '添加';
    editingCardIndex = null; // 重置编辑索引
    addSiteModal.classList.add('show');
    document.getElementById('site-name').focus();
});

// 显示设置模态框
settingsBtn.addEventListener('click', async () => {
    settingsModal.classList.add('show');
    const settings = await loadBackgroundSettings();
    await updateSettingsUI(settings);
});

// 关闭模态框
closeBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        addSiteModal.classList.remove('show');
        settingsModal.classList.remove('show');
    });
});

// 点击模态框外部关闭
[addSiteModal, settingsModal].forEach(modal => {
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.classList.remove('show');
        }
    });
});

// 保存网站按钮点击事件
saveSiteBtn.addEventListener('click', async () => {
    const name = document.getElementById('site-name').value.trim();
    const url = document.getElementById('site-url').value.trim();
    const icon = document.getElementById('site-icon').value.trim() || 'ri-global-line';  // 默认图标
    
    // 验证必填字段
    if (!name) {
        alert('请输入网站名称！');
        return;
    }
    if (!url) {
        alert('请输入网站地址！');
        return;
    }
    
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
        alert('请输入有效的网址！');
        return;
    }

    const sites = await loadSites();
    const isEditing = document.getElementById('modal-title').textContent === '编辑网站';
    
    if (isEditing && editingCardIndex !== null) {
        // 编辑模式：更新现有卡片
        sites[editingCardIndex] = { name, url, icon };
    } else if (!isEditing) {
        // 只有在非编辑模式下才添加新卡片
        sites.push({ name, url, icon });
    }
    
    await saveSites(sites);
    await renderSites();
    
    // 清空表单并关闭模态框
    document.getElementById('site-name').value = '';
    document.getElementById('site-url').value = '';
    document.getElementById('site-icon').value = '';
    editingCardIndex = null; // 重置编辑索引
    addSiteModal.classList.remove('show');
});

// 右键菜单编辑事件
document.querySelector('.context-menu-item.edit').addEventListener('click', async () => {
    if (!currentCard) return;
    const index = parseInt(currentCard.dataset.index);
    editingCardIndex = index; // 保存正在编辑的卡片索引
    const sites = await loadSites();
    const site = sites[index];
    
    // 填充编辑表单
    document.getElementById('modal-title').textContent = '编辑网站';
    document.getElementById('site-name').value = site.name;
    document.getElementById('site-url').value = site.url;
    document.getElementById('site-icon').value = site.icon;
    document.getElementById('save-site-btn').textContent = '保存';
    
    // 显示编辑模态框
    addSiteModal.classList.add('show');
    
    hideContextMenu();
});

document.querySelector('.context-menu-item.delete').addEventListener('click', async () => {
    if (!currentCard) return;
    const index = parseInt(currentCard.dataset.index);
    const sites = await loadSites();
    const site = sites[index];
    
    if (confirm(`确定要删除 ${site.name} 吗？`)) {
        sites.splice(index, 1);
        await saveSites(sites);
        await renderSites();
    }
    
    hideContextMenu();
});

// 点击其他地方隐藏右键菜单
document.addEventListener('click', hideContextMenu);
document.addEventListener('contextmenu', (e) => {
    if (!e.target.closest('.site-card')) {
        hideContextMenu();
    }
});

// 更新设置界面
async function updateSettingsUI(settings) {
    // 卡片大小高亮
    document.querySelectorAll('.setting-card[data-setting="card-size"]').forEach(card => {
        card.classList.toggle('active', card.dataset.value === (settings.cardSize || 'small'));
    });
    // 时钟样式高亮
    document.querySelectorAll('.setting-card[data-setting="clock-style"]').forEach(card => {
        card.classList.toggle('active', card.dataset.value === (settings.clockStyle || 'simple'));
    });
    // 背景类型高亮
    document.querySelectorAll('.setting-card[data-setting="background-type"]').forEach(card => {
        card.classList.toggle('active', card.dataset.value === settings.backgroundType);
    });
    // 显示/隐藏相应的设置面板
    document.getElementById('color-background-settings').style.display = 
        settings.backgroundType === 'color' ? 'block' : 'none';
    document.getElementById('image-background-settings').style.display = 
        settings.backgroundType === 'image' ? 'block' : 'none';
    // 更新颜色选择器
    document.getElementById('background-color').value = settings.backgroundColor;
    // 加载背景图片列表
    if (settings.backgroundType === 'image') {
        await loadBackgroundImages();
    }
}

// 卡片大小、时钟样式点击事件
// 只保留一套逻辑，全部走 settings

document.querySelectorAll('.setting-card[data-setting="card-size"]').forEach(card => {
    card.addEventListener('click', async () => {
        const settings = await loadBackgroundSettings();
        settings.cardSize = card.dataset.value;
        await saveBackgroundSettings(settings);
        await updateSettingsUI(settings);
        applyCardSize(settings.cardSize);
    });
});

document.querySelectorAll('.setting-card[data-setting="clock-style"]').forEach(card => {
    card.addEventListener('click', async () => {
        const settings = await loadBackgroundSettings();
        settings.clockStyle = card.dataset.value;
        await saveBackgroundSettings(settings);
        await updateSettingsUI(settings);
        applyClockStyle(settings.clockStyle);
    });
});

// 背景颜色选择
document.getElementById('background-color').addEventListener('change', (e) => {
    const background = {
        type: 'color',
        value: e.target.value
    };
    saveBackground(background);
    applyBackground(background);
});

// 右键菜单元素
let bgImgContextMenu = document.getElementById('bg-img-context-menu');
if (!bgImgContextMenu) {
    bgImgContextMenu = document.createElement('div');
    bgImgContextMenu.id = 'bg-img-context-menu';
    bgImgContextMenu.className = 'context-menu';
    bgImgContextMenu.innerHTML = `
        <div class="context-menu-item delete">
            <i class="ri-delete-bin-line"></i> 删除
        </div>
    `;
    document.body.appendChild(bgImgContextMenu);
}
let currentBgImgItem = null;

// 关闭右键菜单
function hideBgImgContextMenu() {
    bgImgContextMenu.classList.remove('show');
    currentBgImgItem = null;
}
document.addEventListener('click', (e) => {
    if (!e.target.closest('#bg-img-context-menu')) {
        hideBgImgContextMenu();
    }
});

// 右键菜单删除功能
bgImgContextMenu.querySelector('.context-menu-item.delete').onclick = async function() {
    if (!currentBgImgItem) return;
    const img = currentBgImgItem.querySelector('img');
    if (!img) return;
    // 获取图片文件名
    const url = img.src;
    const filename = url.split('/').pop();
    if (!confirm('确定要删除这张背景图片吗？')) return;
    // 如果当前设置的背景图片就是被删图片，则自动切换为默认背景
    const settings = await loadBackgroundSettings();
    if (settings.backgroundImage && url.endsWith(settings.backgroundImage.split('/').pop())) {
        settings.backgroundImage = '';
        settings.backgroundType = 'color';
        await saveBackgroundSettings(settings);
        await applyBackgroundSettings(settings);
    }
    // 调用后端接口删除
    try {
        const resp = await fetch(`/api/backgrounds/${encodeURIComponent(filename)}`, { method: 'DELETE' });
        if (resp.ok) {
            await loadBackgroundImages();
        } else {
            alert('删除失败');
        }
    } catch (e) {
        alert('删除失败');
    }
    hideBgImgContextMenu();
};

// 判断颜色亮度（YIQ公式）
function isColorLight(hex) {
    let r, g, b;
    if (hex.startsWith('#')) {
        hex = hex.slice(1);
    }
    if (hex.length === 3) {
        r = parseInt(hex[0] + hex[0], 16);
        g = parseInt(hex[1] + hex[1], 16);
        b = parseInt(hex[2] + hex[2], 16);
    } else if (hex.length === 6) {
        r = parseInt(hex.slice(0, 2), 16);
        g = parseInt(hex.slice(2, 4), 16);
        b = parseInt(hex.slice(4, 6), 16);
    } else {
        return false;
    }
    // YIQ公式
    return (r * 299 + g * 587 + b * 114) / 1000 > 180;
}

// backgrounds缓存
let backgroundsMeta = {};

// 加载背景图片列表（并缓存亮暗信息）
async function loadBackgroundImages() {
    try {
        const response = await fetch('/api/backgrounds');
        if (!response.ok) {
            throw new Error('获取背景图片列表失败');
        }
        const images = await response.json();
        backgroundsMeta = {};
        const container = document.getElementById('background-images');
        container.innerHTML = '';
        const settings = await loadBackgroundSettings();
        const highlightUrl = settings.backgroundImage;
        // 只渲染所有图片
        images.forEach(imgObj => {
            backgroundsMeta[imgObj.url] = imgObj.isLight;
            const item = document.createElement('div');
            item.className = 'background-image-item';
            if (highlightUrl === imgObj.url && settings.backgroundType === 'image') {
                item.classList.add('selected');
            }
            item.innerHTML = `
                <img src="${imgObj.url}" alt="背景图片">
            `;
            // 点击图片设置为背景
            item.querySelector('img').addEventListener('click', async () => {
                const settings = await loadBackgroundSettings();
                settings.backgroundType = 'image';
                settings.backgroundImage = imgObj.url;
                await saveBackgroundSettings(settings);
                await applyBackgroundSettings(settings);
                await loadBackgroundImages(); // 刷新高亮
                await updateSettingsUI(settings);
                // 立即根据图片亮暗信息切换主题
                if (backgroundsMeta[imgObj.url] === true) {
                    document.body.classList.add('theme-light');
                    document.body.classList.remove('theme-dark');
                } else {
                    document.body.classList.add('theme-dark');
                    document.body.classList.remove('theme-light');
                }
            });
            // 右键菜单
            item.addEventListener('contextmenu', (e) => {
                e.preventDefault();
                currentBgImgItem = item;
                bgImgContextMenu.style.left = `${e.clientX}px`;
                bgImgContextMenu.style.top = `${e.clientY}px`;
                bgImgContextMenu.classList.add('show');
            });
            container.appendChild(item);
        });
        // 插入加号上传块
        const uploadItem = document.createElement('div');
        uploadItem.className = 'background-image-item background-upload-item';
        uploadItem.innerHTML = `
            <div class="upload-icon-wrapper" style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;">
                <i class="ri-add-line" style="font-size:3rem;color:#4a9eff;"></i>
            </div>
        `;
        // 创建隐藏input[type=file]
        let uploadInput = document.getElementById('background-upload-input');
        if (!uploadInput) {
            uploadInput = document.createElement('input');
            uploadInput.type = 'file';
            uploadInput.accept = 'image/*';
            uploadInput.style.display = 'none';
            uploadInput.id = 'background-upload-input';
            document.body.appendChild(uploadInput);
        }
        uploadItem.addEventListener('click', () => {
            uploadInput.value = '';
            uploadInput.click();
        });
        uploadInput.onchange = async (e) => {
            const file = e.target.files[0];
            if (!file) return;
            const formData = new FormData();
            formData.append('file', file);
            try {
                const response = await fetch('/api/backgrounds/upload', {
                    method: 'POST',
                    body: formData
                });
                if (response.ok) {
                    await loadBackgroundImages();
                }
            } catch (error) {
                console.error('上传背景图片失败:', error);
            }
        };
        container.appendChild(uploadItem);
    } catch (error) {
        console.error('加载背景图片列表失败:', error);
    }
}

// 自动切换主题，图片用 backgroundsMeta
function autoSetTheme(settings) {
    if (settings.backgroundType === 'color') {
        if (isColorLight(settings.backgroundColor)) {
            document.body.classList.add('theme-light');
            document.body.classList.remove('theme-dark');
        } else {
            document.body.classList.add('theme-dark');
            document.body.classList.remove('theme-light');
        }
    } else if (settings.backgroundType === 'image') {
        const url = settings.backgroundImage;
        if (!url) {
            document.body.classList.add('theme-dark');
            document.body.classList.remove('theme-light');
            return;
        }
        if (backgroundsMeta[url] === true) {
            document.body.classList.add('theme-light');
            document.body.classList.remove('theme-dark');
        } else {
            document.body.classList.add('theme-dark');
            document.body.classList.remove('theme-light');
        }
    }
}

// 在 applyBackgroundSettings 后调用自动切换主题
async function applyBackgroundSettings(settings) {
    if (settings.backgroundType === 'color') {
        document.body.style.background = settings.backgroundColor;
        window.currentRandomBgUrl = '';
        autoSetTheme(settings);
    } else if (settings.backgroundType === 'image') {
        if (!settings.backgroundImage) {
            // 没有图片时用暗色默认背景
            document.body.style.background = '#1a1a1a';
            document.body.classList.add('theme-dark');
            document.body.classList.remove('theme-light');
            return;
        }
        document.body.style.background = `url(${settings.backgroundImage}) center/cover no-repeat fixed`;
        window.currentRandomBgUrl = settings.backgroundImage;
        autoSetTheme(settings);
    }
}

// 背景设置相关常量
const BACKGROUND_TYPE_KEY = 'background_type';
const BACKGROUND_COLOR_KEY = 'background_color';
const BACKGROUND_IMAGE_KEY = 'background_image';

// 加载背景设置
async function loadBackgroundSettings() {
    try {
        const response = await fetch('/api/settings');
        if (!response.ok) {
            throw new Error('获取设置失败');
        }
        const settings = await response.json();
        return settings;
    } catch (error) {
        console.error('加载背景设置失败:', error);
        return {
            backgroundType: 'color',
            backgroundColor: '#1a1a1a',
            backgroundImage: '',
        };
    }
}

// 保存背景设置
async function saveBackgroundSettings(settings) {
    try {
        const response = await fetch('/api/settings', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(settings)
        });
        if (!response.ok) {
            throw new Error('保存设置失败');
        }
        return true;
    } catch (error) {
        console.error('保存背景设置失败:', error);
        return false;
    }
}

// 修改初始化函数，确保 applyBackgroundSettings 在 updateSettingsUI 之后调用
const init = async () => {
    await renderSites();
    const settings = await loadBackgroundSettings();
    await updateSettingsUI(settings);
    applyCardSize(settings.cardSize || 'small');
    applyClockStyle(settings.clockStyle || 'simple');
    await applyBackgroundSettings(settings);
};

init(); 

document.querySelectorAll('.setting-card[data-setting="background-type"]').forEach(card => {
    card.addEventListener('click', async () => {
        const settings = await loadBackgroundSettings();
        settings.backgroundType = card.dataset.value;
        await saveBackgroundSettings(settings);
        await updateSettingsUI(settings);
        await applyBackgroundSettings(settings);
    });
}); 