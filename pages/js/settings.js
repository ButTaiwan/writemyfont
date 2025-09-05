/*
    操作設定函式
*/

// 讀取設定
async function loadSettings() {
	const settings = {
		notNewFlag: await loadFromDB('notNewFlag', 'N') == 'Y',				// 是否為舊檔案，預設為 N
		scaleRate: await loadFromDB('scaleRate', 100) * 1, 					// 縮放比例，預設為 100%
		smallMode: await loadFromDB('smallMode', 'N') == 'Y',				// 是否小字模式，預設為 N
		lineWidth: await loadFromDB('lineWidth', 12) * 1, 					// 筆寬，預設為 12
		brushType: await loadFromDB('brushType', 0) * 1, 					// 筆刷類型，預設為 0
		pressureMode: await loadFromDB('pressureMode', 'N') == 'Y',			// 筆壓模式，預設為 N
		pressureEffect: await loadFromDB('pressureEffect', 'none'),			// 筆壓公式，預設為 none
		gridType: await loadFromDB('gridType', '3x3grid'),					// 格線類型，預設為 3x3grid
		oldPressureMode: await loadFromDB('oldPressureMode', 'N') == 'Y',	// 啟用舊版筆壓模式，預設為 N
		fontNameEng: await loadFromDB('fontNameEng') || 'MyFreehandFont',
		fontNameCJK: await loadFromDB('fontNameCJK') || fdrawer.fontNameCJK,
		noFixedWidthFlag: await loadFromDB('noFixedWidthFlag', 'N') == 'Y',	// 比例寬輸出，預設為 N
		saveAsTester: await loadFromDB('saveAsTester', 'Y') == 'Y', 		// 是否為測試輸出，預設為 Y
		testSerialNo: await loadFromDB('testSerialNo', 1) * 1,				// 測試輸出序號，預設為 1
		customGlyphs: await loadFromDB('customGlyphs')						// 自定義文字
	};

	if (settings.customGlyphs && settings.customGlyphs != '') {	// 如果有自定義文字，則添加到列表中
		var cglist = settings.customGlyphs.split(/,/);
		glyphList[fdrawer.customList] = [];
		for (var i = 0; i < cglist.length; i++) {
			glyphList[fdrawer.customList].push(cglist[i]);
			var uni = parseInt(cglist[i].replace(/^u(ni)?/g, ''), 16);
			glyphMap[cglist[i]] = { c: String.fromCodePoint(uni), w: 'F' };	// 將自定義文字添加到映射中
		}
	}

	console.log('Settings loaded:', settings);

	return settings;
}

async function updateSetting(key, value) {
	if (settings == null) settings = await loadSettings();
	if (typeof (value) != 'undefined') settings[key] = value;
	if (typeof (settings[key]) == 'boolean') {
		//console.log(`Updating setting ${key} to ${settings[key] ? 'Y' : 'N'}`);
		await saveToDB(key, settings[key] ? 'Y' : 'N'); 				// 將布林值轉換為 'Y' 或 'N'
	} else {
		//console.log(`Updating setting ${key} to ${settings[key]}`);
		await saveToDB(key, settings[key]);
	}
}