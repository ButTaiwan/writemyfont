const version = '0.594'; // 版本號
const upm = 1000;
const userAgent = navigator.userAgent.toLowerCase();
const pressureDelta = 1.3; // 筆壓模式跟一般模式的筆寬差異倍數 (舊筆壓模式用)
const dbName = fdrawer.dbName || "FontDrawerDB"; // 使用 fdrawer.dbName，如果未定義則使用預設值
const storeName = "FontData";
const events = [];

let db;
let settings = null;

const brushes = [];
function addBrush(imgSrc) {
    var brush = new Image();
    brush.src = "data:image/png;base64," + imgSrc;
    brushes.push(brush);
}
addBrush(
    "iVBORw0KGgoAAAANSUhEUgAAAGAAAABgCAYAAADimHc4AAAACXBIWXMAAAsTAAALEwEAmpwYAAAFu2lUWHRYTUw6Y29tLmFkb2JlLnhtcAAAAAAAPD94cGFja2V0IGJlZ2luPSLvu78iIGlkPSJXNU0wTXBDZWhpSHpyZVN6TlRjemtjOWQiPz4gPHg6eG1wbWV0YSB4bWxuczp4PSJhZG9iZTpuczptZXRhLyIgeDp4bXB0az0iQWRvYmUgWE1QIENvcmUgOS4xLWMwMDEgNzkuMTQ2Mjg5OSwgMjAyMy8wNi8yNS0yMDowMTo1NSAgICAgICAgIj4gPHJkZjpSREYgeG1sbnM6cmRmPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5LzAyLzIyLXJkZi1zeW50YXgtbnMjIj4gPHJkZjpEZXNjcmlwdGlvbiByZGY6YWJvdXQ9IiIgeG1sbnM6eG1wPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvIiB4bWxuczpkYz0iaHR0cDovL3B1cmwub3JnL2RjL2VsZW1lbnRzLzEuMS8iIHhtbG5zOnBob3Rvc2hvcD0iaHR0cDovL25zLmFkb2JlLmNvbS9waG90b3Nob3AvMS4wLyIgeG1sbnM6eG1wTU09Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9tbS8iIHhtbG5zOnN0RXZ0PSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvc1R5cGUvUmVzb3VyY2VFdmVudCMiIHhtcDpDcmVhdG9yVG9vbD0iQWRvYmUgUGhvdG9zaG9wIDI1LjAgKFdpbmRvd3MpIiB4bXA6Q3JlYXRlRGF0ZT0iMjAyNS0wNy0xOVQxMToyNToxMSswODowMCIgeG1wOk1vZGlmeURhdGU9IjIwMjUtMDctMTlUMTE6NDc6MTIrMDg6MDAiIHhtcDpNZXRhZGF0YURhdGU9IjIwMjUtMDctMTlUMTE6NDc6MTIrMDg6MDAiIGRjOmZvcm1hdD0iaW1hZ2UvcG5nIiBwaG90b3Nob3A6Q29sb3JNb2RlPSIzIiB4bXBNTTpJbnN0YW5jZUlEPSJ4bXAuaWlkOjgyMTU3OTVjLTUwZDQtNzA0NC05NDczLTliY2FiOGEyNzdlNSIgeG1wTU06RG9jdW1lbnRJRD0i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"
);
addBrush(
    "iVBORw0KGgoAAAANSUhEUgAAAGAAAABgCAYAAADimHc4AAAACXBIWXMAAAsTAAALEwEAmpwYAAAE7mlUWHRYTUw6Y29tLmFkb2JlLnhtcAAAAAAAPD94cGFja2V0IGJlZ2luPSLvu78iIGlkPSJXNU0wTXBDZWhpSHpyZVN6TlRjemtjOWQiPz4gPHg6eG1wbWV0YSB4bWxuczp4PSJhZG9iZTpuczptZXRhLyIgeDp4bXB0az0iQWRvYmUgWE1QIENvcmUgOS4xLWMwMDEgNzkuMTQ2Mjg5OSwgMjAyMy8wNi8yNS0yMDowMTo1NSAgICAgICAgIj4gPHJkZjpSREYgeG1sbnM6cmRmPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5LzAyLzIyLXJkZi1zeW50YXgtbnMjIj4gPHJkZjpEZXNjcmlwdGlvbiByZGY6YWJvdXQ9IiIgeG1sbnM6eG1wPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvIiB4bWxuczpkYz0iaHR0cDovL3B1cmwub3JnL2RjL2VsZW1lbnRzLzEuMS8iIHhtbG5zOnBob3Rvc2hvcD0iaHR0cDovL25zLmFkb2JlLmNvbS9waG90b3Nob3AvMS4wLyIgeG1sbnM6eG1wTU09Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9tbS8iIHhtbG5zOnN0RXZ0PSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvc1R5cGUvUmVzb3VyY2VFdmVudCMiIHhtcDpDcmVhdG9yVG9vbD0iQWRvYmUgUGhvdG9zaG9wIDI1LjAgKFdpbmRvd3MpIiB4bXA6Q3JlYXRlRGF0ZT0iMjAyNS0wNy0xOVQxMToyNToxMSswODowMCIgeG1wOk1vZGlmeURhdGU9IjIwMjUtMDctMTlUMTE6Mjg6MTYrMDg6MDAiIHhtcDpNZXRhZGF0YURhdGU9IjIwMjUtMDctMTlUMTE6Mjg6MTYrMDg6MDAiIGRjOmZvcm1hdD0iaW1hZ2UvcG5nIiBwaG90b3Nob3A6Q29sb3JNb2RlPSIzIiB4bXBNTTpJbnN0YW5jZUlEPSJ4bXAuaWlkOmE0ZTBhZjA2LTcyMTUtMWY0Ni1hODZkLWU3NzU4MzNmNmMwZCIgeG1wTU06RG9jdW1lbnRJRD0i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"
);
addBrush(
    "iVBORw0KGgoAAAANSUhEUgAAAGAAAABgCAYAAADimHc4AAAACXBIWXMAAAsTAAALEwEAmpwYAAAGlmlUWHRYTUw6Y29tLmFkb2JlLnhtcAAAAAAAPD94cGFja2V0IGJlZ2luPSLvu78iIGlkPSJXNU0wTXBDZWhpSHpyZVN6TlRjemtjOWQiPz4gPHg6eG1wbWV0YSB4bWxuczp4PSJhZG9iZTpuczptZXRhLyIgeDp4bXB0az0iQWRvYmUgWE1QIENvcmUgOS4xLWMwMDEgNzkuMTQ2Mjg5OSwgMjAyMy8wNi8yNS0yMDowMTo1NSAgICAgICAgIj4gPHJkZjpSREYgeG1sbnM6cmRmPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5LzAyLzIyLXJkZi1zeW50YXgtbnMjIj4gPHJkZjpEZXNjcmlwdGlvbiByZGY6YWJvdXQ9IiIgeG1sbnM6eG1wPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvIiB4bWxuczpkYz0iaHR0cDovL3B1cmwub3JnL2RjL2VsZW1lbnRzLzEuMS8iIHhtbG5zOnBob3Rvc2hvcD0iaHR0cDovL25zLmFkb2JlLmNvbS9waG90b3Nob3AvMS4wLyIgeG1sbnM6eG1wTU09Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9tbS8iIHhtbG5zOnN0RXZ0PSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvc1R5cGUvUmVzb3VyY2VFdmVudCMiIHhtcDpDcmVhdG9yVG9vbD0iQWRvYmUgUGhvdG9zaG9wIDI1LjAgKFdpbmRvd3MpIiB4bXA6Q3JlYXRlRGF0ZT0iMjAyNS0wNy0xOVQxMToyNToxMSswODowMCIgeG1wOk1vZGlmeURhdGU9IjIwMjUtMDctMTlUMTE6NTU6MDErMDg6MDAiIHhtcDpNZXRhZGF0YURhdGU9IjIwMjUtMDctMTlUMTE6NTU6MDErMDg6MDAiIGRjOmZvcm1hdD0iaW1hZ2UvcG5nIiBwaG90b3Nob3A6Q29sb3JNb2RlPSIzIiB4bXBNTTpJbnN0YW5jZUlEPSJ4bXAuaWlkOjU0YmZiNzZmLThmNGYtNGE0YS04OGEwLTc4MDA2NWI2ZjMwNCIgeG1wTU06RG9jdW1lbnRJRD0iYWRvYmU6ZG9jaWQ6cGhvdG9zaG9wOmY5ODYzOWYzLTU3YjMtZWU0Yy04OTUxLWM4MzAyYzAyNTk3YSIgeG1wTU06T3JpZ2luYWxEb2N1bWVudElEPSJ4bXAuZGlkOmE0ZTBhZjA2LTcyMTUtMWY0Ni1hODZkLWU3NzU4MzNmNmMwZCI+IDx4bXBNTTpIaXN0b3J5PiA8cmRmOlNlcT4gPHJkZjpsaSBzdEV2dDphY3Rpb249ImNyZWF0ZWQiIHN0RXZ0Omluc3RhbmNlSUQ9InhtcC5paWQ6YTRlMGFmMDYtNzIxNS0xZjQ2LWE4NmQtZTc3NTgzM2Y2YzBkIiBzdEV2dDp3aGVuPSIyMDI1LTA3LTE5VDExOjI1OjExKzA4OjAwIiBzdEV2dDpzb2Z0d2FyZUFnZW50PSJBZG9iZSBQaG90b3Nob3AgMjUuMCAoV2luZG93cykiLz4gPHJkZjpsaSBzdEV2dDphY3Rpb249InNhdmVkIiBzdEV2dDppbnN0YW5jZUlEPSJ4bXAuaWlkOjkyNGNkYWJlLWUxMmEtY2E0MS04YmE1LTEwODI2NmM4MzQzMiIgc3RFdnQ6d2hlbj0iMjAyNS0wNy0xOVQxMTo1NTowMSswODowMCIgc3RFdnQ6c29mdHdhcmVBZ2VudD0iQWRvYmUgUGhvdG9zaG9wIDI1LjAgKFdpbmRvd3MpIiBzdEV2dDpjaGFuZ2VkPSIvIi8+IDxyZGY6bGkgc3RFdnQ6YWN0aW9uPSJzYXZlZCIgc3RFdnQ6aW5zdGFuY2VJRD0ieG1wLmlpZDo1NGJmYjc2Zi04ZjRmLTRhNGEtODhhMC03ODAwNjViNmYzMDQiIHN0RXZ0OndoZW49IjIwMjUtMDctMTlUMTE6NTU6MDErMDg6MDAiIHN0RXZ0OnNvZnR3YXJlQWdlbnQ9IkFkb2JlIFBob3Rvc2hvcCAyNS4wIChXaW5kb3dzKSIgc3RFdnQ6Y2hhbmdlZD0iLyIvPiA8L3JkZjpTZXE+IDwveG1wTU06SGlzdG9yeT4gPC9yZGY6RGVzY3JpcHRpb24+IDwvcmRmOlJERj4gPC94OnhtcG1ldGE+IDw/eHBhY2tldCBlbmQ9InIiPz6Ijiu+AAAKxklEQVR42u2d6U9cyRXFf73Q3ewMi8HLGLBhzGQyiRQpkUZRIuVz/uxkkoyU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"
);
addBrush(
    "iVBORw0KGgoAAAANSUhEUgAAAGAAAABgCAYAAADimHc4AAAACXBIWXMAAAsTAAALEwEAmpwYAAAGlmlUWHRYTUw6Y29tLmFkb2JlLnhtcAAAAAAAPD94cGFja2V0IGJlZ2luPSLvu78iIGlkPSJXNU0wTXBDZWhpSHpyZVN6TlRjemtjOWQiPz4gPHg6eG1wbWV0YSB4bWxuczp4PSJhZG9iZTpuczptZXRhLyIgeDp4bXB0az0iQWRvYmUgWE1QIENvcmUgOS4xLWMwMDEgNzkuMTQ2Mjg5OSwgMjAyMy8wNi8yNS0yMDowMTo1NSAgICAgICAgIj4gPHJkZjpSREYgeG1sbnM6cmRmPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5LzAyLzIyLXJkZi1zeW50YXgtbnMjIj4gPHJkZjpEZXNjcmlwdGlvbiByZGY6YWJvdXQ9IiIgeG1sbnM6eG1wPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvIiB4bWxuczpkYz0iaHR0cDovL3B1cmwub3JnL2RjL2VsZW1lbnRzLzEuMS8iIHhtbG5zOnBob3Rvc2hvcD0iaHR0cDovL25zLmFkb2JlLmNvbS9waG90b3Nob3AvMS4wLyIgeG1sbnM6eG1wTU09Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9tbS8iIHhtbG5zOnN0RXZ0PSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvc1R5cGUvUmVzb3VyY2VFdmVudCMiIHhtcDpDcmVhdG9yVG9vbD0iQWRvYmUgUGhvdG9zaG9wIDI1LjAgKFdpbmRvd3MpIiB4bXA6Q3JlYXRlRGF0ZT0iMjAyNS0wNy0xOVQxMToyNToxMSswODowMCIgeG1wOk1vZGlmeURhdGU9IjIwMjUtMDctMTlUMTU6MjA6NTYrMDg6MDAiIHhtcDpNZXRhZGF0YURhdGU9IjIwMjUtMDctMTlUMTU6MjA6NTYrMDg6MDAiIGRjOmZvcm1hdD0iaW1hZ2UvcG5nIiBwaG90b3Nob3A6Q29sb3JNb2RlPSIzIiB4bXBNTTpJbnN0YW5jZUlEPSJ4bXAuaWlkOjg0ODE1NjE1LTNlOTktZTU0MC05MTJkLTIzOTIyNzU2NDdmYiIgeG1wTU06RG9jdW1lbnRJRD0iYWRvYmU6ZG9jaWQ6cGhvdG9zaG9wOjMyNmMxZmViLWZhNTItZGI0ZC1iNmE1LWY3YTdkZmUxNTM3MiIgeG1wTU06T3JpZ2luYWxEb2N1bWVudElEPSJ4bXAuZGlkOmE0ZTBhZjA2LTcyMTUtMWY0Ni1hODZkLWU3NzU4MzNmNmMwZCI+IDx4bXBNTTpIaXN0b3J5PiA8cmRmOlNlcT4gPHJkZjpsaSBzdEV2dDphY3Rpb249ImNyZWF0ZWQiIHN0RXZ0Omluc3RhbmNlSUQ9InhtcC5paWQ6YTRlMGFmMDYtNzIxNS0xZjQ2LWE4NmQtZTc3NTgzM2Y2YzBkIiBzdEV2dDp3aGVuPSIyMDI1LTA3LTE5VDExOjI1OjExKzA4OjAwIiBzdEV2dDpzb2Z0d2FyZUFnZW50PSJBZG9iZSBQaG90b3Nob3AgMjUuMCAoV2luZG93cykiLz4gPHJkZjpsaSBzdEV2dDphY3Rpb249InNhdmVkIiBzdEV2dDppbnN0YW5jZUlEPSJ4bXAuaWlkOjc2YWQxMWJjLTU3YzYtOWE0YS1hOTQ5LWZmMTAzMWNmNDhmNCIgc3RFdnQ6d2hlbj0iMjAyNS0wNy0xOVQxNToyMDo1NiswODowMCIgc3RFdnQ6c29mdHdhcmVBZ2VudD0iQWRvYmUgUGhvdG9zaG9wIDI1LjAgKFdpbmRvd3MpIiBzdEV2dDpjaGFuZ2VkPSIvIi8+IDxyZGY6bGkgc3RFdnQ6YWN0aW9uPSJzYXZlZCIgc3RFdnQ6aW5zdGFuY2VJRD0ieG1wLmlpZDo4NDgxNTYxNS0zZTk5LWU1NDAtOTEyZC0yMzkyMjc1NjQ3ZmIiIHN0RXZ0OndoZW49IjIwMjUtMDctMTlUMTU6MjA6NTYrMDg6MDAiIHN0RXZ0OnNvZnR3YXJlQWdlbnQ9IkFkb2JlIFBob3Rvc2hvcCAyNS4wIChXaW5kb3dzKSIgc3RFdnQ6Y2hhbmdlZD0iLyIvPiA8L3JkZjpTZXE+IDwveG1wTU06SGlzdG9yeT4gPC9yZGY6RGVzY3JpcHRpb24+IDwvcmRmOlJERj4gPC94OnhtcG1ldGE+IDw/eHBhY2tldCBlbmQ9InIiPz7P7eCvAAAGsklEQVR42u2dbYiUVRTHf2d2XHPzZU1N0wKtzPd8Qcoy01Cx+mJl4IcyUJI+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"
);
addBrush(
    "iVBORw0KGgoAAAANSUhEUgAAAGAAAABgCAYAAADimHc4AAAACXBIWXMAAAsTAAALEwEAmpwYAAAGlmlUWHRYTUw6Y29tLmFkb2JlLnhtcAAAAAAAPD94cGFja2V0IGJlZ2luPSLvu78iIGlkPSJXNU0wTXBDZWhpSHpyZVN6TlRjemtjOWQiPz4gPHg6eG1wbWV0YSB4bWxuczp4PSJhZG9iZTpuczptZXRhLyIgeDp4bXB0az0iQWRvYmUgWE1QIENvcmUgOS4xLWMwMDEgNzkuMTQ2Mjg5OSwgMjAyMy8wNi8yNS0yMDowMTo1NSAgICAgICAgIj4gPHJkZjpSREYgeG1sbnM6cmRmPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5LzAyLzIyLXJkZi1zeW50YXgtbnMjIj4gPHJkZjpEZXNjcmlwdGlvbiByZGY6YWJvdXQ9IiIgeG1sbnM6eG1wPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvIiB4bWxuczpkYz0iaHR0cDovL3B1cmwub3JnL2RjL2VsZW1lbnRzLzEuMS8iIHhtbG5zOnBob3Rvc2hvcD0iaHR0cDovL25zLmFkb2JlLmNvbS9waG90b3Nob3AvMS4wLyIgeG1sbnM6eG1wTU09Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9tbS8iIHhtbG5zOnN0RXZ0PSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvc1R5cGUvUmVzb3VyY2VFdmVudCMiIHhtcDpDcmVhdG9yVG9vbD0iQWRvYmUgUGhvdG9zaG9wIDI1LjAgKFdpbmRvd3MpIiB4bXA6Q3JlYXRlRGF0ZT0iMjAyNS0wNy0xOVQxMToyNToxMSswODowMCIgeG1wOk1vZGlmeURhdGU9IjIwMjUtMDctMTlUMTI6Mjk6MzIrMDg6MDAiIHhtcDpNZXRhZGF0YURhdGU9IjIwMjUtMDctMTlUMTI6Mjk6MzIrMDg6MDAiIGRjOmZvcm1hdD0iaW1hZ2UvcG5nIiBwaG90b3Nob3A6Q29sb3JNb2RlPSIzIiB4bXBNTTpJbnN0YW5jZUlEPSJ4bXAuaWlkOjI3ZDI3MjBiLTUzYjgtMTM0NC04MGZjLTFkY2EwMzQxMzFlNiIgeG1wTU06RG9jdW1lbnRJRD0iYWRvYmU6ZG9jaWQ6cGhvdG9zaG9wOmU5ZWFjMDdmLTNmMDQtYzc0NS1iYTcxLTJlNjJkY2U5NmM5YSIgeG1wTU06T3JpZ2luYWxEb2N1bWVudElEPSJ4bXAuZGlkOmE0ZTBhZjA2LTcyMTUtMWY0Ni1hODZkLWU3NzU4MzNmNmMwZCI+IDx4bXBNTTpIaXN0b3J5PiA8cmRmOlNlcT4gPHJkZjpsaSBzdEV2dDphY3Rpb249ImNyZWF0ZWQiIHN0RXZ0Omluc3RhbmNlSUQ9InhtcC5paWQ6YTRlMGFmMDYtNzIxNS0xZjQ2LWE4NmQtZTc3NTgzM2Y2YzBkIiBzdEV2dDp3aGVuPSIyMDI1LTA3LTE5VDExOjI1OjExKzA4OjAwIiBzdEV2dDpzb2Z0d2FyZUFnZW50PSJBZG9iZSBQaG90b3Nob3AgMjUuMCAoV2luZG93cykiLz4gPHJkZjpsaSBzdEV2dDphY3Rpb249InNhdmVkIiBzdEV2dDppbnN0YW5jZUlEPSJ4bXAuaWlkOmFiZmViNmY4LTUwNzEtNWM0Ni04YjJkLTQxODYxYzE3NGIxYSIgc3RFdnQ6d2hlbj0iMjAyNS0wNy0xOVQxMjoyOTozMiswODowMCIgc3RFdnQ6c29mdHdhcmVBZ2VudD0iQWRvYmUgUGhvdG9zaG9wIDI1LjAgKFdpbmRvd3MpIiBzdEV2dDpjaGFuZ2VkPSIvIi8+IDxyZGY6bGkgc3RFdnQ6YWN0aW9uPSJzYXZlZCIgc3RFdnQ6aW5zdGFuY2VJRD0ieG1wLmlpZDoyN2QyNzIwYi01M2I4LTEzNDQtODBmYy0xZGNhMDM0MTMxZTYiIHN0RXZ0OndoZW49IjIwMjUtMDctMTlUMTI6Mjk6MzIrMDg6MDAiIHN0RXZ0OnNvZnR3YXJlQWdlbnQ9IkFkb2JlIFBob3Rvc2hvcCAyNS4wIChXaW5kb3dzKSIgc3RFdnQ6Y2hhbmdlZD0iLyIvPiA8L3JkZjpTZXE+IDwveG1wTU06SGlzdG9yeT4gPC9yZGY6RGVzY3JpcHRpb24+IDwvcmRmOlJERj4gPC94OnhtcG1ldGE+IDw/eHBhY2tldCBlbmQ9InIiPz4oCt+pAAAQ7UlEQVR42u2dCXgURRbHKyQhAeQGRRBEoyI3inhwrCwKwnqh4okiAp6AriiH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"
);
addBrush(
    "iVBORw0KGgoAAAANSUhEUgAAAGAAAABgCAYAAADimHc4AAAACXBIWXMAAAsTAAALEwEAmpwYAAAGlmlUWHRYTUw6Y29tLmFkb2JlLnhtcAAAAAAAPD94cGFja2V0IGJlZ2luPSLvu78iIGlkPSJXNU0wTXBDZWhpSHpyZVN6TlRjemtjOWQiPz4gPHg6eG1wbWV0YSB4bWxuczp4PSJhZG9iZTpuczptZXRhLyIgeDp4bXB0az0iQWRvYmUgWE1QIENvcmUgOS4xLWMwMDEgNzkuMTQ2Mjg5OSwgMjAyMy8wNi8yNS0yMDowMTo1NSAgICAgICAgIj4gPHJkZjpSREYgeG1sbnM6cmRmPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5LzAyLzIyLXJkZi1zeW50YXgtbnMjIj4gPHJkZjpEZXNjcmlwdGlvbiByZGY6YWJvdXQ9IiIgeG1sbnM6eG1wPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvIiB4bWxuczpkYz0iaHR0cDovL3B1cmwub3JnL2RjL2VsZW1lbnRzLzEuMS8iIHhtbG5zOnBob3Rvc2hvcD0iaHR0cDovL25zLmFkb2JlLmNvbS9waG90b3Nob3AvMS4wLyIgeG1sbnM6eG1wTU09Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9tbS8iIHhtbG5zOnN0RXZ0PSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvc1R5cGUvUmVzb3VyY2VFdmVudCMiIHhtcDpDcmVhdG9yVG9vbD0iQWRvYmUgUGhvdG9zaG9wIDI1LjAgKFdpbmRvd3MpIiB4bXA6Q3JlYXRlRGF0ZT0iMjAyNS0wNy0xOVQxMToyNToxMSswODowMCIgeG1wOk1vZGlmeURhdGU9IjIwMjUtMDctMjFUMjI6MDc6MTErMDg6MDAiIHhtcDpNZXRhZGF0YURhdGU9IjIwMjUtMDctMjFUMjI6MDc6MTErMDg6MDAiIGRjOmZvcm1hdD0iaW1hZ2UvcG5nIiBwaG90b3Nob3A6Q29sb3JNb2RlPSIzIiB4bXBNTTpJbnN0YW5jZUlEPSJ4bXAuaWlkOjg3MzBkNGY3LTY4ZmEtYjE0YS1iOGU3LTI2NjhhOTA2ZjU4MSIgeG1wTU06RG9jdW1lbnRJRD0iYWRvYmU6ZG9jaWQ6cGhvdG9zaG9wOmE2NzljNjU1LTU3NmItYmE0NS04NzhlLWQ5MGE4NTNhZjIwZSIgeG1wTU06T3JpZ2luYWxEb2N1bWVudElEPSJ4bXAuZGlkOmE0ZTBhZjA2LTcyMTUtMWY0Ni1hODZkLWU3NzU4MzNmNmMwZCI+IDx4bXBNTTpIaXN0b3J5PiA8cmRmOlNlcT4gPHJkZjpsaSBzdEV2dDphY3Rpb249ImNyZWF0ZWQiIHN0RXZ0Omluc3RhbmNlSUQ9InhtcC5paWQ6YTRlMGFmMDYtNzIxNS0xZjQ2LWE4NmQtZTc3NTgzM2Y2YzBkIiBzdEV2dDp3aGVuPSIyMDI1LTA3LTE5VDExOjI1OjExKzA4OjAwIiBzdEV2dDpzb2Z0d2FyZUFnZW50PSJBZG9iZSBQaG90b3Nob3AgMjUuMCAoV2luZG93cykiLz4gPHJkZjpsaSBzdEV2dDphY3Rpb249InNhdmVkIiBzdEV2dDppbnN0YW5jZUlEPSJ4bXAuaWlkOjgyMTU3OTVjLTUwZDQtNzA0NC05NDczLTliY2FiOGEyNzdlNSIgc3RFdnQ6d2hlbj0iMjAyNS0wNy0xOVQxMTo0NzoxMiswODowMCIgc3RFdnQ6c29mdHdhcmVBZ2VudD0iQWRvYmUgUGhvdG9zaG9wIDI1LjAgKFdpbmRvd3MpIiBzdEV2dDpjaGFuZ2VkPSIvIi8+IDxyZGY6bGkgc3RFdnQ6YWN0aW9uPSJzYXZlZCIgc3RFdnQ6aW5zdGFuY2VJRD0ieG1wLmlpZDo4NzMwZDRmNy02OGZhLWIxNGEtYjhlNy0yNjY4YTkwNmY1ODEiIHN0RXZ0OndoZW49IjIwMjUtMDctMjFUMjI6MDc6MTErMDg6MDAiIHN0RXZ0OnNvZnR3YXJlQWdlbnQ9IkFkb2JlIFBob3Rvc2hvcCAyNS4wIChXaW5kb3dzKSIgc3RFdnQ6Y2hhbmdlZD0iLyIvPiA8L3JkZjpTZXE+IDwveG1wTU06SGlzdG9yeT4gPC9yZGY6RGVzY3JpcHRpb24+IDwvcmRmOlJERj4gPC94OnhtcG1ldGE+IDw/eHBhY2tldCBlbmQ9InIiPz6uWwLnAAAD8UlEQVR42u3cX8ieYxwH8M/DNtMWYzP1yghZkpPNn5lJW5KccCT/QkQSIUorESf+RJGwE8RqlDAndkBJsjkgm/yZhq0l2cZsjL0z2+3gvt71WM+7533+Tdu+37p66u05uj7PfV339bt/99uoqkry/+WwTEEAApAEIABJAAKQBCAASQACkAQgAEkAApAEIABJAAKQBCAASQACkAQgAEkAApD0L+P2/kOj0ZiDadiFYXyDbeW7WzJlvae5H7exd3Nuo9FYgVMwBT9gAn7GJ1iDb/EhdheUfzKl3QOoquo/A/djB6oWYyvW4Su8iqtwFoYyrZ0B7JnvFgCTsXAUgFbjO7xW4C7FpExxbwAjuRaryhIzFojtWFuWqscxK1PdG8DhOB/LOrgaRsau8rkGD2I2jsPETP/YAZpzb9l8qy7HTryLezD3UN8zugEYV5aUF7Gh3AF1i7EGr+MOnFfusgLQBmAkR+MafN4DwMjYhpVYjBsxIwCdvbB3H9b3AaLCxoLxNBYEYOw5AQ+V03I/ILbjN3yEO8uJPABtMrlsrC+U29CdfYAYuYvajJcwJwDtc2Q5iL2xj5N0L2MlbkUjAO2zoMvzw1jGDjyH0wPQPnPx1oAgKnyMywPQPvPKGeKXAUH8igdwVABap6Eub1+ERfh+gFfFklL6CMAomYaL8TxWd1Ds63Qsx9UBGD2Tymb9TIH4c0AQa9Xl9eMDMHrOxROlTrR9QBCb8CzODsDoObX8WleXgt/uPiPsLBCLcRnGB2D0Q91NWDGgq+Fv/IQ3ceX+Xp4OBIDmzMfbA7xr+hFL1U8ATwrA6JmBJ/HXgCA24p0CceIgl6cDFaA5t/SxAtuq1LGsQEwZRO3pYABoLnUsHeDytBw3BKB9jsXDpSQxCIh16qd2jQC0zxX4YEAQX+I2dYdHANpkJp5St1U2P+TpdWzF+7hOl90dhwrASMbherxXJm+4TxAbSuFvPo7oZHk61ACaMxuPqZ+ubepTIfB3dal9ZgDGnqnqxuKXC8bmPl0Vj+LkAHSWWbi9LCdf672Z4LNSRpkegM4yHRfiLvVj1C09QGxWt++fGYDuNu0hdYl8IT7tseh3t7qjMABdZEKpCZ1TNu9VpWa0rcPSxhKcEYD+5BI8Ukogqzs8xM0PQP8yhAtwM15Rd3wM4499IKzHgub5bvWSXqa2s4xXv8wyXt1uP0/9ZO80dUvlcLk7mlTOHV9UVbWnayMAgztnTMUx6jdOZ5SC4S6sr6pqUcsdOUtQ39P8ax5pGpu4zyUo2b/JvyoIQACSAAQgCUAAkgAEIAlAAJIABCAJQACSAAQgCUAAkgAEIAlAAJIABCAJwMGVfwFk+B+8bph6jgAAAABJRU5ErkJggg=="
);

