/*
    介面控制器
    控制介面上的各種按鈕和選單
*/

// 初始化
async function initController() {
    const $listSelect = $('#listSelect');
    // 依照設定值顯示筆寬、筆刷、筆壓UI
    $('#lineWidthSelect').val(settings.lineWidth);
    $('#lineWidthSlider').val(settings.lineWidth);
    // $('#brushSelector').empty().append($(brushes[settings.brushType]));
    brushes.forEach((brush, index) => {
        brush.style.width = '16px';
        const input = document.createElement('input');
        input.type = 'radio';
        input.className = 'btn-check';
        input.id = `brush_${index}`;
        input.name = 'brush';
        input.value = index;
        input.autocomplete = 'off';
        const label = document.createElement('label');
        label.className = 'btn btn-outline-primary';
        label.htmlFor = `brush_${index}`;
        label.appendChild(brush);
        $('#brushRadioGroup').append(input);
        $('#brushRadioGroup').append(label);
        if (settings.brushType == index) {
            input.checked = true;
        }
    });
    $('#brushDisplayImg').attr('src', brushesURL[settings.brushType]);
    $('#brushDisplayImg').css('width', `${settings.lineWidth * getCanvasScaleRate()}px`);
    if (settings.pressureMode) {
        $('#pressureSwitch').prop('checked', true);
    } else {
        $('#pressureSwitch').prop('checked', false);
    }

    initListSelect($listSelect);
}

