require('dotenv').config()
process.env.TZ = 'Asia/Jakarta'
const {
    redis_client,
    redisGet
} = require('./utils/redis')

const crc32 = require('./utils/hash')
const cron = require('node-cron')
const covid19_update = require('./wuhan')
const { tweet } = require('./utils/tweet')

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
                var start_tweet = await tweet(c.title)
                var latest_id = start_tweet.id_str
                if(content.length > 278) {
                    var chunk = chunkText(content)
                    for (let i = 0; i < chunk.length; i++) {
                        const element = chunk[i];
                        var text = element.join(' ')
                        if(i != chunk.length - 1) {
                            text += ` ~(${i+1}/${chunk.length})`
                        }
                        var child_tweet = await tweet(text, latest_id)
                        latest_id = child_tweet.id_str
                        if(i === chunk.length - 1) {
                            tweet(`Updated: ${c.updated_at}`, child_tweet.id_str)
                        }
                    }
                } else if (content.length > 0) {
                    tweet(content, start_tweet.id_str)
                }
                redis_client.setex('news:'+hash_code, 86400*7, c.title)
            }
        }
    })
    corona.regions_affected.every(async t => {
        if(t.country.toLowerCase().includes('indonesia')) {
            let json_str = JSON.stringify(t)
            var checkExist = await redisGet('indonesia_affected')
            if(!checkExist || checkExist !== json_str) {
                let text = `Pembaruan COVID-19 di ${t.country} saat ini
Terkonfirmasi: ${t.infection}
Kasus aktif: ${t.active_cases}
Disembuhkan: ${t.recovered}
Meninggal: ${t.deaths}
Tingkat Kematian: ${t.mortality_rate}
Tingkat Kesembuhan: ${t.recovery_rate}
`
                await tweet(text)
                redis_client.set('indonesia_affected', json_str)
            }
        }
    })
}
cron.schedule("*/10 * * * *", () => {
    console.log("START")
    start()
})

console.log("Service is running, press CTRL+C to stop.")
