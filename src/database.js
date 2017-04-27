const Promise = require('bluebird')
const MongoDB = Promise.promisifyAll(require('mongodb'))
const MongoClient = Promise.promisifyAll(MongoDB.MongoClient)

const state = {
  db: undefined,
}

exports.connect = async () => {
  if (state.db) return
  state.db = await MongoClient.connectAsync('mongodb://localhost:27017/nb-bot')
  return state.db
}
exports.db = async () => {
  return await exports.connect()
}

exports.tryMakeStats = async (collection) => {
  const test = await collection.findOne({team: 'nb!'})
  if (!test) {
    collection.insert([{
      team: 'nb!',
      wins: 0,
      losses: 0,
    }])
  }
}
exports.getStats = async () => {
  try {
    const collectionS = await state.db.collection('stats')
    await exports.tryMakeStats(collectionS)
    const results = await collectionS.findOne({team: 'nb!'})
    return {
      wins: results.wins,
      losses: results.losses,
    }
  } catch (e) {
    throw e
  }
}
exports.getStatsTimes = async () => {
  try {
    const collectionT = await state.db.collection('stats-time')
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
exports.setStats = async (wins, losses) => {
  try {
    const collectionS = await state.db.collection('stats')
    await module.exports.tryMakeStats(collectionS)
    await collectionS.update({team: 'nb!'}, {
      $set: {
        wins: wins,
        losses: losses,
      },
    })
    const collectionT = await state.db.collection('stats-time')
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
