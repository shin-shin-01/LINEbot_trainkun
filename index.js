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

  if(event.type === 'postback'){
    if(event.postback.data == "九大学研都市"){

      var res = await getTrainTime("00009453", "00007420", "00000016", "0", event.postback.params.time);
      var response = res.join('\n');

       responsemsg = {
           type: "text",
           text: response
        };

    } else if(event.postback.data == "博多"){

      var res = await getTrainTime("00007420", "00009453", "00000836", "1", event.postback.params.time);
      var response = res.join('\n');

       responsemsg = {
           type: "text",
           text: response
        };
      }
  } else {

      responsemsg = {
        type: "template",
        altText: "this is a buttons template",
        template: {
            type: "buttons",
            title: "出発駅＆時刻選択",
            text: "Please select",
          actions:[
            {
            type:"datetimepicker",
            label:"九大学研都市駅発",
            data:"九大学研都市",
            mode:"time"
            },
            {
            type:"datetimepicker",
            label:"博多駅発",
            data:"博多",
            mode:"time"
            }
            ]
        }
         };
    }

  return bot.replyMessage(event.replyToken, responsemsg);
} // function-end


async function getTrainTime( departure, arrival, line,  updown, time){

  //https://www.navitime.co.jp/diagram/depArrTimeList?departure=00009453&arrival=00007420&line=00000016&updown=0&hour=4&date=2020-01-09
  const cheerioObject = await cheerio.fetch('https://www.navitime.co.jp/diagram/depArrTimeList',{departure:departure,arrival:arrival,line:line,updown:updown});
  // span[class="time dep"]
  let lists = cheerioObject.$('span').text();
  let replyMessage = [];

  lists = lists.trim().replace(/\t/g, "").replace(/\n+/g, ",").split(",");

  var start_flag = false;
  lists.forEach((list) => {
    if(list.indexOf("カレンダー時以降") !== -1){
      replyMessage.push(list.split("降")[1].trim());
      start_flag = true;
    }else{
      if(start_flag){
        replyMessage.push(list.trim());
      }else{
        //
      }
    }
  });
  replyMessage.pop();
  console.log(time);
  return replyMessage;
}
