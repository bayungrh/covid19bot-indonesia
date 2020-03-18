require('dotenv').config()
process.env.TZ = 'Asia/Jakarta'
const {
    redis_client,
    redisGet
} = require('./utils/redis')

const crc32 = require('./utils/hash')
const cron = require('node-cron')
const covid19_update_thewuhanvirus = require('./wuhan')
const covid19_update_worldometers = require('./worldometers')
const { tweet, tweet_with_image } = require('./utils/tweet')
const nodeHtmlToImage = require('node-html-to-image')
const fs = require('fs')

function chunkText(text) {
    var array = text.split(' ')
    var i,j,temparray = [],chunk = 20;
    for (i=0,j=array.length; i<j; i+=chunk) {
        temparray.push(array.slice(i,i+chunk));
    }
    return temparray
}

const thewuhanvirus_start = async() => {
    var corona = await covid19_update_thewuhanvirus()
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
                            tweet(`Updated: ${c.updated_at}`, latest_id)
                        }
                    }
                } else if (content.length > 0) {
                    var child_tweet = await tweet(content, start_tweet.id_str)
                    tweet(`Updated: ${c.updated_at}`, child_tweet.id_str)
                } else {
                    tweet(`Updated: ${c.updated_at}`, start_tweet.id_str)
                }
                redis_client.setex('news:'+hash_code, 86400*7, c.title)
            }
        }
    })
    corona.regions_affected.every(async t => {
        if(t.country.toLowerCase().includes('indonesia')) {
            let json_str = JSON.stringify(t)
            let checkExist = await redisGet('indonesia_affected')
            var exist_parse, diff_total = 0, diff_death = 0, diff_recovered = 0;
            if(checkExist !== json_str) {
                if(checkExist) {
                    exist_parse = JSON.parse(checkExist)
                    diff_total = parseInt(t.infection) - parseInt(exist_parse.infection)
                    diff_death = parseInt(t.deaths) - parseInt(exist_parse.deaths)
                    diff_recovered = parseInt(t.recovered) - parseInt(exist_parse.recovered)
                }
                let text = `COVID-19 di ${t.country} saat ini.

- Total: ${t.infection} ${diff_total > 0 ? `(+${diff_total})` : ''}
- Perawatan: ${t.active_cases}
- Sembuh: ${t.recovered} ${diff_recovered > 0 ? `(+${diff_recovered})` : ''}
- Meninggal: ${t.deaths} ${diff_death > 0 ? `(+${diff_death})` : ''}
- Tingkat kematian: ${t.mortality_rate}
- Tingkat kesembuhan: ${t.recovery_rate}

Bersumber dari thebaselab
#COVID19 #COVID19Indonesia #coronavirus
`
                nodeHtmlToImage({
                    output: './image.png',
                    html: fs.readFileSync('./utils/template.html').toString(),
                    content: {...{source: 'thebaselab', date: new Date().toLocaleDateString()}, ...t}
                }).then(() => {
                    tweet_with_image(text, fs.readFileSync('./image.png'))
                }).catch(() => {
                    tweet(text)
                })
                redis_client.set('indonesia_affected', json_str)
            }
        }
    })
}

const worldometers_start = async() => {
    const update = await covid19_update_worldometers('indonesia')
    let json_str = JSON.stringify(update)
    let checkExist = await redisGet('indonesia_affected:worldometers')
    var exist_parse, diff_total = 0, diff_death = 0, diff_recovered = 0;
    if(checkExist !== json_str) {
        if(checkExist) {
            exist_parse = JSON.parse(checkExist)
            diff_total = parseInt(update.infection) - parseInt(exist_parse.infection)
            diff_death = parseInt(update.deaths) - parseInt(exist_parse.deaths)
            diff_recovered = parseInt(update.recovered) - parseInt(exist_parse.recovered)
        }
        let text = `COVID-19 di ${update.country} saat ini.

- Total: ${update.infection} ${diff_total > 0 ? `(+${diff_total})` : ''}
- Perawatan: ${update.active_cases}
- Sembuh: ${update.recovered} ${diff_recovered > 0 ? `(+${diff_recovered})` : ''}
- Meninggal: ${update.deaths} ${diff_death > 0 ? `(+${diff_death})` : ''}

Bersumber dari worldometers
#COVID19 #COVID19Indonesia #coronavirus
`
        nodeHtmlToImage({
            output: './image_2.png',
            html: fs.readFileSync('./utils/template.html').toString(),
            content: {...{source: 'worldometers', date: new Date().toLocaleDateString()}, ...update}
        }).then(() => {
            tweet_with_image(text, fs.readFileSync('./image_2.png'))
        }).catch(() => {
            tweet(text)
        })
        redis_client.set('indonesia_affected:worldometers', json_str)
    }
}

cron.schedule("*/10 * * * *", () => {
    console.log("START for thebaselab")
    redis_client.exists("worldometers_isrunning", async (err, reply) => {
        if(reply === 1) {
            console.log("Waitting worldometers script")
            return false
        } else {
            redis_client.set('thebaselab_isrunning', '1')
            await thewuhanvirus_start()
            redis_client.del('thebaselab_isrunning')
        }
    })
}, { timezone: "Asia/Jakarta" })

cron.schedule("*/7 * * * *", async () => {
    console.log("START for worldometers")
    redis_client.exists("thebaselab_isrunning", async (err, reply) => {
        if(reply === 1) {
            console.log("Waitting thebaselab script")
            return false
        } else {
            redis_client.set('worldometers_isrunning', '1')
            await worldometers_start()
            redis_client.del('worldometers_isrunning')
        }
    })
}, { timezone: "Asia/Jakarta" })

console.log("Service is running, press CTRL+C to stop.")