const get = require("./get");

class GitHub {
	api(path) {
		return get("https://api.github.com/" + path)
			.then(JSON.parse)
			.then(res => {
				if(typeof res.message === "string") {
					if(res.message.indexOf("rate limit") > -1) {
						throw new Error("GitHub API rate limit exceeded");
					}
					throw new Error(res.message);
				}

				return res;
			});
	}


	readDir(path) {
		return this.api("repos/JsOS-Team/NPI-pkg/contents/" + path)
			.then(files => {
				if(!Array.isArray(files)) {
					throw new Error(path + " is not a directory");
				} else {
					return files;
				}
			});
	}
	readModule(path) {
		return this.api("repos/JsOS-Team/NPI-pkg/contents/" + path)
			.then(module => {
				if(module.type !== "submodule") {
					throw new Error(path + " is not a module");
				} else {
					return module;
				}
			});
	}
	readTree(sha) {
		return this.api("repos/JsOS-Team/NPI-pkg/git/trees/" + sha + "?recursive=1");
	}
	readFilePages(path) {
		return get("https://jsos-team.github.io/NPI-pkg/" + path);
	}
};

module.exports = GitHub;