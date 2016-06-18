/**
 * storage interface
 */
var siObj = {
  init: storageObj.init,
  list: function(path, callback) {
    storageObj.dirList(path, function(r) {
      if (typeof callback === 'function') {
        callback(r);
      }
    }, true);
  },
  dirNew: function(name, callback) {
    storageObj.dirNew(name, function(r) {
      if (typeof callback === 'function') {
        callback(r);
      }
    });
  },
  itemDel: function(id, type, callback) {
    switch (type) {
      case 'Directory':
        storageObj.dirDel(id, function(r) {
          if (typeof callback === 'function') {
            callback(r);
          }
        });
        break;

      case 'File':
        storageObj.fileDel(id, function(r) {
          if (typeof callback === 'function') {
            callback(r);
          }
        });
        break;
    }

  },
  fileNew: function(file, callback) {
    storageObj.fileNew(file, function(r) {
      if (typeof callback === 'function') {
        callback(r);
      }
    })
  },
  fileDonwload: function(id, callback) {
    storageObj.fileGet(id, function(r) {
      if (typeof callback === 'function') {
        callback(r);
      }
    })
  },
  fileDonwloadZip: function(idList, callback) {
    storageObj.fileGetMutiple(idList, function(r) {
      if (typeof callback === 'function') {
        callback(r);
      }
    })
  },
  currentPath: function() {
    return storageObj._path;
  },
  currentProcess: function() {
    return storageObj._process;
  },
  actionCancel: storageObj._ajaxCancel
}