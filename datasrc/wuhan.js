const puppeteer = require("puppeteer");

const covid19_update = async () => {
    const browser = await puppeteer.launch({
        args: ["--no-sandbox"]
    });
    const page = await browser.newPage();
    await page.setCacheEnabled(true)
    await page.goto(`https://coronavirus.thebaselab.com`, {
        waitUntil: ['load', 'domcontentloaded', 'networkidle0', 'networkidle2']
    })

    const data = await page.evaluate(async() => {
        var news = []
        var affecteds = []
        const card_news = document.querySelectorAll("div.update_cards > div.cards_container > div.jumbotron-fluid")
        var table_affected = document.querySelectorAll('#country_data > table > tbody > tr')
        card_news.forEach(card => {
            news.push({
                title: card.querySelector('h6').textContent,
                content: card.querySelector('h5').textContent,
                updated_at: card.querySelector('div.d-flex.justify-content-between.align-items-end div.text-right h5').textContent,
            })
        })
        table_affected.forEach(td => {
            affecteds.push({
                country: td.querySelector('th').textContent,
                infection: td.querySelector('td:nth-child(2) > h4').textContent,
                active_cases: td.querySelector('td:nth-child(4) > h4').textContent,
                deaths: td.querySelector('td:nth-child(5) > h4').textContent,
                recovered: td.querySelector('td:nth-child(7) > h4').textContent,
                mortality_rate: td.querySelector('td:nth-child(8) > h4').textContent,
                recovery_rate: td.querySelector('td:nth-child(9) > h4').textContent,
            })
        })
        return {
            news: news,
            regions_affected: affecteds
        }
    })
    await page.close().then(() => browser.close())
    return data
};

module.exports = covid19_update