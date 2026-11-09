// 议程时间线构建（浏览器版，支持中文 / 英文两套文案）
(function (global) {
  var PRESIDENT_NAME = '圆圆';
  var VPM_NAME = '谢不言';

  var CN_NUM = ['零', '一', '二', '三', '四', '五', '六', '七', '八', '九', '十'];
  function cn(n) {
    return n >= 0 && n <= 10 ? CN_NUM[n] : String(n);
  }

  var STD = {
    preparation: 20,
    presidentWelcome: 2,
    toastmasterOpen: 3,
    receptionBrief: 5,
    warmupIntro: 1,
    warmup: 10,
    geIntro: 1,
    geTeam: 7,
    impromptuIntro: 1,
    impromptu: 18,
    speechIntro: 1,
    speech: 7,
    qa: 5,
    breakTime: 15,
    evalIntro: 1,
    ttEval: 6,
    speechEval: 3,
    callOfficers: 1,
    ahCounter: 2,
    grammarian: 3,
    timer: 2,
    geSummary: 7,
    vote: 5,
    induction: 8,
    award: 3,
    closing: 1
  };

  var STR = {
    zh: {
      prep: '开启准备工作，欢迎访客',
      hOpening: '开场环节',
      president: '主席',
      presidentC: '主席致欢迎词，介绍头马/俱乐部，介绍主持人',
      tm: '主持人',
      tmOpen: '主持人致开场词，欢迎来宾，介绍接待官',
      saa: '接待官',
      saaBrief: '会议须知介绍，欢迎客人（每人自我介绍30秒）',
      warmupIntro: '主持人介绍暖场环节',
      warmup: '暖场官',
      warmupC: '暖场环节',
      geIntro: '介绍总评',
      ge: '总评估人',
      geTeam: '总评估解释自己的职责并介绍评估团队',
      hTopics: '即兴演讲环节',
      topicsIntro: '主持人介绍即兴演讲环节',
      ttm: '即兴演讲主持人',
      ttmC: '主持即兴演讲环节',
      hSpeech: '备稿环节',
      speechIntro: '位备稿演讲人的目标',
      speechIntroPrefix: '介绍第',
      speech: '备稿演讲',
      qa: 'Q&A环节',
      qaOwner: '所有人',
      qaC: '位备稿演讲者',
      brk: '中场休息',
      brkC: '中场休息（拍照、交流）统一口号：相约西子，有我有你',
      hEval: '下半场评估环节',
      evalIntro: '主持人介绍评估环节',
      ttEval: '即兴演讲评估人',
      ttEvalC: '评估即兴演讲环节',
      speechEval: '备稿',
      speechEvalC: '评估演讲者',
      callOfficers: '召集三官',
      ah: '哼哈官',
      ahC: '给出每个人的哼哈反馈',
      grammarian: '语法官',
      grammarianC: '给出每个人的语法反馈与每日一词',
      timer: '时间官',
      timerC: '给出每个人的时间反馈',
      geSummary: '评估整场会议',
      hVote: '投票&颁奖',
      vote: '投票&来宾感言',
      vpm: 'VPM',
      vpmC: '介绍入会流程 & 新会员入会仪式',
      award: '颁奖',
      closing: '结束语'
    },
    en: {
      prep: 'Open the venue and welcome guests',
      hOpening: 'Opening Session',
      president: 'President',
      presidentC: 'Welcome, introduce Toastmasters & the club, introduce the Toastmaster',
      tm: 'Toastmaster',
      tmOpen: 'Opening remarks, welcome guests, introduce the Sergeant at Arms',
      saa: 'Sergeant at Arms',
      saaBrief: 'Introduce meeting etiquette, welcome guests (30-sec self-intro each)',
      warmupIntro: 'Introduce the warm-up session',
      warmup: 'Warm-up Master',
      warmupC: 'Warm-up session',
      geIntro: 'Introduce the General Evaluator',
      ge: 'General Evaluator',
      geTeam: 'Explain the GE role and introduce the evaluation team',
      hTopics: 'Table Topics Session',
      topicsIntro: 'Introduce the Table Topics session',
      ttm: 'Table Topics Master',
      ttmC: 'Lead the Table Topics session',
      hSpeech: 'Prepared Speeches',
      speechIntro: ' speaker objectives',
      speechIntroPrefix: 'Introduce prepared speaker ',
      speech: 'Prepared Speech',
      qa: 'Q&A Session',
      qaOwner: 'Everyone',
      qaC: ' prepared speakers',
      brk: 'Break',
      brkC: 'Break (photos & networking). Slogan: See you at Xizi, with me and you.',
      hEval: 'Evaluation Session',
      evalIntro: 'Introduce the evaluation session',
      ttEval: 'Table Topics Evaluator',
      ttEvalC: 'Evaluate the Table Topics session',
      speechEval: 'Speech ',
      speechEvalC: 'Evaluate speaker ',
      callOfficers: 'Call the three officers',
      ah: 'Ah-Counter',
      ahC: 'Give feedback on filler words',
      grammarian: 'Grammarian',
      grammarianC: 'Give feedback on language and the Word of the Day',
      timer: 'Timer',
      timerC: 'Give timing feedback',
      geSummary: 'Evaluate the whole meeting',
      hVote: 'Voting & Awards',
      vote: 'Voting & guest comments',
      vpm: 'VPM',
      vpmC: 'Introduce membership & induction ceremony',
      award: 'Awards',
      closing: 'Closing remarks'
    }
  };

  function toMinutes(hhmm) {
    if (!hhmm || hhmm.indexOf(':') < 0) return 19 * 60;
    var p = hhmm.split(':');
    return Number(p[0]) * 60 + (Number(p[1]) || 0);
  }

  function fmtTime(totalMin) {
    var h = Math.floor(totalMin / 60) % 24;
    var m = totalMin % 60;
    return (h < 10 ? '0' : '') + h + ':' + (m < 10 ? '0' : '') + m;
  }

  function buildAgenda(parsed, lang) {
    var L = STR[lang === 'en' ? 'en' : 'zh'];
    var en = lang === 'en';
    var start = toMinutes(parsed.startTimeText);
    var rows = [];
    var t = start;

    function push(role, owner, content, dur) {
      rows.push({
        startTime: fmtTime(t),
        role: role,
        owner: owner || '',
        content: content || '',
        durationMin: dur,
        duration: dur > 0 ? dur + (en ? ' min' : '分钟') : '',
        kind: 'row',
        isHeading: false
      });
      t += dur;
    }
    function heading(text) {
      rows.push({
        startTime: fmtTime(t),
        role: text,
        owner: '',
        content: '',
        durationMin: 0,
        duration: '',
        kind: 'heading',
        isHeading: true
      });
    }

    var president = parsed.president || PRESIDENT_NAME;
    var vpm = parsed.vpm || VPM_NAME;
    var speeches = parsed.speeches || [];
    var n = speeches.length;

    t = start - STD.preparation;
    push(L.saa, parsed.reception, L.prep, STD.preparation);

    heading(L.hOpening);
    push(L.president, president, L.presidentC, STD.presidentWelcome);
    push(L.tm, parsed.host, L.tmOpen, STD.toastmasterOpen);
    push(L.saa, parsed.reception, L.saaBrief, STD.receptionBrief);

    if (parsed.warmupHost || parsed.featureKind === 'warmup') {
      push(L.tm, parsed.host, L.warmupIntro, STD.warmupIntro);
      push(
        L.warmup,
        parsed.warmupHost || parsed.tableTopicHost,
        parsed.featureKind === 'warmup' && parsed.featureContent ? parsed.featureContent : L.warmupC,
        parsed.featureDurationMinutes || STD.warmup
      );
    }

    push(L.tm, parsed.host, L.geIntro, STD.geIntro);
    push(L.ge, parsed.generalEvaluator, L.geTeam, STD.geTeam);

    heading(L.hTopics);
    var fk = parsed.featureKind || 'impromptu';
    if (fk === 'debate' || fk === 'workshop' || fk === 'custom') {
      var label = { debate: en ? 'Debate' : '辩论', workshop: en ? 'Workshop' : '工作坊', custom: en ? 'Special' : '特色' }[fk];
      push(label + (en ? ' Session' : '环节'), parsed.tableTopicHost, parsed.featureContent, parsed.featureDurationMinutes || STD.impromptu);
    } else {
      push(L.tm, parsed.host, L.topicsIntro, STD.impromptuIntro);
      var topic = parsed.featureContent ? L.ttmC + '《' + parsed.featureContent + '》' : L.ttmC;
      push(L.ttm, parsed.tableTopicHost, topic, parsed.featureDurationMinutes || STD.impromptu);
    }

    if (n) {
      heading(L.hSpeech);
      speeches.forEach(function (s) {
        push(L.tm, parsed.host, L.speechIntroPrefix + (en ? s.index : cn(s.index)) + L.speechIntro, STD.speechIntro);
        var parts = [];
        if (s.title) parts.push('《' + s.title + '》');
        if (s.tag) parts.push(s.tag === '破冰' && en ? 'Ice Breaker' : s.tag);
        if (s.path) parts.push('（' + s.path + '）');
        push(L.speech + ' ' + s.index, s.speaker, parts.join(' '), STD.speech);
      });
      push(L.qa, L.qaOwner, (en ? n : cn(n)) + L.qaC, STD.qa);
    }

    push(L.brk, '', L.brkC, STD.breakTime);

    heading(L.hEval);
    push(L.tm, parsed.host, L.evalIntro, STD.evalIntro);
    push(L.ttEval, parsed.tableTopicEvaluator, L.ttEvalC, STD.ttEval);
    speeches.forEach(function (s) {
      push(L.speechEval + s.index + (en ? ' Evaluator' : '评估人'), s.evaluator, L.speechEvalC + s.index + '：' + s.speaker, STD.speechEval);
    });
    push(L.ge, parsed.generalEvaluator, L.callOfficers, STD.callOfficers);
    push(L.ah, parsed.ahCounter, L.ahC, STD.ahCounter);
    push(L.grammarian, parsed.grammarian, L.grammarianC, STD.grammarian);
    push(L.timer, parsed.timer, L.timerC, STD.timer);
    push(L.ge, parsed.generalEvaluator, L.geSummary, STD.geSummary);

    heading(L.hVote);
    push(L.saa, parsed.reception, L.vote, STD.vote);
    push(L.vpm, vpm, L.vpmC, STD.induction);
    push(L.president, president, L.award, STD.award);
    push(L.president, president, L.closing, STD.closing);

    return {
      meeting: {
        meetingTitle: parsed.meetingTitle,
        meetingNumber: parsed.meetingNumber,
        meetingTypeLabel: parsed.meetingTypeLabel,
        dateText: parsed.dateText,
        startTimeText: parsed.startTimeText,
        endTimeText: parsed.endTimeText,
        templateType: parsed.templateType
      },
      rows: rows
    };
  }

  global.AgendaBuilder = { buildAgenda: buildAgenda };
})(window);
