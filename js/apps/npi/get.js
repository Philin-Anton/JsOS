const http = require("http");
const url = require("url");

function get(path, cb) {
	const opt = url.parse(path);
	opt.headers = {
		"X-Requested-With": "JsOS/NPI",
		"User-Agent": "JsOS/NPI"
	};

	function once(resolve, reject, tries) {
		let done = false;

		http.get(opt, res => {
			let str = "";
			res.setEncoding("utf8");
			res.on("data", chunk => {
				str += chunk;
			});
			res.on("end", () => {
				done = true;
				resolve(str);
			});
			res.on("error", e => {
				done = true;
				reject(e);
			});

			setTimeout(() => {
				if(done) {
					return;
				}

				if(tries === 0) {
					reject(new Error("Timeout on " + path));
				} else {
					once(resolve, reject, tries - 1);
				}
			}, 20000);
		});
	}

	// Try 3 times on timeout
	return new Promise((resolve, reject) => {
		once(resolve, reject, 3);
	});
}

function corsGet(url) {
	return get("http://cors-anywhere.herokuapp.com/" + url)
		.then(res => {
			if(res.toLowerCase().indexOf("//www.herokucdn.com") > -1) {
				throw new Error("cors-anywhere.herokuapp.com is down");
			}

			return res;
		});
}

module.exports = corsGet;