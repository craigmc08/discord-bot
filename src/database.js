const Promise = require('bluebird')
const MongoDB = Promise.promisifyAll(require('mongodb'))
const MongoClient = Promise.promisifyAll(MongoDB.MongoClient)

module.exports.connect = async () => {
  try {
    const db = await MongoClient.connectAsync('mongodb://localhost:27017/nb-bot')
    return db
  } catch (e) {
    throw e
  }
}
module.exports.collection = async (name) => {
  try {
    const db = await module.exports.connect()
    return await db.collection(name)
  } catch (e) {
    throw e
  }
}

module.exports.tryMakeStats = async (collection) => {
  const test = await collection.findOne({team: 'nb!'})
  if (!test) {
    collection.insert([{
      team: 'nb!',
      wins: 0,
      losses: 0,
    }])
  }
}
module.exports.getStats = async () => {
  try {
    const collectionS = await module.exports.collection('stats')
    await module.exports.tryMakeStats(collectionS)
    const results = await collectionS.findOne({team: 'nb!'})
    return {
      wins: results.wins,
      losses: results.losses,
    }
  } catch (e) {
    throw e
  }
}
module.exports.getStatsTimes = async () => {
  try {
    const collectionT = await module.exports.collection('stats-time')
    const cursor = await collectionT.find({
      team: 'nb!'
    }, {
      sort: 'time'
    })
    return cursor
  } catch (e) {
    throw e
  }
}
module.exports.setStats = async (wins, losses) => {
  try {
    const collectionS = await module.exports.collection('stats')
    await module.exports.tryMakeStats(collectionS)
    await collectionS.update({team: 'nb!'}, {
      $set: {
        wins: wins,
        losses: losses,
      },
    })
    const collectionT = await module.exports.collection('stats-time')
    const doc = {
      time: Date.now(),
      team: 'nb!',
      wins: wins,
      losses: losses,
    }
    collectionT.insert([doc])
    return
  } catch (e) {
    throw e
  }
}
