const GitHub = require("./github");

class Package {
	constructor(name) {
		this.name = name;
		this.installationStopped = false;
		this.github = new GitHub();
	}

	getInfo() {
		let info = {
			name: this.name
		};
		let pkg;

		// Get package
		return this.github.readDir("packages")
			.then(packages => {
				pkg = packages.find(file => file.name === this.name);
				if(!pkg) {
					throw new Error("Package not found");
				}
				info.url = pkg.html_url;
				info.sha = pkg.sha;

				// Get module
				return this.github.readModule(`packages/${this.name}`)
					.then(module => {
						info.module = module.submodule_git_url;
					}, () => {
						info.module = null;
					});
			})
			.then(() => {
				// Read files
				return this.github.readTree(pkg.sha);
			}).then(tree => {
				info.files = 0;
				info.size = 0;
				tree.tree.forEach(file => {
					if(file.type === "blob") {
						info.files++;
						info.size += file.size;
					}
				});
			})
			.then(() => info);
	}

	install(io) {
		this.installationStopped = false;

		io.writeLine("Getting information");
		return this.getInfo()
			.then(info => {
				io.writeLine("Gathering package");
				return this.github.readTree(info.sha);
			})
			.then(tree => {
				return Promise.all(tree.tree.map(file => this.installFile(file, io)))
					.catch(e => {
						this.installationStopped = true;
						throw e;
					});
			})
			.then(() => {
				io.writeLine(`Installing package ${this.name}`);

				const app = require(`npi/${this.name}`);

				// Install application
				PERSISTENCE.Apps[this.name] = {
					run: app.call,
					commands: app.commands
				};

				// Create links
				for(const command of app.commands) {
					PERSISTENCE.Apps._commands[command] = this.name;
				}

				io.writeLine(`Installed package ${this.name}`);
			});
	}
	installFile(file, io) {
		if(file.type != "blob") {
			return;
		}

		io.writeLine("Downloading " + file.path);

		return this.github.readFilePages(`packages/${this.name}/${file.path}`)
			.then(code => {
				if(this.installationStopped) {
					return;
				}

				require.register(`/node_modules/npi/${this.name}/${file.path}`, code);
				io.writeLine("Installed " + file.path);
			});
	}
};

module.exports = Package;