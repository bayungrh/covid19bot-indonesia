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
const covid19_update_mathdroid = require('./datasrc/mathdroid')

const { tweet, tweet_with_image } = require('./utils/tweet')
const generateImg = require('./utils/generate-img')
var chunkTxt = require('chunk-text');


function chunkText(text) {
    var array = text.split(' ')
    var i,j,temparray = [],chunk = 20;
    for (i=0,j=array.length; i<j; i+=chunk) {
        temparray.push(array.slice(i,i+chunk));
    }
    return temparray
}
function chunkArr(array, chunkSize) {
    return [].concat.apply([],
      array.map(function(elem, i) {
        return i % chunkSize ? [] : [array.slice(i, i + chunkSize)];
      })
    );
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
                    var chunk = chunkTxt(content, 278)
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
    const update = await covid19_update_mathdroid()
    if(update.length < 1) return
    let json_str = JSON.stringify(update)
    let checkExist = await redisGet('indonesia_cases_perprovince:mathdroid')
    if(checkExist === json_str) return

    let text = ""
    let arr_text = []
    update.forEach(element => {
        text = `- (${element.provinsi})` + ` positif: ${element.kasusPosi} | sembuh: ${element.kasusSemb} | meninggal: ${element.kasusMeni}`
        arr_text.push(text)
    })
    
    let chunkarray = chunkArr(arr_text, 3)
    const start_tweet = await tweet(`Jumlah kasus berdasarkan daerah saat ini. (${new Date().toLocaleString()})`)
    let latest_id = start_tweet.id_str
    for (let i = 0; i < chunkarray.length; i++) {
        const txt = chunkarray[i];
        const child_tweet = await tweet(txt.join('\n'), latest_id)
        latest_id = child_tweet.id_str
    }
    redis_client.set('indonesia_cases_perprovince:mathdroid', json_str)
}

(() => {
    console.log("Service is running, press CTRL+C to stop.")
    redis_client.del('worldometers_isrunning')
    redis_client.del('thebaselab_isrunning')
    
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
})()
