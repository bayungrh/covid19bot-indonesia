const unirest = require('unirest')

const kawalcovid19 = async () => {
    return unirest.get('https://api.kawalcovid19.id/v1/api/case/summary').type('json').then(res => {
        let body = res.body
        if(res.headers['content-type'] === 'application/json') {
            return {
                country: "Indonesia 🇮🇩",
                infection: body.confirmed,
                recovered: body.recovered,
                deaths: body.deceased,
                active_cases: body.activeCare
            }
        } return {}
    }).catch(err => {})
};

module.exports = kawalcovid19
