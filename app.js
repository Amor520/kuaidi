// 数据存储
let expressData = [];
let currentArea = '';
let currentDetailId = null;
let currentFilter = '全部'; // 当前筛选区域

// 注册 Service Worker
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
            .then(reg => console.log('Service Worker 注册成功'))
            .catch(err => console.log('Service Worker 注册失败:', err));
    });
}

// 页面加载时初始化
document.addEventListener('DOMContentLoaded', function() {
    loadData();
    renderExpressList();
    renderPickedList();
});

// 加载数据
function loadData() {
    const saved = localStorage.getItem('expressData');
    if (saved) {
        expressData = JSON.parse(saved);
    }
}

// 保存数据
function saveData() {
    localStorage.setItem('expressData', JSON.stringify(expressData));
}

// 页面切换
function switchPage(page) {
    // 移除所有页面的 active 类
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));

    // 激活选中的页面和导航
    if (page === 'home') {
        document.getElementById('home-page').classList.add('active');
        document.querySelectorAll('.nav-item')[0].classList.add('active');
        renderExpressList();
    } else if (page === 'picked') {
        document.getElementById('picked-page').classList.add('active');
        document.querySelectorAll('.nav-item')[1].classList.add('active');
        renderPickedList();
    } else if (page === 'settings') {
        document.getElementById('settings-page').classList.add('active');
        document.querySelectorAll('.nav-item')[2].classList.add('active');
    }
}

// 显示区域选择弹窗
function showAreaSelect() {
    document.getElementById('area-modal').classList.add('active');
}

// 选择区域
function selectArea(area) {
    currentArea = area;
    closeModal('area-modal');
    showAddModal();
}

// 显示添加快递弹窗
function showAddModal() {
    document.getElementById('selected-area').textContent = currentArea;
    document.getElementById('code-input').value = '';
    document.getElementById('add-modal').classList.add('active');
}

// 关闭添加弹窗
function closeAddModal() {
    closeModal('add-modal');
    document.getElementById('code-input').value = '';
}

// 关闭模态框
function closeModal(modalId) {
    document.getElementById(modalId).classList.remove('active');
}

// 输入按键
function inputKey(key) {
    const input = document.getElementById('code-input');
    input.value += key;
}

// 删除按键
function deleteKey() {
    const input = document.getElementById('code-input');
    input.value = input.value.slice(0, -1);
}

// 保存快递
function saveExpress() {
    const code = document.getElementById('code-input').value.trim();

    if (!code) {
        alert('请输入取件码');
        return;
    }

    const newExpress = {
        id: Date.now(),
        area: currentArea,
        code: code,
        time: new Date().toISOString(),
        picked: false
    };

    expressData.unshift(newExpress);
    saveData();
    closeAddModal();
    renderExpressList();
}

