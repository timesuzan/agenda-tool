// 会议通知解析（浏览器版，逻辑与微信云函数 src/parser.js 保持一致）
(function (global) {
  var TBD_EMOJIS = ['🌮', '⚾', '🎳'];

  function cleanRole(v) {
    if (v == null) return '';
    var s = String(v).trim();
    for (var i = 0; i < TBD_EMOJIS.length; i++) {
      if (s.indexOf(TBD_EMOJIS[i]) >= 0) return '';
    }
    return s;
  }

  function parseTitle(line) {
    var m = line.match(/^(.+?)\s*[#＃]\s*([0-9]+[^【\[]*)\s*[【\[](.+?)[】\]]/);
    if (m) {
      return { meetingTitle: m[1].trim(), meetingNumber: m[2].trim(), meetingTypeLabel: m[3].trim() };
    }
    m = line.match(/^[#＃]\s*([0-9]+[^【\[]*)\s*[【\[](.+?)[】\]]/);
    if (m) {
      return { meetingTitle: '', meetingNumber: m[1].trim(), meetingTypeLabel: m[2].trim() };
    }
    return { meetingTitle: line.trim(), meetingNumber: '', meetingTypeLabel: '' };
  }

  function parseTime(line) {
    var m = line.match(/(\d{4})年(\d{1,2})月(\d{1,2})日\s*(\d{1,2}:\d{2})\s*[-~]\s*(\d{1,2}:\d{2})/);
    if (m) {
      return {
        dateText: m[1] + '年' + m[2] + '月' + m[3] + '日',
        startTimeText: m[4],
        endTimeText: m[5]
      };
    }
    return { dateText: line.trim(), startTimeText: '', endTimeText: '' };
  }

  var FEATURE_PRIORITY = [
    { re: /工作坊|workshop/i, kind: 'workshop' },
    { re: /辩论|debate/i, kind: 'debate' },
    { re: /即兴|impromptu/i, kind: 'impromptu' },
    { re: /暖场|warmup/i, kind: 'warmup' }
  ];

  function parseFeature(value) {
    var startIdx = -1;
    var matched = null;
    for (var i = 0; i < FEATURE_PRIORITY.length; i++) {
      var fk = FEATURE_PRIORITY[i];
      var idx = value.search(fk.re);
      if (idx >= 0) {
        if (startIdx < 0 || idx < startIdx) startIdx = idx;
        if (!matched) matched = fk;
      }
    }
    if (!matched) {
      var bm0 = value.match(/[《\[](.*?)[》\]]/);
      if (bm0) {
        return {
          tableTopicHost: value.slice(0, bm0.index).trim(),
          featureKind: 'impromptu',
          featureLabel: '',
          featureContent: bm0[1].trim(),
          featureDurationMinutes: 0
        };
      }
      return {
        tableTopicHost: value.trim(),
        featureKind: 'impromptu',
        featureLabel: '',
        featureContent: '',
        featureDurationMinutes: 0
      };
    }
    var host = value.slice(0, startIdx).trim();
    var rest = value.slice(startIdx).trim();
    var dm = rest.match(/需要\s*(\d+)\s*分钟|(\d+)\s*分钟/);
    var dur = dm ? parseInt(dm[1] || dm[2], 10) : 0;
    return {
      tableTopicHost: host,
      featureKind: matched.kind,
      featureLabel: matched.kind,
      featureContent: rest,
      featureDurationMinutes: dur
    };
  }

  function parseSpeech(value) {
    var path = '';
    var pm = value.match(/L\d+-\d+/);
    if (pm) path = pm[0];
    var title = '';
    var bm = value.match(/\[(.*?)\]|《(.*?)》/);
    if (bm) title = bm[1] || bm[2];
    var speaker = value;
    if (pm) speaker = speaker.replace(pm[0], '');
    if (bm) speaker = speaker.replace(bm[0], '');
    speaker = speaker.trim();
    var tag = '';
    var tm = speaker.match(/^(.*?)\s*(破冰|备稿|即兴|进阶|高阶)$/);
    if (tm && tm[1].trim()) {
      speaker = tm[1].trim();
      tag = tm[2];
    }
    return { speaker: speaker.trim(), title: title.trim(), path: path, tag: tag };
  }

  var ROLE_KEYS = {
    会议经理: 'meetingManager',
    主席: 'president',
    接待官: 'reception',
    主持人: 'host',
    总评估: 'generalEvaluator',
    时间官: 'timer',
    语法官: 'grammarian',
    哼哈官: 'ahCounter',
    摄影官: 'photographer',
    暖场官: 'warmupHost',
    桌面评估: 'tableTopicEvaluator',
    会员副主席: 'vpm',
    VPM: 'vpm'
  };

  function defaultMeeting() {
    return {
      meetingTitle: '',
      meetingNumber: '',
      meetingTypeLabel: '',
      templateType: 'chinese',
      dateText: '',
      startTimeText: '',
      endTimeText: '',
      meetingManager: '',
      president: '',
      reception: '',
      host: '',
      generalEvaluator: '',
      timer: '',
      grammarian: '',
      ahCounter: '',
      photographer: '',
      warmupHost: '',
      tableTopicEvaluator: '',
      vpm: '',
      tableTopicHost: '',
      featureKind: 'impromptu',
      featureLabel: '',
      featureContent: '',
      featureDurationMinutes: 0,
      speeches: [],
      placeholders: []
    };
  }

  function parseMeetingNotice(noticeText, templateType) {
    var lines = String(noticeText || '')
      .split('\n')
      .map(function (l) {
        return l.trim();
      })
      .filter(Boolean);

    var result = defaultMeeting();
    var speeches = [];
    var evaluators = {};

    for (var li = 0; li < lines.length; li++) {
      var line = lines[li];

      if (!result.meetingNumber && /[#＃]\s*\d+\s*[【\[]/.test(line)) {
        var t = parseTitle(line);
        if (t.meetingNumber) {
          var prev = li > 0 ? lines[li - 1] : '';
          var prevUsable = prev && prev.length <= 30 && !/[:：]/.test(prev) && !/[#＃]/.test(prev);
          result.meetingTitle = t.meetingTitle || (prevUsable ? prev : result.meetingTitle);
          result.meetingNumber = t.meetingNumber;
          result.meetingTypeLabel = t.meetingTypeLabel;
          continue;
        }
      }

      // 英文通知常见写法：「#898 English Meeting」（没有【】）
      if (!result.meetingNumber && /^[#＃]\s*\d+/.test(line)) {
        var m2 = line.match(/^[#＃]\s*(\d+)\s*(.*)$/);
        if (m2) {
          result.meetingNumber = m2[1];
          var rest = (m2[2] || '').trim();
          if (/english/i.test(rest)) result.meetingTypeLabel = '英文会议';
          else if (/中文/.test(rest)) result.meetingTypeLabel = '中文会议';
          var prevLine = li > 0 ? lines[li - 1] : '';
          if (prevLine && prevLine.length <= 60 && !/[:：]/.test(prevLine) && !/[#＃]/.test(prevLine)) {
            result.meetingTitle = prevLine;
          }
          continue;
        }
      }

      if (/^时间[:：]/.test(line)) {
        var tm = parseTime(line.replace(/^时间[:：]/, ''));
        result.dateText = tm.dateText;
        result.startTimeText = tm.startTimeText;
        result.endTimeText = tm.endTimeText;
        continue;
      }
      if (/^桌面主持[:：]/.test(line)) {
        var ft = parseFeature(line.replace(/^桌面主持[:：]/, ''));
        result.tableTopicHost = ft.tableTopicHost;
        result.featureKind = ft.featureKind;
        result.featureLabel = ft.featureLabel;
        result.featureContent = ft.featureContent;
        result.featureDurationMinutes = ft.featureDurationMinutes;
        continue;
      }

      var sp = line.match(/^备稿(?:演讲|演说)(\d+)[:：](.*)$/);
      if (sp) {
        speeches[parseInt(sp[1], 10)] = parseSpeech(sp[2]);
        continue;
      }
      var ev = line.match(/^备稿(?:演讲|演说)?评估(\d+)[:：](.*)$/);
      if (ev) {
        evaluators[parseInt(ev[1], 10)] = cleanRole(ev[2]);
        continue;
      }

      var handled = false;
      for (var zh in ROLE_KEYS) {
        if (!ROLE_KEYS.hasOwnProperty(zh)) continue;
        if (line.indexOf(zh + '：') === 0 || line.indexOf(zh + ':') === 0) {
          result[ROLE_KEYS[zh]] = cleanRole(line.slice(zh.length + 1).trim());
          handled = true;
          break;
        }
      }
      if (handled) continue;
    }

    result.speeches = [];
    for (var i = 1; i < speeches.length; i++) {
      if (!speeches[i]) continue;
      result.speeches.push({
        index: i,
        speaker: speeches[i].speaker,
        title: speeches[i].title,
        path: speeches[i].path,
        tag: speeches[i].tag || '',
        evaluator: evaluators[i] || '',
        durationMinutes: 0
      });
    }

    if (result.meetingTypeLabel.indexOf('英文') >= 0) result.templateType = 'english';
    else if (result.meetingTypeLabel.indexOf('中文') >= 0) result.templateType = 'chinese';
    else result.templateType = templateType || 'chinese';

    return result;
  }

  global.AgendaParser = { parseMeetingNotice: parseMeetingNotice };
})(window);
