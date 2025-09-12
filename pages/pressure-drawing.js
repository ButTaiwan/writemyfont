/**
 * Pressure Drawing Module
 * Uses perfect-freehand library for pressure-sensitive drawing
 */

class PressureDrawing {
  constructor() {
    this.perfectFreehandModule = null;
    this.currentStroke = [];
    this.isDrawing = false;
    this.lastPoint = null;
    this.hasPressureSupport = false; // 檢測是否支援筆壓
    this.pressureCheckCount = 0; // 用於檢測筆壓支援
    this.delayedStart = false; // 是否在延遲繪製狀態
    this.startPoint = null; // 起筆點
    this.moveThreshold = 5; // 移動閾值（像素）
  }

  // Initialize the perfect-freehand module
  async initialize() {
    try {
      this.perfectFreehandModule = await import(
        "https://unpkg.com/perfect-freehand@1.2.2/dist/esm/index.mjs"
      );
      return true;
    } catch (error) {
      return false;
    }
  }

  // Start a new stroke
  startStroke(x, y, pressure = 0.5) {
    this.isDrawing = true;
    this.currentStroke = [];
    this.lastPoint = { x, y, pressure };
    this.delayedStart = true; // 進入延遲繪製狀態
    this.startPoint = { x, y, pressure };
    this.currentStroke.push([x, y, pressure]);
  }

  // Add a point to the current stroke
  addPoint(x, y, pressure = 0.5) {
    if (!this.isDrawing) return;

    // 檢查是否在延遲繪製狀態
    if (this.delayedStart && this.startPoint) {
      const dx = x - this.startPoint.x;
      const dy = y - this.startPoint.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance < this.moveThreshold) {
        // 還沒有足夠的移動，只更新起始點的壓力
        this.startPoint.pressure = Math.max(this.startPoint.pressure, pressure);
        this.currentStroke[0] = [
          this.startPoint.x,
          this.startPoint.y,
          this.startPoint.pressure,
        ];
        this.lastPoint = { x, y, pressure };
        return;
      } else {
        // 開始真正的繪製
        this.delayedStart = false;
      }
    }

    let isSimulatedPressure = false;

    // 如果沒有真實壓力支持且檢測計數足夠，才進行速度模擬
    if (
      pressure === 0.5 &&
      this.lastPoint &&
      !this.hasPressureSupport &&
      this.pressureCheckCount > 3
    ) {
      const dx = x - this.lastPoint.x;
      const dy = y - this.lastPoint.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      // Adjust pressure based on drawing speed (slower = more pressure)
      const speedFactor = Math.min(1, 10 / Math.max(distance, 1));
      pressure = 0.4 + speedFactor * 0.4; // Range from 0.4 to 0.8，範圍較小避免極端值
      isSimulatedPressure = true;
    }

    // 只對模擬的壓力值增強對比，讓效果更明顯
    if (isSimulatedPressure) {
      if (pressure < 0.5) {
        pressure = pressure * 0.9; // 低壓力稍微降低
      } else {
        pressure = 0.4 + (pressure - 0.5) * 1.1; // 高壓力稍微增加
      }
    }

