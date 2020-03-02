var Twit = require('twit')

var T = new Twit({
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