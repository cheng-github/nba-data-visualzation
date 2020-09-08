const MongoClient = require('mongodb').MongoClient;
const assert = require('assert');

const url = 'mongodb://localhost:27017';
const dbName = 'NBA_PLAYER_STAT';
let db;


async function getConection() {
    if (db) {
        return db;
    }
    const client = new MongoClient(url, { useUnifiedTopology: true });
    await client.connect();
    
    db = client.db(dbName);
    return db;
}

module.exports = getConection;


