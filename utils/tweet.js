const Twit = require('twit')
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

const tweet_with_image = (text, image) => {
    return new Promise((resolve, reject) => {
        T.post("media/upload", { media_data: image.toString('base64') }, function(err, data, response) {
            var mediaIdStr = data.media_id_string;
            var meta_params = { media_id: mediaIdStr};
            T.post("media/metadata/create", meta_params, function(err, data, response) {
                if (!err) {
                    var params = {
                        status: text,
                        media_ids: [mediaIdStr]
                    };
                    T.post("statuses/update", params, function(err, data, response) {
                        if(!err) {
                            console.log("Tweet SENT " + data.id_str)
                            resolve(data)
                        } else {
                            reject(err)
                        }
                    })
                } else {
                    reject(err)
                }
            })
        })
    })
}

module.exports = {
    T,
    tweet,
    tweet_with_image
}