/*
    字型相關函式
*/

async function createFont(glyphs, gidMap, verts, ccmps) {
	if (settings.saveAsTester) {
		settings.fontNameEng += settings.testSerialNo;
		settings.fontNameCJK += settings.testSerialNo;
		updateSetting('testSerialNo', settings.testSerialNo + 1); // 更新測試序號
	}

	const font = new opentype.Font({
		familyName: settings.fontNameEng,
		fullName: settings.fontNameEng,
		postScriptName: settings.fontNameEng.replace(/[^a-zA-Z0-9]/g, ''), // 去除特殊字符
		styleName: 'Regular',
		designer: 'zi-hi.com',
		designerURL: 'https://zi-hi.com',
		manufacturer: 'zi-hi.com',
		manufacturerURL: 'https://zi-hi.com',

		unitsPerEm: upm,
		ascender: 880,
		descender: -120,
		glyphs: glyphs
	});

	for (var group in font.names) {
		font.names[group].fontFamily[fdrawer.fontLang] = settings.fontNameCJK;
		font.names[group].fullName[fdrawer.fontLang] = settings.fontNameCJK;
	}

	font.tables.os2.achVendID = 'ZIHI';
	font.tables.os2.ulCodePageRange1 = fdrawer.codePage; // CodePage
	font.tables.os2.usWinAscent = 920; // Windows ascent
	font.tables.os2.usWinDescent = 200; // Windows ascent
	font.tables.os2.xAvgCharWidth = upm;

	// ccmps
	for (let i in ccmps) {
		var gname_to = ccmps[i];
		var allpass = true;
		var subfrom = [];
		for (let i in glyphMap[gname_to].s) {
			var gname_from = glyphMap[gname_to].s[i];
			if (!gidMap[gname_from]) allpass = false;
			subfrom.push(gidMap[gname_from]);
		}
		if (!allpass) continue;
		font.substitution.addLigature('ccmp', { sub: subfrom, by: gidMap[gname_to] });
	}

	// verts
	for (let i in verts) {
		var gname_v = verts[i];
		var gname_h = glyphMap[gname_v].v;
		if (!gidMap[gname_v]) continue; // 如果沒有對應的 cid，則跳過
		if (!gidMap[gname_h]) continue; // 如果沒有對應的 cid，則跳過
		font.substitution.addSingle('vert', { sub: gidMap[gname_h], by: gidMap[gname_v] });
	}

	return font;
}
