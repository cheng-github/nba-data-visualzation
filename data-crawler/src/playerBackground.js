const puppeteer = require('puppeteer-core');
const nameValueMapper = {
    "全　　名": "full_name",
    "位　　置": "position",
    "身　　高": "height",
    "体　　重": "weight",
    "出生日期": "birthday",
    "出生城市": "birth_city",
    "高　　中": "high_school",
    "大　　学": "university",
    "球衣号码": "jersey_numbers",
    "选秀情况": "talent_show_status",
    "当前薪金": "current_salary",
};
const infoKeys = Object.keys(nameValueMapper);



async function getPlayerBackgoundInfo(page) {
    let playerInfo = await page.$$eval('.detail > div', handlePlayBackgound, nameValueMapper, infoKeys);
    return playerInfo;
}


function handlePlayBackgound(playerDetail) {
    let nameValueMapper = arguments[1];
    let infoKeys = arguments[2];
    let playerInfo = Object.create(null);
    // 获取运动员个人信息
    for (let node of playerDetail) {
        // 如果是球衣号码一栏，单独拉出来提取
        if (node.id === 'numberDetail') {
            let allChildNodes = node.childNodes;
            let number_info = [];
            for (innerNode of allChildNodes) {
                if (innerNode.tagName === "DIV" && innerNode.className === "column") {
                    number_info.push({ number: innerNode.textContent.trim(), team: innerNode.nextSibling.textContent.trim() });
                }
            }
            playerInfo.number_detail = number_info;
            continue;
        }
        let row = node.textContent.split(':');
        if (infoKeys.includes(row[0])) {
            let value = row[1];
            if (row[0] === '球衣号码') {
                let endIndex = value.indexOf("详情");
                value = value.slice(0, endIndex === -1 ? undefined : endIndex).trim();
            } else if (row[0] === '选秀情况') {
                let endIndex = value.indexOf("选秀一览");
                value = value.slice(0, endIndex === -1 ? undefined : endIndex).trim();
            } else if (row[0] === '当前薪金') {
                let endMoneyReg = /.*美元/;
                let matchResult = value.match(endMoneyReg);
                value = matchResult ? matchResult[0] : row[1].trim();
            } 
            playerInfo[nameValueMapper[row[0]]] = value;
        }
    }

    return playerInfo;
}


/* (async function () {
    const browserExecPath = 'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe';
    const browser = await puppeteer.launch({ headless: true, executablePath: browserExecPath });
    const page = await browser.newPage();
    getPlayerBackgoundByUrl('http://www.stat-nba.com/player/45.html', page);
})();
 */

module.exports = getPlayerBackgoundInfo;