require('dotenv').config()
const Twit = require('twit')
const {
    redis_client,
    redisGet
} = require('./utils/redis')

const crc32 = require('./utils/hash')
const cron = require('node-cron')
const covid19_update = require('./wuhan')

const T = new Twit({
  consumer_key:         process.env.TWITTER_CONSUMER_KEY,
  consumer_secret:      process.env.TWITTER_CONSUMER_SECRET,
  access_token:         process.env.TWITTER_ACCESS_TOKEN,
  access_token_secret:  process.env.TWITTER_ACCESS_TOKEN_SECRET,
})

const tweet = (text, reply_status_id=null) => {
    return new Promise((resolve, reject) => {
        var dataTwit = reply_status_id ? {status: text, in_reply_to_status_id: reply_status_id} : {status: text}
        T.post('statuses/update', dataTwit, function(err, data, response) {
            if(!err) {
                console.log("Tweet SENT")
                resolve(data)
            } else {
                reject(err)
            }
        })
    })
}

function chunkText(text) {
    var array = text.split(' ')
    var i,j,temparray = [],chunk = 20;
    for (i=0,j=array.length; i<j; i+=chunk) {
        temparray.push(array.slice(i,i+chunk));
    }
    return temparray
}

const start = async() => {
    var corona = await covid19_update()
    corona.news.every(async c => {
        var content = c.content
        if(c.title.toLowerCase().includes('indonesia')) {
            var hash_code = crc32(c.title)
            if(await redisGet('news:'+hash_code)) {
                console.log(hash_code+" EXIST")
                return false
            } else {
                // console.log(hash_code)
                var start_tweet = await tweet(c.title).then(start_tweet)
                var latest_id = start_tweet.id_str
                if(content.length > 278) {
                    var chunk = chunkText(content)
                    for (let i = 0; i < chunk.length; i++) {
                        const element = chunk[i];
                        var text = element.join(' ')
                        if(i != chunk.length - 1) {
                            text += ` ~(${i+1}/${chunk.length})`
                        }
                        var child_tweet = await tweet(text, latest_id).then(child_tweet)
                        latest_id = child_tweet.id_str
                    }
                } else {
                    await tweet(content, start_tweet.id_str).then()
                }
                redis_client.setex('news:'+hash_code, 60*24*30, c.title)
            }
        }
    })
}

cron.schedule("* * * * *", () => {
    console.log("START")
    start()
})

console.log("Service is running, press CTRL+C to stop.")