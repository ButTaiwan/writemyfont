/*
    IndexedDB 操作函式
*/

// 初始化 IndexedDB
function initDB() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(dbName, 1);

        request.onupgradeneeded = function (event) {
            db = event.target.result;
            if (!db.objectStoreNames.contains(storeName)) {
                db.createObjectStore(storeName, { keyPath: 'key' });
            }
        };

        request.onsuccess = function (event) {
            db = event.target.result;
            resolve(db);
        };

        request.onerror = function (event) {
            reject(event.target.error);
        };
    });
}

// 儲存資料到 IndexedDB
function saveToDB(key, value) {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([storeName], 'readwrite');
        const store = transaction.objectStore(storeName);
        const request = store.put({ key, value });

        request.onsuccess = function () {
            resolve();
        };

        request.onerror = function (event) {
            reject(event.target.error);
        };
    });
}

// 從 IndexedDB 讀取資料
function loadFromDB(key, defaultValue = null) {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([storeName], 'readonly');
        const store = transaction.objectStore(storeName);
        const request = store.get(key);

        request.onsuccess = function (event) {
            resolve(event.target.result ? event.target.result.value : defaultValue);
        };

        request.onerror = function (event) {
            reject(event.target.error);
        };
    });
}

// 計算 IndexedDB 中字形數量
function countGlyphFromDB() {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([storeName], 'readonly');
        const store = transaction.objectStore(storeName);
        const cursorRequest = store.openCursor();

        let count = 0;
        cursorRequest.onsuccess = function (event) {
            const cursor = event.target.result;
            if (cursor) {
                if (cursor.key.startsWith('g_')) count++;
                cursor.continue();
            } else {
                resolve(count); // 當游標完成時，返回計數
            }
        };

        cursorRequest.onerror = function (event) {
            reject(event.target.error);
        };
    });
}

// 刪除 IndexedDB 中的資料
function deleteFromDB(key) {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([storeName], 'readwrite');
        const store = transaction.objectStore(storeName);
        const request = store.delete(key);

        request.onsuccess = function () {
            resolve();
        };

        request.onerror = function (event) {
            reject(event.target.error);
        };
    });
}

// 清除 IndexedDB
function clearDB() {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([storeName], 'readwrite');
        const store = transaction.objectStore(storeName);
        const request = store.clear();

        request.onsuccess = function () {
            resolve();
        };

        request.onerror = function (event) {
            reject(event.target.error);
        };
    });
}

// 儲存畫布的功能
async function saveToLocalDB(canvas, runNow = false) {
    async function saveSVGToDB(glyph, pngData) {
        const svgData = await toSVG(glyph, pngData);
        if (svgData && svgData != '') {
            await saveToDB('s_' + glyph, svgData);
        } else {			// 轉外框後才發現是空白的話，連同png一起清掉
            await deleteFromDB('g_' + glyph);
            await deleteFromDB('s_' + glyph);
        }
        $('#spanDoneCount').text(await countGlyphFromDB());
    }
    let saveGlyph = nowGlyph;	// 嘗試解決非同步操作導致的 Race Condition
    const pngData = canvas.canvas.toDataURL();
    await saveToDB('g_' + saveGlyph, pngData);

    if (canvas.svgTimers[saveGlyph]) clearTimeout(canvas.svgTimers[saveGlyph]);	// 清除之前的定時器

    if (runNow) {	// 如果立即儲存
        await saveSVGToDB(saveGlyph, pngData);	// 儲存 SVG
    } else {	// 延遲儲存
        canvas.svgTimers[saveGlyph] = setTimeout(async function () {	// 延遲轉外框
            saveSVGToDB(saveGlyph, pngData);	// 儲存 SVG
        }, 1200);
    }
}