export const PHOTOS = [
  { id:1,  seed:'lumora10', w:600, h:820, title:'Golden Hour Reflections',   caption:'The canal at dusk — light fragmented across still water, each ripple a brushstroke.',  location:'Venice, Italy',    people:['@marco_v','@sofia_r'],  creator:{ id:'c1', name:'Alexandra Kane', handle:'@alex.kane', seed:'p10' }, likes:1843, rating:4.8, ratingCount:212, tags:['landscape','travel','golden-hour'], date:'2026-04-28' },
  { id:2,  seed:'lumora20', w:600, h:450, title:'Kyoto in Bloom',            caption:'Sakura season is fleeting — I woke at 4am to have the path entirely to myself.',          location:'Kyoto, Japan',     people:['@hana_t'],              creator:{ id:'c2', name:'James Okafor',   handle:'@james.ok',  seed:'p20' }, likes:2201, rating:4.9, ratingCount:318, tags:['japan','travel','nature'],      date:'2026-04-15' },
  { id:3,  seed:'lumora30', w:600, h:750, title:'Urban Geometry',            caption:'Looking straight up in Midtown — the city becomes pure abstraction.',                      location:'New York, USA',    people:[],                       creator:{ id:'c1', name:'Alexandra Kane', handle:'@alex.kane', seed:'p10' }, likes:987,  rating:4.5, ratingCount:98,  tags:['architecture','urban','abstract'], date:'2026-04-10' },
  { id:4,  seed:'lumora40', w:600, h:400, title:'Desert Dunes at Sunrise',   caption:'Ninety minutes of hiking. Worth every step.',                                              location:'Merzouga, Morocco',people:['@leila_m','@yusuf_a'],  creator:{ id:'c3', name:'Chloe Renard',   handle:'@chloe.r',   seed:'p30' }, likes:3102, rating:5.0, ratingCount:441, tags:['desert','landscape','africa'],  date:'2026-03-30' },
  { id:5,  seed:'lumora50', w:600, h:900, title:'The Portrait Studio',       caption:'Natural north light only — no flash, no fill, no apology.',                               location:'Berlin, Germany',  people:['@max_b'],               creator:{ id:'c4', name:'Nuala Fitzroy',  handle:'@nuala.f',   seed:'p40' }, likes:1456, rating:4.7, ratingCount:167, tags:['portrait','studio','bw'],       date:'2026-04-02' },
  { id:6,  seed:'lumora60', w:600, h:500, title:'Monsoon Season',            caption:'Standing in the rain for forty minutes produced this one frame.',                          location:'Jaipur, India',    people:[],                       creator:{ id:'c2', name:'James Okafor',   handle:'@james.ok',  seed:'p20' }, likes:2788, rating:4.9, ratingCount:309, tags:['travel','rain','india'],        date:'2026-04-19' },
  { id:7,  seed:'lumora70', w:600, h:680, title:'Nordic Winter Light',       caption:'Six hours of diffused winter sun — the blue hour lasts all afternoon here.',              location:'Tromsø, Norway',   people:['@erik_h'],              creator:{ id:'c3', name:'Chloe Renard',   handle:'@chloe.r',   seed:'p30' }, likes:1923, rating:4.8, ratingCount:224, tags:['norway','winter','landscape'],  date:'2026-03-14' },
  { id:8,  seed:'lumora80', w:600, h:420, title:'Café Geometry',             caption:'Paris in February. A café table, strong espresso, and an hour to observe.',               location:'Paris, France',    people:['@isabelle_d'],          creator:{ id:'c4', name:'Nuala Fitzroy',  handle:'@nuala.f',   seed:'p40' }, likes:1102, rating:4.6, ratingCount:130, tags:['paris','cafe','street'],        date:'2026-04-05' },
  { id:9,  seed:'lumora90', w:600, h:800, title:'High Atlas Portraits',      caption:'A community that has barely changed in five centuries.',                                   location:'High Atlas, Morocco',people:['@fatima_z','@ahmed_k'], creator:{ id:'c1', name:'Alexandra Kane', handle:'@alex.kane', seed:'p10' }, likes:3455, rating:5.0, ratingCount:512, tags:['portrait','travel','africa'],  date:'2026-03-28' },
  { id:10, seed:'lumora11', w:600, h:450, title:'Tokyo Neon Reflections',    caption:'Shibuya on a wet Tuesday night — the rain makes everything electric.',                   location:'Tokyo, Japan',     people:[],                       creator:{ id:'c2', name:'James Okafor',   handle:'@james.ok',  seed:'p20' }, likes:2654, rating:4.9, ratingCount:377, tags:['japan','urban','night'],        date:'2026-04-22' },
  { id:11, seed:'lumora12', w:600, h:700, title:'Amalfi Light',              caption:'The light here changes so quickly — you get maybe three minutes of this.',                location:'Amalfi, Italy',    people:['@giulia_r'],            creator:{ id:'c3', name:'Chloe Renard',   handle:'@chloe.r',   seed:'p30' }, likes:1788, rating:4.7, ratingCount:193, tags:['italy','landscape','coastal'],  date:'2026-04-11' },
  { id:12, seed:'lumora13', w:600, h:550, title:'The Empty Auditorium',      caption:'Post-concert silence is its own kind of music.',                                          location:'Vienna, Austria',  people:[],                       creator:{ id:'c4', name:'Nuala Fitzroy',  handle:'@nuala.f',   seed:'p40' }, likes:987,  rating:4.5, ratingCount:91,  tags:['architecture','indoor','bw'],   date:'2026-04-08' },
]

export const STORIES = [
  { id:'s1', name:'alex.kane',  seed:'p10', hasNew:true  },
  { id:'s2', name:'james.ok',   seed:'p20', hasNew:true  },
  { id:'s3', name:'chloe.r',    seed:'p30', hasNew:false },
  { id:'s4', name:'nuala.f',    seed:'p40', hasNew:true  },
  { id:'s5', name:'marta.v',    seed:'p50', hasNew:false },
  { id:'s6', name:'lee.photo',  seed:'p60', hasNew:true  },
  { id:'s7', name:'oscar.m',    seed:'p70', hasNew:false },
  { id:'s8', name:'yuki.r',     seed:'p80', hasNew:true  },
]

export const ALL_TAGS = ['All','landscape','travel','portrait','urban','architecture','nature','japan','bw','night','africa','coastal']

export const CREATORS = [
  { name:'Alexandra Kane', handle:'@alex.kane', seed:'p10', photos:47 },
  { name:'James Okafor',   handle:'@james.ok',  seed:'p20', photos:38 },
  { name:'Chloe Renard',   handle:'@chloe.r',   seed:'p30', photos:62 },
  { name:'Nuala Fitzroy',  handle:'@nuala.f',   seed:'p40', photos:29 },
]

export const TRENDING = [
  ['landscape',815],['travel',643],['portrait',512],
  ['japan',448],['urban',334],['architecture',298],['bw',210],
]

export const DEMO_USERS = {
  consumer: { id:'demo_consumer', name:'Jamie Reynolds', handle:'@jamie.r', role:'consumer', avatar:'demo_c' },
  creator:  { id:'demo_creator',  name:'Alexandra Kane', handle:'@alex.kane', role:'creator',  avatar:'p10'   },
}
