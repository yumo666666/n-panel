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
    if (longPressTimer) return;
    
    longPressTimer = setTimeout(() => {
        enterReorderMode();
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
        card.innerHTML = `
            <i class="${site.icon}"></i>
            <span>${site.name}</span>
        `;
        
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
    addSiteModal.classList.add('show');
    document.getElementById('site-name').focus();
});

// 显示设置模态框
settingsBtn.addEventListener('click', () => {
    settingsModal.classList.add('show');
    // 设置当前选中的选项
    const currentCardSize = loadCardSize();
    const currentClockStyle = loadClockStyle();
    const currentBackground = loadBackground();
    
    document.querySelectorAll('.setting-card').forEach(card => {
        const setting = card.dataset.setting;
        const value = card.dataset.value;
        if ((setting === 'card-size' && value === currentCardSize) ||
            (setting === 'clock-style' && value === currentClockStyle)) {
            card.classList.add('active');
        } else {
            card.classList.remove('active');
        }
    });
    
    document.getElementById('background-color').value = currentBackground.type === 'color' ? currentBackground.value : '#1a1a1a';
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

// 右键菜单事件处理
document.querySelector('.context-menu-item.edit').addEventListener('click', async () => {
    if (!currentCard) return;
    const index = parseInt(currentCard.dataset.index);
    const sites = await loadSites();
    const site = sites[index];
    
    // 填充编辑表单
    document.getElementById('site-name').value = site.name;
    document.getElementById('site-url').value = site.url;
    document.getElementById('site-icon').value = site.icon;
    
    // 显示编辑模态框
    addSiteModal.classList.add('show');
    
    // 修改保存按钮行为
    const saveBtn = document.getElementById('save-site-btn');
    const originalClickHandler = saveBtn.onclick;
    
    saveBtn.onclick = async () => {
        const name = document.getElementById('site-name').value.trim();
        const url = document.getElementById('site-url').value.trim();
        const icon = document.getElementById('site-icon').value.trim();
        
        if (!name || !url || !icon) {
            alert('请填写所有字段！');
            return;
        }
        
        if (!url.startsWith('http://') && !url.startsWith('https://')) {
            alert('请输入有效的网址！');
            return;
        }
        
        // 更新网站信息
        sites[index] = { name, url, icon };
        await saveSites(sites);
        await renderSites();
        
        // 清空表单并关闭模态框
        document.getElementById('site-name').value = '';
        document.getElementById('site-url').value = '';
        document.getElementById('site-icon').value = '';
        addSiteModal.classList.remove('show');
        
        // 恢复原始保存按钮行为
        saveBtn.onclick = originalClickHandler;
    };
    
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

// 设置卡片点击事件
document.querySelectorAll('.setting-card').forEach(card => {
    card.addEventListener('click', () => {
        const setting = card.dataset.setting;
        const value = card.dataset.value;
        
        // 移除同组其他卡片的选中状态
        document.querySelectorAll(`.setting-card[data-setting="${setting}"]`).forEach(c => {
            c.classList.remove('active');
        });
        
        // 添加当前卡片的选中状态
        card.classList.add('active');
        
        // 应用设置
        if (setting === 'card-size') {
            saveCardSize(value);
            applyCardSize(value);
        } else if (setting === 'clock-style') {
            saveClockStyle(value);
            applyClockStyle(value);
        }
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

// 背景图片上传
document.getElementById('background-upload').addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            const background = {
                type: 'image',
                value: e.target.result
            };
            saveBackground(background);
            applyBackground(background);
        };
        reader.readAsDataURL(file);
    }
});

// 初始加载
const init = async () => {
    await renderSites();
    applyCardSize(loadCardSize());
    applyClockStyle(loadClockStyle());
    applyBackground(loadBackground());
};

init(); 