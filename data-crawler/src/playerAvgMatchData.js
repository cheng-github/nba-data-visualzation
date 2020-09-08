const puppeteer = require('puppeteer-core');
const browserExecPath = 'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe';
const seasonNameValueMapper = {
    "赛季": "season",
    "球队": "team",
    "出场": "appearances_count",
    "首发": "starter_count",
    "时间": "playing_time",
    "投篮": "field_goal_percentage",
    "命中": "field_goal_count",
    "出手": "shot_count",
    "三分": "three_point_shot_percentage",
    "命中_三分": "three_point_goal_count",
    "出手_三分": "three_point_shot_count",
    "罚球": "free_throw_percentage",
    "命中_罚球": "free_throw_goal_count",
    "出手_罚球": "free_throw_shot_count",
    "篮板": "rebound_count",
    "前场": "offensive_rebound",
    "后场": "defensive_rebound",
    "助攻": "assist",
    "抢断": "steal",
    "盖帽": "blocks_shots",
    "失误": "faults",
    "犯规": "foul",
    "得分": "average_points",
    "胜": "victory",
    "负": "defeat"
};
const statNameValueMapper = {
    "NBA生涯": "career",
    "效力球队": "team_count",
    "出场": "appearances_count",
    "首发": "starter_count",
    "时间": "playing_time",
    "投篮": "field_goal_percentage",
    "命中": "field_goal_count",
    "出手": "shot_count",
    "三分": "three_point_shot_percentage",
    "命中_三分": "three_point_goal_count",
    "出手_三分": "three_point_shot_count",
    "罚球": "free_throw_percentage",
    "命中_罚球": "free_throw_goal_count",
    "出手_罚球": "free_throw_shot_count",
    "篮板": "rebound_count",
    "前场": "offensive_rebound",
    "后场": "defensive_rebound",
    "助攻": "assist",
    "抢断": "steal",
    "盖帽": "blocks_shots",
    "失误": "faults",
    "犯规": "foul",
    "得分": "average_points",
    "胜": "victory",
    "负": "defeat"
};
// 记录单个赛季的数据列
let singleSeasonTableColumnName = [];


async function getPlayerAvgMatchData(page) {
    await mountFuncToBrowser(page);
    // 获取头部的位置和对应的 name 值
    singleSeasonTableColumnName = await page.$$eval('#stat_box_avg > thead > tr > th', handlerSeasonColumn);
    
    // 获取赛季场均数据，由于会出现一些球员在同一赛季不同球队打过的情况，所以会有一个叫做总和的东西
    // 另外需要注意的是，单个赛季会有一个 class 属性，而最后的总和没有
    // 而且，这里不可以在 $$ 方法传递回调方法里做操作，因为，方法只接收一个参数
    let res = await page.$$eval('#stat_box_avg > tbody > tr', (rows, 
        singleSeasonTableColumnName, seasonNameValueMapper, statNameValueMapper
        ) => {
        let season_arr = [];
        for (let row of rows) {
            // 两种类型，另外一种是总计数据
            if (row.className === "sort") {
                season_arr.push(handleSeasonData(row.children, singleSeasonTableColumnName, seasonNameValueMapper));
            } else {
                // 这里有两行数据，分别是统计表头和总计数据
                // 注意 children 和 childNodes 的区别，他们区别在于前者不会将换行看作一个 text 节点，而后者会
                // 同样，nextSibling 是指的是在 childNodes 的下一个兄弟节点，而nextElementSibling 则是指的是 children 
                // 中的下一个节点
                // 这里我们需要遍历 td 节点，所以选择了 children 而不是 childNodes
                let statDataRow = row.nextElementSibling;
                let columnNodes = row.children;
                let dataNodes = statDataRow.children;
                season_arr.push(handleStaData(columnNodes, dataNodes, statNameValueMapper));
                break;
            }
        }
        return season_arr;
    }, 
    /* 三个分别对应的数列数据的提取方法，之前获取的表头的列数组，以及表头列文字和数据库字段的映射对象 */
    singleSeasonTableColumnName, seasonNameValueMapper,
    /* 处理统计数据 */
    statNameValueMapper
    );
    
    
    return res;
}

// 可使用 JSHandle 将需要执行的函数挂载到浏览器执行上下文中
async function mountFuncToBrowser(page) {
    page.evaluateHandle(() => {
        function handleSeasonData(nodes) {
            let tableColumnName = arguments[1];
            let seasonNameValueMapper = arguments[2];
            // 遍历节点拿到各个赛季数据
            let currentSeasonData = Object.create(null);
            for (let i = 0, l = nodes.length; i < l; i++) {
                if (!tableColumnName[i] || !seasonNameValueMapper[tableColumnName[i]]) {
                    continue;
                }
                currentSeasonData[seasonNameValueMapper[tableColumnName[i]]] = nodes[i].textContent.trim();
            }
            return currentSeasonData;
        }

        function handleStaData(columns, dataRow, statNameValueMapper) {
            let statData = Object.create(null);
            let statTableColumnName = [];
            for (let column of columns) {
                statTableColumnName.push(column.textContent.trim());
            }
            for (let i = 0, l = dataRow.length; i < l; i++) {
                if (!statTableColumnName[i] || !statNameValueMapper[statTableColumnName[i]]) {
                    continue;
                }
                statData[statNameValueMapper[statTableColumnName[i]]] = dataRow[i].textContent.trim();
            }

            return statData;
        }

        window.handleSeasonData = handleSeasonData;
        window.handleStaData = handleStaData;
    })
}

function handlerSeasonColumn(columns) {
    let tableColumnName = [];
    for (let column of columns) {
        let value = column.textContent.trim();
        if (value === "命中" || value === "出手") {
            value = tableColumnName.includes(value) ?
                tableColumnName.includes(value + "_三分") ?
                    value + "_罚球" :
                    value + "_三分" :
                value;
        }
        tableColumnName.push(value);
    }
    return tableColumnName;
}

/* (async () => {
    const browser = await puppeteer.launch({ 
        headless: false, 
        slowMo: 250, // slow down by 250ms
        devtools: true,
        executablePath: browserExecPath });
    const page = await browser.newPage();
    getPlayerAvgMatchData('http://www.stat-nba.com/player/45.html', page)
})(); */


module.exports = getPlayerAvgMatchData;