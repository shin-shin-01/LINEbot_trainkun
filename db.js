
// ---------------------------------------------------
const { Client } = require('pg');
const { response } = require('express');
// BusData Json
const busdata = require('./bus.json');

// パラメータ設定
require('dotenv').config({debug: true});

const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: true
});

client.connect();

// ---------------------------------------------------
class DB {
    async registerDB( userID, idx, where) {
        /*
        DBに登録する作業 
        */
       const update_query = {
           text: `UPDATE userdb SET bus${idx}=($1) where userid=($2)`,
           values: [where, userID]
       }
       client.query(update_query);
    }
    
    async getUserDB(userID) {
        /*
        ユーザ情報を取得する作業 
        */
        const get_query = {
            text: 'select * from userdb where userid=($1)',
            values: [userID]
        }
        var result = await client.query(get_query)
            .then(res => {
                return res.rows[0]
            });
        
        // ユーザ情報がない場合の初期値
        if (!result){
            const add_query = {
                text: 'INSERT INTO userdb(userid, bus1, bus2, bus3, bus4) VALUES($1, $2, $3, $4, $5)',
                values: [userID, '産学連携', '九大学研', '中央図書', '九大学研'],
                }
                
            client.query(add_query);

            return {
                bus1: '産学連携交流センター',
                bus2: '九大学研都市',
                bus3: '中央図書館',
                bus4: '九大学研都市'
              }
        } else {
            return result;
        }
    }

    async SelectBus(num) {
        /*
        バス停を選択する作業 
        */
        let responsemsg = {
            "type": "text",
            "text": `Select Bus Stop No.${num}`,
            "quickReply": {
              "items": []
            }
          }

        for (var key in busdata) {
            if (key.indexOf(' → ') !== -1){
                break;
            }
            responsemsg["quickReply"]["items"].push({
                "type": "action",
                "action": {
                    "type":"postback",
                    "label": key,
                    "data": 'R'+num+key
                }
            })
        }
        return responsemsg;
    }


}



module.exports = DB;