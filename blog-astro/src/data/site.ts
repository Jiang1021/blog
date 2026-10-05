/**
 * 站点内容配置 —— 这里是全站唯一的内容来源。
 * 改这个文件就能替换整站文案，页面结构不用动。
 *
 * 内容已按 2026-02 的确认结果填好，之后想改直接改这里。
 */

export const site = {
  /** 英文名 / 网络 ID，出现在 Hero 大标题、终端侧栏、页脚 */
  handle: 'Jiang1021',
  /** 打游戏时用的 ID —— 只出现在 About 正文里 */
  handleGame: 'JiangJT1021',
  /** 中文名，出现在 Hero 副标题、About、浏览器标题 */
  cn: '江枫',
  /** 站点全名，用于 <title> 与品牌位 */
  name: '江枫的实验室',
  /** 站点副标题，用于默认 <title> 的后半段 */
  studio: "Jiang1021's Lab",
  /** 一句话身份描述 —— Hero 下面那行 lede。SEO 也用它，所以写全一点 */
  tagline: '一个普普通通的高二学生，业余写点代码，把折腾的过程记在这里。',
  /** 终端侧栏 `cat focus.txt` 那行 —— 当前在专注的事 */
  focus: '工作日学习，休息日游乐',
  /** 终端侧栏 `whoami` 后面那行 —— 身份标签 */
  role: '学生 · 业余开发者',
  /** 站点描述，用于 meta description（SEO / 分享卡片） */
  description: '一个高二学生的个人博客：学习、代码，和一些折腾的记录。',
  /** 常用邮箱，首页 Contact 点一下就能复制；RSS 也用这个 */
  email: 'JiangJT_1021@163.com',
  /** 坐标 */
  location: '中国 · 广东',
  /** 博客域名或服务器地址 */
  url: 'http://192.168.31.149',
  /** 从哪一年开始写博客 / 写代码，用于 About 与统计 */
  since: 2020,
};

export const nav = [
  { label: 'Posts', href: '#posts' },
  { label: 'Work', href: '#work' },
  { label: 'Notes', href: '#notes' },
  { label: 'About', href: '#about' },
];

/**
 * Hero 下方四个数据槽。
 * 数字以后文章/项目多了直接改这里。
 */
export const stats = [
  { num: '—', suffix: '', label: 'Articles' },
  { num: '—', suffix: '', label: 'Projects' },
  { num: '5', suffix: '+', label: 'Years' },
  { num: '∞', suffix: '', label: 'Curiosity' },
];

export const marquee = [
  'BUILD', 'WRITE', 'BREAK', 'LEARN', 'SHIP',
  'BUILD', 'WRITE', 'BREAK', 'LEARN', 'SHIP',
];

/**
 * 精选项目 / 实验 —— 首页 Bento 网格。
 * 目前是 4 个空位（项目还没做出来，先留位置）。
 *
 * 有项目之后，把对应那条改成这样就行：
 *   { idx: '01', title: '项目名', badge: 'Open Source', desc: '一句话讲清它解决什么问题。',
 *     tags: ['TypeScript', 'Astro'], span: 'wide' }   // 去掉 placeholder: true
 *
 * 字段说明：
 *   idx   左上角序号（保持两位数）
 *   title 项目名
 *   badge 右上角标签，一般用 Open Source / Tool / Experiment
 *   desc  一两句话讲清它解决什么问题
 *   tags  技术栈，2~3 个就够
 *   span  'wide' 表示占两格宽度（Bento 的视觉节奏）
 *   去掉 placeholder 后虚线框会变成实线，文字恢复正常颜色
 */
export const works = [
  { idx: '01', title: '—', badge: '—', desc: '项目占位，待填写。', tags: ['—', '—'], span: 'wide', placeholder: true },
  { idx: '02', title: '—', badge: '—', desc: '项目占位，待填写。', tags: ['—', '—'], placeholder: true },
  { idx: '03', title: '—', badge: '—', desc: '项目占位，待填写。', tags: ['—', '—'], placeholder: true },
  { idx: '04', title: '—', badge: '—', desc: '项目占位，待填写。', tags: ['—', '—'], placeholder: true },
];

/** 项目区标题下的一句话。有项目之后可以换成别的说法。 */
export const worksLede = '还没什么拿得出手的东西 —— 先把位置留着，做出来了就填进来。';

/**
 * 关于我 —— 首页 About 区块。
 * 段落里可以用 <strong> 之类的行内标签（模板里按 HTML 渲染）。
 */
export const about = {
  /** About 的标题 */
  title: '工作日学习，休息日游乐',
  /** 正文段落，想写几段就加几段 */
  paragraphs: [
    `我叫江枫，也可以叫我 Jiang1021（打游戏的时候会用 ${site.handleGame}）。大概是 2020 年接触的编程，然后零零散散学了一点。目前会读代码，但是写代码有点困难。`,
    '这个博客也是自己折腾的，算是第三个正式开始写的项目了吧。未来期待在空闲时间写多点别的东西。',
  ],
  /** 右下方格，键值对；坐标会自动用上面的 location */
  facts: [
    { k: '身份', v: site.role },
    { k: '主机', v: 'Debian 13 / i3-4005U · 客厅的旧笔记本' },
    { k: '编程龄', v: '2020 年至今' },
    { k: '坐标', v: site.location },
  ],
};

