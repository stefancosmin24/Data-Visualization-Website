//Axios will handle HTTP requests to web service
import axios from 'axios';

//Module that reads keys from .env file
import dotenv from 'dotenv'; 

import fs from 'fs';

const AWS = require("aws-sdk");
//Tell AWS about region
AWS.config.update({
    region: "us-east-1",
    endpoint: "https://dynamodb.us-east-1.amazonaws.com"
});




//Copy variables in file into environment variables
dotenv.config();

{

    async function putData(params: any) {
        //Create new DocumentClient
        let documentClient = new AWS.DynamoDB.DocumentClient();
        
    //Store data in DynamoDB and handle errors
    try {
        let result = await documentClient.put(params).promise();
        console.log("Data uploaded successfully: " + JSON.stringify(result));
    } catch (err) {
        console.error("ERROR uploading data: " + JSON.stringify(err));
    }
    }


    //Defines structure of Alpha Vantage data.
    interface AlphaVantageForex {
        [key:string]:{//Time Series FX (Daily)
            [key:string]: { //Date: 2023-02-06
                [key:string]:number//4. close
            }
        }
    };

    interface params {
                TableName: string,
                Item: {
                    stock: string ,// Symbol,
                    timestamp: number, //date.getTime(),
                    price: number//data['Time Series (15min)'][dt]['4. close']
                }
            }
    

    //Displays data from web service
    function processData(data:AlphaVantageForex, Symbol:string):void{
        
        for(let dt in data['Time Series (60min)']){
            //Convert data to unix timestamp
            const date = new Date(dt);
            
            //console.log("DATE: " + dt + "; UNIX TS: " + date.getTime() + "; FOR: " + Symbol);
            //console.log(data['Time Series (15min)'][dt]['4. close']);
            
            //Add to DynamoDB
            
            let params = {
                TableName: "stockData",
                Item: {
                    "stock": Symbol,
                    "timestamp": date.getTime(),
                    "price":data['Time Series (60min)'][dt]['4. close']
                }
            }

            putData(params);
        }
    }


    //Downloads data from AlphaVantage
    async function downloadData(){
        //Currency symbol
        const symbol:string="MSFT";
        //const toCurrency:string="IBM";

        //Base url
        let url:string = "https://www.alphavantage.co/query?function=TIME_SERIES_INTRADAY";

        let interval:string = "60min";

        //Request complete data
        url += "&outputsize=full";

        //Add currency symbols
        url += "&symbol=" + symbol + "&interval=" + interval;

        //Add API key
        url += "&apikey=" + process.env.ALPHAVANTAGE_API_KEY;
        console.log(url); 

        //Sent GET to endpoint with Axios
        let data:AlphaVantageForex = (await axios.get(url)).data ;
         

        //Output the data
        processData(data, symbol);

    }

    downloadData();

}

//Structure of data from web service
    // 'Meta Data': {
    //     '1. Information': 'Forex Daily Prices (open, high, low, close)',
    //     '2. From Symbol': 'EUR',
    //     '3. To Symbol': 'USD',
    //     '4. Output Size': 'Compact',
    //     '5. Last Refreshed': '2023-02-06 10:55:00',
    //     '6. Time Zone': 'UTC'
    //   },
    //   'Time Series FX (Daily)': {
    //     '2023-02-06': {
    //       '1. open': '1.07878',
    //       '2. high': '1.07990',
    //       '3. low': '1.07580',
    //       '4. close': '1.07624'
    //     },