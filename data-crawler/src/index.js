const puppeteer = require('puppeteer-core');
const assert = require('assert');
const browserExecPath = 'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe';
const getPlayerBackgoundInfo = require('./playerBackground');
const getPlayerAvgMatchData = require('./playerAvgMatchData');
const getConection = require('./mongoUtil');
const avaiablePrefiex = [
    'A', 'B', 'C', 'D', 'E',
    'F', 'G', 'H', 'I', 'J',
    'K', 'L', 'M', 'N', 'O',
    'P', 'Q', 'R', 'S', 'T',
    'U', 'V', 'W', 'X', 'Y',
    'Z'    
];
let playerNameLinkMap = new Map();

(async () => {
    const browser = await puppeteer.launch({ headless: true, executablePath: browserExecPath });
    const page = await browser.newPage();
    for (let prefix of avaiablePrefiex) {
        await page.goto(`http://www.stat-nba.com/playerList.php?il=${prefix}&lil=0`);
        let elements = await page.$$('.playerList');
        let playerNameLinks = await elements[elements.length - 1].$$eval('div > a', function (players) {
            return players.map(player => ({
                href: player.href, 
                name: player.firstElementChild.textContent.trim()
            }));
        });
        console.log(`---------------------  ${prefix}  ---------------------`);
        for (let p of playerNameLinks) {
            if (!playerNameLinkMap.has(p.name)) {
                playerNameLinkMap.set(p.name, p.href);
            } else if (playerNameLinkMap.has(p.name) && playerNameLinkMap.get(p.name) === p.href) {
                console.log(`出现重复数据${p.name}`);
                process.exit(1);
            } else {
                let regNum = /([0-9]*)/i;
                let suffix = p.href.match(regNum)[1];
                console.log(suffix);
                playerNameLinkMap.set(p.name + '-' + suffix, p.href);
            }
            console.log(p.href);
        }
    }

    // 遍历球员的页面链接，获取球员的详细数据，存入到 mongodb 中
    const db = await getConection(); // 获取 mongo 操作对象
    let counter = 0;
    let res = [];
    for (let mixName of playerNameLinkMap.keys()) {
        await page.goto(playerNameLinkMap.get(mixName));
        let currentPlayer = {};
        let playerBackground = await getPlayerBackgoundInfo(page);
        let playerAvgMatchData = await getPlayerAvgMatchData(page);
        currentPlayer.mix_name = mixName;
        currentPlayer.background = playerBackground;
        currentPlayer.regular_season = playerAvgMatchData;
        res.push(currentPlayer);
        if (counter++ > 20) {
            await insertData(db, res);
            counter = 0;
            res = [];
        }
    }
    if (counter > 0) {
        await insertData(db, res);
        counter = 0;
    }
    

    process.exit(0);
})();


async function insertData(db, arr) {
    let insertRes = await db.collection('player_data').insertMany(arr);
    assert.equal(arr.length, insertRes.insertedCount);
}