/**
 * 最近更新 —— 首页 Journal 列表。
 * TODO：接上 Astro 内容集合后这里会自动生成，现在先占位。
 */
export const posts = [
  { date: '—', title: '文章占位，待填写', tag: '—', len: '—', placeholder: true },
  { date: '—', title: '文章占位，待填写', tag: '—', len: '—', placeholder: true },
  { date: '—', title: '文章占位，待填写', tag: '—', len: '—', placeholder: true },
  { date: '—', title: '文章占位，待填写', tag: '—', len: '—', placeholder: true },
  { date: '—', title: '文章占位，待填写', tag: '—', len: '—', placeholder: true },
  { date: '—', title: '文章占位，待填写', tag: '—', len: '—', placeholder: true },
];

/**
 * 碎碎念 —— 一行一条的短想法。
 * 这个可以保留我写的那几条（跟技术/折腾有关），也可以全换成你自己的。
 */
export const notes = [
  { date: '—', text: '碎碎念占位，待填写。' },
  { date: '—', text: '碎碎念占位，待填写。' },
  { date: '—', text: '碎碎念占位，待填写。' },
  { date: '—', text: '碎碎念占位，待填写。' },
];

/**
 * Presence 卡片 —— "现在进行时"的两张卡。
 * 音乐卡已按你的选择去掉（要接真数据得配后端，先不做）。
 * GitHub 卡留着，下面三个数字是手写的；以后想自动拉真实数据，
 * 可以改成构建时请求 https://api.github.com/users/Jiang1021。
 */
export const presence = {
  github: {
    enabled: true,
    user: 'Jiang1021',
    repos: 1,
    followers: 0,
    commits: 0,
  },
};

/**
 * 顶栏的「灵动岛」播放器。
 *
 * 音频与封面文件都放在 public/media/ 下，由另一个流程转码生成；
 * manifest.json 里有实测的时长、体积和封面尺寸。
 * 想换歌：把新文件放进 public/media/，改下面的 title / artist / album /
 * sources / cover / 歌词文件路径即可，组件代码不用动。
 */
export const player = {
  /** 默认音量 0~1（首次访问时；之后以 localStorage 的 b0-player-volume 为准） */
  volume: 0.72,
  /** 是否等用户碰到小岛才加载播放器脚本。参考站就是这么做的：首屏不为播放器付流量 */
  lazy: true,
  /** 曲目的网易云链接在 tracks[].externalUrl，岛的星标会跟着当前曲目变 */
  /** 歌词整体偏移（秒）。正数让歌词推迟出现，负数提前 */
  lyricsOffset: 0,
};

/**
 * 播放列表。当前只有两首：
 *   1. 万能青年旅店《采石》 —— 默认曲目（components/DynamicIsland.astro 里读 tracks[0]）
 *   2. 蔡徐坤《Don't Call》 —— 封面来自 D:\Download\Don't call.jpg
 *
 * 音频与封面都在 public/media/ 下，由 ffmpeg 转码生成；manifest.json 里有实测时长与体积。
 * 想加歌：把文件放进 public/media/，在这里 push 一条即可，组件与播放器代码都不用动。
 */
export const tracks = [
  {
    id: 'cai-shi',
    title: '采石',
    artist: '万能青年旅店',
    album: '冀西南林路行',
    /** 秒；由 ffmpeg 实测（public/media/manifest.json）。播放器加载元数据后会用 audio.duration 覆盖 */
    duration: 536.17,
    lyrics: '/media/cai-shi.lrc',
    cover: {
      webp: '/media/cai-shi-cover.webp',
      jpg: '/media/cai-shi-cover.jpg',
    },
    sources: [
      { src: '/media/cai-shi.opus', type: 'audio/ogg; codecs=opus' },
      { src: '/media/cai-shi.mp3', type: 'audio/mpeg' },
    ],
    /** 在网易云音乐里打开这首歌（岛上的星标按钮） */
    externalUrl: 'https://music.163.com/song?id=1974443814',
  },
  {
    id: 'dont-call',
    title: "Don't Call",
    artist: '蔡徐坤',
    album: 'KUN',
    duration: 249.93,
    lyrics: '/media/dont-call.lrc',
    cover: {
      webp: '/media/dont-call-cover.webp',
      jpg: '/media/dont-call-cover.jpg',
    },
    sources: [
      { src: '/media/dont-call.opus', type: 'audio/ogg; codecs=opus' },
      { src: '/media/dont-call.mp3', type: 'audio/mpeg' },
    ],
    /** 没查到这首歌的确切 song id，先用网易云搜索页，别乱填 id */
    externalUrl: "https://music.163.com/#/search/m/?s=Don't%20Call%20%E8%94%A1%E5%BE%90%E5%9D%A4",
  },
];

/** 默认曲目（灵动岛首屏显示的那首）。播放器会在两首之间循环切换。 */
export const track = tracks[0];

/**
 * 社交链接。只留了你在用的两个；要加就照格式加一行，
 * 页脚与 Contact 会自动同步。
 */
export const socials = [
  { label: 'GitHub', href: 'https://github.com/Jiang1021' },
  { label: 'BiliBili', href: 'https://space.bilibili.com/2018896628' },
];