// 渲染快递列表
function renderExpressList() {
    const container = document.getElementById('express-list');
    let unpickedData = expressData.filter(item => !item.picked);

    // 根据筛选条件过滤
    if (currentFilter !== '全部') {
        unpickedData = unpickedData.filter(item => item.area === currentFilter);
    }

    // 按区域排序
    const areaOrder = ['东区', '西区', '东西区邮政', '荷花塘', '16栋', '17栋', '顺丰'];
    unpickedData.sort((a, b) => {
        const aIndex = areaOrder.indexOf(a.area);
        const bIndex = areaOrder.indexOf(b.area);
        // 如果区域相同，按时间倒序（新的在前）
        if (aIndex === bIndex) {
            return new Date(b.time) - new Date(a.time);
        }
        return aIndex - bIndex;
    });

    if (unpickedData.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">📦</div>
                <p>暂无快递</p>
                <p style="font-size: 14px; margin-top: 8px; color: var(--text-secondary);">${currentFilter === '全部' ? '点击右下角按钮添加快递' : '该区域暂无快递'}</p>
            </div>
        `;
        return;
    }

    container.innerHTML = unpickedData.map(item => `
        <div class="express-item">
            <div class="express-item-left" onclick="showDetail(${item.id})">
                <div class="express-item-header">
                    <span class="area-tag">${item.area}</span>
                    <span class="time-text">${formatTime(item.time)}</span>
                </div>
                <div class="code-display">${item.code}</div>
            </div>
            <button class="check-btn" onclick="event.stopPropagation(); quickMarkAsPicked(${item.id})">已取</button>
        </div>
    `).join('');
}

// 区域筛选
function filterByArea(area) {
    currentFilter = area;

    // 更新筛选按钮状态
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    event.target.classList.add('active');

    renderExpressList();
}

// 渲染已取快递列表
function renderPickedList() {
    const container = document.getElementById('picked-list');
    let pickedData = expressData.filter(item => item.picked);

    // 按区域排序
    const areaOrder = ['东区', '西区', '东西区邮政', '荷花塘', '16栋', '17栋', '顺丰'];
    pickedData.sort((a, b) => {
        const aIndex = areaOrder.indexOf(a.area);
        const bIndex = areaOrder.indexOf(b.area);
        // 如果区域相同，按时间倒序（新的在前）
        if (aIndex === bIndex) {
            return new Date(b.time) - new Date(a.time);
        }
        return aIndex - bIndex;
    });

    if (pickedData.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">✓</div>
                <p>暂无已取快递</p>
            </div>
        `;
        return;
    }

    container.innerHTML = pickedData.map(item => `
        <div class="express-item" onclick="showDetail(${item.id})">
            <div class="express-item-left">
                <div class="express-item-header">
                    <span class="area-tag" style="background: #d1fae5; color: #059669;">${item.area}</span>
                    <span class="time-text">${formatTime(item.time)}</span>
                </div>
                <div class="code-display">${item.code}</div>
            </div>
        </div>
    `).join('');
}

// 显示详情
function showDetail(id) {
    currentDetailId = id;
    const item = expressData.find(e => e.id === id);

    if (!item) return;

    document.getElementById('detail-area').textContent = item.area;
    document.getElementById('detail-code').textContent = item.code;
    document.getElementById('detail-time').textContent = formatTime(item.time);

    // 根据状态显示/隐藏"标记为已取"按钮
    const markBtn = document.getElementById('mark-picked-btn');
    if (item.picked) {
        markBtn.style.display = 'none';
    } else {
        markBtn.style.display = 'block';
    }

    document.getElementById('detail-modal').classList.add('active');
}

// 标记为已取
function markAsPicked() {
    const item = expressData.find(e => e.id === currentDetailId);
    if (item) {
        item.picked = true;
        item.pickedTime = new Date().toISOString();
        saveData();
        closeModal('detail-modal');
        renderExpressList();
        renderPickedList();
    }
}

// 快速标记为已取（从列表直接操作）
function quickMarkAsPicked(id) {
    const item = expressData.find(e => e.id === id);
    if (item) {
        item.picked = true;
        item.pickedTime = new Date().toISOString();
        saveData();
        renderExpressList();
        renderPickedList();
    }
}

// 删除快递
function deleteExpress() {
    if (confirm('确定要删除这条快递记录吗？')) {
        expressData = expressData.filter(e => e.id !== currentDetailId);
        saveData();
        closeModal('detail-modal');
        renderExpressList();
        renderPickedList();
    }
}

// 清空所有数据
function clearAllData() {
    if (confirm('确定要清空所有数据吗？此操作不可恢复！')) {
        expressData = [];
        saveData();
        renderExpressList();
        renderPickedList();
        alert('已清空所有数据');
    }
}

// 格式化时间
function formatTime(isoString) {
    const date = new Date(isoString);
    const now = new Date();
    const diff = now - date;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return '刚刚';
    if (minutes < 60) return `${minutes}分钟前`;
    if (hours < 24) return `${hours}小时前`;
    if (days < 7) return `${days}天前`;

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hour = String(date.getHours()).padStart(2, '0');
    const minute = String(date.getMinutes()).padStart(2, '0');

    return `${year}-${month}-${day} ${hour}:${minute}`;
}

// 点击模态框背景关闭
document.querySelectorAll('.modal').forEach(modal => {
    modal.addEventListener('click', function(e) {
        if (e.target === this) {
            this.classList.remove('active');
        }
    });
});