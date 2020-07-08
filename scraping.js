// Scraping
process.env.NODE_TLS_REJECT_UNAUTHORIZED = 0;  // SSL証明書検証エラーを無視する設定
const cheerio = require('cheerio-httpcli');


async function getTrainTime( departure, arrival, line,  updown, time, name){
    /*
    電車の時刻に関してスクレイピングを行い結果を返す

    [input]
    departure: 出発駅コード str-num. length 8;
    arrival: 到着駅コード str-num. length 8;
    line: 路線コード str-num. length 8;
    updown: str-num.  0(up), 1(down)
    time: postbacked-time
    name: 'departure-station-name -> arrival-station-name'

    [return]
    replyMessage: string
 
    */

    /* 
    Example of scraping link
    https://www.navitime.co.jp/diagram/depArrTimeList?departure=00009453&arrival=00007420&line=00000016&updown=0&hour=4&date=2020-01-09
    */
    const cheerioObject = await cheerio.fetch('https://www.navitime.co.jp/diagram/depArrTimeList',{departure:departure,arrival:arrival,line:line,updown:updown});
    let lists = cheerioObject.$('span').text();
    let replyMessage = [];
  
    lists = lists.trim().replace(/\t/g, "").replace(/\n+/g, ",").split(",");
  
    // 最初の時刻が取得でき次第Trueにする
    var is_start = false;
    // 表示する個数を数える
    var count = 0
  
    lists.forEach((list) => {
      if(count >= 5){
        //break;
      }else{
  
          if(list.indexOf("カレンダー時以降") !== -1){
  
            if( TIME (time, list.split("降")[1].trim(), 'train') ){
              replyMessage.push(list.split("降")[1].trim());
              count++;
            }else{
              ;
            }
  
            is_start = true;
  
          }else{
            if(is_start){
              if( TIME (time, list.trim(), 'train') ){
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
    // 駅名を先頭に挿入
    replyMessage.unshift(name);
    return replyMessage;
}
 
async function getBusTime( departure, arrival, line, time, name){
    /*
    バスの時刻に関してスクレイピングを行い結果を返す

    [input]
    departure: 出発駅コード str-num. length 8;
    arrival: 到着駅コード str-num. length 8;
    line: 路線コード str-num. length 8;
    time: postbacked-time
    name: 'departure-station-name -> arrival-station-name'

    [return]
    replyMessage: string
 
    */

    /* 
    Example of scraping link
    https://www.navitime.co.jp/bus/diagram/timelist?departure=00291944&arrival=00087909&line=00053907
    */
    const cheerioObject = await cheerio.fetch('https://www.navitime.co.jp/bus/diagram/timelist',{departure:departure,arrival:arrival,line:line});
    let lists = cheerioObject.$('span').text();
    let replyMessage = [];
    // console.log(lists);
  
    lists = lists.trim().replace(/\t/g, "").replace(/\n+/g, ",").split("行");
  
    // 最初の時刻が取得でき次第Trueにする
    var is_start = false;
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
        if (TIME(time, list.split(split_word)[1].trim(), 'bus')){
          replyMessage.push(list.split(split_word)[1].trim());
          count++;
        }
        is_start = true;
  
      }else if(is_start){
          if(TIME(time, list.trim(), 'bus')){
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
  
  
function TIME(time, list, type){
    /*
    時刻の比較を行い　time以降のものを取得

    [input]
    time: 指定時刻　ex) str. 00:00
    list: ex) 快速09:22発〜 or 09:22発〜
    type: str. 'train' or 'bus'

    [return]
    flag: bool
 
    */
    var flag = false;
  
    if (type == "train") {
        // 快速09:22発〜
        list = list.split("発")[0];
        if(list.indexOf("快速") !== -1){
        list = list.split("速")[1];
        }
    } else if (type == "bus") {
        // list : 09:22発〜
        list = list.split("発")[0];
    }

    time = time.split(":");
    list = list.split(":");
  
    if(Number(list[0]) === 0){
      list[0] = 24;
    }
  
    if((Number(list[0]) === Number(time[0])) && (Number(list[1]) >= Number(time[1]))){
      flag = true;
    }else if(Number(list[0]) > Number(time[0])){
      flag = true;
    }else{
      //
    }
  
    return flag;
}