//Use Node module for accessing newsapi
const NewsAPI = require('newsapi');

//Module that reads keys from .env file
import dotenv from 'dotenv';

//Copy variables in file into environment variables
dotenv.config();

//aws details
const AWS = require("aws-sdk");
//Tell AWS about region
AWS.config.update({
    region: "us-east-1",
    endpoint: "https://dynamodb.us-east-1.amazonaws.com"
});

//Create new NewsAPI class
const newsapi = new NewsAPI(process.env.NEWS_API);

//Uload Data function
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

//Define structure of data returned from NewsAPI
interface Article {
    title: string,
    publishedAt: string
}
//Define structure of data returned from NewsAPI
interface NewsAPIResult {
    articles: Array<Article>
}

//Pulls and logs data from API
async function getNews(): Promise<void> {
    //Search API
    const stockName = "Apple";
    const result: NewsAPIResult = await newsapi.v2.everything({
        q: stockName,
        pageSize: 100,
        language: 'en'
    });

    //upload article titles and dates 
    console.log(result.articles.length);
    for (let article of result.articles) {
        const date = new Date(article.publishedAt);
        //console.log("Unix Time: " + date.getTime() + "; title: " + article.title);

        let params = {
            TableName: "textData",
            Item: {
                "StockSymbol": stockName,
                "StockTS": date.getTime(),
                "text": article.title
            }
        }
        putData(params);
    }




}

getNews();

//Query API
// newsapi.v2.everything({
//     q: 'middlesex',
//     sources: 'bbc-news,the-verge',
//     domains: 'bbc.co.uk,techcrunch.com',
//     from: '2017-12-01',
//     to: '2017-12-12',
//     language: 'en',
//     sortBy: 'relevancy',
//     page: 2
//   }).then(response => {
//     console.log(response);
//     /*
//       {
//         status: "ok",
//         articles: [...]
//       }
//     */
//   });