const unirest = require('unirest')

const serialize = function(obj) {
    var str = [];
    for (var p in obj)
      if (obj.hasOwnProperty(p)) {
        str.push(encodeURIComponent(p) + "=" + encodeURIComponent(obj[p]));
      }
    return str.join("&");
}

const generate = (query) => {
    return new Promise((resolve, reject) => {
        return unirest.get("https://covid19-html5img.glitch.me/image?" + serialize(query))
            .encoding(null)    
            .end(async (res) => {
                if (res.error) {
                    console.log("Error when downloading page : ", " ", res.error)
                    reject(res.error);
                }
                const data = Buffer.from(res.raw_body);
                // fs.writeFileSync('myimg.png', data);
                resolve(data.toString('base64'));
            })
    })
}

module.exports = generate