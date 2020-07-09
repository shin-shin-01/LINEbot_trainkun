console.log("START");

// ---------------------------------------------------
// モジュールのインポート
const server = require('express')();
// Messaging APIのSDKをインポート
const line = require('@line/bot-sdk');
// Scraping function
const scraping = require('./scraping.js');
const scrape = new scraping();

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
    var root = ["00053907", "00053915"];
    var response = [];
    for (var idx in root) {
      var res = await scrape.getBusTime("00291944", "00087909", root[idx],  "07:00", "九大学研都市 → 産学連携");
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

  if(event.type === 'postback'){
    if(event.postback.data == "九大学研都市(博多)"){
      var code = ["train", "00009453", "00007420", "00000016", "0", "九大学研都市駅 → 博多"];

    } else if(event.postback.data == "九大学研都市(天神)"){
      var code = ["train", "00009453", "00006431", "00000016", "0", "九大学研都市駅 → 天神"];

    } else if(event.postback.data == "天神"){
      var code = ["train", "00006431", "00009453", "00000836", "1", "天神 → 九大学研都市駅"];

    } else if(event.postback.data == "博多"){
      var code = ["train", "00007420", "00009453", "00000836", "1", "博多 → 九大学研都市駅"];

    } else if(event.postback.data == "九大学研都市(産学連携)"){
      var code = ["bus", "00291944", "00087909", "九大学研都市 → 産学連携"];
      var root = ["00053907", "00053915"];

    } else if(event.postback.data == "産学連携(九大学研都市)"){
      var code = ["bus", "00087909", "00291944", "産学連携 → 九大学研都市"];
      var root = ["00053907", "00053915", "00053917"];
      
    } else if(event.postback.data == "九大学研都市(中央図書館)"){
      var code = ["bus", "00291944", "00291995", "九大学研都市 → 中央図書館"];
      var root = ["00053907", "00053914", "00053915"];

    } else if(event.postback.data == "中央図書館(九大学研都市)"){
      var code = ["bus", "00291995",　"00291944", "00053907", "中央図書館 → 九大学研都市"];
      var root = ["00053907", "00053914", "00053915"];

    }

    if (code[0] == "train") {
      var res = await scrape.getTrainTime(code[1], code[2], code[3], code[4], event.postback.params.time, code[5]);
      var responsemsg = {
        type: "text",
        text: res.join('\n')
      };

    } else if (code[0] == "bus") {
      var responsemsg = [];

      for (var idx in root) {
        var res = await scrape.getBusTime(code[1], code[2], root[idx], event.postback.params.time, code[3]);
        responsemsg.push({
          type: "text",
          text: res.join('\n')
        });
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
          label:"九大学研 → 産学連携",
          data:"九大学研都市(産学連携)",
          mode:"time"
          },
          {
          type:"datetimepicker",
          label:"産学連携 → 九大学研",
          data:"産学連携(九大学研都市)",
          mode:"time"
          },
          {
          type:"datetimepicker",
          label:"九大学研 → 中央図書館",
          data:"九大学研都市(中央図書館)",
          mode:"time"
          },
          {
          type:"datetimepicker",
          label:"中央図書館 → 九大学研",
          data:"中央図書館(九大学研都市)",
          mode:"time"
          }
          ]
      }// template
    };//respose

  } else{
    responsemsg = {
      type: "text",
      text: "メニューから選択してください"
    };
  }//else

  return bot.replyMessage(event.replyToken, responsemsg);
} // function-end
