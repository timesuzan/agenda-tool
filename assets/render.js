// 议程版面渲染（Canvas 版，版式与微信版 writePdf.js 对齐）
(function (global) {
  var PAGE_W = 595.32;
  var PAGE_H = 841.92;
  var M = 18;
  var CONTENT_W = PAGE_W - M * 2;
  var RIGHT_W = 100;
  var LEFT_W = CONTENT_W - RIGHT_W;
  var COL_RATIO = [11, 23, 20, 45, 14];

  var TITLE_H = 21;
  var HEAD_H = 14;
  var BANNER_GAP = 3;
  var TITLE_GAP = 2;
  var MID_GAP = 6;
  var BOTTOM_BOX_H = 54;
  var FOOT_GAP = 4;
  var TIMER_ROW_H = 10.5;
  var TIMER_H = 7 * TIMER_ROW_H;
  var MIN_ROW_H = 8.5;
  var MAX_ROW_H = 26;

  var FONT_FAMILY = '"PingFang SC","Hiragino Sans GB","Microsoft YaHei","Heiti SC",sans-serif';

  var OFFICERS = {
    zh: [
      '主席/President：圆圆',
      '教育副主席/VPE：Tanvi',
      '会员副主席/VPM：谢不言',
      '公关副主席/PR：David',
      '秘书长/Secretary：黛黛',
      '财务官/Treasurer：阿婉',
      '接待官/SAA：阿月'
    ],
    en: ['President: 圆圆', 'VPE: Tanvi', 'VPM: 谢不言', 'VPPR: David', 'Secretary: 黛黛', 'Treasurer: 阿婉', 'SAA: 阿月']
  };

  var UI = {
    zh: {
      headers: ['时间', '角色', '成员', '会议事项', '用时'],
      wod: '每日一词',
      fees: ['参会费用：', '西子会员：免费；', '兄弟俱乐部：10元；', '来宾：20元；', '**报名角色免费！'],
      timerTitle: '计时规则',
      timerHeader: ['提示类型', '3分钟及以内', '3分钟以上'],
      timerRows: [
        ['绿牌', '还剩一分钟', '还剩两分钟'],
        ['黄牌', '还剩半分钟', '还剩一分钟'],
        ['红牌', '时间到', '']
      ],
      timerNote: '宽限后响铃，超时则取消评奖资格',
      photographer: '摄影官',
      boxes: [
        [
          '头马是什么？',
          '头马国际演讲俱乐部是充满活力且内容丰富的国际教育组织社团，通过自学、互学和实践，促进个人成长，提高自信，提高演讲能力和领导能力。宗旨是训练会员的沟通技巧与领导能力。'
        ],
        [
          '加入头马您将收获：',
          '1.不止一项能力的提升：演讲能力、领导能力、沟通能力',
          '2.不止一个上台的机会：即兴演讲、备稿演讲、评估反馈',
          '3.不止一份人生的经历：个人成长、良师助力、潜能发挥'
        ],
        ['头马的6条路径：', '1、精通演讲', '2、高级幽默', '3、有说服力的影响', '4、愿景沟通+', '5、动态领导力', '6、激励策略'],
        [
          '会议须知：',
          '1. 手机关机或静音',
          '2. 不要私下交谈',
          '3. 演讲者上下台请鼓掌',
          '4. 上台和下台时请有力握手',
          '5. 话题请勿涉及宗教、种族、政治和性'
        ]
      ]
    },
    en: {
      headers: ['Time', 'Role', 'Member', 'Agenda', 'Duration'],
      wod: 'Word of the Day',
      fees: ['Fees:', 'Xizi members: Free;', 'Sister clubs: 10 RMB;', 'Guests: 20 RMB;', '**Free if you take a role!'],
      timerTitle: 'Timing Rules',
      timerHeader: ['Signal', 'Within 3 min', 'Over 3 min'],
      timerRows: [
        ['Green', '1 min left', '2 min left'],
        ['Yellow', '30 sec left', '1 min left'],
        ['Red', "Time's up", '']
      ],
      timerNote: 'A bell rings after the grace period; overtime disqualifies from awards',
      photographer: 'Photographer',
      boxes: [
        [
          'What is Toastmasters?',
          'Toastmasters International is a vibrant global educational organization. Through self-learning, peer learning and practice, it helps people grow, build confidence, and improve speaking and leadership skills. Its mission is to train members in communication and leadership.'
        ],
        [
          'What you will gain:',
          '1. More than one skill: speaking, leadership and communication',
          '2. More than one chance to speak: impromptu, prepared speeches and feedback',
          '3. More than one life experience: growth, mentors and potential'
        ],
        [
          'The 6 Toastmasters Pathways:',
          '1. Mastering Presentation',
          '2. Advanced Humor',
          '3. Persuasive Influence',
          '4. Visionary Communication+',
          '5. Dynamic Leadership',
          '6. Motivational Strategies'
        ],
        [
          'Meeting Etiquette:',
          '1. Silence or switch off your phone',
          '2. No private conversations',
          '3. Applaud speakers on and off stage',
          '4. Firm handshake on and off stage',
          '5. No topics on religion, race, politics or sex'
        ]
      ]
    }
  };

  var QR_KEYS = ['wechat', 'alipay', 'xhs', 'vpm'];
  var QR_LABELS = { wechat: 'WeChat Pay', alipay: 'Alipay', xhs: 'Xiaohongshu', vpm: 'VPM WeChat' };

  var C_DARK = '#004062';
  var C_HEAD = '#d5dce4';
  var C_YEL = '#ebeebf';
  var C_TEXT = '#44546a';
  var C_LINE = '#c7ced5';

  function clamp(v, lo, hi) {
    return Math.max(lo, Math.min(hi, v));
  }

  function safeText(s) {
    return String(s == null ? '' : s)
      .replace(/[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{FE0F}]/gu, '')
      .replace(/\s+$/g, '');
  }

  function render(canvas, parsed, agenda, options) {
    var opts = options || {};
    var images = opts.images || {};
    var S = opts.scale || 2.4;

    var isEn =
      /英文|english/i.test(String((parsed && parsed.meetingTypeLabel) || '')) ||
      (parsed && parsed.templateType === 'english');
    var U = isEn ? UI.en : UI.zh;
    var officers = isEn ? OFFICERS.en : OFFICERS.zh;

    canvas.width = Math.round(PAGE_W * S);
    canvas.height = Math.round(PAGE_H * S);
    var ctx = canvas.getContext('2d');

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    var currentFont = '';
    function setFont(size, bold) {
      var spec = (bold ? 'bold ' : '') + (size * S).toFixed(2) + 'px ' + FONT_FAMILY;
      if (spec !== currentFont) {
        ctx.font = spec;
        currentFont = spec;
      }
    }
    function measure(text, size) {
      setFont(size, false);
      return ctx.measureText(text).width / S;
    }
    function drawText(text, x, yBaseline, size, color) {
      setFont(size, false);
      ctx.fillStyle = color || '#000000';
      ctx.textBaseline = 'alphabetic';
      ctx.fillText(text, x * S, (PAGE_H - yBaseline) * S);
    }
    function drawRect(x, yBottom, w, h, color) {
      ctx.fillStyle = color;
      ctx.fillRect(x * S, (PAGE_H - yBottom - h) * S, w * S, h * S);
    }
    function strokeRect(x, yBottom, w, h, lineWidth) {
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = (lineWidth || 0.6) * S;
      ctx.strokeRect(x * S, (PAGE_H - yBottom - h) * S, w * S, h * S);
    }
    function line(x1, y1, x2, y2, width, color) {
      ctx.strokeStyle = color;
      ctx.lineWidth = width * S;
      ctx.beginPath();
      ctx.moveTo(x1 * S, (PAGE_H - y1) * S);
      ctx.lineTo(x2 * S, (PAGE_H - y2) * S);
      ctx.stroke();
    }
    function drawImage(img, x, yBottom, w, h) {
      if (!img || !img.width) return;
      ctx.drawImage(img, x * S, (PAGE_H - yBottom - h) * S, w * S, h * S);
    }

    var rows = agenda.rows || [];
    var X_LEFT = M;
    var X_RIGHT = M + LEFT_W;

    var totalRatio = 0;
    for (var r = 0; r < COL_RATIO.length; r++) totalRatio += COL_RATIO[r];
    var CW = COL_RATIO.map(function (v) {
      return (LEFT_W * v) / totalRatio;
    });
    var colX = [];
    var acc = X_LEFT;
    for (var c = 0; c < CW.length; c++) {
      colX.push(acc);
      acc += CW[c];
    }

    var NO_LINE_START = '）】》。，、；：！？%」』”’';
    function wrap(text, size, maxW) {
      var chars = Array.from(safeText(text));
      var lines = [];
      var lineText = '';
      for (var i = 0; i < chars.length; i++) {
        var ch = chars[i];
        if (lineText && measure(lineText + ch, size) > maxW) {
          if (NO_LINE_START.indexOf(ch) >= 0) {
            lineText += ch;
            continue;
          }
          lines.push(lineText);
          lineText = ch;
        } else {
          lineText += ch;
        }
      }
      if (lineText) lines.push(lineText);
      return lines.length ? lines : [''];
    }

    // —— 底部四栏高度预算 ——
    var boxBw = CONTENT_W / 4;
    var BOX_TEXTS = U.boxes;
    function measureBoxes(fs) {
      var gap = Math.max(0.9, fs * 0.2);
      var need = 0;
      for (var b = 0; b < BOX_TEXTS.length; b++) {
        var n = 0;
        var lines = BOX_TEXTS[b];
        for (var li = 0; li < lines.length; li++) n += wrap(lines[li], fs, boxBw - 8).length;
        need = Math.max(need, n * (fs + gap) + 10);
      }
      return need;
    }
    var boxFs = 6.2;
    var boxNeed = measureBoxes(boxFs);
    while (boxNeed > 92 && boxFs > 5.2) {
      boxFs -= 0.2;
      boxNeed = measureBoxes(boxFs);
    }
    var boxGap = Math.max(0.9, boxFs * 0.2);

    // —— 高度预算 ——
    var bannerImg = images.banner;
    var bannerH = bannerImg && bannerImg.width ? Math.min(132, (CONTENT_W * bannerImg.height) / bannerImg.width) : 0;

    var boxH = clamp(Math.max(BOTTOM_BOX_H, boxNeed), BOTTOM_BOX_H, 92);
    function bottomH() {
      return boxH + FOOT_GAP + TIMER_H;
    }

    var midTop = PAGE_H - M - bannerH - BANNER_GAP - TITLE_H - TITLE_GAP - HEAD_H;
    var midBottom = M + bottomH() + MID_GAP;
    var midH = midTop - midBottom;

    var SIZES = [10.5, 10, 9.5, 9, 8.5, 8, 7.5, 7, 6.5, 6];
    var sizeMain = SIZES[0];
    var measured = [];
    var sumH = 0;

    function measureRow(row, size) {
      if (row.kind === 'heading' || row.isHeading) {
        return { heading: true, lines: [safeText(row.role)], h: size + 6.5 };
      }
      var cells = [row.startTime, row.role, row.owner, row.content, row.duration];
      var lines = cells.map(function (v, i) {
        return wrap(v, size, CW[i] - 5);
      });
      var maxLines = 1;
      for (var i = 0; i < lines.length; i++) maxLines = Math.max(maxLines, lines[i].length);
      return { heading: false, lines: lines, maxLines: maxLines, h: Math.max(MIN_ROW_H, maxLines * (size + 1.4) + 3.2) };
    }

    function measureAll(size) {
      measured = rows.map(function (row) {
        return measureRow(row, size);
      });
      sumH = measured.reduce(function (a, m) {
        return a + m.h;
      }, 0);
    }

    if (rows.length) {
      for (var si = 0; si < SIZES.length; si++) {
        sizeMain = SIZES[si];
        measureAll(sizeMain);
        if (sumH <= midH) break;
      }
      if (sumH > midH && bannerH > 60) {
        var cut = Math.min(sumH - midH + 2, bannerH - 60);
        if (cut > 0) {
          bannerH -= cut;
          midTop += cut;
          midH += cut;
        }
      }
      var per = midH / rows.length;
      if (per > MAX_ROW_H) {
        var leftover = midH - MAX_ROW_H * rows.length;
        boxH += leftover;
        midBottom = M + bottomH() + MID_GAP;
        midH = midTop - midBottom;
      }
      var k = sumH > 0 ? midH / sumH : 1;
      measured = measured.map(function (m) {
        return { heading: m.heading, lines: m.lines, maxLines: m.maxLines, h: m.h * k };
      });
    }

    // —— 绘制 ——
    var y = PAGE_H - M;

    if (bannerImg && bannerH > 0) {
      drawImage(bannerImg, M, y - bannerH, CONTENT_W, bannerH);
      y -= bannerH + BANNER_GAP;
    }

    var mt = agenda.meeting || {};
    var title = safeText(mt.meetingTitle || '');
    var num = mt.meetingNumber || '';
    if (!num) {
      var mm = title.match(/(\d{2,4})/);
      if (mm) num = mm[1];
    }
    title = title
      .replace(/[#＃]\s*\d+\s*/g, '')
      .replace(/[【\[][^】\]]*[】\]]/g, '')
      .replace(/\d{2,4}\s*次?会议/g, '')
      .trim();
    var isEn = /英文/i.test(String(mt.meetingTypeLabel || ''));
    var fullTitle = isEn
      ? title + (num ? ' #' + num : '') + ' 英文会议'
      : title + (num ? '第' + num + '次' : '') + '中文会议';
    var dateStr = mt.dateText ? '  日期：' + mt.dateText : '';

    drawRect(M, y - TITLE_H, CONTENT_W, TITLE_H, C_HEAD);
    var tSize = 11.5;
    while (tSize > 8 && measure(safeText(fullTitle + dateStr), tSize) > CONTENT_W - 12) tSize -= 0.5;
    drawText(safeText(fullTitle + dateStr), M + 5, y - TITLE_H + 6, tSize, '#000000');
    y -= TITLE_H + TITLE_GAP;

    drawRect(X_LEFT, y - HEAD_H, LEFT_W, HEAD_H, C_HEAD);
    U.headers.forEach(function (h, i) {
      drawText(h, colX[i] + 3, y - HEAD_H + 4.5, 7.5, '#000000');
    });
    drawRect(X_RIGHT, y - HEAD_H, RIGHT_W, HEAD_H, '#a5a5a5');
    drawText('Club Officers', X_RIGHT + 3, y - HEAD_H + 4.5, 7.5, '#000000');

    var midTopActual = y - HEAD_H;
    var ry = midTopActual;
    var lineGap = sizeMain + 1.4;

    for (var ri = 0; ri < rows.length; ri++) {
      var m = measured[ri];
      var h = m.h;
      if (m.heading) {
        drawRect(X_LEFT, ry - h, LEFT_W, h, C_HEAD);
        var hs = Math.min(sizeMain + 0.5, h - 3);
        var tw = measure(m.lines[0], hs);
        drawText(m.lines[0], X_LEFT + (LEFT_W - tw) / 2, ry - h / 2 - hs * 0.36, hs, '#000000');
      } else {
        var blockH = m.maxLines * lineGap;
        var top = ry - Math.max(1, (h - blockH) / 2);
        for (var ci = 0; ci < m.lines.length; ci++) {
          for (var li2 = 0; li2 < m.lines[ci].length; li2++) {
            drawText(m.lines[ci][li2], colX[ci] + 2, top - sizeMain * 0.9 - li2 * lineGap, sizeMain, '#000000');
          }
        }
      }
      line(X_LEFT, ry - h, X_RIGHT, ry - h, 0.4, C_LINE);
      ry -= h;
    }

    for (var vi = 1; vi < colX.length; vi++) {
      line(colX[vi], midTopActual, colX[vi], ry, 0.4, C_LINE);
    }
    line(X_RIGHT, midTopActual, X_RIGHT, midBottom, 0.5, C_LINE);

    // —— 右栏 ——
    var cy = midTopActual - 2;
    var QR_LABEL_H = 10.5;
    function drawRightText(txt, size, color, indent) {
      var lines = wrap(txt, size, RIGHT_W - 8);
      for (var i = 0; i < lines.length; i++) {
        if (cy - size < midBottom) return;
        drawText(lines[i], X_RIGHT + (indent || 4), cy - size, size, color);
        cy -= size + 1.6;
      }
    }

    for (var oi = 0; oi < officers.length; oi++) drawRightText(officers[oi], 7.6, C_TEXT, 4);
    cy -= 2;

    var wod = opts.wordOfTheDay || {};
    var wodWord = String(wod.word || '').trim() || '________';
    var wodExample = String(wod.example || '').trim();
    drawRect(X_RIGHT, cy - 11, RIGHT_W, 11, C_DARK);
    drawText(U.wod, X_RIGHT + 4, cy - 11 + 2.5, 7, '#ffffff');
    cy -= 13;
    var wSize = 20;
    while (wSize > 9 && measure(safeText(wodWord), wSize) > RIGHT_W - 10) wSize -= 0.5;
    drawText(safeText(wodWord), X_RIGHT + 4, cy - wSize, wSize, C_TEXT);
    cy -= wSize + 4;
    if (wodExample) drawRightText(wodExample, 7, C_TEXT, 4);
    cy -= 2;

    var feeLines = 0;
    for (var fi = 0; fi < U.fees.length; fi++) feeLines += wrap(U.fees[fi], 7, RIGHT_W - 8).length;
    var feeH = feeLines * 8.6 + 2;
    var qrAvail = Math.max(0, cy - midBottom - feeH);
    var qrBlockH = qrAvail / QR_KEYS.length;
    var qrImg = clamp(qrBlockH - (QR_LABEL_H + 2 + 5), 22, 80);

    for (var qi = 0; qi < QR_KEYS.length; qi++) {
      if (qrBlockH < 26 || cy - qrBlockH < midBottom) break;
      var key = QR_KEYS[qi];
      drawRect(X_RIGHT, cy - QR_LABEL_H, RIGHT_W, QR_LABEL_H, C_DARK);
      drawText(QR_LABELS[key], X_RIGHT + 4, cy - QR_LABEL_H + 2.5, 7, '#ffffff');
      var img = images[key];
      if (img && img.width) {
        // 保持原始宽高比，居中放进方形槽位
        var fit = Math.min(qrImg / img.width, qrImg / img.height);
        var dw = img.width * fit;
        var dh = img.height * fit;
        drawImage(img, X_RIGHT + (RIGHT_W - dw) / 2, cy - QR_LABEL_H - 2 - dh, dw, dh);
      }
      cy -= qrBlockH;
    }

    for (var fi2 = 0; fi2 < U.fees.length; fi2++) drawRightText(U.fees[fi2], 7, '#000000', 4);

    // —— 计时规则表格 ——
    var ty = M + boxH + FOOT_GAP + TIMER_H;
    var H = TIMER_ROW_H;
    var tcw = [LEFT_W * 0.4, LEFT_W * 0.35, LEFT_W * 0.25];
    var tcx = [X_LEFT, X_LEFT + tcw[0], X_LEFT + tcw[0] + tcw[1]];
    function centerIn(txt, x, w, yb, hh, size, color) {
      var t = safeText(txt);
      var cw = measure(t, size);
      drawText(t, x + (w - cw) / 2, yb + (hh - size) / 2 + size * 0.2, size, color || '#000000');
    }

    ty -= H;
    drawRect(X_LEFT, ty, LEFT_W, H, C_YEL);
    strokeRect(X_LEFT, ty, LEFT_W, H);
    centerIn(U.timerTitle, X_LEFT, LEFT_W, ty, H, 7.2);

    ty -= H;
    for (var hi = 0; hi < U.timerHeader.length; hi++) {
      drawRect(tcx[hi], ty, tcw[hi], H, C_YEL);
      strokeRect(tcx[hi], ty, tcw[hi], H);
      centerIn(U.timerHeader[hi], tcx[hi], tcw[hi], ty, H, 6.8);
    }

    var SIGN_COLORS = ['#00b050', '#ffff00', '#ff0000'];
    for (var ti = 1; ti < U.timerRows.length; ti++) {
      ty -= H;
      drawRect(tcx[0], ty, tcw[0], H, SIGN_COLORS[ti - 1]);
      strokeRect(tcx[0], ty, tcw[0], H);
      drawText(safeText(U.timerRows[ti - 1][0]), tcx[0] + 4, ty + (H - 6.8) / 2 + 6.8 * 0.2, 6.8, '#000000');

      if (ti === U.timerRows.length) {
        strokeRect(tcx[1], ty, tcw[1] + tcw[2], H);
        centerIn(U.timerRows[ti - 1][1] || U.timerRows[ti - 1][2], tcx[1], tcw[1] + tcw[2], ty, H, 6.8);
      } else {
        for (var cj = 1; cj <= 2; cj++) {
          strokeRect(tcx[cj], ty, tcw[cj], H);
          centerIn(U.timerRows[ti - 1][cj], tcx[cj], tcw[cj], ty, H, 6.8);
        }
      }
    }

    ty -= H;
    drawRect(X_LEFT, ty, LEFT_W, H, C_YEL);
    strokeRect(X_LEFT, ty, LEFT_W, H);
    centerIn(U.timerNote, X_LEFT, LEFT_W, ty, H, 6.8);

    ty -= H;
    drawRect(X_LEFT, ty, LEFT_W, H, '#ffffff');
    strokeRect(X_LEFT, ty, LEFT_W, H);
    centerIn(U.photographer + '：' + ((parsed && parsed.photographer) || '____'), X_LEFT, LEFT_W, ty, H, 6.8);

    // —— 底部四栏 ——
    U.boxes.forEach(function (lines, i) {
      var bx = M + i * boxBw;
      drawRect(bx + 1, M, boxBw - 2, boxH, C_HEAD);
      var ly = M + boxH - 7;
      for (var a = 0; a < lines.length; a++) {
        var wrapped = wrap(lines[a], boxFs, boxBw - 8);
        for (var b = 0; b < wrapped.length; b++) {
          if (ly - boxFs < M + 1) break;
          drawText(wrapped[b], bx + 4, ly - boxFs, boxFs, '#000000');
          ly -= boxFs + boxGap;
        }
      }
    });
  }

  global.AgendaRender = { render: render };
})(window);
