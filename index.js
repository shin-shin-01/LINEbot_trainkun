console.log("START");

// ---------------------------------------------------
// モジュールのインポート
const server = require('express')();
// Messaging APIのSDKをインポート
const line = require('@line/bot-sdk');
// Scraping function
const scraping = require('./scraping.js');
const scrape = new scraping();
// DB register
const db = require('./db.js');
const db_func = new db();
// BusData Json
const busdata = require('./bus.json');
const e = require('express');

// ---------------------------------------------------
// パラメータ設定
require('dotenv').config({debug: true});

if (typeof process.env.LINE_ACCESS_TOKEN == 'undefined'){
  console.error("Error: LINE_ACCESS_TOKEN is not set.");
} else {
  console.log("loading .env Done");
}

const line_config = {
  channelAccessToken: process.env.LINE_ACCESS_TOKEN,
  channelSecret: process.env.LINE_CHANNEL_SECRET
};

// ---------------------------------------------------
// Webサーバ設定
const PORT = process.env.PORT || 3000;
server.listen(PORT);
console.log(`Server running at ${PORT}`);

// APIコールのためのクライアントインスタンスを作成
bot = new line.Client(line_config);

// ----------------------------------------------------
// ルーター設定
server.get('/', (req, res) => res.send('Hello, LINEBOT!')); //ブラウザ確認用
server.get('/test', (req, res) => {
  async function test(){
    var root = ["00053907", "00053915", "00053917"];
    var response = [];
    for (var idx in root) {
      var res = await scrape.getBusTime("00087909", "00291944", root[idx],  "07:00", "九大学研都市 → 産学連携");
      response.push([res.join('\n')]);
    }

    console.log('OKAERI!');
    console.log(response);
  }

  test();
}); //関数テスト用

server.post('/bot/webhook', line.middleware(line_config), (req, res, next) => {
  // 先行してLINE側にステータスコード200でレスポンスする
  res.sendStatus(200);
  console.log("res Status 200");

  Promise.all(req.body.events.map(handleEvent));
});

// ----------------------------------------------------

async function handleEvent(event){
  console.log(event);
  // ユーザ情報
  let userid = event.source.userId;
  var user_bus = await db_func.getUserDB(userid);

  if(event.type === 'postback'){
    // 登録作業でのPOSTBACK
    if (event.postback.data.slice(0, 1) == 'R') {
      if((event.postback.data).length == 2){
        responsemsg = await db_func.SelectBus(event.postback.data.slice(1, 2));
      } else {
        await db_func.registerDB(userid, event.postback.data.slice(1, 2), event.postback.data.slice(2));
        // TODO: 確認作業を簡単に表示しよう
        responsemsg = {
          type: "text",
          text: "現在の登録をばすくんで確認してね（改良中）"
        }
      }
    } else {

      if(event.postback.data == "九大学研都市(博多)"){
        var code = ["train", "00009453", "00007420", "00000016", "0", "九大学研都市駅 → 博多"];

      } else if(event.postback.data == "九大学研都市(天神)"){
        var code = ["train", "00009453", "00006431", "00000016", "0", "九大学研都市駅 → 天神"];

      } else if(event.postback.data == "天神"){
        var code = ["train", "00006431", "00009453", "00000836", "1", "天神 → 九大学研都市駅"];

      } else if(event.postback.data == "博多"){
        var code = ["train", "00007420", "00009453", "00000836", "1", "博多 → 九大学研都市駅"];

        
      } else if(event.postback.data.indexOf(' → ') !== -1){
        // バスデータ
        let st_en = event.postback.data.split(' → ');
        var code = ["bus", busdata[st_en[0]], busdata[st_en[1]], event.postback.data];
        var root = busdata[event.postback.data];
      }

      if (code[0] == "train") {
        var res = await scrape.getTrainTime(code[1], code[2], code[3], code[4], event.postback.params.time, code[5]);
        var responsemsg = {
          type: "text",
          text: res.join('\n')
        };

      } else if (code[0] == "bus") {
        var responsemsg = [];

        if ((!root)||(root[0] == "error")) {
          responsemsg.push({
            type: "text",
            text: "該当する時刻表がありません。追加を待ってね"
          });
        } else {
          for (var idx in root) {
            var res = await scrape.getBusTime(code[1], code[2], root[idx], event.postback.params.time, code[3]);
            responsemsg.push({
              type: "text",
              text: res.join('\n')
            });
          }
        }
      }
    }
  // postback else
  } else if (event.message.text.indexOf("でんしゃくん") !== -1){

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
          label:"九大学研都市駅発(博多)",
          data:"九大学研都市(博多)",
          mode:"time"
          },
          {
          type:"datetimepicker",
          label:"九大学研都市駅発(天神)",
          data:"九大学研都市(天神)",
          mode:"time"
          },
          {
          type:"datetimepicker",
          label:"天神発",
          data:"天神",
          mode:"time"
          },
          {
          type:"datetimepicker",
          label:"博多発",
          data:"博多",
          mode:"time"
          }
          ]
      }// template
    };//respose

  } else if (event.message.text.indexOf("ばすくん") !== -1){

    responsemsg = {
      type: "template",
      altText: "this is a buttons template",
      template: {
          type: "buttons",
          title: "出発バス停＆時刻選択",
          text: "Please select",
        actions:[
          {
          type:"datetimepicker",
          label: user_bus.bus1.slice(0,4) + " → " + user_bus.bus2.slice(0,4),
          data: user_bus.bus1.slice(0,4) + " → " + user_bus.bus2.slice(0,4),
          mode:"time"
          },
          {
          type:"datetimepicker",
          label: user_bus.bus2.slice(0,4) + " → " + user_bus.bus1.slice(0,4),
          data: user_bus.bus2.slice(0,4) + " → " + user_bus.bus1.slice(0,4),
          mode:"time"
          },
          {
          type:"datetimepicker",
          label: user_bus.bus3.slice(0,4) + " → " + user_bus.bus4.slice(0,4),
          data: user_bus.bus3.slice(0,4) + " → " + user_bus.bus4.slice(0,4),
          mode:"time"
          },
          {
          type:"datetimepicker",
          label: user_bus.bus4.slice(0,4) + " → " + user_bus.bus3.slice(0,4),
          data: user_bus.bus4.slice(0,4) + " → " + user_bus.bus3.slice(0,4),
          mode:"time"
          }
          ]
      }// template
    };//respose

  } else if (event.message.text.indexOf("登録") !== -1) {
     var responsemsg = {
        "type": "text",
        "text": `変更するバス停を選択してね`,
        "quickReply": {
          "items": []
        }
      }
      for (var i=1; i<5; i++) {
        responsemsg["quickReply"]["items"].push({
          "type": "action",
          "action": {
              "type":"postback",
              "label": user_bus[`bus${i}`],
              "data": 'R'+String(i)
          }
        })
      }

  } else {
    responsemsg = {
      type: "text",
      text: "メニューから選択してください"
    };
  }//else

  return bot.replyMessage(event.replyToken, responsemsg);
} // function-end
