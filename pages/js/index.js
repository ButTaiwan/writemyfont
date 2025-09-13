const version = '0.592'; // 版本號
const upm = 1000;
const userAgent = (navigator.userAgent || navigator.vendor || window.opera).toLowerCase();
const pressureDelta = 1.3;		// 筆壓模式跟一般模式的筆寬差異倍數 (舊筆壓模式用)
const dbName = fdrawer.dbName || 'FontDrawerDB'; // 使用 fdrawer.dbName，如果未定義則使用預設值
const storeName = 'FontData';
const events = [];
let db;
let settings = null;
let nowList = null;
let nowGlyphIndex = null;
let nowGlyph = null;
// (舊筆壓模式) 初始化 PressureDrawing 實例
const pressureDrawing = new PressureDrawing();
let pressureDrawingSettings = {
	thinning: 0.5,
	smoothing: 0.4,
	streamline: 0.4
};

// 取得畫布渲染縮放比例，用於調整筆刷大小
function getCanvasScaleRate() {
	const drawingCanvas = document.getElementById("drawingCanvas");
	const { width: canvasRenderWidth } = drawingCanvas.getBoundingClientRect();
	const canvasWidth = drawingCanvas.width;
	return canvasRenderWidth / canvasWidth;
}

// 將畫布轉換為 SVG
async function toSVG(gname, savedCanvas) {
	// 建立一個臨時的 canvas
	const tempCanvas = document.createElement('canvas');
	const tempCtx = tempCanvas.getContext('2d');
	tempCanvas.width = 500;
	tempCanvas.height = 500;

	tempCtx.fillStyle = 'white';
	tempCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);
	const img = new Image();
	img.src = savedCanvas;
	return new Promise((resolve) => {
		img.onload = function () {
			tempCtx.drawImage(img, 0, 0);

			// 使用 potrace.js 將臨時 canvas 轉換為 SVG
			Potrace.loadImageFromUrl(tempCanvas.toDataURL('image/png'));
			Potrace.setParameter({
				turdSize: 100, // 減少雜訊
				opttolerance: 0.5, // 調整優化容差
			});
			Potrace.process(function () {
				var svgData = Potrace.getSVG(2); // 取得 SVG 資料
				svgData = svgData.replace(/^.+path d="/, '').replace(/".+$/, '');
				resolve(svgData);
			});
		};
	});
}

// (舊筆壓模式) 更新筆壓繪圖狀態
async function updatePressureDrawingStatus() {
	const moduleInitialized = await pressureDrawing.initialize();

	// 預設關閉筆壓繪圖
	settings.oldPressureMode = settings.oldPressureMode && moduleInitialized;

	// $('#brushSelector').toggle(!settings.oldPressureMode); 		// 如果舊筆壓繪圖啟用，則隱藏筆刷選擇器
	if (settings.oldPressureMode) { // 如果舊筆壓繪圖啟用，則設定筆刷為圓形
		$('#brushSelector').empty().append($(brushes[0]));
		$('#brushSelector').attr('disabled', true);
		$('#brushDisplayImg').attr('src', brushesURL[0]);
		$('#brushDisplay').attr('disabled', true);
		$('#brushRadioGroup input[type="radio"]')[0].checked = true;
		$('#brushRadioGroup input[type="radio"]').attr('disabled', true);
	} else {
		$('#brushSelector').empty().append($(brushes[settings.brushType]));
		$('#brushSelector').attr('disabled', false);
		$('#brushDisplayImg').attr('src', brushesURL[settings.brushType]);
		$('#brushDisplay').attr('disabled', false);
		$('#brushRadioGroup input[type="radio"]').attr('disabled', false);
		$('#brushRadioGroup input[type="radio"]')[settings.brushType].checked = true;
	}
	$('#pressureSwitchContainer').toggle(!settings.oldPressureMode); 	// 如果舊筆壓繪圖啟用，則隱藏筆壓開關
}

function initListSelect($listSelect) {
	$listSelect.empty(); // 清空選單
	for (var list in glyphList) {
		$listSelect.append(
			$('<option></option>').val(list).text(list)
		);
	}
}

document.addEventListener('DOMContentLoaded', async function () {
	const settings_container = document.getElementById('settings_container');
	const settings_container_modal = new bootstrap.Modal(settings_container);
	const canvas = new Canvas();

	// 初始化 IndexedDB
	try {
		await initDB();
	} catch (error) {
		console.error('IndexedDB 起動失敗', error);
		return;
	}
	console.log('IndexedDB 起動完成');
	settings = await loadSettings();
	initController(); // 初始化功能
	initMenu(); // 初始化上方選單切換
	canvas.init();	// 初始化九宮格底圖
	$('#canvas-container').toggleClass('smallmode', settings.smallMode);

	// 開始監聽功能事件
	startController(canvas);

	$('#listSelect').trigger('change'); // 觸發一次 change 事件以載入第一個列表

	// 初始化筆壓繪圖狀態
	await updatePressureDrawingStatus();

	if (!settings.notNewFlag) {
		settings_container_modal.show();
	} else {
		if ($('#ads-container')) $('#ads-container').show();
	}
	$('#spanDoneCount').text(await countGlyphFromDB());

	$('#smallModeCheck').prop('checked', settings.smallMode);
	var scale = settings.scaleRate; // 預設縮放比例為 100%
	$('#scaleRateSlider').val(scale);
	$('#scaleRateValue').text(scale + '%');
	$('#pressureEffectSelect').val(settings.pressureEffect);
	$('#pressureDrawingEnabled').prop('checked', settings.oldPressureMode);
	$('#gridTypeSelect').val(settings.gridType);

	canvas.run();

	// 判斷是否在 in-app browser 中
	if (/fban|fbav|instagram|line|threads/i.test(userAgent)) {
		// 如果是 Facebook、Instagram 或 Line 的 in-app browser
		alert(fdrawer.inAppNotice);
	}

	// 解決 iOS Safari 按鈕點兩下容易不小心放大視窗的問題
	if (/iphone|ipad|ipod/.test(userAgent) && /safari/.test(userAgent.toLowerCase())) {
		document.querySelectorAll('body').forEach(function (btn) {
			btn.addEventListener('dblclick', function (e) {
				e.preventDefault();
			}, { passive: false });
		});
	}
});
