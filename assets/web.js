// 页面交互（网站版，经典脚本，无模块、无内联事件）
// 相比小红书小工具版：保存改为浏览器下载，新增「打印 / 导出 PDF」，移除容器 API 依赖。
(function (global) {
  var SAMPLE = [
    '杭州西子双语演讲俱乐部',
    '#898【中文会议】会议角色预约',
    '会议经理：David',
    '时间：2026年10月14日 19:00-21:00',
    '地点：西湖区文新街道综合文化站三楼（五联地铁站C口出）',
    '主持人：Tanvi',
    '接待官：David',
    '暖场官：圆圆',
    '总评估：章丽红',
    '时间官：安一',
    '语法官：KYQ',
    '哼哈官：艾问',
    '桌面主持：Becky《打开情绪的盒子》',
    '桌面评估：Emily',
    '备稿演说1：David《PR的自我修炼》破冰',
    '备稿评估1：圆圆',
    '备稿演讲2：Sally 《我的10年》破冰',
    '备稿评估2： Apple',
    '摄影官：洋洋'
  ].join('\n');

  var IMAGE_SOURCES = {
    banner: './assets/images/banner.png',
    wechat: './assets/images/qr-wechat.png',
    alipay: './assets/images/qr-alipay.png',
    xhs: './assets/images/qr-xhs.png',
    vpm: './assets/images/qr-vpm.png'
  };

  var images = {};
  var currentDataUrl = '';
  var selectedType = 'chinese';
  var manualType = false;

  var $ = function (id) {
    return document.getElementById(id);
  };

  function setStatus(text) {
    var el = $('status');
    if (el) el.textContent = text || '';
  }

  function setHint(text) {
    var el = $('parseHint');
    if (el) el.textContent = text || '';
  }

  function preloadImages() {
    var imagesPromise = new Promise(function (resolve) {
      var keys = Object.keys(IMAGE_SOURCES);
      var left = keys.length;
      keys.forEach(function (key) {
        var img = new Image();
        img.onload = function () {
          images[key] = img;
          left--;
          if (left === 0) resolve(images);
        };
        img.onerror = function () {
          left--;
          if (left === 0) resolve(images);
        };
        img.src = IMAGE_SOURCES[key];
      });
      if (!keys.length) resolve(images);
    });
    return imagesPromise;
  }

  function showView(name) {
    $('viewInput').className = name === 'input' ? 'view' : 'view hidden';
    $('viewPreview').className = name === 'preview' ? 'view' : 'view hidden';
    global.scrollTo(0, 0);
  }

  function setType(type) {
    selectedType = type === 'english' ? 'english' : 'chinese';
    $('typeZh').className = selectedType === 'chinese' ? 'seg-btn active' : 'seg-btn';
    $('typeEn').className = selectedType === 'english' ? 'seg-btn active' : 'seg-btn';
  }

  function detectType(text) {
    if (/[【\[]\s*英文/.test(text) || /English\s+Meeting/i.test(text)) return 'english';
    if (/[【\[]\s*中文/.test(text) || /中文会议/.test(text)) return 'chinese';
    return '';
  }

  function generate() {
    var text = $('notice').value || '';
    if (!text.trim()) {
      setHint('请先粘贴会议通知');
      return;
    }
    setHint('正在生成…');
    preloadImages().then(function () {
      try {
        var parsed = global.AgendaParser.parseMeetingNotice(text, selectedType);
        // 以界面上选择的类型为准（通知里的【中文/英文会议】只用来做默认识别）
        parsed.templateType = selectedType;
        parsed.meetingTypeLabel = selectedType === 'english' ? '英文会议' : '中文会议';
        var agenda = global.AgendaBuilder.buildAgenda(parsed, selectedType === 'english' ? 'en' : 'zh');
        var canvas = $('canvas');
        global.AgendaRender.render(canvas, parsed, agenda, {
          images: images,
          scale: 2.4,
          wordOfTheDay: {
            word: $('word').value || '',
            example: $('wordExample').value || ''
          }
        });
        currentDataUrl = canvas.toDataURL('image/png');
        setHint('');
        setStatus('');
        showView('preview');
      } catch (err) {
        setHint('生成失败：' + ((err && err.message) || err));
      }
    });
  }

  function fileName(ext) {
    var d = new Date();
    var pad = function (n) { return (n < 10 ? '0' : '') + n; };
    return '会议议程-' + d.getFullYear() + pad(d.getMonth() + 1) + pad(d.getDate()) + '.' + ext;
  }

  function downloadImage() {
    if (!currentDataUrl) {
      setStatus('请先生成议程');
      return;
    }
    var a = document.createElement('a');
    a.href = currentDataUrl;
    a.download = fileName('png');
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setStatus('已开始下载 PNG 议程图');
  }

  function printImage() {
    if (!currentDataUrl) {
      setStatus('请先生成议程');
      return;
    }
    var w = global.open('', '_blank');
    if (!w) {
      setStatus('浏览器拦截了弹窗，请允许弹窗后重试');
      return;
    }
    global.__agendaDataUrl = currentDataUrl;
    w.document.write(
      '<!DOCTYPE html><html><head><meta charset="UTF-8"><title>打印议程</title>' +
      '<style>' +
      '@page { size: A4; margin: 10mm; }' +
      'html,body { margin:0; padding:0; background:#fff; }' +
      'img { display:block; width:100%; height:auto; }' +
      '@media screen { body { padding:16px; } img { box-shadow:0 2px 12px rgba(0,0,0,.15); } }' +
      '</style></head><body>' +
      '<img id="agenda" alt="会议议程" />' +
      '<script>' +
      'var img = document.getElementById("agenda");' +
      'var src = window.opener && window.opener.__agendaDataUrl ? window.opener.__agendaDataUrl : "";' +
      'if (src) { img.onload = function () { setTimeout(function () { window.focus(); window.print(); }, 200); }; img.src = src; }' +
      'else { document.body.innerText = "图片加载失败，请关闭此窗口重试"; }' +
      '<\/script></body></html>'
    );
    w.document.close();
    setStatus('已打开打印窗口：选择「另存为 PDF」即可导出 PDF');
  }

  function bind() {
    $('typeZh').addEventListener('click', function () {
      manualType = true;
      setType('chinese');
    });
    $('typeEn').addEventListener('click', function () {
      manualType = true;
      setType('english');
    });
    $('notice').addEventListener('input', function () {
      if (manualType) return;
      var detected = detectType($('notice').value);
      if (detected) setType(detected);
    });
    $('btnSample').addEventListener('click', function () {
      $('notice').value = SAMPLE;
      manualType = false;
      setType('chinese');
      setHint('已填入示例，可以直接点「生成议程图」');
    });
    $('btnClear').addEventListener('click', function () {
      $('notice').value = '';
      $('word').value = '';
      $('wordExample').value = '';
      setHint('');
    });
    $('btnGenerate').addEventListener('click', generate);
    $('btnBack').addEventListener('click', function () {
      showView('input');
    });
    $('btnSave').addEventListener('click', downloadImage);
    $('btnPrint').addEventListener('click', printImage);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
      bind();
      preloadImages();
    });
  } else {
    bind();
    preloadImages();
  }
})(window);