// 初始化 IndexedDB
function initDB() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(dbName, 1);

        request.onupgradeneeded = function (event) {
            db = event.target.result;
            if (!db.objectStoreNames.contains(storeName)) {
                db.createObjectStore(storeName, { keyPath: "key" });
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
        const transaction = db.transaction([storeName], "readwrite");
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
        const transaction = db.transaction([storeName], "readonly");
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

function countGlyphFromDB() {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([storeName], "readonly");
        const store = transaction.objectStore(storeName);
        const cursorRequest = store.openCursor();

        let count = 0;
        cursorRequest.onsuccess = function (event) {
            const cursor = event.target.result;
            if (cursor) {
                if (cursor.key.startsWith("g_")) count++;
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
        const transaction = db.transaction([storeName], "readwrite");
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
        const transaction = db.transaction([storeName], "readwrite");
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

// 讀取設定
async function loadSettings() {
    const settings = {
        notNewFlag: (await loadFromDB("notNewFlag", "N")) == "Y", // 是否為舊檔案，預設為 N
        scaleRate: (await loadFromDB("scaleRate", 100)) * 1, // 縮放比例，預設為 100%
        smallMode: (await loadFromDB("smallMode", "N")) == "Y", // 是否小字模式，預設為 N
        lineWidth: (await loadFromDB("lineWidth", 12)) * 1, // 筆寬，預設為 12
        brushType: (await loadFromDB("brushType", 0)) * 1, // 筆刷類型，預設為 0
        pressureMode: (await loadFromDB("pressureMode", "N")) == "Y", // 筆壓模式，預設為 N
        pressureEffect: await loadFromDB("pressureEffect", "none"), // 筆壓公式，預設為 none
        gridType: await loadFromDB("gridType", "3x3grid"), // 格線類型，預設為 3x3grid
        oldPressureMode: (await loadFromDB("oldPressureMode", "N")) == "Y", // 啟用舊版筆壓模式，預設為 N
        fontNameEng: (await loadFromDB("fontNameEng")) || "MyFreehandFont",
        fontNameCJK: (await loadFromDB("fontNameCJK")) || fdrawer.fontNameCJK,
        noFixedWidthFlag: (await loadFromDB("noFixedWidthFlag", "N")) == "Y", // 比例寬輸出，預設為 N
        saveAsTester: (await loadFromDB("saveAsTester", "Y")) == "Y", // 是否為測試輸出，預設為 Y
        testSerialNo: (await loadFromDB("testSerialNo", 1)) * 1, // 測試輸出序號，預設為 1
        customGlyphs: await loadFromDB("customGlyphs"), // 自定義文字
    };

    if (settings.customGlyphs && settings.customGlyphs != "") {
        // 如果有自定義文字，則添加到列表中
        var cglist = settings.customGlyphs.split(/,/);
        glyphList[fdrawer.customList] = [];
        for (var i = 0; i < cglist.length; i++) {
            glyphList[fdrawer.customList].push(cglist[i]);
            var uni = parseInt(cglist[i].replace(/^u(ni)?/g, ""), 16);
            glyphMap[cglist[i]] = { c: String.fromCodePoint(uni), w: "F" }; // 將自定義文字添加到映射中
        }
    }

    console.log("Settings loaded:", settings);

    return settings;
}

async function updateSetting(key, value) {
    if (settings == null) settings = await loadSettings();
    if (typeof value != "undefined") settings[key] = value;
    if (typeof settings[key] == "boolean") {
        //console.log(`Updating setting ${key} to ${settings[key] ? 'Y' : 'N'}`);
        await saveToDB(key, settings[key] ? "Y" : "N"); // 將布林值轉換為 'Y' 或 'N'
    } else {
        //console.log(`Updating setting ${key} to ${settings[key]}`);
        await saveToDB(key, settings[key]);
    }
}

// 初始化
async function initCanvas(canvas) {
    canvas.addEventListener("touchstart", e => e.preventDefault(), {
        passive: false,
    });
    canvas.addEventListener("touchmove", e => e.preventDefault(), {
        passive: false,
    });

    var scale = parseInt(settings.scaleRate, 10) / 100; // 轉換為小數

    // 繪製底圖
    const gridCanvas = document.getElementById("gridCanvas");
    const gridCtx = gridCanvas.getContext("2d");
    gridCtx.clearRect(0, 0, gridCanvas.width, gridCanvas.height);

    const emWidth = gridCanvas.width / scale; // 字身框寬度
    const emHeight = gridCanvas.height / scale; // 字身框高度
    const gridXOff = (gridCanvas.width - emWidth) / 2; // X 軸偏移量
    const gridYOff = (gridCanvas.height - emHeight) / 2; // X 軸偏移量

    //const gridWidth = Math.round(gridCanvas.width / scale / 3);		// 每格寬度
    //const gridHeight = Math.round(gridCanvas.height / scale / 3);	// 每格高度

    gridCtx.strokeStyle = "#cccccc";
    gridCtx.lineWidth = 1;

    // 繪製格線
    let lines = 1;

    // 字身框
    gridCtx.beginPath();
    gridCtx.rect(gridXOff, gridYOff, emWidth, emHeight);
    gridCtx.stroke();

    if (settings.gridType == "3x3grid") lines = 3;
    else if (settings.gridType == "3x3grid-new") lines = 4;
    else if (settings.gridType == "2x2grid") lines = 2;
    else if (settings.gridType == "stargrid") lines = 2;

    for (let i = 1; i < lines; i++) {
        if (settings.gridType == "3x3grid-new" && i == 2) continue; // 跳過新 3x3 格線的中間線

        gridCtx.beginPath();
        gridCtx.moveTo(gridXOff + (emWidth * i) / lines, gridYOff);
        gridCtx.lineTo(gridXOff + (emWidth * i) / lines, gridYOff + emHeight);
        gridCtx.stroke();

        gridCtx.beginPath();
        gridCtx.moveTo(gridXOff, gridYOff + (emHeight * i) / lines);
        gridCtx.lineTo(gridXOff + emWidth, gridYOff + (emHeight * i) / lines);
        gridCtx.stroke();
    }

    if (settings.gridType == "stargrid") {
        gridCtx.beginPath();
        gridCtx.moveTo(gridXOff, gridYOff);
        gridCtx.lineTo(gridXOff + emWidth, gridYOff + emHeight);
        gridCtx.stroke();
        gridCtx.beginPath();
        gridCtx.moveTo(gridXOff + emWidth, gridYOff);
        gridCtx.lineTo(gridXOff, gridYOff + emHeight);
        gridCtx.stroke();
    } else if (settings.gridType == "boxgrid") {
        gridCtx.beginPath();
        gridCtx.rect(gridXOff + emWidth * 0.15, gridYOff + emHeight * 0.15, emWidth * 0.7, emHeight * 0.7);
        gridCtx.stroke();
    }

    if (settings.gridType == "boxgrid" || settings.gridType == "nogrid") {
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
    gridCtx.strokeStyle = "#ee9999"; // 基線顏色
    gridCtx.beginPath();
    gridCtx.moveTo(0, gridYOff + emHeight * 0.75);
    gridCtx.lineTo(gridCanvas.width, gridYOff + emHeight * 0.75);
    gridCtx.stroke();

    // 依照設定值顯示筆寬、筆刷、筆壓UI
    $("#lineWidthSlider").val(settings.lineWidth);
    $("#lineWidthValue").text(settings.lineWidth);
    $("#brushSelector").empty().append($(brushes[settings.brushType]));
    $("#pressureButton")
        .removeClass("on off")
        .addClass(settings.pressureMode ? "on" : "off");
}

function initListSelect($listSelect) {
    $listSelect.empty(); // 清空選單
    for (var list in glyphList) {
        $listSelect.append($("<option></option>").val(list).text(list));
    }
}

async function createFont(glyphs, gidMap, verts, ccmps) {
    if (settings.saveAsTester) {
        settings.fontNameEng += settings.testSerialNo;
        settings.fontNameCJK += settings.testSerialNo;
        updateSetting("testSerialNo", settings.testSerialNo + 1); // 更新測試序號
    }

    const font = new opentype.Font({
        familyName: settings.fontNameEng,
        fullName: settings.fontNameEng,
        postScriptName: settings.fontNameEng.replace(/[^a-zA-Z0-9]/g, ""), // 去除特殊字符
        styleName: "Regular",
        designer: "zi-hi.com",
        designerURL: "https://zi-hi.com",
        manufacturer: "zi-hi.com",
        manufacturerURL: "https://zi-hi.com",

        unitsPerEm: upm,
        ascender: 880,
        descender: -120,
        glyphs: glyphs,
    });

    for (var group in font.names) {
        font.names[group].fontFamily[fdrawer.fontLang] = settings.fontNameCJK;
        font.names[group].fullName[fdrawer.fontLang] = settings.fontNameCJK;
    }

    font.tables.os2.achVendID = "ZIHI";
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
        font.substitution.addLigature("ccmp", {
            sub: subfrom,
            by: gidMap[gname_to],
        });
    }

    // verts
    for (let i in verts) {
        var gname_v = verts[i];
        var gname_h = glyphMap[gname_v].v;
        if (!gidMap[gname_v]) continue; // 如果沒有對應的 cid，則跳過
        if (!gidMap[gname_h]) continue; // 如果沒有對應的 cid，則跳過
        font.substitution.addSingle("vert", {
            sub: gidMap[gname_h],
            by: gidMap[gname_v],
        });
    }

    return font;
}

$(document).ready(async function () {
    const $listSelect = $("#listSelect");

    const $canvas = $("#drawingCanvas");
    const canvas = $canvas[0];
    const ctx = canvas.getContext("2d");
    let ratio = canvas.height / $canvas.height();
    let isDrawing = false;
    const undoStack = []; // 儲存畫布狀態的堆疊
    const $naviContainer = $("#navi-container");
    const $progressContainer = $("#progress-container");
    const $progressBar = $("#progress-bar");
    const $progressText = $("#progress-text");

    // 初始化 IndexedDB
    initDB()
        .then(async () => {
            console.log("IndexedDB 起動完成");
            settings = await loadSettings();
            initListSelect($listSelect);
            initCanvas(canvas); // 初始化九宮格底圖
            $("#canvas-container").toggleClass("smallmode", settings.smallMode);

            $listSelect.change(); // 觸發一次 change 事件以載入第一個列表

            // 初始化筆壓繪圖狀態
            await updatePressureDrawingStatus();

            if (!settings.notNewFlag) {
                $("#settingButton").click();
            } else {
                if ($("#ads-container")) $("#ads-container").show();
            }
            $("#spanDoneCount").text(await countGlyphFromDB());

            // 如果 URL 參數中有 export=true，則自動開始匯出
            const urlParams = new URLSearchParams(window.location.search);
            if (urlParams.get("export") === "true") await sendRightNOW();
        })
        .catch(error => {
            console.error("IndexedDB 起動失敗", error);
        });

    // (舊筆壓模式) 初始化 PressureDrawing 實例
    const pressureDrawing = new PressureDrawing();
    //let pressureDrawingEnabled = false;
    let pressureDrawingSettings = {
        thinning: 0.5,
        smoothing: 0.4,
        streamline: 0.4,
    };

    // (舊筆壓模式) 更新筆壓繪圖狀態
    async function updatePressureDrawingStatus() {
        const moduleInitialized = await pressureDrawing.initialize();

        // 預設關閉筆壓繪圖
        settings.oldPressureMode = settings.oldPressureMode && moduleInitialized;
        $("#brushSelector").toggle(!settings.oldPressureMode); // 如果舊筆壓繪圖啟用，則隱藏筆刷選擇器
        $("#pressureButton").toggle(!settings.oldPressureMode); // 如果舊筆壓繪圖啟用，則隱藏筆壓開關
    }

    let nowList = null;
    let nowGlyphIndex = null;
    let nowGlyph = null;

    // 切換列表
    $listSelect.on("change", function () {
        const selectedValue = $(this).val();
        if (selectedValue) {
            nowList = glyphList[selectedValue];
            nowGlyphIndex = 0; // 重置當前字形索引
            setGlyph(0);
        }
    }); //.change(); // 觸發一次 change 事件以載入第一個列表

    // 設定編輯中的字符
    function setGlyph(index) {
        if (!nowList) return;
        if (index < 0) index = nowList.length - 1; // 如果索引小於0，則設為最後一個字符
        if (index >= nowList.length) index = 0; // 如果索引大於字符數量，則設為第一個字符
        nowGlyphIndex = index;
        nowGlyph = nowList[index]; // 取得當前字符的名稱

        $("#glyphName").text(nowGlyph); // 更新顯示的字符
        $("#charSeq").text(glyphMap[nowGlyph].c).removeClass("vert");
        if (glyphMap[nowGlyph].v && nowGlyph.indexOf(".vert") > 0) $("#charSeq").addClass("vert");

        $("#glyphNote").text(glyphMap[nowGlyph].n || "");

        // 載入之前的畫布內容
        undoStack.length = 0; // 清空復原堆疊
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        loadCanvasData(nowGlyph);

        // 重置筆壓檢測狀態
        if (settings.oldPressureMode) {
            pressureDrawing.resetPressureDetection();
        }
    }

    var svgTimers = {}; // 用於控制 SVG 儲存的定時器

    async function saveSVG(glyph, pngData) {
        const svgData = await toSVG(glyph, pngData);

        if (svgData && svgData != "") {
            await saveToDB("s_" + glyph, svgData);
        } else {
            // 轉外框後才發現是空白的話，連同png一起清掉
            await deleteFromDB("g_" + glyph);
            await deleteFromDB("s_" + glyph);
        }

        $("#spanDoneCount").text(await countGlyphFromDB());
    }

    // 儲存畫布的功能
    async function saveToLocalDB(runNow = false) {
        let saveGlyph = nowGlyph; // 嘗試解決非同步操作導致的 Race Condition
        const pngData = canvas.toDataURL();
        await saveToDB("g_" + saveGlyph, pngData);

        if (svgTimers[saveGlyph]) clearTimeout(svgTimers[saveGlyph]); // 清除之前的定時器

        if (runNow) {
            // 如果立即儲存
            await saveSVG(saveGlyph, pngData); // 儲存 SVG
        } else {
            // 延遲儲存
            svgTimers[saveGlyph] = setTimeout(async function () {
                // 延遲轉外框
                saveSVG(saveGlyph, pngData); // 儲存 SVG
            }, 1200);
        }
    }

    // 修改讀取畫布的功能
    async function loadCanvasData(glyph) {
        const savedCanvas = await loadFromDB("g_" + glyph);
        if (savedCanvas) {
            const img = new Image();
            img.src = savedCanvas;
            img.onload = function () {
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                ctx.drawImage(img, 0, 0);
            };
        }
    }

    $("#prevButton").on("click", function () {
        setGlyph(nowGlyphIndex - 1);
    }); // 切換到上一個字符
    $("#nextButton").on("click", function () {
        setGlyph(nowGlyphIndex + 1);
    }); // 切換到下一個字符

    $("#findButton").on("click", function () {
        var char = prompt(fdrawer.findMsg);
        if (!char) return; // 如果沒有輸入字符，則不進行任何操作
        char = char.trim(); // 去除前後空白
        if (char.length === 0) return;

        var breakFlag = false;
        for (let i in glyphList) {
            for (let j in glyphList[i]) {
                if (glyphMap[glyphList[i][j]].c == char) {
                    nowList = glyphList[i];
                    $listSelect.val(i); // 更新下拉選單的值
                    setGlyph(j * 1);
                    breakFlag = true;
                    break;
                }
            }
            if (breakFlag) break;
        }

        // 找不到的話詢問要不要新增這個字
        if (!breakFlag) {
            if (char.length == (char.codePointAt(0) < 65536 ? 1 : 2)) {
                if (confirm(fdrawer.notFound + "\n" + fdrawer.confirmAdd)) {
                    var uni = char.codePointAt(0).toString(16).toUpperCase();
                    var gn = uni.length <= 4 ? "uni" + uni.padStart(4, "0") : "u" + uni; // 生成 Unicode 名稱
                    var chr = String.fromCodePoint(char.codePointAt(0));

                    if (!glyphList[fdrawer.customList]) {
                        glyphList[fdrawer.customList] = [];
                        initListSelect($listSelect); // 重新初始化下拉選單
                    }
                    glyphList[fdrawer.customList].push(gn); // 將新字符添加到自定義列表
                    glyphMap[gn] = { c: chr, w: "F" }; // 將自定義文字添加到映射中
                    updateSetting("customGlyphs", glyphList[fdrawer.customList].join(",")); // 儲存自定義字符

                    nowList = glyphList[fdrawer.customList];
                    $listSelect.val(fdrawer.customList); // 更新下拉選單的值
                    setGlyph(glyphList[fdrawer.customList].length - 1);
                }
            } else {
                alert(fdrawer.notFound);
            }
        }
    });

    // 更新筆寬
    $("#lineWidthSlider").on("input", function () {
        settings.lineWidth = parseInt($(this).val(), 10);
        $("#lineWidthValue").text(settings.lineWidth);
        updateSetting("lineWidth"); // 儲存筆寬到 Local Storage
    });

    // 切換筆刷
    $("#brushSelector").on("click", function () {
        settings.brushType++;
        if (settings.brushType >= brushes.length) settings.brushType = 0;

        updateSetting("brushType"); // 儲存筆刷類型
        $("#brushSelector").empty().append($(brushes[settings.brushType]));
    });

    // 切換筆壓
    $("#pressureButton").on("click", function () {
        settings.pressureMode = !settings.pressureMode;
        updateSetting("pressureMode");
        $("#pressureButton")
            .removeClass("on off")
            .addClass(settings.pressureMode ? "on" : "off");
    });

    // 切換畫筆與橡皮擦模式
    $("#penButton").on("click", function () {
        $("#penButton").addClass("use");
        $("#eraserButton").removeClass("use");
        eraseMode = false;
    });
    $("#eraserButton").on("click", function () {
        $("#eraserButton").addClass("use");
        $("#penButton").removeClass("use");
        eraseMode = true; // 切換到橡皮擦模式
    });

    let hasPointerEvent = false; // 這個筆畫是否有pointer事件
    let hasRealPressure = false; // 這個筆畫是否曾經有疑似真實的筆壓值
    let simulatePressure = false; // 模擬筆壓開關
    let lastPressure = 0.5; // 上一次的筆壓值

    function getPressureValue(mode, event, x, y) {
        if (!settings.pressureMode) return 0.5;

        let eventType = event.type;
        if (mode == "move" && hasPointerEvent && !eventType.includes("pointer")) return null; // 如果曾經有pointer事件，則只接受pointer事件

        let toolType = event.originalEvent.pointerType;
        let pressure = event.originalEvent.pressure;
        let touchForce = event.originalEvent.touches && event.originalEvent.touches.length > 0 ? event.originalEvent.touches[0].force : null;
        let webkitForce = event.originalEvent.webkitForce !== undefined ? event.originalEvent.webkitForce : null;

        if (mode == "start") {
            if (events.length > 1000) events.splice(0, events.length - 200);
            if (eventType.includes("pointer")) hasPointerEvent = true; // 這個筆畫有pointer事件
        } else if (mode == "end") {
            simulatePressure = false;
            hasTouchEvent = false;
            hasRealPressure = false;
            hasPointerEvent = false;
        }

        events.push(`${mode} - ${eventType} / ${toolType} / P:${pressure} / T:${touchForce} / W:${webkitForce}`); // 儲存事件資訊
        //console.log(`${eventType} / ${toolType} / P:${pressure} / T:${touchForce} / W:${webkitForce}`); // 儲存事件資訊

        let isRealPressure = typeof pressure != "undefined";
        if (isRealPressure && toolType != "pen" && pressure == 0) isRealPressure = false;
        if (isRealPressure && toolType != "pen" && !hasRealPressure && (pressure == 1 || pressure == 0.5)) isRealPressure = false;
        if (toolType == "pen" && pressure < 0.01) return null;
        if (mode != "start" && !simulatePressure && !isRealPressure) return null;

        if (isRealPressure) {
            simulatePressure = false; // 如果移動中發現有真實筆壓值，則關閉模擬筆壓
            if (pressure > 0 && pressure < 1 && pressure != 0.5) hasRealPressure = true; // 出現過看似真實的筆壓值

            // 真實筆壓值套用敏感度運算
            if (settings.pressureEffect == "contrast") pressure = 0.5 + Math.sin((pressure * 0.9 - 0.45) * Math.PI) / 2;
            if (settings.pressureEffect == "enhance") pressure = Math.sin((pressure * Math.PI) / 2);
            if (settings.pressureEffect == "enhancex") pressure = Math.sin((Math.sin((pressure * Math.PI) / 2) * Math.PI) / 2);

            if (mode != "start") pressure = (lastPressure + pressure) / 2;
            return (lastPressure = pressure);
        } else if (mode == "start") {
            simulatePressure = true; // 如果開始繪製時沒有真實筆壓值，則開啟模擬筆壓
            return 0.5;
        } else {
            //if (simulatePressure && lastX && lastY) {
            let distance = Math.sqrt(Math.pow(x - lastX, 2) + Math.pow(y - lastY, 2));
            let speedFactor = Math.min(1, 5 / Math.max(distance, 1));
            pressure = (lastPressure * 3 + speedFactor * 0.65 + 0.05) / 4;
            return (lastPressure = pressure);
        }
    }

    // 儲存背景用於筆壓繪圖的即時預覽
    let backgroundImageData = null;
    let lastX,
        lastY,
        lastLW,
        isMoved = false;
    var eraseMode = false;

    function drawBrush(ctx, brush, x, y, lw) {
        if (userAgent.includes("macintosh") && userAgent.includes("safari") && !userAgent.includes("chrome")) {
            // 在 Mac Safari 上使用臨時 canvas 繪製，避免直接繪圖造成污垢
            // 不知道為什麼我的Mac-Safari直接繪圖會很髒，只好建立一個臨時的畫筆 canvas
            // 但這會造成Android上很慢，所以只在Mac-Safari上使用
            const brushCanvas = document.createElement("canvas");
            brushCanvas.width = lw;
            brushCanvas.height = lw;
            const brushCtx = brushCanvas.getContext("2d");
            brushCtx.drawImage(brush, 0, 0, lw, lw);

            ctx.drawImage(brushCanvas, x - lw / 2, y - lw / 2);
        } else {
            // 其他瀏覽器直接繪製
            ctx.drawImage(brush, x - lw / 2, y - lw / 2, lw + 1, lw + 1);
        }
    }

    // 開始繪製
    $canvas.on("mousedown touchstart pointerdown", function (event) {
        if (event.touches && event.touches.length === 2) {
            if (isDrawing) $("#undoButton").trigger("click"); // 先撤銷掉目前的筆劃
            isDrawing = false;
            return;
        }

        if (isDrawing && !event.type.includes("pointer")) return;

        const { x, y } = getCanvasCoordinates(event);
        var pressureVal = getPressureValue("start", event, x, y);
        ratio = canvas.height / $canvas.height(); // 筆畫開始時重新確認一次螢幕縮放比（因為有可能調過視窗大小等）

        var png = canvas.toDataURL();
        if (!isDrawing && png != undoStack[undoStack.length - 1]) undoStack.push(png); // 儲存當前畫布狀態到 undoStack
        isDrawing = true; // 儲存畫布後正式宣告筆畫開始
        if (svgTimers[nowGlyph]) clearTimeout(svgTimers[nowGlyph]); // 停止SVG轉外框 (提高效能)

        if (settings.oldPressureMode) {
            // 舊筆壓模式
            const pressure = pressureDrawing.simulatePressure(event.originalEvent, "start");
            pressureDrawing.startStroke(x * ratio, y * ratio, pressure);
            backgroundImageData = ctx.getImageData(0, 0, canvas.width, canvas.height); // 儲存背景圖像用於即時預覽

            // 防止預設的觸控行為（如滾動）
            event.preventDefault();
        } else {
            // 筆刷模式
            var lw = settings.lineWidth * pressureVal * 2; // 計算線寬
            ctx.globalCompositeOperation = eraseMode ? "destination-out" : "source-over"; // 如果是橡皮擦模式，則使用 destination-out，否則使用 source-over
            //if (event.type.includes('pointer'))
            //drawBrush(ctx, brushes[settings.brushType], x*ratio, y*ratio, lw);

            lastX = x; // 儲存最後的 X 座標
            lastY = y; // 儲存最後的 Y 座標
            lastLW = lw;
            isMoved = false;
        }
    });

    // 繪製中
    $canvas.on("mousemove touchmove pointermove", function (event) {
        if (!isDrawing) return;
        const { x, y } = getCanvasCoordinates(event);
        var pressureVal = getPressureValue("move", event, x, y);
        if (settings.pressureMode && pressureVal == null) return; // 筆壓模式必須要有筆壓值

        if (settings.oldPressureMode) {
            // 舊筆壓模式
            // 使用筆壓繪圖系統：收集點並提供即時預覽
            const pressure = pressureDrawing.simulatePressure(event.originalEvent, "move");
            pressureDrawing.addPoint(x * ratio, y * ratio, pressure);

            // 生成即時預覽筆跡
            pressureDrawingSettings.size = settings.lineWidth * pressureDelta;
            const previewStroke = pressureDrawing.createPreviewStroke(pressureDrawingSettings);
            if (previewStroke && backgroundImageData) {
                ctx.putImageData(backgroundImageData, 0, 0); // 恢復背景圖像
                pressureDrawing.drawStrokeOnCanvas(ctx, previewStroke, eraseMode); // 繪製預覽筆跡
            }

            // 防止預設的觸控行為
            event.preventDefault();
        } else {
            ctx.globalCompositeOperation = eraseMode ? "destination-out" : "source-over"; // 如果是橡皮擦模式，則使用 destination-out，否則使用 source-over

            var lw = settings.lineWidth * pressureVal * 2;

            var d = Math.max(Math.abs(lastX - x), Math.abs(lastY - y)) * 1.5;
            if (d > 40) events.push(`Long-DrawImage / ${pressureVal} / ${event.originalEvent.pointerType} / ${x}, ${y}, ${lw} (${lastX}, ${lastY}, ${lastLW}) ${d}`); // 儲存事件資訊
            if (d > 0) {
                for (var t = d; t > 0; t--) {
                    var tx = (lastX + ((x - lastX) * t) / d) * ratio;
                    var ty = (lastY + ((y - lastY) * t) / d) * ratio;
                    var tlw = lastLW + ((lw - lastLW) * t) / d; // 線寬漸變

                    drawBrush(ctx, brushes[settings.brushType], tx, ty, tlw);
                }
                events.push(`Move-DrawImage / ${pressureVal} / ${event.originalEvent.pointerType} / ${x}, ${y}, ${lw} (${lastX}, ${lastY}, ${lastLW}) ${d}`); // 儲存事件資訊
            }

            lastX = x; // 更新最後的 X 座標
            lastY = y; // 更新最後的 Y 座標
            lastLW = lw; // 更新最後的筆寬
            isMoved = true;
        }
    });

    // 停止繪製
    $canvas.on("mouseup mouseleave touchend pointerup pointerleave", function (event) {
        if (!isDrawing) return;
        isDrawing = false;
        const { x, y } = getCanvasCoordinates(event);
        getPressureValue("end", event, x, y);

        if (settings.oldPressureMode) {
            // 舊筆壓模式
            // 使用筆壓繪圖系統：生成最終筆跡並繪製
            pressureDrawingSettings.size = settings.lineWidth * pressureDelta;
            const finalStroke = pressureDrawing.finishStroke(pressureDrawingSettings);
            if (finalStroke && finalStroke.length > 0) {
                if (backgroundImageData) ctx.putImageData(backgroundImageData, 0, 0); // 恢復背景圖像（如果有的話）
                pressureDrawing.drawStrokeOnCanvas(ctx, finalStroke, eraseMode); // 繪製最終筆跡
            }

            // 清除背景圖像數據
            backgroundImageData = null;
        } else {
            if (!isMoved) {
                ctx.globalCompositeOperation = eraseMode ? "destination-out" : "source-over"; // 如果是橡皮擦模式，則使用 destination-out，否則使用 source-over
                drawBrush(ctx, brushes[settings.brushType], lastX * ratio, lastY * ratio, lastLW);
            }

            lastX = null;
            lastY = null;
            lastLW = null;
            isMoved = false; // 重置移動狀態
        }

        ctx.globalCompositeOperation = "source-over"; // 恢復正常繪圖模式(重要)

        saveToLocalDB(); // 停止繪製時儲存畫布內容到 Local Storage
    });

    // 復原功能
    $("#undoButton").on("click", function () {
        if (undoStack.length > 0) {
            const lastState = undoStack.pop();
            const img = new Image();
            img.src = lastState;
            img.onload = function () {
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                ctx.drawImage(img, 0, 0);
                saveToLocalDB(); // 復原後更新 Local Storage
            };
        }
    });

    // 雙指復原
    let undoTouchTime = null;
    $(document)
        .on("touchstart", function (event) {
            if (event.touches.length === 2) {
                undoTouchTime = new Date().getTime(); // 記錄雙指觸控的時間
            }
        })
        .on("touchend", function (event) {
            if (undoTouchTime && new Date().getTime() - undoTouchTime < 250) {
                // 如果雙指觸控時間夠短
                $("#undoButton").trigger("click");
                undoTouchTime = null;
            }
        });

    // 清除畫布的功能
    $("#clearButton").on("click", async function () {
        const savedCanvas = await loadFromDB("g_" + nowGlyph);
        if (!savedCanvas) return; // 如果沒有儲存的畫布，則不進行任何操作
        undoStack.push(canvas.toDataURL()); // 儲存當前畫布狀態到 undoStack
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        //undoStack.length = 0; // 清空復原堆疊
        await deleteFromDB("g_" + nowGlyph); // 清除 IndexedDB 中的資料
        await deleteFromDB("s_" + nowGlyph); // 清除 IndexedDB 中的資料
    });

    async function moveGlyph(xoff, yoff) {
        const savedCanvas = await loadFromDB("g_" + nowGlyph);
        if (!savedCanvas) return; // 如果沒有儲存的畫布，則不進行任何操作
        undoStack.push(canvas.toDataURL()); // 儲存當前畫布狀態到 undoStack

        const img = new Image();
        img.src = savedCanvas;
        img.onload = function () {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(img, xoff, yoff);
            saveToLocalDB(); // 更新 Local Storage
        };
    }

    $("#moveLeftButton").on("click", function () {
        moveGlyph(-10, 0);
    }); // 向左移動 10px
    $("#moveRightButton").on("click", function () {
        moveGlyph(10, 0);
    }); // 向右移動 10px
    $("#moveUpButton").on("click", function () {
        moveGlyph(0, -10);
    }); // 向上移動 10px
    $("#moveDownButton").on("click", function () {
        moveGlyph(0, 10);
    }); // 向下移動 10px

    // 支援鍵盤方向鍵操作
    $(document).on("keydown", function (event) {
        switch (event.key) {
            case "ArrowLeft": // 左方向鍵
                moveGlyph(-10, 0);
                break;
            case "ArrowRight": // 右方向鍵
                moveGlyph(10, 0);
                break;
            case "ArrowUp": // 上方向鍵
                moveGlyph(0, -10);
                break;
            case "ArrowDown": // 下方向鍵
                moveGlyph(0, 10);
                break;
            case "z": // Z 鍵 - 復原
                $("#undoButton").trigger("click");
                break;
            case "v": // V 鍵 - 畫筆
                $("#penButton").trigger("click");
                break;
            case "c": // V 鍵 - 橡皮擦
                $("#eraserButton").trigger("click");
                break;
            case "x": // X 鍵 - 清除
                $("#clearButton").trigger("click");
                break;
            case "b": // B 鍵 - 切換筆刷
                $("#brushSelector").trigger("click");
                break;
            case "n": // N 鍵 - 切換筆壓
                $("#pressureButton").trigger("click");
                break;
            case "PageDown": // PageDown 鍵 - 下一步
            case "]": // "]" 鍵 - 下一步
                $("#nextButton").trigger("click");
                break;
            case "PageUp": // PageUp 鍵 - 上一步
            case "[": // "]" 鍵 - 下一步
                $("#prevButton").trigger("click");
                break;
            case "Enter": // Enter 鍵 - 下一步 / 同時按shift - 上一步
            case " ": // Space 鍵 - 下一步 / 同時按shift - 上一步
                $(event.shiftKey ? "#prevButton" : "#nextButton").trigger("click");
                break;
        }
    });

    // 更新進度條
    function updateProgress(current, total) {
        const percentage = Math.round((current / total) * 100);
        $progressBar.val(percentage);
        $progressText.text(`${percentage}%`);
    }

    async function toSVG(gname, savedCanvas) {
        // 建立一個臨時的 canvas
        const tempCanvas = document.createElement("canvas");
        const tempCtx = tempCanvas.getContext("2d");
        tempCanvas.width = 500;
        tempCanvas.height = 500;

        tempCtx.fillStyle = "white";
        tempCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);
        const img = new Image();
        img.src = savedCanvas;
        return new Promise(resolve => {
            img.onload = function () {
                tempCtx.drawImage(img, 0, 0);

                // 使用 potrace.js 將臨時 canvas 轉換為 SVG
                Potrace.loadImageFromUrl(tempCanvas.toDataURL("image/png"));
                Potrace.setParameter({
                    turdSize: 100, // 減少雜訊
                    opttolerance: 0.5, // 調整優化容差
                });
                Potrace.process(function () {
                    var svgData = Potrace.getSVG(2); // 取得 SVG 資料
                    svgData = svgData.replace(/^.+path d="/, "").replace(/".+$/, "");
                    resolve(svgData);
                });
            };
        });
    }

    async function loadSVG(gname) {
        var savedSvg = await loadFromDB("s_" + gname);
        if (savedSvg) return savedSvg; // 如果已經存在 SVG，則直接返回

        var savedCanvas = await loadFromDB("g_" + gname);
        if (!savedCanvas) return null;
        var svgData = toSVG(gname, savedCanvas); // 如果不存在 SVG，則儲存並返回新的 SVG
        await saveToDB("s_" + gname, svgData);
        return svgData;
    }

    function createGlyph(unicode, gname, adw, path) {
        var glyphObj = {
            name: gname,
            advanceWidth: adw,
            path: path || new opentype.Path(),
        };
        if (unicode) glyphObj.unicode = unicode;
        return new opentype.Glyph(glyphObj);
    }

    function padPath(path, pad) {
        var boundingBox = path.getBoundingBox();
        var width = Math.round(boundingBox.x2 - boundingBox.x1);
        var xoff = pad - Math.round(boundingBox.x1); // 單純指定邊界寬度

        path.commands.forEach(c => {
            c.x = c.x + xoff;
            if (c.x1) c.x1 = c.x1 + xoff;
            if (c.x2) c.x2 = c.x2 + xoff;
        });
        return width + pad * 2; // 返回調整後的寬度
    }

    $("#saveAsTester").on("click", async function () {
        updateSetting("saveAsTester", this.checked); // 儲存是否為測試儲存
    });

    async function loadWriting() {
        // 顯示進度條
        $naviContainer.hide();
        $progressContainer.show();
        $progressBar.val(0);
        $progressText.text("0%");

        const glyphs = [
            // 建立字符陣列，並加入一些空格字符（因程式機制上無法畫出空白字符，只能自動產生）
            createGlyph(null, ".notdef", 600), // notdef
            createGlyph(0x20, "space", 300), // 空格
            createGlyph(0xa0, "uni00A0", 300), // No-break Space
            createGlyph(0x2c9, "macron", 600), // 一聲
            createGlyph(0x3000, "uni3000", upm), // Ideographic Space
            createGlyph(0x2002, "uni2002", upm / 2), // En Space
            createGlyph(0x2003, "uni2003", upm), // Em Space
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
                let path = await opentype.Path.fromSVG(svgData, {
                    flipYBase: 0,
                    scale: scale,
                    y: 880 - scaleoff,
                    x: scaleoff,
                });

                let adw = upm;
                if (glyphMap[gname].w == "P" || glyphMap[gname].w == "H") {
                    // 比例寬自動調整
                    adw = padPath(path, 50);
                } else if (settings.noFixedWidthFlag) {
                    adw = padPath(path, 100);
                }

                let unicode = null;
                if (gname.match(/^uni([0-9A-F]{4})$/i)) {
                    unicode = parseInt(RegExp.$1, 16); // 轉換為 Unicode 編碼
                } else if (gname.match(/^u([0-9A-F]{5})$/i)) {
                    unicode = parseInt(RegExp.$1, 16); // 轉換為 Unicode 編碼
                } else if (gname.indexOf(".vert") < 0 && glyphMap[gname].c.length == 1) {
                    unicode = glyphMap[gname].c.charCodeAt(0); // 使用字符的 Unicode 編碼
                }
                let glyph = createGlyph(unicode, gname, adw, path);
                glyphs.push(glyph);
                gidMap[gname] = glyphs.length - 1;

                // 自動製作全形字符
                if (glyphMap[gname].f) {
                    let gnameF = glyphMap[gname].f;
                    let pathF = await opentype.Path.fromSVG(svgData, {
                        flipYBase: 0,
                        scale: scale,
                        y: 880 - scaleoff,
                        x: scaleoff,
                    });
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
			if (gidMap[glyphF.name]) continue; 	// 如果使用者已經自行繪製全形字符，則跳過
            glyphs.push(glyphF);
            gidMap[glyphF.name] = glyphs.length - 1;
        }
        const font = await createFont(glyphs, gidMap, verts, ccmps);
        return font;
    }
    // 儲存字型檔
    $("#downloadFontButton").on("click", async function () {
        const font = await loadWriting();
        // 建立下載連結
        const link = document.createElement("a");
        link.download = font.names.windows.postScriptName.en + ".otf"; //'drawing.otf';
        link.href = window.URL.createObjectURL(new Blob([font.toArrayBuffer()]), {
            type: "font/opentype",
        });
        link.click();
        // 隱藏進度條
        $naviContainer.show();
        $progressContainer.hide();
    });

    const sendRightNOW = async () => {
        const font = await loadWriting();
        const buffer = font.toArrayBuffer();
        const host = "https://justwritenow.zeabur.app"; //"http://localhost:8080";
        const popup = window.open(`${host}/upload?send=But`, "_blank");
        if (!popup) {
            alert(fdrawer.exportConfirmMsg);
            return;
        } else {
            console.log("popup 建立成功");
        }
        window.addEventListener("message", event => {
            console.log("Parent received message from:", event.origin, "data:", event.data);
            if (event.origin !== host) {
                console.log("Origin mismatch, expected", host);
                return;
            }
            if (event.data === "ready") {
                console.log("Received ready signal, sending buffer to popup");

                // Convert to base64
                const uint8Array = new Uint8Array(buffer);
                const base64String = btoa(String.fromCharCode.apply(null, Array.from(uint8Array)));

                popup.postMessage(
                    {
                        bufferBase64: base64String,
                        byteLength: buffer.byteLength,
                    },
                    event.origin
                );
            }
        });
        $naviContainer.show();
        $progressContainer.hide();
    };

    $("#justwriteNOWButton").on("click", async function () {
        await sendRightNOW();
    });
  
    // 顯示設定畫面
    $("#settingButton").on("click", async function () {
        $("#settings-title").text(settings.notNewFlag ? fdrawer.settingsTitle : fdrawer.welcomeTitle);
        $("#span-welcome").toggle(!settings.notNewFlag);
        $("#div-backup").toggle(settings.notNewFlag);

        $("#settings-container").show();
        $("#fontNameEng").val(settings.fontNameEng);
        $("#fontNameCJK").val(settings.fontNameCJK);
        $("#smallModeCheck").prop("checked", settings.smallMode);
        $("#noFixedWidthFlag").prop("checked", settings.noFixedWidthFlag);
        var scale = settings.scaleRate; // 預設縮放比例為 100%
        $("#scaleRateSlider").val(scale);
        $("#scaleRateValue").text(scale + "%");

        $("#pressureEffectSelect").val(settings.pressureEffect);
        $("#pressureDrawingEnabled").prop("checked", settings.oldPressureMode);
        $("#gridTypeSelect").val(settings.gridType);

        if (!settings.notNewFlag) updateSetting("notNewFlag", true); // 如果是第一次使用，則設定 notNewFlag 為 true
    });

    // 關閉設定畫面
    $("#closeSettingsButton").on("click", function () {
        $("#settings-container").hide();
    });

    $("#fontNameEng").on("change", function () {
        updateSetting(
            "fontNameEng",
            $(this)
                .val()
                .replace(/[^a-zA-Z0-9 ]/g, "")
        );
    });
    $("#fontNameCJK").on("change", function () {
        updateSetting("fontNameCJK", $(this).val());
    });
    $("#smallModeCheck").on("click", async function () {
        await updateSetting("smallMode", $(this).prop("checked"));
        $("#canvas-container").toggleClass("smallmode", settings.smallMode);
    });
    $("#noFixedWidthFlag").on("click", function () {
        updateSetting("noFixedWidthFlag", $(this).prop("checked"));
    });
    $("#scaleRateSlider").on("input", function () {
        var rate = parseInt($(this).val(), 10);
        $("#scaleRateValue").text(rate + "%");
        updateSetting("scaleRate", rate);
        initCanvas(canvas);
    });
    $("#pressureEffectSelect").change(function () {
        updateSetting("pressureEffect", $(this).val());
    });
    $("#gridTypeSelect").change(function () {
        updateSetting("gridType", $(this).val());
        initCanvas(canvas);
    });

    // 筆壓繪圖設定事件監聽器
    $("#pressureDrawingEnabled").on("change", async function () {
        updateSetting("oldPressureMode", $(this).prop("checked"));
        // 立即更新筆壓繪圖狀態
        await updatePressureDrawingStatus();

        $("#brushSelector").toggle(!settings.oldPressureMode); // 如果舊筆壓繪圖啟用，則隱藏筆刷選擇器
        $("#pressureButton").toggle(!settings.oldPressureMode); // 如果舊筆壓繪圖啟用，則隱藏筆壓開關
    });

    // 顯示字表畫面
    $("#canvasListButton").on("click", async function () {
        saveToLocalDB(true); // 儲存當前畫布內容到 Local Storage

        $("#listup-container").show();
        $("#listup-body").empty(); // 清空

        // 計算 viewBox
        var scale = parseInt(settings.scaleRate, 10) / 100;
        var emSize = Math.round(upm / scale);
        var emOff = Math.round((upm - emSize) / 2);
        var viewBox = `${emOff} ${emOff} ${emSize} ${emSize}`;

        for (let i in nowList) {
            var gname = nowList[i];
            var svgData = await loadFromDB("s_" + gname);
            if (svgData) {
                // 已寫過
                $("#listup-body").append(
                    $('<svg version="1.1" viewBox="' + viewBox + '">')
                        .html('<path d="' + svgData + '" stroke="#000" fill="#000"></path>')
                        .data("index", i)
                        .on("click", function () {
                            setGlyph($(this).data("index") * 1);
                            $("#listup-container").hide();
                        })
                );
            } else {
                var cell = $("<span>")
                    .text(glyphMap[gname].c)
                    .data("index", i)
                    .on("click", function () {
                        setGlyph($(this).data("index") * 1);
                        $("#listup-container").hide();
                    });
                if (glyphMap[gname].v && gname.indexOf(".vert") > 0) cell.addClass("vert");
                $("#listup-body").append(cell);
            }
        }

        $('<p class="dummy"><p>').appendTo($("#listup-body"));
    });

    // 關閉設定畫面
    $("#closeListupButton").on("click", function () {
        $("#listup-container").hide();
    });

    // 顯示提示畫面
    $("#hintButton").on("click", function () {
        $("#hint-container").show();
        $("#version").text(version);
    });

    // 關閉提示畫面
    $("#closeHintButton").on("click", function () {
        $("#hint-container").hide();
    });

    // 顯示下載畫面
    $("#downloadButton").on("click", async function () {
        $("#download-container").show();
        $("#saveAsTester").prop("checked", settings.saveAsTester); // 設定是否為測試儲存
    });

    // 關閉下載畫面
    $("#closeDownloadButton").on("click", function () {
        $("#download-container").hide();
    });

    // 關閉廣告畫面
    $("#closeAdsButton").on("click", function () {
        $("#ads-container").hide();
    });

    // 取得滑鼠或觸控座標
    function getCanvasCoordinates(event) {
        const rect = canvas.getBoundingClientRect();
        const touch = event.type.includes("touch") ? event.originalEvent.touches[0] : event;
        return {
            x: touch.clientX - rect.left,
            y: touch.clientY - rect.top,
        };
    }

    // 匯出事件 - Debugger
    $("#exportEventsButton").on("click", async function () {
        const data = events.join("\n");
        if (data.length > 0) {
            const blob = new Blob([data], { type: "text/plain" });
            const link = document.createElement("a");
            link.download = settings.fontNameEng + "-EventLog" + new Date().toISOString() + ".txt";
            link.href = window.URL.createObjectURL(blob);
            link.click();
        } else {
            alert(fdrawer.noDataToExport);
        }
    });

    // 匯出資料
    $("#exportDataButton").on("click", async function () {
        const transaction = db.transaction([storeName], "readonly");
        const store = transaction.objectStore(storeName);
        const request = store.getAll();

        request.onsuccess = async function (event) {
            const data = event.target.result.map(item => `${item.key}\t${item.value}`).join("\n");
            if (data.length > 0) {
                const blob = new Blob([data], { type: "text/plain" });
                const link = document.createElement("a");
                link.download = settings.fontNameEng + "-" + new Date().toISOString() + ".txt";
                link.href = window.URL.createObjectURL(blob);
                link.click();
            } else {
                alert(fdrawer.noDataToExport);
            }
        };
    });

    // 匯入資料
    $("#importDataFile").on("change", async function () {
        if (confirm(fdrawer.importConfirm)) {
            const fileInput = $(this);
            const file = fileInput[0].files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = async function (e) {
                    await clearDB(); // 清除現有的 IndexedDB 資料
                    const data = e.target.result;
                    const lines = data.split("\n");
                    for (const line of lines) {
                        if (line.trim() === "") continue; // 跳過空行
                        const parts = line.split("\t");
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
            $(this).val(""); // 清除選擇的檔案
        }
    });

    // 修改清除所有資料的功能
    $("#clearAllButton").on("click", async function () {
        if (confirm(fdrawer.clearConfirm)) {
            await clearDB();
            alert(fdrawer.clearDone);
            location.reload(); // 重新載入頁面
        }
    });
});

document.addEventListener("DOMContentLoaded", function () {
    // 判斷是否在 in-app browser 中
    const userAgent = navigator.userAgent || navigator.vendor || window.opera;

    if (/FBAN|FBAV|Instagram|Line|Threads/i.test(userAgent)) {
        // 如果是 Facebook、Instagram 或 Line 的 in-app browser
        alert(fdrawer.inAppNotice);
    }

    // 解決 iOS Safari 按鈕點兩下容易不小心放大視窗的問題
    if (/iphone|ipad|ipod/.test(userAgent.toLowerCase()) && /safari/.test(userAgent.toLowerCase())) {
        document.querySelectorAll("body").forEach(function (btn) {
            btn.addEventListener(
                "dblclick",
                function (e) {
                    e.preventDefault();
                },
                { passive: false }
            );
        });
    }
});