    this.currentStroke.push([x, y, pressure]);
    this.lastPoint = { x, y, pressure };
  }

  // Finish the current stroke and return the path
  finishStroke(options = {}) {
    if (!this.isDrawing) {
      this.delayedStart = false;
      this.startPoint = null;
      return null;
    }

    // 如果還在延遲繪製狀態，說明沒有足夠的移動，直接生成圓形點
    if (this.delayedStart && this.startPoint) {
      this.isDrawing = false;
      this.delayedStart = false;
      const strokePoints = [
        [this.startPoint.x, this.startPoint.y, this.startPoint.pressure],
      ];
      this.startPoint = null;
      return this.generateCircularDot(strokePoints, options);
    }

    // 如果筆跡太短（只有起始點），也生成圓形點
    if (this.currentStroke.length < 2) {
      this.isDrawing = false;
      this.delayedStart = false;
      const strokePoints = [...this.currentStroke];
      this.startPoint = null;
      return this.generateCircularDot(strokePoints, options);
    }

    // 動態決定是否模擬壓力
    const shouldSimulatePressure =
      !this.hasPressureSupport && this.pressureCheckCount > 3;

    const defaultOptions = {
      size: 12,
      thinning: 0.8, // 增加壓力對粗細的影響
      smoothing: 0.5,
      streamline: 0.3, // 減少流線化，讓壓力變化更明顯
      simulatePressure: shouldSimulatePressure, // 動態決定是否模擬壓力
      easing: (t) => t,
      start: {
        taper: 0,
        easing: (t) => t,
        cap: true,
      },
      end: {
        taper: 25, // 大幅增加結尾的漸減效果
        easing: (t) => Math.sin((t * Math.PI) / 2), // 使用正弦緩動，更平滑
        cap: true, // 使用圓頭來避免尖銳結尾
      },
    };

    const finalOptions = { ...defaultOptions, ...options };

    try {
      // 複製 stroke 點，避免修改原始資料
      let strokePoints = [...this.currentStroke];

      // 壓力平滑處理
      if (strokePoints.length > 5) {
        strokePoints = this.smoothPressureValues(strokePoints);
      }

      // 檢查是否為靜止點或極短筆跡
      if (strokePoints.length <= 3) {
        this.isDrawing = false;
        this.currentStroke = [];
        this.delayedStart = false;
        this.startPoint = null;
        return this.generateCircularDot(strokePoints, finalOptions);
      }

      // 檢查筆跡是否在很小的範圍內
      const bounds = this.calculateBounds(strokePoints);
      const maxDistance = Math.max(bounds.width, bounds.height);

      if (maxDistance < 8) {
        // 如果筆跡範圍小於 8 像素
        this.isDrawing = false;
        this.currentStroke = [];
        this.delayedStart = false;
        this.startPoint = null;
        return this.generateCircularDot(strokePoints, finalOptions);
      }

      // Get stroke outline from perfect-freehand
      const outlinePoints = this.perfectFreehandModule.getStroke(
        strokePoints,
        finalOptions,
      );

      this.isDrawing = false;
      this.currentStroke = [];
      this.delayedStart = false;
      this.startPoint = null;

      return outlinePoints;
    } catch (error) {
      this.isDrawing = false;
      this.currentStroke = [];
      this.delayedStart = false;
      this.startPoint = null;
      return null;
    }
  }

  // Smooth pressure values to create natural light-heavy-light curve
  smoothPressureValues(strokePoints) {
    if (!strokePoints || strokePoints.length < 5) return strokePoints;

    const points = [...strokePoints];
    const len = points.length;

    // Step 1: 移除開始和結尾的不穩定區域
    let startIndex = 0;
    let endIndex = len;

    // 找到壓力開始穩定的位置
    for (let i = 2; i < Math.min(len - 2, 15); i++) {
      const pressureVariance = this.calculatePressureVariance(
        points,
        i - 2,
        i + 2,
      );
      if (pressureVariance < 0.15) {
        // 放寬穩定標準
        startIndex = i;
        break;
      }
    }

    // 找到壓力結束穩定的位置
    for (let i = len - 3; i >= Math.max(startIndex + 2, len - 15); i--) {
      const pressureVariance = this.calculatePressureVariance(
        points,
        i - 2,
        i + 2,
      );
      if (pressureVariance < 0.15) {
        // 放寬穩定標準
        endIndex = i + 1;
        break;
      }
    }

    // Step 2: 截取穩定區域
    const stablePoints = points.slice(startIndex, endIndex);

    if (stablePoints.length < 3) return points; // 如果穩定區域太小，返回原始數據

    // Step 3: 對穩定區域進行移動平均平滑
    const smoothedPoints = this.applyMovingAverage(stablePoints);

    // Step 4: 創建自然的起筆和收筆
    const naturalCurve = this.createNaturalPressureCurve(smoothedPoints);

    return naturalCurve;
  }

  // Calculate pressure variance in a range
  calculatePressureVariance(points, start, end) {
    if (start < 0 || end >= points.length || end - start < 2) return 999;

    const pressures = points.slice(start, end + 1).map((p) => p[2]);
    const mean = pressures.reduce((a, b) => a + b) / pressures.length;
    const variance =
      pressures.reduce((acc, p) => acc + Math.pow(p - mean, 2), 0) /
      pressures.length;

    return Math.sqrt(variance);
  }

  // Apply moving average to smooth pressure values
  applyMovingAverage(points) {
    if (points.length < 3) return points;

    const smoothed = [];
    const windowSize = 5; // 增加窗口大小，讓平滑效果更明顯

    for (let i = 0; i < points.length; i++) {
      const start = Math.max(0, i - Math.floor(windowSize / 2));
      const end = Math.min(points.length - 1, i + Math.floor(windowSize / 2));

      let sumPressure = 0;
      let count = 0;

      for (let j = start; j <= end; j++) {
        sumPressure += points[j][2];
        count++;
      }

      const avgPressure = sumPressure / count;
      smoothed.push([points[i][0], points[i][1], avgPressure]);
    }

    return smoothed;
  }

  // Create natural pressure curve with light start and end
  createNaturalPressureCurve(points) {
    if (points.length < 3) return points;

    const result = [...points];
    const len = result.length;

    // 找到壓力的峰值位置
    let maxPressure = 0;
    let maxIndex = Math.floor(len / 2);

    for (let i = 0; i < len; i++) {
      if (result[i][2] > maxPressure) {
        maxPressure = result[i][2];
        maxIndex = i;
      }
    }

    // 創建自然的壓力曲線：輕 -> 重 -> 輕
    for (let i = 0; i < len; i++) {
      let factor = 1.0;

      if (i < maxIndex) {
        // 起筆段：從 0.3 漸增到 1.0
        factor = 0.3 + 0.7 * (i / maxIndex);
      } else {
        // 收筆段：從 1.0 漸減到 0.2
        factor = 1.0 - 0.8 * ((i - maxIndex) / (len - 1 - maxIndex));
        factor = Math.max(0.2, factor);
      }

      // 應用漸變係數，但保持原始壓力的相對變化
      result[i][2] = result[i][2] * factor;
    }

    return result;
  }

  // Calculate bounds of stroke points
  calculateBounds(strokePoints) {
    if (!strokePoints || strokePoints.length === 0) {
      return { width: 0, height: 0, minX: 0, maxX: 0, minY: 0, maxY: 0 };
    }

    let minX = strokePoints[0][0];
    let maxX = strokePoints[0][0];
    let minY = strokePoints[0][1];
    let maxY = strokePoints[0][1];

    for (let i = 1; i < strokePoints.length; i++) {
      const [x, y] = strokePoints[i];
      minX = Math.min(minX, x);
      maxX = Math.max(maxX, x);
      minY = Math.min(minY, y);
      maxY = Math.max(maxY, y);
    }

    return {
      width: maxX - minX,
      height: maxY - minY,
      minX,
      maxX,
      minY,
      maxY,
    };
  }

  // Generate circular dot based on pressure
  generateCircularDot(strokePoints, options) {
    if (!strokePoints || strokePoints.length === 0) return [];

    // 計算中心點和平均壓力
    let centerX = 0;
    let centerY = 0;
    let totalPressure = 0;

    for (const point of strokePoints) {
      centerX += point[0];
      centerY += point[1];
      totalPressure += point[2];
    }

    centerX /= strokePoints.length;
    centerY /= strokePoints.length;
    const avgPressure = totalPressure / strokePoints.length;

    // 根據壓力計算半徑
    const baseRadius = (options.size || 12) * 0.6; // 增加基礎半徑
    const radius = baseRadius * (0.4 + avgPressure * 0.8); // 增加最小和最大半徑

    // 生成圓形的點
    const circlePoints = [];
    const segments = 16; // 圓形分段數

    for (let i = 0; i < segments; i++) {
      const angle = (i * 2 * Math.PI) / segments;
      const x = centerX + Math.cos(angle) * radius;
      const y = centerY + Math.sin(angle) * radius;
      circlePoints.push([x, y]);
    }

    return circlePoints;
  }

  // Convert stroke outline to SVG path
  outlineToSVGPath(outlinePoints) {
    if (!outlinePoints || outlinePoints.length < 2) return "";

    const path = outlinePoints.reduce((acc, point, index) => {
      const [x, y] = point;
      if (index === 0) {
        return `M${x},${y}`;
      }
      return `${acc}L${x},${y}`;
    }, "");

    return `${path}Z`;
  }

  // Draw stroke outline on canvas
  drawStrokeOnCanvas(ctx, outlinePoints, eraseMode = false) {
    if (!outlinePoints || outlinePoints.length < 2) return;

    ctx.save();

    // Set composite operation for erasing
    ctx.globalCompositeOperation = eraseMode
      ? "destination-out"
      : "source-over";

    // Create path from outline points
    ctx.beginPath();
    outlinePoints.forEach((point, index) => {
      const [x, y] = point;
      if (index === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });
    ctx.closePath();

    // Fill the path
    ctx.fillStyle = eraseMode ? "rgba(0,0,0,1)" : "black";
    ctx.fill();

    ctx.restore();
  }

  // Get current stroke points (for preview)
  getCurrentStrokePoints() {
    return [...this.currentStroke];
  }

  // Check if currently drawing
  getIsDrawing() {
    return this.isDrawing;
  }

  // Cancel current stroke
  cancelStroke() {
    this.isDrawing = false;
    this.currentStroke = [];
    this.lastPoint = null;
    this.delayedStart = false;
    this.startPoint = null;
  }

  // Reset pressure detection (useful when switching characters)
  resetPressureDetection() {
    this.hasPressureSupport = false;
    this.pressureCheckCount = 0;
    this.delayedStart = false;
    this.startPoint = null;
  }

  // Create a preview stroke (for real-time drawing feedback)
  createPreviewStroke(options = {}) {
    if (!this.isDrawing || this.currentStroke.length < 8) return null;

    // 在延遲繪製狀態下不生成預覽筆跡
    if (this.delayedStart) return null;

    // 動態決定是否模擬壓力
    const shouldSimulatePressure =
      !this.hasPressureSupport && this.pressureCheckCount > 3;

    const defaultOptions = {
      size: 12,
      thinning: 0.8, // 增加壓力對粗細的影響
      smoothing: 0.5,
      streamline: 0.3, // 減少流線化，讓壓力變化更明顯
      simulatePressure: shouldSimulatePressure, // 動態決定是否模擬壓力
      easing: (t) => t,
      start: {
        taper: 0,
        easing: (t) => t,
        cap: true,
      },
      end: {
        taper: 25, // 大幅增加結尾的漸減效果
        easing: (t) => Math.sin((t * Math.PI) / 2), // 使用正弦緩動，更平滑
        cap: true, // 使用圓頭來避免尖銳結尾
      },
    };

    const finalOptions = { ...defaultOptions, ...options };

    try {
      // 對預覽筆跡也應用壓力平滑
      let previewPoints = [...this.currentStroke];
      if (previewPoints.length > 5) {
        previewPoints = this.smoothPressureValues(previewPoints);
      }

      return this.perfectFreehandModule.getStroke(previewPoints, finalOptions);
    } catch (error) {
      return null;
    }
  }

  // Simulate pressure from pointer events
  simulatePressure(event, eventType = "move") {
    // 提筆事件特殊處理 - 使用較低的壓力值
    if (eventType === "end" && this.lastPoint) {
      return Math.max(0.05, this.lastPoint.pressure * 0.3); // 提筆時壓力大幅減少
    }

    // Try to get pressure from pointer event (works with Apple Pencil)
    if (
      event &&
      event.pressure !== undefined &&
      event.pressure > 0.1 &&
      event.pointerType === "pen"
    ) {
      // 只有筆類型的 pointer event 且壓力值 > 0.1 才算真實筆壓支援
      this.hasPressureSupport = true;

      // 提筆事件時限制最大壓力值
      let pressure = event.pressure;
      if (eventType === "end") {
        pressure = Math.min(pressure, 0.6); // 提筆時限制最大壓力
      }

      return Math.max(0.1, Math.min(1.0, pressure));
    }

    // 非筆類型的 pointer events（如手指）使用模擬壓力
    if (event && event.pointerType && event.pointerType !== "pen") {
      this.pressureCheckCount++;
      return 0.5; // 返回預設值，讓速度模擬邏輯處理
    }

    // Try to get pressure from touch event
    if (event && event.touches && event.touches.length > 0) {
      const touch = event.touches[0];

      // Apple Pencil support through force property
      if (
        touch.force !== undefined &&
        touch.force > 0.1 &&
        touch.touchType === "stylus"
      ) {
        // 只有觸控筆類型且 force > 0.1 才算真實筆壓支援
        this.hasPressureSupport = true;

        // 提筆事件時限制最大壓力值
        let force = touch.force;
        if (eventType === "end") {
          force = Math.min(force, 0.6); // 提筆時限制最大壓力
        }

        return Math.max(0.1, Math.min(1.0, force));
      }

      // 其他觸控事件（手指觸控或沒有 touchType）不提供真實壓力，使用模擬壓力
      if (!touch.touchType || touch.touchType !== "stylus") {
        this.pressureCheckCount++;
        return 0.5; // 返回預設值，讓速度模擬邏輯處理
      }
    }

    // Try to get pressure from mouse/pointer events
    if (
      event &&
      event.buttons !== undefined &&
      event.type &&
      event.type.includes("mouse")
    ) {
      // For mouse events, don't claim pressure support and use default simulation
      // 滑鼠事件不提供真實壓力，應該使用模擬壓力
      this.pressureCheckCount++;
      return 0.5; // 返回預設值，讓 addPoint 中的速度模擬邏輯處理
    }

    // Check for webkitForce (Safari specific for Force Touch)
    if (event && event.webkitForce !== undefined && event.webkitForce > 1.0) {
      // 只有 webkitForce > 1.0 才算真實壓力支援（正常值為 1.0，有壓力時會超過）
      this.hasPressureSupport = true;

      // 提筆事件時限制最大壓力值
      let force = event.webkitForce;
      if (eventType === "end") {
        force = Math.min(force, 2.0); // 提筆時限制最大壓力
      }

      // webkitForce 的範圍通常是 1.0-3.0，需要映射到 0.1-1.0
      const normalizedForce = Math.max(
        0.1,
        Math.min(1.0, (force - 1.0) / 2.0 + 0.5),
      );
      return normalizedForce;
    }

    // 增加檢測計數
    this.pressureCheckCount++;

    // Default pressure simulation with slight randomization
    if (eventType === "end") {
      return 0.3; // 提筆時使用固定的低壓力值
    }
    return 0.5 + Math.random() * 0.3; // Random pressure between 0.5 and 0.8
  }
}

// Export for use in other modules
window.PressureDrawing = PressureDrawing;
