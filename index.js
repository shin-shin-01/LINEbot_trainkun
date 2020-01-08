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
    if(event.postback.data == "九大学研都市(博多)"){

      var res = await getTrainTime("00009453", "00007420", "00000016", "0", event.postback.params.time, "九大学研都市駅 → 博多");
      var response = res.join('\n');

       responsemsg = {
           type: "text",
           text: response
        };

    } else if(event.postback.data == "九大学研都市(天神)"){

      var res = await getTrainTime("00009453", "00006431", "00000016", "0", event.postback.params.time, "九大学研都市駅 → 天神");
      var response = res.join('\n');

       responsemsg = {
           type: "text",
           text: response
        };
      } else if(event.postback.data == "天神"){

        var res = await getTrainTime("00006431", "00009453", "00000836", "1", event.postback.params.time, "天神 → 九大学研都市駅");
        var response = res.join('\n');

         responsemsg = {
             type: "text",
             text: response
          };
      } else if(event.postback.data == "博多"){

      var res = await getTrainTime("00007420", "00009453", "00000836", "1", event.postback.params.time, "博多 → 九大学研都市駅");
      var response = res.join('\n');

       responsemsg = {
           type: "text",
           text: response
        };
      } else if(event.postback.data == "九大学研都市(産学連携)"){

      var res = await getBusTime("00291944", "00087909", "00053907", event.postback.params.time, "九大学研都市 → 産学連携");
      var response = res.join('\n');

       responsemsg = {
           type: "text",
           text: response
        };
      } else if(event.postback.data == "産学連携(九大学研都市)"){

      var res = await getBusTime("00087909", "00291944", "00053907", event.postback.params.time, "産学連携 → 九大学研都市");
      var response = res.join('\n');

       responsemsg = {
           type: "text",
           text: response
        };
      } else if(event.postback.data == "九大学研都市(中央図書館)"){

      var res = await getBusTime("00291944", "00291995", "00053907", event.postback.params.time, "九大学研都市 → 中央図書館");
      var response = res.join('\n');

       responsemsg = {
           type: "text",
           text: response
        };
      } else if(event.postback.data == "中央図書館(九大学研都市)"){

      var res = await getBusTime("00291995",　"00291944", "00053907", event.postback.params.time, "中央図書館 → 九大学研都市");
      var response = res.join('\n');

       responsemsg = {
           type: "text",
           text: response
        };
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
    } else{}//else

  return bot.replyMessage(event.replyToken, responsemsg);
} // function-end

// -----------------------------------------------------------------------------------

async function getTrainTime( departure, arrival, line,  updown, time, name){

  //https://www.navitime.co.jp/diagram/depArrTimeList?departure=00009453&arrival=00007420&line=00000016&updown=0&hour=4&date=2020-01-09
  const cheerioObject = await cheerio.fetch('https://www.navitime.co.jp/diagram/depArrTimeList',{departure:departure,arrival:arrival,line:line,updown:updown});
  let lists = cheerioObject.$('span').text();
  let replyMessage = [];

  lists = lists.trim().replace(/\t/g, "").replace(/\n+/g, ",").split(",");

  // 最初の時刻が取得でき次第Trueにする
  var start_flag = false;
  // 表示する個数を数える
  var count = 0

  lists.forEach((list) => {
    if(count >= 5){
      //break;
    }else{

        if(list.indexOf("カレンダー時以降") !== -1){

          if( TIME (time, list.split("降")[1].trim() ) ){
            replyMessage.push(list.split("降")[1].trim());
            count++;
          }else{
            //
          }

          start_flag = true;

        }else{
          if(start_flag){
            if( TIME (time, list.trim() ) ){
              if(list.indexOf("快速") !== -1){
                list = list.replace(/快速/g,"");
                }else{}
              replyMessage.push(list.trim());
              count++;
            }else{}
          }else{}
        }
    }
  });
  // 先頭に挿入
  replyMessage.unshift(name);
  return replyMessage;
}


function TIME(user, list){
  var flag = false;

  // user : 03:29, list : 快速09:22発〜
  list = list.split("発")[0];
  if(list.indexOf("快速") !== -1){
    list = list.split("速")[1];
  }
  user = user.split(":");
  list = list.split(":");

  if(Number(list[0]) === 0){
    list[0] = 24;
  }

  if((Number(list[0]) === Number(user[0])) && (Number(list[1]) >= Number(user[1]))){
    flag = true;
  }else if(Number(list[0]) > Number(user[0])){
    flag = true;
  }else{
    //
  }

  return flag;
}


// -----------------------------------------------------------------------


async function getBusTime( departure, arrival, line, time, name){
  // https://www.navitime.co.jp/bus/diagram/timelist?departure=00291944&arrival=00087909&line=00053907
  const cheerioObject = await cheerio.fetch('https://www.navitime.co.jp/bus/diagram/timelist',{departure:departure,arrival:arrival,line:line});
  let lists = cheerioObject.$('span').text();
  let replyMessage = [];
  // console.log(lists);

  lists = lists.trim().replace(/\t/g, "").replace(/\n+/g, ",").split("行");

  // 最初の時刻が取得でき次第Trueにする
  var start_flag = false;
  // 表示する個数を数える
  var count = 0
  if (departure === "00291944"){
    // 九大学研都市駅は始発
    var split_word = "（始）";
  }else{
    var split_word = "降";
  }


  lists.forEach((list) => {
    if(count >= 6){
      //break;
    }else{

    if(list.indexOf("カレンダー時以降") !== -1){
      if (Bus_TIME(time, list.split(split_word)[1].trim())){
        replyMessage.push(list.split(split_word)[1].trim());
        count++;
      }
      start_flag = true;

    }else if(start_flag){
        if(Bus_TIME(time, list.trim())){
          replyMessage.push(list.trim());
          count++;
        }
      }//start-flag
    }//count_else
  });// for-end
  if (count === 0){
    replyMessage.push("終バス終わったよ！");
  }
  // 先頭に挿入
  replyMessage.unshift(name);
  return replyMessage;
}


function Bus_TIME(user, list){
  var flag = false;

  // user : 03:29, list : 09:22発〜
  list = list.split("発")[0];

  user = user.split(":");
  list = list.split(":");

  if(Number(list[0]) === 0){
    list[0] = 24;
  }

  if((Number(list[0]) === Number(user[0])) && (Number(list[1]) >= Number(user[1]))){
    flag = true;
  }else if(Number(list[0]) > Number(user[0])){
    flag = true;
  }else{
    //
  }

  return flag;
}