function startController(canvas) {
    const $listSelect = $('#listSelect');
    const $naviContainer = $('#navi-container');
    const $progressContainer = $('#progress-container');
    const download_container = document.getElementById('download_container');
    const hint_container = document.getElementById('hint_container');
    const listup_container = document.getElementById('listup_container');
    const listup_container_modal = new bootstrap.Modal(listup_container);
    const settings_container = document.getElementById('settings_container');

    // 切換列表
    $listSelect.on('change', function () {
        const selectedValue = $(this).val();
        if (selectedValue) {
            nowList = glyphList[selectedValue];
            nowGlyphIndex = 0; // 重置當前字形索引
            canvas.setGlyph(0);
        }
    });

    $('#prevButton').on('click', function () { canvas.setGlyph(nowGlyphIndex - 1); }); // 切換到上一個字符
    $('#nextButton').on('click', function () { canvas.setGlyph(nowGlyphIndex + 1); }); // 切換到下一個字符

    $('#findButton').on('click', function () {
        var char = prompt(fdrawer.findMsg);
        if (!char) return; // 如果沒有輸入字符，則不進行任何操作
        char = char.trim(); // 去除前後空白
        if (char.length === 0) return;

        var breakFlag = false;
        for (let i in glyphList) {
            for (let j in glyphList[i]) {
                if (glyphMap[glyphList[i][j]].c == char) {
                    nowList = glyphList[i];
                    $listSelect.val(i); 	// 更新下拉選單的值
                    canvas.setGlyph(j * 1);
                    breakFlag = true;
                    break;
                }
            }
            if (breakFlag) break;
        }

        // 找不到的話詢問要不要新增這個字
        if (!breakFlag) {
            if (char.length == (char.codePointAt(0) < 65536 ? 1 : 2)) {
                if (confirm(fdrawer.notFound + '\n' + fdrawer.confirmAdd)) {
                    var uni = char.codePointAt(0).toString(16).toUpperCase();
                    var gn = uni.length <= 4 ? 'uni' + uni.padStart(4, '0') : 'u' + uni; // 生成 Unicode 名稱
                    var chr = String.fromCodePoint(char.codePointAt(0));

                    if (!glyphList[fdrawer.customList]) {
                        glyphList[fdrawer.customList] = [];
                        initListSelect($listSelect); // 重新初始化下拉選單
                    }
                    glyphList[fdrawer.customList].push(gn); // 將新字符添加到自定義列表
                    glyphMap[gn] = { c: chr, w: 'F' };	// 將自定義文字添加到映射中
                    updateSetting('customGlyphs', glyphList[fdrawer.customList].join(',')); // 儲存自定義字符

                    nowList = glyphList[fdrawer.customList];
                    $listSelect.val(fdrawer.customList); 	// 更新下拉選單的值
                    canvas.setGlyph(glyphList[fdrawer.customList].length - 1);
                }
            } else {
                alert(fdrawer.notFound);
            }
        }
    });

    // 更新筆寬
    $('#lineWidthSelect').on('change', function () {
        settings.lineWidth = parseInt($(this).val(), 10);
        updateSetting('lineWidth'); // 儲存筆寬到 Local Storage
        $('#lineWidthSlider').val(settings.lineWidth);
        $('#brushDisplayImg').css('width', `${settings.lineWidth * getCanvasScaleRate()}px`);
    });
    $('#lineWidthSlider').on('input', function () {
        settings.lineWidth = parseInt($(this).val(), 10);
        updateSetting('lineWidth'); // 儲存筆寬到 Local Storage
        $('#lineWidthSelect').val(settings.lineWidth);
        $('#brushDisplayImg').css('width', `${settings.lineWidth * getCanvasScaleRate()}px`);
    });

    // 切換筆刷
    function brushSwitchTo(index) {
        if (settings.oldPressureMode) return;
        if (index >= brushes.length) return;
        settings.brushType = index;
        updateSetting('brushType'); // 儲存筆刷類型
        // $('#brushSelector').empty().append($(brushes[settings.brushType]));
        $('#brushDisplayImg').attr('src', brushesURL[settings.brushType]);
    }
    function brushSwitchToNext() {
        if (settings.oldPressureMode) return;
        settings.brushType++;
        if (settings.brushType >= brushes.length) settings.brushType = 0;

        updateSetting('brushType'); // 儲存筆刷類型
        // $('#brushSelector').empty().append($(brushes[settings.brushType]));
        $('#brushDisplayImg').attr('src', brushesURL[settings.brushType]);
    }
    // $('#brushSelector').on('click', brushSwitchToNext);
    $('#brushRadioGroup input[type="radio"]').on('change', function () {
        brushSwitchTo(parseInt(this.value));
    });

    // 快捷區筆刷預覽可切換筆刷
    $('#brushDisplay').on('click', brushSwitchToNext);

    // 切換筆壓
    $('#pressureSwitch').on('click', function () {
        settings.pressureMode = !settings.pressureMode;
        updateSetting('pressureMode');
    });

    // 切換畫筆與橡皮擦模式
    $('#penButton').on('click', function () {
        $('#penButton').addClass('btn-primary');
        $('#penButton').removeClass('btn-light');
        $('#eraserButton').addClass('btn-light');
        $('#eraserButton').removeClass('btn-primary');
        canvas.eraseMode = false;
    });

    $('#eraserButton').on('click', function () {
        $('#eraserButton').addClass('btn-primary');
        $('#eraserButton').removeClass('btn-light');
        $('#penButton').addClass('btn-light');
        $('#penButton').removeClass('btn-primary');
        canvas.eraseMode = true; // 切換到橡皮擦模式
    });

    $('#undoButton').on('click', canvas.undo.bind(canvas));

    // 雙指復原
    let undoTouchTime = null;
    $(document).on('touchstart', function (event) {
        if (event.touches.length === 2) {
            undoTouchTime = new Date().getTime(); // 記錄雙指觸控的時間
        }
    }).on('touchend', function (event) {
        if (undoTouchTime && new Date().getTime() - undoTouchTime < 250) { // 如果雙指觸控時間夠短
            canvas.undo();
            undoTouchTime = null;
        }
    });

    // 清除畫布的功能
    $('#clearButton').on('click', canvas.clear.bind(canvas));

    $('#moveLeftButton').on('click', function () { canvas.moveGlyph(-10, 0); }); // 向左移動 10px
    $('#moveRightButton').on('click', function () { canvas.moveGlyph(10, 0); }); // 向右移動 10px
    $('#moveUpButton').on('click', function () { canvas.moveGlyph(0, -10); }); // 向上移動 10px
    $('#moveDownButton').on('click', function () { canvas.moveGlyph(0, 10); }); // 向下移動 10px

    // 支援鍵盤方向鍵操作
    $(document).on('keydown', function (event) {
        switch (event.key) {
            case 'ArrowLeft': // 左方向鍵
                canvas.moveGlyph(-10, 0);
                break;
            case 'ArrowRight': // 右方向鍵
                canvas.moveGlyph(10, 0);
                break;
            case 'ArrowUp': // 上方向鍵
                canvas.moveGlyph(0, -10);
                break;
            case 'ArrowDown': // 下方向鍵
                canvas.moveGlyph(0, 10);
                break;
            case 'z': // Z 鍵 - 復原
                undoCanvas();
                break;
            case 'v': // V 鍵 - 畫筆
                $('#penButton').trigger('click');
                break;
            case 'c': // V 鍵 - 橡皮擦
                $('#eraserButton').trigger('click');
                break;
            case 'x': // X 鍵 - 清除
                clearCanvas();
                break;
            case 'b': // B 鍵 - 切換筆刷
                brushSwitchToNext();
                break;
            case 'n': // N 鍵 - 切換筆壓
                $('#pressureSwitch').trigger('click');
                break;
            case 'PageDown': 	// PageDown 鍵 - 下一步
            case ']': 			// "]" 鍵 - 下一步
                $('#nextButton').trigger('click');
                break;
            case 'PageUp': 		// PageUp 鍵 - 上一步
            case '[': 			// "]" 鍵 - 下一步
                $('#prevButton').trigger('click');
                break;
            case 'Enter': 		// Enter 鍵 - 下一步 / 同時按shift - 上一步
            case ' ': 			// Space 鍵 - 下一步 / 同時按shift - 上一步
                $(event.shiftKey ? '#prevButton' : '#nextButton').trigger('click');
                break;
        }
    });


    $('#saveAsTester').on('click', async function () {
        updateSetting('saveAsTester', this.checked); // 儲存是否為測試儲存
    });

    // 儲存字型檔
    $('#downloadFontButton').on('click', async function () {
        function padPath(path, pad) {
            var boundingBox = path.getBoundingBox();
            var width = Math.round(boundingBox.x2 - boundingBox.x1);
            var xoff = pad - Math.round(boundingBox.x1);		// 單純指定邊界寬度

            path.commands.forEach(c => {
                c.x = c.x + xoff;
                if (c.x1) c.x1 = c.x1 + xoff;
                if (c.x2) c.x2 = c.x2 + xoff;
            });
            return width + pad * 2; // 返回調整後的寬度
        }
        function createGlyph(unicode, gname, adw, path) {
            var glyphObj = {
                name: gname,
                advanceWidth: adw,
                path: path || new opentype.Path()
            };
            if (unicode) glyphObj.unicode = unicode;
            return new opentype.Glyph(glyphObj);
        }
        // 更新進度條
        function updateProgress(current, total) {
            const percentage = Math.round((current / total) * 100);
            $('#progress-bar').val(percentage);
            $('#progress-text').text(`${percentage}%`);
        }
        async function loadSVG(gname) {
            var savedSvg = await loadFromDB('s_' + gname);
            if (savedSvg) return savedSvg; 	// 如果已經存在 SVG，則直接返回

            var savedCanvas = await loadFromDB('g_' + gname);
            if (!savedCanvas) return null;
            var svgData = await toSVG(gname, savedCanvas); // 如果不存在 SVG，則儲存並返回新的 SVG
            await saveToDB('s_' + gname, svgData);
            return svgData;
        }

        // 顯示進度條
        $naviContainer.hide();
        $progressContainer.show();
        $('#progress-bar').val(0);
        $('#progress-text').text('0%');

        const glyphs = [							// 建立字符陣列，並加入一些空格字符（因程式機制上無法畫出空白字符，只能自動產生）
            createGlyph(null, '.notdef', 600),		// notdef
            createGlyph(0x20, 'space', 300),		// 空格
            createGlyph(0xA0, 'uni00A0', 300),		// No-break Space
            createGlyph(0x2c9, 'macron', 600),		// 一聲
            createGlyph(0x3000, 'uni3000', upm),	// Ideographic Space
            createGlyph(0x2002, 'uni2002', upm / 2),	// En Space
            createGlyph(0x2003, 'uni2003', upm),	// Em Space
        ];

        const gidMap = {};
        const fulls = [];
        const verts = [];
        const ccmps = [];

        const totalGlyphs = Object.keys(glyphMap).length; // 總字符數量
        let processedGlyphs = 0;
        var scale = parseInt(settings.scaleRate, 10) / 100;
        var scaleoff = (upm - scale * upm) / 2; // 縮放偏移量

        for (let gname in glyphMap) {
            // 更新進度條
            updateProgress(processedGlyphs, totalGlyphs);
            processedGlyphs++;

            try {
                let svgData = await loadSVG(gname);
                if (!svgData) continue;
                let path = await opentype.Path.fromSVG(svgData, { flipYBase: 0, scale: scale, y: 880 - scaleoff, x: scaleoff });

                let adw = upm;
                if (glyphMap[gname].w == 'P' || glyphMap[gname].w == 'H') { // 比例寬自動調整
                    adw = padPath(path, 50);
                } else if (settings.noFixedWidthFlag) {
                    adw = padPath(path, 100);
                }

                let unicode = null;
                if (gname.match(/^uni([0-9A-F]{4})$/i)) {
                    unicode = parseInt(RegExp.$1, 16); // 轉換為 Unicode 編碼
                } else if (gname.match(/^u([0-9A-F]{5})$/i)) {
                    unicode = parseInt(RegExp.$1, 16); // 轉換為 Unicode 編碼
                } else if (gname.indexOf('.vert') < 0 && glyphMap[gname].c.length == 1) {
                    unicode = glyphMap[gname].c.charCodeAt(0); // 使用字符的 Unicode 編碼
                }
                let glyph = createGlyph(unicode, gname, adw, path);
                glyphs.push(glyph);
                gidMap[gname] = glyphs.length - 1;

                // 自動製作全形字符
                if (glyphMap[gname].f) {
                    let gnameF = glyphMap[gname].f;
                    let pathF = await opentype.Path.fromSVG(svgData, { flipYBase: 0, scale: scale, y: 880 - scaleoff, x: scaleoff });
                    let adwF = upm;
                    if (settings.noFixedWidthFlag) adwF = padPath(pathF, 100); // 如果沒有固定寬度
                    let unicodeF = null;
                    if (gnameF.match(/^uni([0-9A-F]{4})$/i)) unicodeF = parseInt(RegExp.$1, 16); // 轉換為 Unicode 編碼
                    let glyphF = createGlyph(unicodeF, gnameF, adwF, pathF);
                    fulls.push(glyphF);
                }

                if (glyphMap[gname].v) verts.push(gname);
                if (glyphMap[gname].s) ccmps.push(gname);
            } catch (err) {
                console.error(`Error processing glyph ${gname}:`, err);
            }
        }

        // 加入全形字符在後面
        for (let i in fulls) {
            var glyphF = fulls[i];
            glyphs.push(glyphF);
            gidMap[glyphF.name] = glyphs.length - 1;
        }
        const font = await createFont(glyphs, gidMap, verts, ccmps);

        // 建立下載連結
        const link = document.createElement('a');
        link.download = font.names.windows.postScriptName.en + '.otf'; //'drawing.otf';
        link.href = window.URL.createObjectURL(new Blob([font.toArrayBuffer()]), { type: "font/opentype" });
        link.click();

        // 隱藏進度條
        $naviContainer.show();
        $progressContainer.hide();
    });

    // 顯示設定畫面
    settings_container.addEventListener('shown.bs.modal', function () {
        $('#settings-title').text(settings.notNewFlag ? fdrawer.settingsTitle : fdrawer.welcomeTitle);
        $('#span-welcome').toggle(!settings.notNewFlag);

        $('#fontNameEng').val(settings.fontNameEng);
        $('#fontNameCJK').val(settings.fontNameCJK);
        $('#noFixedWidthFlag').prop('checked', settings.noFixedWidthFlag);

        if (!settings.notNewFlag) updateSetting('notNewFlag', true); // 如果是第一次使用，則設定 notNewFlag 為 true
    });

    $('#fontNameEng').on('change', function () { updateSetting('fontNameEng', $(this).val().replace(/[^a-zA-Z0-9 ]/g, '')); });
    $('#fontNameCJK').on('change', function () { updateSetting('fontNameCJK', $(this).val()); });
    $('#smallModeCheck').on('click', async function () {
        await updateSetting('smallMode', $(this).prop('checked'));
        $('#canvas-container').toggleClass('smallmode', settings.smallMode);
        $('#brushDisplayImg').css('width', `${settings.lineWidth * getCanvasScaleRate()}px`);
    });
    $('#noFixedWidthFlag').on('click', function () { updateSetting('noFixedWidthFlag', $(this).prop('checked')); });
    $('#scaleRateSlider').on('input', function () {
        var rate = parseInt($(this).val(), 10);
        $('#scaleRateValue').text(rate + '%');
        updateSetting('scaleRate', rate);
        canvas.init(); // 重新初始化畫布
    });
    $('#pressureEffectSelect').on('change', function () { updateSetting('pressureEffect', $(this).val()); });
    $('#gridTypeSelect').on('change', function () {
        updateSetting('gridType', $(this).val());
        canvas.init(); // 重新初始化畫布
    });

    // 筆壓繪圖設定事件監聽器
    $('#pressureDrawingEnabled').on('change', async function () {
        updateSetting('oldPressureMode', $(this).prop('checked'));
        // 立即更新筆壓繪圖狀態
        await updatePressureDrawingStatus();
    });

    // 顯示字表畫面
    listup_container.addEventListener('shown.bs.modal', async function () {
        saveToLocalDB(canvas, true); // 儲存當前畫布內容到 Local Storage		

        $('#listup-body').empty(); 		// 清空

        // 計算 viewBox
        var scale = parseInt(settings.scaleRate, 10) / 100;
        var emSize = Math.round(upm / scale);
        var emOff = Math.round((upm - emSize) / 2);
        var viewBox = `${emOff} ${emOff} ${emSize} ${emSize}`;

        for (let i in nowList) {
            var gname = nowList[i];
            var svgData = await loadFromDB('s_' + gname);
            if (svgData) {		// 已寫過
                $('#listup-body').append(
                    $('<svg version="1.1" viewBox="' + viewBox + '">').html('<path d="' + svgData + '" stroke="#000" fill="#000"></path>').data('index', i).on('click', function () {
                        setGlyph($(this).data('index') * 1);
                        listup_container_modal.hide();
                    })
                );
            } else {
                var cell = $('<span>').text(glyphMap[gname].c).data('index', i).on('click', function () {
                    setGlyph($(this).data('index') * 1);
                    listup_container_modal.hide();
                });
                if (glyphMap[gname].v && gname.indexOf('.vert') > 0) cell.addClass('vert');
                $('#listup-body').append(cell);
            }
        }

        $('<p class="dummy"><p>').appendTo($('#listup-body'));
    });

    // 顯示提示畫面
    hint_container.addEventListener('shown.bs.modal', function () {
        $('#version').text(version);
    });

    // 顯示下載畫面
    download_container.addEventListener('shown.bs.modal', async function () {
        $('#saveAsTester').prop('checked', settings.saveAsTester); // 設定是否為測試儲存
    });

    // 關閉廣告畫面
    $('#closeAdsButton').on('click', function () {
        $('#ads-container').hide();
    });

    // 匯出事件 - Debugger
    $('#exportEventsButton').on('click', async function () {
        const data = events.join('\n');
        if (data.length > 0) {
            const blob = new Blob([data], { type: 'text/plain' });
            const link = document.createElement('a');
            link.download = settings.fontNameEng + '-EventLog' + (new Date()).toISOString() + '.txt';
            link.href = window.URL.createObjectURL(blob);
            link.click();
        } else {
            alert(fdrawer.noDataToExport);
        }
    });

    // 匯出資料
    $('#exportDataButton').on('click', async function () {
        const transaction = db.transaction([storeName], 'readonly');
        const store = transaction.objectStore(storeName);
        const request = store.getAll();

        request.onsuccess = async function (event) {
            const data = event.target.result.map(item => `${item.key}\t${item.value}`).join('\n');
            if (data.length > 0) {
                const blob = new Blob([data], { type: 'text/plain' });
                const link = document.createElement('a');
                link.download = settings.fontNameEng + '-' + (new Date()).toISOString() + '.txt';
                link.href = window.URL.createObjectURL(blob);
                link.click();
            } else {
                alert(fdrawer.noDataToExport);
            }
        };
    });

    // 匯入資料
    $('#importDataFile').on('change', async function () {
        if (confirm(fdrawer.importConfirm)) {
            const fileInput = $(this);
            const file = fileInput[0].files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = async function (e) {
                    await clearDB(); // 清除現有的 IndexedDB 資料
                    const data = e.target.result;
                    const lines = data.split('\n');
                    for (const line of lines) {
                        if (line.trim() === '') continue; // 跳過空行
                        const parts = line.split('\t');
                        if (parts.length < 2) continue; // 如果格式不正確，跳過
                        const key = parts[0].trim();
                        const value = parts[1].trim();
                        await saveToDB(key, value);
                    }
                    alert(fdrawer.importDone);
                    location.reload(); // 重新載入頁面
                };
                reader.readAsText(file);
            }
        } else {
            $(this).val(''); // 清除選擇的檔案
        }
    });

    // 修改清除所有資料的功能
    $('#clearAllButton').on('click', async function () {
        if (confirm(fdrawer.clearConfirm)) {
            await clearDB();
            alert(fdrawer.clearDone);
            location.reload(); // 重新載入頁面
        }
    });

    // 快捷區清除畫布
    $('#clearButtonUnderCanvas').on('click', canvas.clear.bind(canvas));
    // 快捷區上一步
    $('#undoButtonUnderCanvas').on('click', canvas.undo.bind(canvas));

}