'use strict';

const llfs = require('./low-level');
const Utils = require('./utils');
const utils = new Utils(llfs);

const { log, success } = $$.logger;

module.exports = {
  readdir (path, options, callback) {
    callback = callback || options;
    let resolved = null;

    try {
      resolved = utils.resolvePath(path);
    } catch (e) {
      callback(e);

      return;
    }
    if (resolved.level === 0) {
      callback(null, $$.block.devices.map((device) => device.name));
    } else if (resolved.level >= 1) {
      llfs.getPartitions(resolved.parts[0]).then((partitions) => {
        if (resolved.level >= 2) {
          return partitions[resolved.parts[1]].getFilesystem();
        }
        callback(null, partitions.map((_, i) => `p${i}`));
      })
        .then((filesystem) => {
          if (resolved.level <= 1) return;

          /* if (resolved.level >= 3) {
          callback(new Error('Subdirectories aren\'t supported yet'));
        }*/
          return filesystem.readdir(resolved.parts.slice(2).join('/'), callback);
        })

      /* .then(list => {
        if (resolved.level <= 1) return;
        callback(null, list.map(file => file.name), list);
      })*/
        .catch((err) => {
          callback(err);
        });
    }
  },

  /** Read file from system path or device
   * @param  {string} path - Path
   * @param  {object} [options] - Options
   * @param  {function} callback - Callback(error, result)
   */
  readFile (path, options = () => {}, callback = options) {
    let resolved = null;

    if (utils.isSystemPath(path)) {
      log(`${path} is a system path`, { level: 'fs' });

      const extpath = utils.extractSystemPath(path);

      log(`${path} extracted to ${extpath}`, { level: 'fs' });

      callback(null, __SYSCALL.initrdReadFile(extpath));
      success('OK!', { from: 'FS->readFile->System', level: 'fs' });

      return;
    }

    try {
      resolved = utils.resolvePath(path);
    } catch (e) {
      callback(e);

      return;
    }
    if (resolved.level >= 3) {
      llfs.getPartitions(resolved.parts[0]).then((partitions) => partitions[resolved.parts[1]].getFilesystem())
        .then((filesystem) => {
          filesystem.readFile(resolved.parts.slice(2).join('/'), typeof options === 'string' ? { 'encoding': options } : options, callback);
        })
        .catch((err) => {
          callback(err);
        });
    } else {
      callback(new Error('Is a directory'));
    }
  },
  writeFile (path, data, options = () => {}, callback = options) {
    let resolved = null;

    try {
      resolved = utils.resolvePath(path);
    } catch (e) {
      callback(e);

      return;
    }
    if (resolved.level >= 3) {
      llfs.getPartitions(resolved.parts[0]).then((partitions) => partitions[resolved.parts[1]].getFilesystem())
        .then((filesystem) => {
          filesystem.writeFile(resolved.parts.slice(2).join('/'), data, typeof options === 'string' ? { 'encoding': options } : options, callback);
        })
        .catch((err) => {
          callback(err);
        });
    } else {
      callback(new Error('Is a directory'));
    }
  },
  mkdir (path, options = () => {}, callback = options) {
    let resolved = null;

    try {
      resolved = utils.resolvePath(path);
    } catch (e) {
      callback(e);

      return;
    }
    if (resolved.level >= 3) {
      llfs.getPartitions(resolved.parts[0]).then((partitions) => partitions[resolved.parts[1]].getFilesystem())
        .then((filesystem) => {
          filesystem.mkdir(resolved.parts.slice(2).join('/'), options, callback);
        })
        .catch((err) => {
          callback(err);
        });
    } else {
      callback(new Error('Is a directory'));
    }
  },
};
