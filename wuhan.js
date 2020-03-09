const puppeteer = require("puppeteer");

const covid19_update = async () => {
    const browser = await puppeteer.launch({
        args: ["--no-sandbox"]
    });
    const page = await browser.newPage();
    await page.setCacheEnabled(true)
    await page.goto(`https://thewuhanvirus.com/`, {
        waitUntil: ['load', 'domcontentloaded', 'networkidle0', 'networkidle2']
    })

    const news = await page.evaluate(async() => {
        var contents = []
        const cards = document.querySelectorAll("div.update_cards > div.cards_container > div.jumbotron-fluid")
        cards.forEach(async (product, i) => {
            contents.push({
                title: product.querySelector('h6').textContent,
                content: product.querySelector('h5').textContent,
                updated_at: product.querySelector('div.d-flex.justify-content-between.align-items-end div.text-right h5').textContent,
            })
        });
        return contents
    })

    const table_affected = await page.evaluate(async () => {
        var tbs = []
        var tables = document.querySelectorAll('#country_data > table > tbody > tr')
        tables.forEach(t => {
            tbs.push({
                country: t.querySelector('th').textContent,
                infection: t.querySelector('td:nth-child(2) > h4').textContent,
                active_cases: t.querySelector('td:nth-child(3) > h4').textContent,
                deaths: t.querySelector('td:nth-child(4) > h4').textContent,
                recovered: t.querySelector('td:nth-child(5) > h4').textContent,
            })
        })
        return tbs
    })
    await browser.close()

    return {
        news: news,
        regions_affected: table_affected
    }
};

module.exports = covid19_update