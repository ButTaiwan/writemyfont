class Canvas {
    constructor() {
        this.$canvas = $('#drawingCanvas');
        this.canvas = this.$canvas[0];
        this.ctx = this.canvas.getContext('2d');
        this.ratio = this.canvas.height / this.$canvas.height();
        this.isDrawing = false;
        this.undoStack = []; // 儲存畫布狀態的堆疊
        this.hasPointerEvent = false;	// 這個筆畫是否有pointer事件
        this.hasRealPressure = false;	// 這個筆畫是否曾經有疑似真實的筆壓值
        this.simulatePressure = false; 	// 模擬筆壓開關
        this.lastPressure = 0.5; 		// 上一次的筆壓值
        this.svgTimers = {}; // 用於控制 SVG 儲存的定時器
        this.eraseMode = false;
        this.lastX = 0;
        this.lastY = 0;
        this.lastLW = 0;
        this.isMoved = false;
        this.backgroundImageData = null; // 儲存背景用於筆壓繪圖的即時預覽
    }

    init() {
        this.canvas.addEventListener('touchstart', (e) => e.preventDefault(), { passive: false });
        this.canvas.addEventListener('touchmove', (e) => e.preventDefault(), { passive: false });

        var scale = parseInt(settings.scaleRate, 10) / 100; // 轉換為小數

        // 繪製底圖
        const gridCanvas = document.getElementById('gridCanvas');
        const gridCtx = gridCanvas.getContext('2d');
        gridCtx.clearRect(0, 0, gridCanvas.width, gridCanvas.height);

        const emWidth = gridCanvas.width / scale;			// 字身框寬度
        const emHeight = gridCanvas.height / scale;			// 字身框高度
        const gridXOff = (gridCanvas.width - emWidth) / 2;	// X 軸偏移量
        const gridYOff = (gridCanvas.height - emHeight) / 2;	// X 軸偏移量

        //const gridWidth = Math.round(gridCanvas.width / scale / 3);		// 每格寬度
        //const gridHeight = Math.round(gridCanvas.height / scale / 3);	// 每格高度

        gridCtx.strokeStyle = '#cccccc';
        gridCtx.lineWidth = 1;

        // 繪製格線
        let lines = 1;

        // 字身框
        gridCtx.beginPath();
        gridCtx.rect(gridXOff, gridYOff, emWidth, emHeight);
        gridCtx.stroke();

        if (settings.gridType == '3x3grid') lines = 3;
        else if (settings.gridType == '3x3grid-new') lines = 4;
        else if (settings.gridType == '2x2grid') lines = 2;
        else if (settings.gridType == 'stargrid') lines = 2;

        for (let i = 1; i < lines; i++) {
            if (settings.gridType == '3x3grid-new' && i == 2) continue; // 跳過新 3x3 格線的中間線

            gridCtx.beginPath();
            gridCtx.moveTo(gridXOff + emWidth * i / lines, gridYOff);
            gridCtx.lineTo(gridXOff + emWidth * i / lines, gridYOff + emHeight);
            gridCtx.stroke();

            gridCtx.beginPath();
            gridCtx.moveTo(gridXOff, gridYOff + emHeight * i / lines);
            gridCtx.lineTo(gridXOff + emWidth, gridYOff + emHeight * i / lines);
            gridCtx.stroke();
        }

        if (settings.gridType == 'stargrid') {
            gridCtx.beginPath();
            gridCtx.moveTo(gridXOff, gridYOff);
            gridCtx.lineTo(gridXOff + emWidth, gridYOff + emHeight);
            gridCtx.stroke();
            gridCtx.beginPath();
            gridCtx.moveTo(gridXOff + emWidth, gridYOff);
            gridCtx.lineTo(gridXOff, gridYOff + emHeight);
            gridCtx.stroke();
        } else if (settings.gridType == 'boxgrid') {
            gridCtx.beginPath();
            gridCtx.rect(gridXOff + emWidth * 0.15, gridYOff + emHeight * 0.15, emWidth * 0.7, emHeight * 0.7);
            gridCtx.stroke();
        }

        if (settings.gridType == 'boxgrid' || settings.gridType == 'nogrid') {
            let boxLen = 15;
            gridCtx.beginPath();
            gridCtx.moveTo(gridXOff - boxLen, gridYOff + emHeight * 0.5);
            gridCtx.lineTo(gridXOff + boxLen, gridYOff + emHeight * 0.5);
            gridCtx.stroke();
            gridCtx.beginPath();
            gridCtx.moveTo(gridXOff + emWidth - boxLen, gridYOff + emHeight * 0.5);
            gridCtx.lineTo(gridXOff + emWidth + boxLen, gridYOff + emHeight * 0.5);
            gridCtx.stroke();
            gridCtx.beginPath();
            gridCtx.moveTo(gridXOff + emWidth * 0.5, gridYOff - boxLen);
            gridCtx.lineTo(gridXOff + emWidth * 0.5, gridYOff + boxLen);
            gridCtx.stroke();
            gridCtx.beginPath();
            gridCtx.moveTo(gridXOff + emWidth * 0.5, gridYOff + emHeight - boxLen);
            gridCtx.lineTo(gridXOff + emWidth * 0.5, gridYOff + emHeight + boxLen);
            gridCtx.stroke();
        }

        // 繪製基線
        gridCtx.strokeStyle = '#ee9999';	// 基線顏色
        gridCtx.beginPath();
        gridCtx.moveTo(0, gridYOff + emHeight * 0.75);
        gridCtx.lineTo(gridCanvas.width, gridYOff + emHeight * 0.75);
        gridCtx.stroke();
    }

    async moveGlyph(xoff, yoff) {
        const savedCanvas = await loadFromDB('g_' + nowGlyph);
        if (!savedCanvas) return; // 如果沒有儲存的畫布，則不進行任何操作
        this.undoStack.push(this.canvas.toDataURL()); // 儲存當前畫布狀態到 undoStack

        const img = new Image();
        img.src = savedCanvas;
        img.onload = function () {
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
            this.ctx.drawImage(img, xoff, yoff);
            saveToLocalDB(this); // 更新 Local Storage
        }.bind(this);
    }

    // 設定編輯中的字符
    setGlyph(index) {
        if (!nowList) return;
        if (index < 0) index = nowList.length - 1; // 如果索引小於0，則設為最後一個字符
        if (index >= nowList.length) index = 0; // 如果索引大於字符數量，則設為第一個字符
        nowGlyphIndex = index;
        nowGlyph = nowList[index]; // 取得當前字符的名稱

        $('#glyphName').text(nowGlyph); // 更新顯示的字符
        $('#charSeq').text(glyphMap[nowGlyph].c).removeClass('vert');
        if (glyphMap[nowGlyph].v && nowGlyph.indexOf('.vert') > 0) $('#charSeq').addClass('vert');

        $('#glyphNote').text(glyphMap[nowGlyph].n || '');

        // 載入之前的畫布內容
        this.undoStack.length = 0; // 清空復原堆疊
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.loadCanvasData(nowGlyph);

        // 重置筆壓檢測狀態
        if (settings.oldPressureMode) {
            pressureDrawing.resetPressureDetection();
        }
    }

    // 修改讀取畫布的功能
    async loadCanvasData(glyph) {
        const savedCanvas = await loadFromDB('g_' + glyph);
        if (savedCanvas) {
            const img = new Image();
            img.src = savedCanvas;
            img.onload = function () {
                this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
                this.ctx.drawImage(img, 0, 0);
            }.bind(this);
        }
    }

    // 取得滑鼠或觸控座標
    getCanvasCoordinates(event) {
        const rect = this.canvas.getBoundingClientRect();
        const touch = event.type.includes('touch') ? event.originalEvent.touches[0] : event;
        return {
            x: touch.clientX - rect.left,
            y: touch.clientY - rect.top
        };
    }

    getPressureValue(mode, event, x, y) {
        if (!settings.pressureMode) return 0.5;

        let eventType = event.type;
        if (mode == 'move' && this.hasPointerEvent && !eventType.includes('pointer')) return null; // 如果曾經有pointer事件，則只接受pointer事件

        let toolType = event.originalEvent.pointerType;
        let pressure = event.originalEvent.pressure;
        let touchForce = event.originalEvent.touches && event.originalEvent.touches.length > 0 ? event.originalEvent.touches[0].force : null;
        let webkitForce = event.originalEvent.webkitForce !== undefined ? event.originalEvent.webkitForce : null;

        if (mode == 'start') {
            if (events.length > 1000) events.splice(0, events.length - 200);
            if (eventType.includes('pointer')) this.hasPointerEvent = true; 		// 這個筆畫有pointer事件
        } else if (mode == 'end') {
            this.simulatePressure = false;
            this.hasTouchEvent = false;
            this.hasRealPressure = false;
            this.hasPointerEvent = false;
        }

        events.push(`${mode} - ${eventType} / ${toolType} / P:${pressure} / T:${touchForce} / W:${webkitForce}`); // 儲存事件資訊
        //console.log(`${eventType} / ${toolType} / P:${pressure} / T:${touchForce} / W:${webkitForce}`); // 儲存事件資訊

        let isRealPressure = typeof (pressure) != 'undefined';
        if (isRealPressure && toolType != 'pen' && pressure == 0) isRealPressure = false;
        if (isRealPressure && toolType != 'pen' && !this.hasRealPressure && (pressure == 1 || pressure == 0.5)) isRealPressure = false;
        if (toolType == 'pen' && pressure < 0.01) return null;
        if (mode != 'start' && !this.simulatePressure && !isRealPressure) return null;

        if (isRealPressure) {
            this.simulatePressure = false;	// 如果移動中發現有真實筆壓值，則關閉模擬筆壓
            if (pressure > 0 && pressure < 1 && pressure != 0.5) this.hasRealPressure = true;	// 出現過看似真實的筆壓值

            // 真實筆壓值套用敏感度運算
            if (settings.pressureEffect == 'contrast') pressure = 0.5 + Math.sin((pressure * 0.9 - 0.45) * Math.PI) / 2;
            if (settings.pressureEffect == 'enhance') pressure = Math.sin(pressure * Math.PI / 2);
            if (settings.pressureEffect == 'enhancex') pressure = Math.sin(Math.sin(pressure * Math.PI / 2) * Math.PI / 2);

            if (mode != 'start') pressure = (lastPressure + pressure) / 2;
            return lastPressure = pressure;

        } else if (mode == 'start') {
            this.simulatePressure = true;	// 如果開始繪製時沒有真實筆壓值，則開啟模擬筆壓
            return 0.5;

        } else { //if (simulatePressure && lastX && lastY) {
            let distance = Math.sqrt(Math.pow(x - this.lastX, 2) + Math.pow(y - this.lastY, 2));
            let speedFactor = Math.min(1, 5 / Math.max(distance, 1));
            pressure = (this.lastPressure * 3 + speedFactor * 0.65 + 0.05) / 4;
            return this.lastPressure = pressure;
        }
    }

    drawBrush(ctx, brush, x, y, lw) {
        if (userAgent.includes('macintosh') && userAgent.includes('safari') && !userAgent.includes('chrome')) {
            // 在 Mac Safari 上使用臨時 canvas 繪製，避免直接繪圖造成污垢
            // 不知道為什麼我的Mac-Safari直接繪圖會很髒，只好建立一個臨時的畫筆 canvas
            // 但這會造成Android上很慢，所以只在Mac-Safari上使用
            const brushCanvas = document.createElement('canvas');
            brushCanvas.width = lw;
            brushCanvas.height = lw;
            const brushCtx = brushCanvas.getContext('2d');
            brushCtx.drawImage(brush, 0, 0, lw, lw);

            ctx.drawImage(brushCanvas, x - lw / 2, y - lw / 2);
        } else {
            // 其他瀏覽器直接繪製
            ctx.drawImage(brush, x - lw / 2, y - lw / 2, lw + 1, lw + 1);
        }
    }

    undo() {
        if (this.undoStack.length > 0) {
            const lastState = this.undoStack.pop();
            const img = new Image();
            img.src = lastState;
            img.onload = function () {
                this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
                this.ctx.drawImage(img, 0, 0);
                saveToLocalDB(this); // 復原後更新 Local Storage
            }.bind(this);
        }
    }

    async clear() {
        const savedCanvas = await loadFromDB('g_' + nowGlyph);
        if (!savedCanvas) return; // 如果沒有儲存的畫布，則不進行任何操作
        this.undoStack.push(this.canvas.toDataURL()); // 儲存當前畫布狀態到 undoStack
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        //undoStack.length = 0; // 清空復原堆疊
        await deleteFromDB('g_' + nowGlyph); // 清除 IndexedDB 中的資料
        await deleteFromDB('s_' + nowGlyph); // 清除 IndexedDB 中的資料
    }

    // 開始繪製
    start(event) {
        if (event.touches && event.touches.length === 2) {
            if (this.isDrawing) undoCanvas();		// 先撤銷掉目前的筆劃
            this.isDrawing = false;
            return;
        }

        if (this.isDrawing && !event.type.includes('pointer')) return;

        const { x, y } = this.getCanvasCoordinates(event);
        var pressureVal = this.getPressureValue('start', event, x, y);
        this.ratio = this.canvas.height / this.$canvas.height();		// 筆畫開始時重新確認一次螢幕縮放比（因為有可能調過視窗大小等）

        var png = this.canvas.toDataURL();
        if (!this.isDrawing && png != this.undoStack[this.undoStack.length - 1]) this.undoStack.push(png); // 儲存當前畫布狀態到 undoStack
        this.isDrawing = true;	// 儲存畫布後正式宣告筆畫開始
        if (this.svgTimers[nowGlyph]) clearTimeout(this.svgTimers[nowGlyph]);	// 停止SVG轉外框 (提高效能)

        if (settings.oldPressureMode) {		// 舊筆壓模式
            const pressure = pressureDrawing.simulatePressure(event.originalEvent, 'start');
            pressureDrawing.startStroke(x * this.ratio, y * this.ratio, pressure);
            this.backgroundImageData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);			// 儲存背景圖像用於即時預覽

            // 防止預設的觸控行為（如滾動）
            event.preventDefault();

        } else {			// 筆刷模式
            var lw = settings.lineWidth * pressureVal * 2; // 計算線寬
            this.ctx.globalCompositeOperation = this.eraseMode ? "destination-out" : "source-over"; // 如果是橡皮擦模式，則使用 destination-out，否則使用 source-over
            //if (event.type.includes('pointer'))
            //drawBrush(ctx, brushes[settings.brushType], x*ratio, y*ratio, lw);

            this.lastX = x; // 儲存最後的 X 座標
            this.lastY = y; // 儲存最後的 Y 座標
            this.lastLW = lw;
            this.isMoved = false;
        }
    }

    // 繪製中
    move(event) {
        if (!this.isDrawing) return;
        const { x, y } = this.getCanvasCoordinates(event);
        var pressureVal = this.getPressureValue('move', event, x, y);
        if (settings.pressureMode && pressureVal == null) return;		// 筆壓模式必須要有筆壓值

        if (settings.oldPressureMode) {							// 舊筆壓模式
            // 使用筆壓繪圖系統：收集點並提供即時預覽
            const pressure = pressureDrawing.simulatePressure(event.originalEvent, 'move');
            pressureDrawing.addPoint(x * this.ratio, y * this.ratio, pressure);

            // 生成即時預覽筆跡
            pressureDrawingSettings.size = settings.lineWidth * pressureDelta;
            const previewStroke = pressureDrawing.createPreviewStroke(pressureDrawingSettings);
            if (previewStroke && this.backgroundImageData) {
                this.ctx.putImageData(this.backgroundImageData, 0, 0);							// 恢復背景圖像
                pressureDrawing.drawStrokeOnCanvas(this.ctx, previewStroke, this.eraseMode);		// 繪製預覽筆跡
            }

            // 防止預設的觸控行為
            event.preventDefault();
        } else {
            this.ctx.globalCompositeOperation = this.eraseMode ? "destination-out" : "source-over"; // 如果是橡皮擦模式，則使用 destination-out，否則使用 source-over

            var lw = settings.lineWidth * pressureVal * 2;

            var d = Math.max(Math.abs(this.lastX - x), Math.abs(this.lastY - y)) * 1.5;
            if (d > 40) events.push(`Long-DrawImage / ${pressureVal} / ${event.originalEvent.pointerType} / ${x}, ${y}, ${lw} (${this.lastX}, ${this.lastY}, ${this.lastLW}) ${d}`); // 儲存事件資訊
            if (d > 0) {
                for (var t = d; t > 0; t--) {
                    var tx = (this.lastX + (x - this.lastX) * t / d) * this.ratio;
                    var ty = (this.lastY + (y - this.lastY) * t / d) * this.ratio;
                    var tlw = this.lastLW + (lw - this.lastLW) * t / d; // 線寬漸變

                    this.drawBrush(this.ctx, brushes[settings.brushType], tx, ty, tlw);
                }
                events.push(`Move-DrawImage / ${pressureVal} / ${event.originalEvent.pointerType} / ${x}, ${y}, ${lw} (${this.lastX}, ${this.lastY}, ${this.lastLW}) ${d}`); // 儲存事件資訊
            }

            this.lastX = x; // 更新最後的 X 座標
            this.lastY = y; // 更新最後的 Y 座標
            this.lastLW = lw; // 更新最後的筆寬
            this.isMoved = true;
        }
    }

    // 停止繪製
    stop(event) {
        if (!this.isDrawing) return;
        this.isDrawing = false;
        const { x, y } = this.getCanvasCoordinates(event);
        this.getPressureValue('end', event, x, y);

        if (settings.oldPressureMode) {		// 舊筆壓模式
            // 使用筆壓繪圖系統：生成最終筆跡並繪製
            pressureDrawingSettings.size = settings.lineWidth * pressureDelta;
            const finalStroke = pressureDrawing.finishStroke(pressureDrawingSettings);
            if (finalStroke && finalStroke.length > 0) {
                if (this.backgroundImageData) this.ctx.putImageData(this.backgroundImageData, 0, 0);	// 恢復背景圖像（如果有的話）
                pressureDrawing.drawStrokeOnCanvas(this.ctx, finalStroke, this.eraseMode);		// 繪製最終筆跡
            }

            // 清除背景圖像數據
            this.backgroundImageData = null;
        } else {
            if (!this.isMoved) {
                this.ctx.globalCompositeOperation = this.eraseMode ? "destination-out" : "source-over"; // 如果是橡皮擦模式，則使用 destination-out，否則使用 source-over
                this.drawBrush(this.ctx, brushes[settings.brushType], this.lastX * this.ratio, this.lastY * this.ratio, this.lastLW);
            }

            this.lastX = null;
            this.lastY = null;
            this.lastLW = null;
            this.isMoved = false; // 重置移動狀態
        }

        this.ctx.globalCompositeOperation = "source-over"; // 恢復正常繪圖模式(重要)

        saveToLocalDB(this); // 停止繪製時儲存畫布內容到 Local Storage
    }

    run() {
        // 開始繪製
        this.$canvas.on('mousedown touchstart pointerdown', this.start.bind(this));
        // 繪製中
        this.$canvas.on('mousemove touchmove pointermove', this.move.bind(this));
        // 停止繪製
        this.$canvas.on('mouseup mouseleave touchend pointerup pointerleave', this.stop.bind(this));
    }
}