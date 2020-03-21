require('dotenv').config()
process.env.TZ = 'Asia/Jakarta'
const {
    redis_client,
    redisGet
} = require('./utils/redis')

const crc32 = require('./utils/hash')
const cron = require('node-cron')
const covid19_update_thewuhanvirus = require('./datasrc/wuhan')
const covid19_update_worldometers = require('./datasrc/worldometers')
const covid19_update_kawalcovid19 = require('./datasrc/kawalcovid')
const covid19_update_summary_mathdroid = require('./datasrc/mathdroid')

const { tweet, tweet_with_image } = require('./utils/tweet')
const generateImg = require('./utils/generate-img')

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
${process.env.HASTAG}
`
                let generate_img_query = {...{source: 'thebaselab', date: new Date().toLocaleDateString()}, ...t} 
                generateImg(generate_img_query).then(buffer => {
                    tweet_with_image(text, buffer)
                }).catch(err => {
                    console.error(err)
                    tweet(text)
                })
                redis_client.set('indonesia_affected', json_str)
            }
        }
    })
}

const worldometers_start = async() => {
    const update = await covid19_update_worldometers('indonesia')
    if(update.length < 1) return
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
${process.env.HASTAG}
`
        let generate_img_query = {...{source: 'worldometers', date: new Date().toLocaleDateString()}, ...update}
        generateImg(generate_img_query).then(buffer => {
            tweet_with_image(text, buffer)
        }).catch(err => {
            console.error(err)
            tweet(text)
        })
        redis_client.set('indonesia_affected:worldometers', json_str)
    }
}

const kawalcovid19_start = async() => {
    const update = await covid19_update_kawalcovid19()
    if(update.length < 1) return
    let json_str = JSON.stringify(update)
    let checkExist = await redisGet('indonesia_affected:kawalcovid19')
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

Bersumber dari kawalcovid19
${process.env.HASTAG}
`
        let generate_img_query = {...{source: 'kawalcovid19', date: new Date().toLocaleDateString()}, ...update}
        generateImg(generate_img_query).then(buffer => {
            tweet_with_image(text, buffer)
        }).catch(err => {
            console.error(err)
            tweet(text)
        })
        redis_client.set('indonesia_affected:kawalcovid19', json_str)
    }
}

const mathdroid_start = async () => {
    const update = await covid19_update_summary_mathdroid()
    if(update.length < 1) return
    let json_str = JSON.stringify(update)
    let checkExist = await redisGet('indonesia_case_summary:mathdroid')
    if(checkExist === json_str) return
    let text = ""
    Object.keys(update).forEach(k => {
        for (let i = 0; i < update[k].length; i++) {
            text += update[k][i].label + `: ${update[k][i].value}` + (i !== update[k].length - 1 ? " | " : "")
        }
        text += "\n\n"
    })
    text = text.trim()
    if(text.length > 278) {
        var chunk = chunkText(text)
        var start_tweet = await tweet("Jumlah per-kasus di Indonesia saat ini.")
        var latest_id = start_tweet.id_str
        for (let i = 0; i < chunk.length; i++) {
            const element = chunk[i];
            var txt = element.join(' ')
            if(i != chunk.length - 1) {
                txt += ` ~(${i+1}/${chunk.length})`
            }
            var child_tweet = await tweet(txt, latest_id)
            latest_id = child_tweet.id_str
            if(i === chunk.length - 1) {
                tweet(`Updated: ${c.updated_at}`, latest_id)
            }
        }
     } else if (text.length > 0) {
         var child_tweet = await tweet(text, start_tweet.id_str)
         tweet(`Updated: ${c.updated_at}`, child_tweet.id_str)
     }
     redis_client.set('indonesia_case_summary:mathdroid', json_str)
}

cron.schedule("*/15 * * * *", () => {
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

cron.schedule("*/10 * * * *", async () => {
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

cron.schedule("*/4 * * * *", async () => {
    console.log("START for kawalcovid19 & mathdroid")
    await kawalcovid19_start()
    await mathdroid_start()
}, { timezone: "Asia/Jakarta" })

console.log("Service is running, press CTRL+C to stop.")
