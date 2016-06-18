/**
 * asure storage files service, version '2015-02-21'
 * method : dirList, dirNew
 */
var storageObj = {
  _xhr: false,
  _fileNewLimit: 4194304,
  _path: false,
  _process: false,
  _stop: false,
  _list: {},
  _info: {
    active: false,
    account: '',
    secret: '',
    url: '',
    container: '',
    version: '2015-02-21'
  },

  beforeBack: false,
  completeBack: false,

  init: function(before, complete) {
    $.support.cors = true;
    if (!storageConf || !storageConf.account || !storageConf.secret || !storageConf.container) {
      return false;
    }
    storageObj._info.active = true;
    storageObj._info.account = storageConf.account;
    storageObj._info.secret = storageConf.secret;
    storageObj._info.container = storageConf.container;
    storageObj._info.url = 'https://' + storageConf.account + '.file.core.windows.net/';
    storageObj.beforeBack = before;
    storageObj.completeBack = complete;
  },
  dirList: function(path, callback, meta) {
    meta = meta || false;
    path = path || '';
    path = (path.indexOf('/') === 0) ? path : '/' + path;
    if (path.slice(-1) !== '/') {
      path = path + '/';
    }
    var _req = {
      act: 'GET',
      path: storageObj._info.container + path,
      query: {
        comp: 'list',
        restype: 'directory'
      }
    }
    var _info = storageObj._requestInit(_req);

    storageObj._ajax(
      _info,
      function(r) {
        var xml = $(r);
        var data = {
          result: '/' + xml.find('EnumerationResults').attr('DirectoryPath'),
          list: {},
          type: []
        };
        xml.find('Entries').children().each(function(i, v) {
          //console.log(v);
          var _type = v.nodeName;
          if (data.list[_type] === undefined) {
            data.list[_type] = [];
            data.type.push(_type);
          }
          data.list[_type].push({
            n: $(v).find('Name').text(),
            p: $(v).find('Properties').text(),
          });
        });
        storageObj._list = data.list;
        storageObj._path = data.result;
        if (meta) {
          storageObj._dirListMeta(data, callback);
        } else {
          if (typeof callback === 'function') {
            callback(data);
          }
        }
      },
      function(xhr, status, error) {
        var data = {
          result: false,
          list: {},
          error: error
        };
        storageObj._list = data.list;
        storageObj._path = data.result;
        if (typeof callback === 'function') {
          callback(data);
        }
      }, null, null, !meta
    );
  },
  _dirListMeta: function(data, callback, type, index) {
    type = type || 0;
    index = index || 0;
    //console.log(type + ',' + index + '/' + data.type.length);
    if (type === data.type.length) {
      //console.log(data);
      if (typeof callback === 'function') {
        callback(data);
      }
      if (typeof storageObj.completeBack === 'function') {
        storageObj.completeBack();
      }
      return false;
    }
    if (!data.type[type]) {
      return false;
    }
    var typeName = data.type[type];
    if (!data.list[typeName][index]) {
      return false;
    }
    var itemName = data.list[typeName][index].n;
    data.list[typeName][index].date = '';
    if (typeName === 'File') {
      storageObj.fileMeta(itemName, function(r) {
        //console.log(r);
        if (r.result) {
          data.list[typeName][index].date = r.meta.date;
        }
        storageObj._dirListNext(data, callback, type, index);
      }, false);
    } else {
      storageObj.dirMeta(itemName, function(r) {
        if (r.result) {
          data.list[typeName][index].date = r.meta.date;
        }
        storageObj._dirListNext(data, callback, type, index);
      }, false);
    }
  },
  _dirListNext: function(data, callback, type, index) {
    var typeName = data.type[type];
    var nextType = type;
    var nextIndex = index + 1;
    if (!data.list[typeName][nextIndex]) {
      nextType = type + 1;
      nextIndex = 0;
    }
    storageObj._dirListMeta(data, callback, nextType, nextIndex);
  },
  dirMeta: function(name, callback, over) {
    if (name == '' || storageObj._path === false) {
      return false;
    }
    var _req = {
      act: 'GET',
      path: storageObj._info.container + storageObj._path + name,
      query: {
        comp: 'metadata',
        restype: 'directory'
      }
    }
    var _info = storageObj._requestInit(_req);

    storageObj._ajax(
      _info,
      function(r, st, xhr) {
        //getResponseHeader
        data = {
          result: name,
          meta: {
            date: xhr.getResponseHeader('Last-Modified')
          }
        }
        if (typeof callback === 'function') {
          callback(data);
        }
      },
      function(xhr, status, error) {
        data = {
          result: false,
          error: error
        }
        if (typeof callback === 'function') {
          callback(data);
        }
      }, null, null, over
    );
  },
  dirNew: function(name, callback) {
    if (name == '' || storageObj._path === false) {
      return false;
    }
    var _req = {
      act: 'PUT',
      path: storageObj._info.container + storageObj._path + name,
      query: {
        restype: 'directory'
      }
    }
    var _info = storageObj._requestInit(_req);

    storageObj._ajax(
      _info,
      function(r) {
        data = {
          result: name
        }
        if (typeof callback === 'function') {
          callback(data);
        }
      },
      function(xhr, status, error) {
        data = {
          result: false,
          error: error,
          text: name
        }
        if (typeof callback === 'function') {
          callback(data);
        }
      }
    );
  },
  dirDel: function(name, callback) {
    if (name == '' || storageObj._path === false) {
      return false;
    }
    var _req = {
      act: 'DELETE',
      path: storageObj._info.container + storageObj._path + name,
      query: {
        restype: 'directory'
      }
    }
    var _info = storageObj._requestInit(_req);

    storageObj._ajax(
      _info,
      function(r) {
        data = {
          result: name
        }
        if (typeof callback === 'function') {
          callback(data);
        }
      },
      function(xhr, status, error) {
        data = {
          result: false,
          error: error
        }
        if (typeof callback === 'function') {
          callback(data);
        }
      }
    );
  },
  fileNew: function(file, callback) {
    if (!file || storageObj._path === false) {
      return false;
    }
    var reader = new FileReader();
    reader.onload = function() {
      var _content = reader.result.split(',')[1] || '';
      var binary = atob(_content);
      var fileArray = [];
      for (var i = 0; i < binary.length; i++) {
        fileArray.push(binary.charCodeAt(i));
      }
      file.data = new Uint8Array(fileArray);
      storageObj._fileInit(file, callback);
    };
    reader.readAsDataURL(file);
  },
  _fileInit: function(file, callback) {
    if (!file || storageObj._path === false) {
      return false;
    }
    var filePathName = (file.path) ? file.path + '/' + file.name : file.name;
    var _req = {
      act: 'PUT',
      path: storageObj._info.container + storageObj._path + filePathName,
      headers: {
        'x-ms-content-length': file.size,
        'x-ms-type': 'file'
      }
    }
    var _info = storageObj._requestInit(_req);

    storageObj._ajax(
      _info,
      function(r) {
        if (file.size > 0) {
          storageObj._fileSet(file, callback);
          return false;
        }
        data = {
          result: filePathName
        }
        if (typeof callback === 'function') {
          callback(data);
        }
      },
      function(xhr, status, error) {
        data = {
          result: false,
          error: error,
          text: filePathName
        }
        if (typeof callback === 'function') {
          callback(data);
        }
      }
    );
  },
  _fileSet: function(file, callback) {
    if (!file || storageObj._path === false) {
      return false;
    }
    storageObj._filePutRange(file, callback);
  },
  _filePutRange: function(file, callback, index) {
    index = index || 0;
    var _length = storageObj._fileNewLimit;
    var _count = Math.ceil(file.data.length / _length);
    var _st = index * _length;
    var _end = _st + _length - 1;
    if (index === _count - 1) {
      _end = file.data.length - 1;
    }
    var filePathName = (file.path) ? file.path + '/' + file.name : file.name;
    var _data = file.data.slice(_st, _end + 1);
    var _req = {
      act: 'PUT',
      path: storageObj._info.container + storageObj._path + filePathName,
      headers: {
        'x-ms-range': 'bytes=' + _st + '-' + _end,
        'x-ms-write': 'update'
      },
      query: {
        comp: 'range'
      },
      contentLength: _data.length,
      contentType: file.type || 'application/octet-stream'
    }
    var _info = storageObj._requestInit(_req);
    _info.data = _data;
    storageObj._ajax(
      _info,
      function(r) {
        if (index < _count - 1) {
          storageObj._filePutRange(file, callback, index + 1);
          return true;
        }
        data = {
          result: filePathName
        }
        if (typeof callback === 'function') {
          callback(data);
        }
      },
      function(xhr, status, error) {
        data = {
          result: false,
          error: error,
          text: filePathName
        }
        if (typeof callback === 'function') {
          callback(data);
        }
      }
    );
  },
  fileGetMutiple: function(list, callback) {
    if (!list || storageObj._path === false) {
      return false;
    }
    var data = {
      result: false,
      dir: [''],
      file: [list.file],
      index: 1,
      fileIndex: 0
    }
    for (var i in list.dir) {
      data.dir.push(list.dir[i]);
      data.file.push([]);
    }
    storageObj._fileGetStructure(data, callback);
  },
  _fileGetStructure: function(list, callback) {
    //中止
    if (storageObj._stop) {
      //console.log('ajax stop!');
      storageObj._stop = false;
      if (typeof storageObj.completeBack === 'function') {
        storageObj.completeBack(null, null);
      }
      return false;
    }
    //循環結束
    if (list.dir.length === list.index) {
      //console.log('structure browse over');
      storageObj._fileGetStructureBrowse(list, callback);
      return true;
    }
    if (!list.dir[list.index]) {
      return false;
    }
    var path = '/' + list.dir[list.index];
    var _req = {
      act: 'GET',
      path: storageObj._info.container + path,
      query: {
        comp: 'list',
        restype: 'directory'
      }
    }
    var _info = storageObj._requestInit(_req);

    storageObj._ajax(
      _info,
      function(r) {
        var xml = $(r);
        var resultPath = xml.find('EnumerationResults').attr('DirectoryPath');

        xml.find('Entries').children().each(function(i, v) {
          //console.log(v);
          var _type = v.nodeName;
          switch (_type) {
            case 'Directory':
              list.dir.push(resultPath + '/' + $(v).find('Name').text());
              list.file.push([]);
              break;
            case 'File':
              list.file[list.index].push(resultPath + '/' + $(v).find('Name').text());
              break;
          }
        });
        list.index++;
        storageObj._fileGetStructure(list, callback);
      },
      function(xhr, status, error) {
        list.index++;
        storageObj._fileGetStructure(list, callback);
      }, null, null, false
    );
  },
  _fileGetStructureBrowse: function(list, callback) {
    //中止
    if (storageObj._stop) {
      //console.log('ajax stop!');
      storageObj._stop = false;
      if (typeof storageObj.completeBack === 'function') {
        storageObj.completeBack(null, null);
      }
      return false;
    }
    //循環結束
    if (list.file.length === list.fileIndex) {
      //console.log('structure file over');
      if (typeof callback === 'function') {
        list.result = true;
        callback(list);
      }
      if (typeof storageObj.completeBack === 'function') {
        storageObj.completeBack();
      }
      return false;
      return true;
    }
    if (!list.file[list.fileIndex]) {
      return false;
    }
    if (list.file[list.fileIndex].length === 0) {
      list.fileIndex++;
      storageObj._fileGetStructureBrowse(list, callback);
      return false;
    }
    storageObj._fileGetStructureData(list.file[list.fileIndex], function(r) {
      list.file[list.fileIndex] = r.result;
      list.fileIndex++;
      storageObj._fileGetStructureBrowse(list, callback);
    }, false)
  },
  _fileGetStructureData: function(list, callback, over) {
    over = (over === undefined) ? true : over;
    var data = {
      result: [],
      list: list
    }
    storageObj._fileGetBrowse(data, callback, 0, over);
  },
  _fileGetBrowse: function(data, callback, index, over) {
    index = index || 0;
    over = (over === undefined) ? true : over;
    if (index === data.list.length) {
      if (typeof callback === 'function') {
        callback(data);
      }
      if (over === true && typeof storageObj.completeBack === 'function') {
        storageObj.completeBack();
      }
      return false;
    }
    if (!data.list[index]) {
      return false;
    }
    storageObj.fileGet(data.list[index], function(r) {
      //console.log(r);
      if (r.result) {
        data.result.push(r);
      }
      storageObj._fileGetBrowse(data, callback, index + 1, over);
    }, false);
  },
  fileGet: function(name, callback, over) {
    if (!name || storageObj._path === false) {
      return false;
    }
    var _req = {
      act: 'GET',
      path: storageObj._info.container + storageObj._path + name
    }
    var _info = storageObj._requestInit(_req);

    storageObj._ajax(
      _info,
      function(r) {
        var byteNumbers = new Array(r.length);
        for (var i = 0; i < r.length; i++) {
          byteNumbers[i] = r.charCodeAt(i);
        }
        var byteArray = new Uint8Array(byteNumbers);
        data = {
          result: name,
          dataArray: byteArray
        }
        if (typeof callback === 'function') {
          callback(data);
        }
      },
      function(xhr, status, error) {
        data = {
          result: false,
          error: error
        }
        if (typeof callback === 'function') {
          callback(data);
        }
      },
      function(xhr, _set) {
        xhr.overrideMimeType("application/octet-stream; charset=x-user-defined;");
      }, null, over
    );
  },
  fileMeta: function(name, callback, over) {
    if (name == '' || storageObj._path === false) {
      return false;
    }
    var _req = {
      act: 'GET',
      path: storageObj._info.container + storageObj._path + name,
      query: {
        comp: 'metadata'
      }
    }
    var _info = storageObj._requestInit(_req);

    storageObj._ajax(
      _info,
      function(r, st, xhr) {
        //getResponseHeader
        data = {
          result: name,
          meta: {
            date: xhr.getResponseHeader('Last-Modified')
          }
        }
        if (typeof callback === 'function') {
          callback(data);
        }
      },
      function(xhr, status, error) {
        data = {
          result: false,
          error: error
        }
        if (typeof callback === 'function') {
          callback(data);
        }
      }, null, null, over
    );
  },
  fileDel: function(name, callback) {
    if (name == '' || storageObj._path === false) {
      return false;
    }
    var _req = {
      act: 'DELETE',
      path: storageObj._info.container + storageObj._path + name
    }
    var _info = storageObj._requestInit(_req);

    storageObj._ajax(
      _info,
      function(r) {
        data = {
          result: name
        }
        if (typeof callback === 'function') {
          callback(data);
        }
      },
      function(xhr, status, error) {
        data = {
          result: false,
          error: error
        }
        if (typeof callback === 'function') {
          callback(data);
        }
      }
    );
  },
  _toBinaryString: function(data) {
    var ret = [];
    var len = data.length;
    var byte;
    for (var i = 0; i < len; i++) {
      byte = (data.charCodeAt(i) & 0xFF);
      console.log(byte);
      ret.push(String.fromCharCode(byte));
    }
    return ret.join('');
  },
  _requestInit: function(req) {
    if (storageObj._info.active !== true) {
      return false;
    }
    var date = new Date;
    var reqInfo = {};
    var queryStr = '';
    var queryUrl = '';
    var headerStr = '';
    var contentLength = '';
    var contentType = '';
    reqInfo.act = req.act;
    reqInfo.date = date.toUTCString();
    var headers = {
      'x-ms-date': reqInfo.date,
      'x-ms-version': storageObj._info.version
    }
    for (var key in req.headers) {
      headers[key] = req.headers[key];
    }

    Object.keys(headers).sort().forEach(function(v, i) {
      headerStr += v + ':' + headers[v] + "\n";
    });

    if (req.contentLength) {
      contentLength = req.contentLength;
    }

    if (req.contentType) {
      contentType = req.contentType;
      headers['Content-Type'] = contentType;
    }

    headers['If-None-Match'] = '';

    req.path = encodeURI(decodeURI(req.path));
    for (var key in req.query) {
      var _parameter = encodeURI(key) + '=' + encodeURI(req.query[key]);
      queryStr += "\n" + key + ":" + req.query[key];
      queryUrl += (queryUrl == '') ? '?' + _parameter : '&' + _parameter;
    }
    var reqStr = req.act + "\n\n\n" + contentLength + "\n\n" + contentType + "\n\n\n\n\n\n\n" + headerStr + "/" + storageObj._info.account + '/' + req.path + queryStr;
    var signature = CryptoJS.HmacSHA256(reqStr, CryptoJS.enc.Base64.parse(storageObj._info.secret)).toString(CryptoJS.enc.Base64);
    headers.Authorization = 'SharedKey ' + storageObj._info.account + ':' + signature;
    reqInfo.headers = headers;
    reqInfo.url = storageObj._info.url + req.path + queryUrl;
    //console.log(req.path);
    return reqInfo;
  },
  _ajax: function(info, success, error, before, complete, over) {
    over = (over === undefined) ? true : over;
    if (storageObj._info.active !== true) {
      if (typeof error === 'function') {
        error(false, false, '尚未登入！');
      }
      return false;
    }

    if (storageObj._process === true) {
      if (typeof error === 'function') {
        error(false, false, '其他處理還在進行中...');
      }
      return false;
    }

    storageObj._xhr = $.ajax({
      crossDomain: true,
      processData: false,
      type: info.act,
      url: info.url,
      headers: info.headers,
      data: info.data,
      success: function(_r, _sta, xhr) {
        storageObj._process = false;
        if (typeof success === 'function') {
          success(_r, _sta, xhr);
        }
      },
      error: function(xhr, _sta, _err) {
        storageObj._process = false;
        if (storageObj._stop) {
          //console.log('ajax stop!');
          storageObj._stop = false;
          if (typeof storageObj.completeBack === 'function' && over === true) {
            storageObj.completeBack(xhr, _sta);
          }
          return false;
        }
        if (typeof error === 'function') {
          error(xhr, _sta, _err);
        }
      },
      beforeSend: function(xhr, _set) {
        storageObj._process = true;
        if (typeof before === 'function') {
          before(xhr, _set);
        }
        if (typeof storageObj.beforeBack === 'function') {
          storageObj.beforeBack(xhr, _set);
        }
      },
      complete: function(xhr, _sta) {
        //console.log('complete');
        storageObj._process = false;
        if (typeof complete === 'function') {
          complete(xhr, _set);
        }
        if (typeof storageObj.completeBack === 'function' && over === true) {
          storageObj.completeBack(xhr, _sta);
        }
      }
    });
  },
  _ajaxCancel: function() {
    if (storageObj._xhr) {
      //console.log('ajax cancel!');
      storageObj._stop = true;
      if (storageObj._process) {
        storageObj._process = false;
        storageObj._xhr.abort();
        storageObj._xhr = false;
      }
    }
  }
}