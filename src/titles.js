export const TITLE_LIST = [
    {
      key: "beginner",
      emoji: "🍼",
      title: "ビギナー思考家",
      description: "討論の世界に足を踏み入れた初心者。",
      condition: (stats, details) => details.level >= 0,
      conditionDescription: "レベル0以上",
      levelRequired: 0,
    },
    {
      key: "apprentice",
      emoji: "📘",
      title: "思考の見習い",
      description: "少しずつ論理を磨き始めた。",
      condition: (stats, details) => details.level >= 3,
      conditionDescription: "レベル3以上",
      levelRequired: 3,
    },
    {
      key: "logic_adept",
      emoji: "🧠",
      title: "論理の修行者",
      description: "論理力が着実に成長中。",
      condition: (stats, details) => details.level >= 7 && stats.logic >= 30,
      conditionDescription: "レベル7以上かつ論理力30以上",
      levelRequired: 7,
    },
    {
      key: "persuader",
      emoji: "🎯",
      title: "説得の実践者",
      description: "説得力で相手を動かす。",
      condition: (stats, details) => details.level >= 10 && stats.persuasiveness >= 35,
      conditionDescription: "レベル10以上かつ説得力35以上",
      levelRequired: 10,
    },
    {
      key: "expressive",
      emoji: "🎤",
      title: "表現の達人",
      description: "多彩な表現で魅了する。",
      condition: (stats, details) => details.level >= 12 && stats.expression >= 40,
      conditionDescription: "レベル12以上かつ表現力40以上",
      levelRequired: 12,
    },
    {
      key: "diversity_seeker",
      emoji: "🌈",
      title: "多様性の探求者",
      description: "様々な視点を受け入れる。",
      condition: (stats, details) => details.level >= 15 && stats.diversity >= 45,
      conditionDescription: "レベル15以上かつ多様性45以上",
      levelRequired: 15,
    },
    {
      key: "insightful",
      emoji: "🔍",
      title: "洞察の深淵",
      description: "深い洞察力を持つ討論者。",
      condition: (stats, details) => details.level >= 18 && stats.depth >= 50,
      conditionDescription: "レベル18以上かつ洞察力50以上",
      levelRequired: 18,
    },
    {
      key: "balanced_mind",
      emoji: "⚖️",
      title: "バランスの哲学者",
      description: "全スコアがバランス良く成長。",
      condition: (stats, details) =>
        details.level >= 20 &&
        stats.logic >= 40 &&
        stats.persuasiveness >= 40 &&
        stats.expression >= 40 &&
        stats.diversity >= 40 &&
        stats.depth >= 40,
      conditionDescription: "レベル20以上かつ全スコア40以上",
      levelRequired: 20,
    },
    {
      key: "strategist",
      emoji: "♟️",
      title: "討論の戦略家",
      description: "冷静な戦略で議論を制す。",
      condition: (stats, details) => details.level >= 25 && stats.logic >= 60,
      conditionDescription: "レベル25以上かつ論理力60以上",
      levelRequired: 25,
    },
    {
      key: "debate_master",
      emoji: "🏆",
      title: "討論マスター",
      description: "全スコアが高く、討論を極めた者。",
      condition: (stats, details) =>
        details.level >= 30 &&
        stats.logic >= 70 &&
        stats.persuasiveness >= 70 &&
        stats.expression >= 70 &&
        stats.diversity >= 70 &&
        stats.depth >= 70,
      conditionDescription: "レベル30以上かつ全スコア70以上",
      levelRequired: 30,
    },
    {
      key: "sage",
      emoji: "🦉",
      title: "知恵の賢者",
      description: "深い知識と経験を持つ老練者。",
      condition: (stats, details) => details.level >= 35,
      conditionDescription: "レベル35以上",
      levelRequired: 35,
    },
    {
      key: "innovator",
      emoji: "🚀",
      title: "思考の開拓者",
      description: "新しい視点で議論の未来を切り拓く。",
      condition: (stats, details) => details.level >= 40 && stats.diversity >= 75,
      conditionDescription: "レベル40以上かつ多様性75以上",
      levelRequired: 40,
    },
    {
      key: "legend",
      emoji: "🌟",
      title: "伝説の討論者",
      description: "数多の討論を制し語り継がれる者。",
      condition: (stats, details) => details.level >= 50,
      conditionDescription: "レベル50以上",
      levelRequired: 50,
    },
    {
      key: "mythic",
      emoji: "👑",
      title: "神話の思考者",
      description: "討論界の頂点に立つ伝説的存在。",
      condition: (stats, details) => details.level >= 70,
      conditionDescription: "レベル70以上",
      levelRequired: 70,
    },
    {
      key: "immortal",
      emoji: "⚡",
      title: "永遠の討論者",
      description: "無限の思考力を持つ存在。",
      condition: (stats, details) => details.level >= 100,
      conditionDescription: "レベル100以上",
      levelRequired: 100,
    },
  ];
  