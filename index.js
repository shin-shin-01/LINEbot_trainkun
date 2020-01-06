// ---------------------------------------------------
// モジュールのインポート
const server = require('express')();
// Messaging APIのSDKをインポート
const line = require('@line/bot-sdk');
// Scraping
process.env.NODE_TLS_REJECT_UNAUTHORIZED = 0;  // SSL証明書検証エラーを無視する設定
const cheerio = require('cheerio-httpcli');

// ---------------------------------------------------
// パラメータ設定
const line_config = {
  channelAccessToken: process.env.LINE_ACCESS_TOKEN,
  channelSecret: process.env.LINE_CHANNEL_SECRET
};

// ---------------------------------------------------
// Webサーバ設定
server.listen(process.env.PORT || 3000);
// APIコールのためのクライアントインスタンスを作成
const bot = new line.Client(line_config);

// ----------------------------------------------------
// ルーター設定
server.post('/bot/webhook', line.middleware(line_config), (req, res, next) => {
  // 先行してLINE側にステータスコード200でレスポンスする
  res.sendStatus(200);

  Promise.all(req.body.events.map(handleEvent));
});

// ----------------------------------------------------
async function handleEvent(event){
  if(event.type == "message" && event.message.type == "text"){

    var res = await getTrainTime();
    var response = res.join('/')
    // console.log(repp)

     responsemsg = {
         type: "text",
         text: response
      };

  }// if-end
  return bot.replyMessage(event.replyToken, responsemsg);
} // function-end


async function getTrainTime(){
  const cheerioObject = await cheerio.fetch('https://www.jrkyushu-timetable.jp/cgi-bin/sp/sp-tt_dep.cgi/2955100/');
  let lists = cheerioObject.$('span').text();
  let replyMessage = [];

  lists = lists.trim().replace(/\t/g, "").replace(/\n+/g, ",").split(",");

  lists.forEach((list) => {
    replyMessage.push(list.trim());
  });

  console.log(replyMessage);
  return replyMessage;
}
