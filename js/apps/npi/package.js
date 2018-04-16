const http = require("http");

class Package {
	constructor(name) {
		this.name = name;
	}

	get(url, cb) {
		return http.get(url, res => {
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

	getInfo() {
		this.corsGet("", str => {
			console.log(str);
		});
	}
};

module.exports = Package;