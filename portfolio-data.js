/* 独立预览：只使用现有作品资料；职责按工作经历说明，不推断单条视频分工。 */
const projects = [
  {id:"pukang-infoflow",short:"璞康数据",direction:"3C 信息流素材",company:"上海璞康数据科技有限公司",position:"信息流内容编导 / 项目内容运营",period:"2026.02 — 至今",title:"3C 数码信息流素材",roles:["内容策略","选题脚本","拍摄剪辑统筹","素材迭代","AI 辅助"],summary:"服务大疆、联想等 3C 数码品牌，围绕产品卖点与消费场景，参与信息流素材的策划、制作与内容迭代。",description:"围绕产品卖点与使用场景，展示 3C 数码信息流内容的表达方式。",primary:"3C 信息流主推作品"},
  {id:"doctor-ip",short:"知识矩阵",direction:"医生 IP 内容",company:"杭州知识矩阵信息科技有限公司",position:"短视频内容策划 / IP 内容运营",period:"2024.10 — 2025.10",title:"医生 IP 内容策划",roles:["内容方向","选题策划","脚本优化","内容运营","风格迭代"],summary:"参与医生 IP 的全平台内容运营，围绕账号定位、用户关注与热点，负责内容方向、选题策划和脚本优化。",description:"收录医生 IP 项目中的内容样片，展示科普内容与短视频表达的结合。",primary:"医生 IP 主推作品"},
  {id:"laofengxiang",short:"老凤祥",direction:"珍珠电商视频",company:"老凤祥股份有限公司 / 杭州沪联文化科技有限公司",position:"电商内容负责人",period:"2023.12 — 2024.06",title:"珍珠电商内容与视觉制作",roles:["内容规划","脚本策划","模特拍摄","视觉拍摄统筹","直播内容"],summary:"围绕老凤祥珍珠天猫、京东旗舰店，规划商品视频、模特展示与直播内容，统筹商品视觉素材制作。",description:"围绕珍珠产品与佩戴场景，展示电商视频中的商品表达。",primary:"珍珠电商主推作品"},
  {id:"ruanshi",short:"阮仕珍珠",direction:"珠宝种草与展示",company:"浙江阮仕珍珠股份有限公司",position:"短视频内容运营 / 编拍剪",period:"2023.02 — 2023.12",title:"珠宝种草与产品展示",roles:["内容策划","产品拍摄","视频剪辑","账号运营","直播切片"],summary:"围绕高客单价珍珠产品的卖点、佩戴场景与用户需求，制作产品宣传、商品展示及直播切片内容。",description:"通过产品细节与场景展示，呈现珍珠饰品的视频内容。",primary:"珠宝短视频主推作品"},
  {id:"wuling",short:"五菱汽车",direction:"汽车新媒体内容",company:"金华五菱汽车销售有限公司",position:"新媒体内容运营 / 编拍剪",period:"2022.03 — 2023.02",title:"汽车新媒体视频内容",roles:["内容规划","选题文案","视频拍摄","剪辑制作","账号运营"],summary:"结合汽车产品卖点、门店营销节点与平台热点，参与品牌账号的内容规划、拍摄与运营。",description:"收录汽车品牌与门店项目中的视频作品，呈现场景化内容表达。",primary:"汽车短视频主推作品"},
  {id:"saber-tooth",short:"剑齿虎传媒",direction:"宣传片与活动记录",company:"金华剑齿虎文化传媒有限公司",position:"视频后期 / 摄影摄像",period:"2021.07 — 2022.03",title:"宣传片拍摄与后期制作",roles:["前期沟通","现场拍摄","视频剪辑","后期包装","项目交付"],summary:"参与政府及企业宣传片项目，承担前期沟通、现场拍摄、视频剪辑与交付，积累镜头语言与后期制作经验。",description:"收录宣传片项目中的视频样片，展示拍摄与后期制作基础。",primary:"宣传片主推作品"}
];
const library = window.localVideoLibrary || {};
const metadata = window.previewVideoMetadata || {};
const CDN = String(window.VIDEO_CDN_BASE_URL || "https://mazhean-video-portfolio-1342835145.cos.ap-guangzhou.myqcloud.com").replace(/\/$/,"");
const escapeHTML = value => String(value ?? "").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const titles = {
  "pukang-infoflow":["3C 信息流主推作品","数码产品混剪种草","大字报信息流素材","产品创意宣传"],
  "doctor-ip":["医生 IP 主推作品","科普口播","科普演绎","综艺感科普"],
  "laofengxiang":["珍珠电商主推作品","珍珠佩戴展示","珠宝口播种草","珍珠种草混剪"],
  "ruanshi":["珠宝短视频主推作品","珍珠产品展示","珍珠佩戴展示","珠宝场景展示"],
  "wuling":["汽车短视频主推作品","汽车新品宣传","门店活动混剪","汽车口播种草"],
  "saber-tooth":["宣传片主推作品","活动记录"],
  "ai-video":["AI 大疆产品场景展示","AI 大疆运动场景广告","AI 大疆产品创意短片"]
};
function videosFor(id){return (library[id] || []).map((video,index)=>({...video,projectId:id,index,title:titles[id]?.[index] || video.title,...metadata[video.url]}));}
function posterFor(video){return ""+(video.poster || video.cover || "assets/social-card.png");}
function durationLabel(seconds){if(!Number.isFinite(Number(seconds)))return "";const value=Math.round(Number(seconds));return `${String(Math.floor(value/60)).padStart(2,"0")}:${String(value%60).padStart(2,"0")}`;}
function metaHTML(video,isExperiment=false){return [isExperiment?"AI 实验":video.format,durationLabel(video.durationSeconds)].filter(Boolean).map(item=>`<span>${escapeHTML(item)}</span>`).join("");}
function playAttributes(video){return `data-play="${video.projectId}" data-index="${video.index}" aria-label="播放${escapeHTML(video.title)}"`;}
