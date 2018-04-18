const http = require("http");
const url = require("url");

class Package {
	constructor(name) {
		this.name = name;
	}

	get(path, cb) {
		const opt = url.parse(path);
		opt.headers = {
			"X-Requested-With": "JsOS/NPI",
			"User-Agent": "JsOS/NPI"
		};

		return http.get(opt, res => {
			let str = "";
			res.setEncoding("utf8");
			res.on("data", chunk => {
				str += chunk;
			});
			res.on("end", () => {
				if(cb) {
					cb(str);
				}
			});
		});
	}

	corsGet(url, cb) {
		return this.get("http://cors-anywhere.herokuapp.com/" + url, cb);
	}

	api(path, cb) {
		this.corsGet("https://api.github.com/" + path, str => {
			cb(JSON.parse(str));
		});
	}

	getInfo() {
		this.api("repos/JsOS-Team/NPI-pkg/contents", files => {
			console.log("Files:", files);
		});
	}
};

module.exports = Package;