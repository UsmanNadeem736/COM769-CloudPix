import 'dotenv/config'
import mongoose from 'mongoose'
import bcrypt from 'bcryptjs'
import User    from '../models/User.js'
import Photo   from '../models/Photo.js'
import Comment from '../models/Comment.js'

const MONGODB_URI = process.env.MONGODB_URI
if (!MONGODB_URI) { console.error('MONGODB_URI not set'); process.exit(1) }

const USERS = [
  { firstName:'Alexandra', lastName:'Kane',    email:'alex@lumora.dev',  password:'lumora123', handle:'@alex.kane',  role:'creator',  avatar:'p10' },
  { firstName:'James',     lastName:'Okafor',  email:'james@lumora.dev', password:'lumora123', handle:'@james.ok',   role:'creator',  avatar:'p20' },
  { firstName:'Chloe',     lastName:'Renard',  email:'chloe@lumora.dev', password:'lumora123', handle:'@chloe.r',    role:'creator',  avatar:'p30' },
  { firstName:'Nuala',     lastName:'Fitzroy', email:'nuala@lumora.dev', password:'lumora123', handle:'@nuala.f',    role:'creator',  avatar:'p40' },
  { firstName:'Demo',      lastName:'Consumer',email:'demo@lumora.dev',  password:'lumora123', handle:'@demo.user',  role:'consumer', avatar:'demo_c' },
]

const PHOTO_SEEDS = [
  { title:'Golden Hour Reflections', caption:'The canal at dusk — light fragmented across still water.', location:'Venice, Italy',     people:['@marco_v','@sofia_r'], tags:['landscape','travel','golden-hour'], imageUrl:'https://picsum.photos/seed/lumora10/600/820', creatorIdx:0 },
  { title:'Kyoto in Bloom',          caption:'Sakura season is fleeting — I woke at 4am to have the path to myself.', location:'Kyoto, Japan',    people:['@hana_t'], tags:['japan','travel','nature'], imageUrl:'https://picsum.photos/seed/lumora20/600/450', creatorIdx:1 },
  { title:'Urban Geometry',          caption:'Looking straight up in Midtown — the city becomes pure abstraction.', location:'New York, USA',   people:[], tags:['architecture','urban','abstract'], imageUrl:'https://picsum.photos/seed/lumora30/600/750', creatorIdx:0 },
  { title:'Desert Dunes at Sunrise', caption:'Ninety minutes of hiking. Worth every step.', location:'Merzouga, Morocco', people:['@leila_m','@yusuf_a'], tags:['desert','landscape','africa'], imageUrl:'https://picsum.photos/seed/lumora40/600/400', creatorIdx:2 },
  { title:'The Portrait Studio',     caption:'Natural north light only — no flash, no fill, no apology.', location:'Berlin, Germany',  people:['@max_b'], tags:['portrait','studio','bw'], imageUrl:'https://picsum.photos/seed/lumora50/600/900', creatorIdx:3 },
  { title:'Monsoon Season',          caption:'Standing in the rain for forty minutes produced this one frame.', location:'Jaipur, India',   people:[], tags:['travel','rain','india'], imageUrl:'https://picsum.photos/seed/lumora60/600/500', creatorIdx:1 },
  { title:'Nordic Winter Light',     caption:'Six hours of diffused winter sun — the blue hour lasts all afternoon here.', location:'Tromsø, Norway',  people:['@erik_h'], tags:['norway','winter','landscape'], imageUrl:'https://picsum.photos/seed/lumora70/600/680', creatorIdx:2 },
  { title:'Café Geometry',           caption:'Paris in February. A café table, strong espresso, and an hour to observe.', location:'Paris, France',   people:['@isabelle_d'], tags:['paris','cafe','street'], imageUrl:'https://picsum.photos/seed/lumora80/600/420', creatorIdx:3 },
  { title:'High Atlas Portraits',    caption:'A community that has barely changed in five centuries.', location:'High Atlas, Morocco', people:['@fatima_z','@ahmed_k'], tags:['portrait','travel','africa'], imageUrl:'https://picsum.photos/seed/lumora90/600/800', creatorIdx:0 },
  { title:'Tokyo Neon Reflections',  caption:'Shibuya on a wet Tuesday night — the rain makes everything electric.', location:'Tokyo, Japan',    people:[], tags:['japan','urban','night'], imageUrl:'https://picsum.photos/seed/lumora11/600/450', creatorIdx:1 },
  { title:'Amalfi Light',            caption:'The light here changes so quickly — you get maybe three minutes of this.', location:'Amalfi, Italy',   people:['@giulia_r'], tags:['italy','landscape','coastal'], imageUrl:'https://picsum.photos/seed/lumora12/600/700', creatorIdx:2 },
  { title:'The Empty Auditorium',    caption:'Post-concert silence is its own kind of music.', location:'Vienna, Austria', people:[], tags:['architecture','indoor','bw'], imageUrl:'https://picsum.photos/seed/lumora13/600/550', creatorIdx:3 },
]

async function seed() {
  await mongoose.connect(MONGODB_URI)
  console.log('Connected. Seeding…')

  await Promise.all([User.deleteMany({}), Photo.deleteMany({}), Comment.deleteMany({})])

  const users = await Promise.all(USERS.map(async u => {
    const hashed = await bcrypt.hash(u.password, 12)
    return User.create({ ...u, password: hashed })
  }))

  const photos = await Promise.all(PHOTO_SEEDS.map(p => {
    const { creatorIdx, ...rest } = p
    return Photo.create({ ...rest, creator: users[creatorIdx]._id })
  }))

  const sampleComments = [
    'The light in this is extraordinary.',
    'Composition is absolutely perfect.',
    'This is breathtaking — well done!',
    'Shot on what gear?',
    'This makes me want to travel.',
    'The colour grading here is on point.',
  ]

  const consumer = users[4]
  for (const photo of photos.slice(0, 6)) {
    await Comment.create({
      photo:          photo._id,
      author:         consumer._id,
      text:           sampleComments[photos.indexOf(photo)],
      sentimentScore: 2,
      sentimentLabel: 'positive',
    })
    photo.likes.push(consumer._id)
    photo.ratings.push({ user: consumer._id, value: 5 })
    await photo.save()
  }

  console.log(`Seeded ${users.length} users, ${photos.length} photos.`)
  console.log('Demo logins:')
  console.log('  Consumer: demo@lumora.dev / lumora123')
  console.log('  Creator:  alex@lumora.dev / lumora123')
  await mongoose.disconnect()
}

seed().catch(err => { console.error(err); process.exit(1) })
