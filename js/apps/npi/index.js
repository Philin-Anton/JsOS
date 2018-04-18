// JsOS/NPI
// By Ivanq

'use strict';

const Package = require("./package");

function main(args, api, res) {
	const io = api.stdio;

	args = args.split(/\s+/);
	let cmd = args.shift();

	if(cmd == "" || cmd == "help") {
		io.setColor("yellow");
		io.writeLine("JsOS/NPI - No Problem Installer");
		io.writeLine("Commands:");
		io.writeLine("help      Show command or subcommand help");
		io.writeLine("info      Show package info");
		return res(0);
	} else if(cmd == "info") {
		if(!args[0]) {
			io.setColor("red");
			io.writeLine("npi info: choose some package");
			return res(1);
		}

		const pkg = new Package(args[0]);
		pkg.getInfo()
			.then(info => {
				io.setColor("white");
				for(const key of Object.keys(info)) {
					let value = info[key];
					if(value === null) {
						value = "<null>";
					}

					io.writeLine(key + " ".repeat(10 - key.length) + value);
				}
				res(0);
			}, e => {
				io.writeError(e.message);
				res(1);
			});
	} else if(cmd == "install") {
		if(!args[0]) {
			io.setColor("red");
			io.writeLine("npi install: choose some package");
			return res(1);
		}

		const pkg = new Package(args[0]);
		pkg.install(io)
			.then(
				() => res(0),
				e => {
					io.writeError(e);
					res(1);
				}
			);
	} else {
		io.setColor("red");
		io.writeLine("Unknown command");
		return res(1);
	}
}

exports.call = (cmd, args, api, res) => main(args, api, res);

exports.commands = ["npi"];