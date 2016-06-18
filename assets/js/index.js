//cloud storage
var indexObj = {
  _fileDragTimer: false,
  _blobUrl: false,
  _dataChange: false,
  init: function() {
    var hash = indexObj.getHash();
    siObj.init(indexObj.beforeAct, indexObj.completeAct);
    siObj.list(hash, indexObj.listHandler);
  },
  beforeAct: function() {
    $('#itemSearch').val('');
    $('.nav.navbar-right button, #pathContent button').attr('disabled', "true");
  },
  completeAct: function() {
    $('.nav.navbar-right button, #pathContent button').removeAttr('disabled');
  },
  folderFoward: function(folder) {
    $('#pathList').html('-');
    $('#pathInfo').html('-')
    $('#pathContent tbody').html('');
    $('#pathContent').hide();
    folder = folder || '';
    var path = indexObj.getHash() + '/' + folder;
    siObj.list(path, indexObj.listHandler);
  },
  folderRefresh: function() {
    indexObj.folderFoward();
  },
  dirPanel: function() {
    $('#modalFolder').modal({
      show: true,
      backdrop: 'static'
    });
  },
  dirPanelClose: function() {
    $('#folderNameNew').val('');
    $('#folderNameInfo').text('-');
    if (indexObj._dataChange === true) {
      indexObj._dataChange = false;
      indexObj.folderRefresh();
    }
  },
  dirNew: function() {
    var _name = $('#folderNameNew').val();
    if (!_name) {
      return false;
    }
    $('#folderNameNew').attr('readonly', "true");
    $('#folderNameInfo').text('-');
    $(this).button('loading');
    $(this).siblings('button').hide();
    siObj.dirNew(_name, indexObj.dirNewHandler);
  },
  dirNewHandler: function(r) {
    $('#folderNameNew').removeAttr('readonly');
    $('#btn_dirNew').button('reset').siblings('button').show();
    if (r.result === false) {
      $('#folderNameInfo').html('<span class="text-danger">錯誤：' + r.error + '</span>');
      return false;
    }
    indexObj._dataChange = true;
    $('#folderNameNew').val('');
    $('#folderNameInfo').html('<span class="text-success">成功：資料夾<strong> ' + r.result + ' </strong>已建立。</span>');
  },
  filePanel: function() {
    $('#modalFile').modal({
      show: true,
      backdrop: 'static'
    });
  },
  filePanelClose: function() {
    $('#fileNameInfo').text('-');
    indexObj.fileSelectRm();
    if (indexObj._dataChange === true) {
      indexObj._dataChange = false;
      indexObj.folderRefresh();
    }
  },
  fileSelect: function(e) {
    var input = e.target;
    if (!input.files[0]) {
      return false;
    }
    indexObj._file = {
      total: 1,
      check: 0,
      dir: ["/"],
      file: [
        [input.files[0]]
      ]
    };
    indexObj.fileRead(input.files[0].name + ' 已選取');
    $('#modalFileUpload').val('');
  },
  fileDragSelect: function(e) {
    e.preventDefault();
    $('#btn_fileNew').attr('disabled', 'true');
    indexObj._file = {
      total: 0,
      check: 0,
      dir: [],
      file: []
    };
    var items;
    if (e.originalEvent.dataTransfer.items) {
      items = e.originalEvent.dataTransfer.items;
      indexObj._file.dir.push('/');
      indexObj._file.file.push([]);
      for (var i = 0; i < items.length; i++) {
        // webkitGetAsEntry is where the magic happens
        var item = items[i].webkitGetAsEntry();
        if (item) {
          indexObj.fileBrowseTree(item);
        }
      }
    } else {
      items = e.originalEvent.dataTransfer.files;
      indexObj._file.dir.push('/');
      indexObj._file.file.push([]);
      for (var i = 0; i < items.length; i++) {
        if (items[i].size > 0 || items[i].type !== "") {
          indexObj._file.file[0].push(items[i]);
          indexObj._file.total++;
        }
      }
      indexObj.fileRead(indexObj._file.total + '個檔案已拖入');
    }
  },
  fileBrowseTree: function(item, path) {
    path = path || "/";
    if (item.isFile) {
      // Get file
      item.file(function(file) {
        clearTimeout(indexObj._fileDragTimer);
        var _idx = indexObj._file.dir.indexOf(path);
        indexObj._file.file[_idx].push(file);
        indexObj._file.total++;
        indexObj._fileDragTimer = setTimeout(function() {
          indexObj.fileRead(indexObj._file.total + '個檔案已拖入');
        }, 1000);
      });
    } else if (item.isDirectory) {
      // Get folder contents
      indexObj._file.dir.push(item.fullPath);
      indexObj._file.file.push([]);
      var dirReader = item.createReader();
      dirReader.readEntries(function(entries) {
        for (var i = 0; i < entries.length; i++) {
          indexObj.fileBrowseTree(entries[i], item.fullPath);
        }
      });
    }
  },
  fileRead: function(msg) {
    //console.log(indexObj._file);
    $('#modalFileSelect').text(msg);
    $('#modalFileRemove').show();
    $('#btn_fileNew').removeAttr('disabled');
  },
  fileNew: function() {
    if (!indexObj._file) {
      return false;
    }
    $(this).button('loading');
    $(this).siblings('button').hide();
    indexObj._file.idx = {
      dir: 0,
      file: -1
    };
    indexObj.fileNewProcess();
    $('#fileNameInfo').html('<span class="text-primary">上傳開始</span>');
  },
  fileNewProcess: function() {
    var idxDir = indexObj._file.idx.dir;
    var idxFile = indexObj._file.idx.file;
    if (!indexObj._file.dir[idxDir]) {
      indexObj.fileNewHandler();
      return false;
    }
    if (idxFile > -1 && !indexObj._file.file[idxDir][idxFile]) {
      indexObj.fileNewHandler();
      return false;
    }

    if (idxFile === -1) {
      //console.log("dir:" + indexObj._file.dir[idxDir].slice(1) + '/');
      if (indexObj._file.dir[idxDir] === "/") {
        indexObj.fileNewNext();
      } else {
        siObj.dirNew(indexObj._file.dir[idxDir].slice(1), indexObj.fileNewNext);
      }
    } else {
      //console.log("file:" + indexObj._file.dir[idxDir].slice(1) + '/' + indexObj._file.file[idxDir][idxFile].name);
      indexObj._file.file[idxDir][idxFile].path = indexObj._file.dir[idxDir].slice(1);
      siObj.fileNew(indexObj._file.file[idxDir][idxFile], indexObj.fileNewNext);
    }
  },
  fileNewNext: function(r) {
    if (r) {
      if (r.result === false) {
        $('#fileNameInfo').prepend('<span class="text-danger">' + r.text + ' 上傳失敗</span><br/>');
      } else {
        indexObj._dataChange = true;
        $('#fileNameInfo').prepend('<span class="text-success"><strong>' + r.result + ' </strong>已上傳。</span><br/>');
      }
    }

    indexObj._file.idx.file += 1;
    if (!indexObj._file.file[indexObj._file.idx.dir][indexObj._file.idx.file]) {
      indexObj._file.idx.dir += 1;
      indexObj._file.idx.file = -1;
    }
    indexObj.fileNewProcess();
  },
  fileNewHandler: function() {
    $('#fileNameInfo').prepend('<span class="text-primary">上傳結束</span><br/>');
    indexObj.fileSelectRm();
    $('#btn_fileNew').button('reset').siblings('button').show();
  },
  fileSelectRm: function() {
    indexObj._file = false;
    $('#modalFileRemove').hide();
    $('#modalFileSelect').text('');
    $('#btn_fileNew').attr('disabled', 'true');
  },
  listHandler: function(r) {
    if (r.result === false) {
      $('#pathInfo').html('<span class="text-danger">錯誤：' + r.error + '</span>');
      return false;
    }
    //bread
    var path = r.result.slice(1, -1);
    var breadStr = '<li class="active">Home</li>'
    if (path !== '') {
      var pathSet = path.split('/');
      breadStr = '<li><a href="#">Home</a></li>';
      for (var i in pathSet) {
        var pathIdx = parseInt(i) + 1;
        if (i == (pathSet.length - 1)) {
          breadStr += '<li class="active">' + pathSet[i] + '</li>';
        } else {
          breadStr += '<li><a href="#' + encodeURI(pathSet.slice(0, pathIdx).join('/')) + '">' + pathSet[i] + '</a></li>';
        }
      }
    }
    $('#pathList').html(breadStr);

    //info
    var dirCount = (r.list.Directory) ? r.list.Directory.length : 0;
    var fileCount = (r.list.File) ? r.list.File.length : 0;
    var infoStr = '<span>Folders <span class="badge">' + dirCount + '</span></span>　<span>Files <span class="badge">' + fileCount + '</span></span>';
    $('#pathInfo').html(infoStr);
    var contentStr = '';
    var typeSet = ['Directory', 'File'];
    for (var t in typeSet) {
      if (typeSet[t] in r.list) {
        for (var i in r.list[typeSet[t]]) {
          var _name = r.list[typeSet[t]][i].n;
          var _prop = r.list[typeSet[t]][i].p;
          var _date = '-';
          var itemStr = '';
          if (r.list[typeSet[t]][i].date && r.list[typeSet[t]][i].date != '') {
            _date = new Date(r.list[typeSet[t]][i].date);
            _date = _date.getStrDateTime().slice(0, 16);
          }
          switch (typeSet[t]) {
            case 'Directory':
              itemStr = '<tr><td><span class="glyphicon glyphicon-folder-open" aria-hidden="true"></span>' + _name + '</td><td>-</td><td>' + _date + '</td><td><button type="button" class="btn btn-info btn-xs btn_enter" data-id="' + _name + '" aria-label="Left Align"><span class="glyphicon glyphicon-log-in" aria-hidden="true"></span></button> <button type="button" class="btn btn-danger btn-xs btn_del" data-type="' + typeSet[t] + '" data-id="' + _name + '" aria-label="Left Align"><span class="glyphicon glyphicon-remove" aria-hidden="true"></span></button></td><td><input class="checkItem" type="checkbox" data-type="' + typeSet[t] + '" data-id="' + _name + '"></td></tr>';
              break;
            case 'File':
              var _byte = indexObj.formateBytes(Math.round(_prop));
              itemStr = '<tr><td><span class="glyphicon glyphicon-file" aria-hidden="true"></span>' + _name + '</td><td>' + _byte + '</td><td>' + _date + '</td><td><button type="button" class="btn btn-info btn-xs btn_download" data-id="' + _name + '" aria-label="Left Align"><span class="glyphicon glyphicon-download-alt" aria-hidden="true"></span></button> <button type="button" class="btn btn-danger btn-xs btn_del" data-type="' + typeSet[t] + '" data-id="' + _name + '" aria-label="Left Align"><span class="glyphicon glyphicon-remove" aria-hidden="true"></span><td><input class="checkItem" type="checkbox" data-type="' + typeSet[t] + '" data-id="' + _name + '"></td></button></td></tr>';
              break;
          }
          contentStr += itemStr;
        }
      }
    }
    if (contentStr !== '') {
      $('#pathContent tbody').html(contentStr);
      $('#pathContent').show();
    }
  },
  itemDelete: function(e) {
    var _id = $(this).attr('data-id');
    var _type = $(this).attr('data-type');
    if (!_id) {
      return false;
    }
    siObj.itemDel(_id, _type, indexObj.itemDeleteHandler);
  },
  itemDeleteHandler: function(r) {
    if (r.result === false) {
      $('#modalError .modal-body').html(r.error);
      $('#modalError').modal('show');
      return false;
    }
    indexObj.folderRefresh();
  },
  dirEnter: function() {
    var _id = encodeURI($(this).attr('data-id'));
    var _current = indexObj.getHash();
    var _hash = (_current) ? _current + '/' + _id : _id;
    indexObj.setHash(_hash);
  },
  fileDownload: function() {
    $('#modalDownload .modal-body').html('下載中...');
    $('#modalDownload').modal({
      show: true,
      backdrop: 'static'
    });
    var _id = $(this).attr('data-id');
    siObj.fileDonwload(_id, indexObj.fileDownloadHandler);
  },
  fileDownloadHandler: function(r) {
    if (r.result === false) {
      $('#modalDownload .modal-body').html('<span class="text-danger">錯誤：' + r.error + '</span>');
      return false;
    }
    var blob = new Blob([r.dataArray], {
      type: 'application/octet-stream'
    });
    indexObj._blobUrl = URL.createObjectURL(blob);
    var infoStr = '<div class="input-group"><div class="form-control form-inline" style="overflow: hidden; line-height: 25px">' + r.result + '</div><div class="input-group-btn"><a href="' + indexObj._blobUrl + '" download="' + r.result + '" class="btn btn-info" aria-label="Left Align">點擊下載</a></div></div>';
    $('#modalDownload .modal-body').html(infoStr);
  },
  fileDonwloadZip: function() {
    var _count = $('.checkItem:checked').length;
    if (_count === 0) {
      return false;
    }
    $('#modalDownload .modal-body').html('下載中...');
    $('#modalDownload').modal({
      show: true,
      backdrop: 'static'
    });
    var list = {
      dir: [],
      file: []
    };
    $('.checkItem:checked').each(function(index, el) {
      switch ($(el).attr('data-type')) {
        case 'Directory':
          list.dir.push($(el).attr('data-id'));
          break;
        case 'File':
          list.file.push($(el).attr('data-id'));
          break;
      }

    });
    siObj.fileDonwloadZip(list, indexObj.fileDonwloadZipHandler);
  },
  fileDonwloadZipHandler: function(r) {
    if (!r.result) {
      $('#modalDownload .modal-body').html('<span class="text-danger">錯誤：請重新下載</span>');
      return false;
    }
    console.log(r);
    var zipName = 'download.zip';
    var zip = new JSZip();
    for (var i in r.dir) {
      zip.folder(r.dir[i]);
      if (r.file[i].length === 0 ) {
        continue;
      }
      for (var j in r.file[i]) {
        zip.file(r.file[i][j].result, r.file[i][j].dataArray, {
          binary: true
        });
      }
    }
    var content = zip.generate({
      type: "blob",
      encodeFileName: function(string) {
        var big5Array = new TextEncoder("big5", {
          NONSTANDARD_allowLegacyEncoding: true
        }).encode(string);
        var stringOrig = new TextDecoder('x-user-defined').decode(big5Array);
        var byteNumbers = [];
        var byte;
        for (var i = 0; i < stringOrig.length; i++) {
          byte = (stringOrig.charCodeAt(i));
          byteNumbers.push(byte);
        }
        //console.log(byteNumbers);
        //測試.json => [63412, 63482, 63416, 63445, 46, 106, 115, 111, 110]
        return byteNumbers;
      }
    });
    indexObj._blobUrl = URL.createObjectURL(content);
    var infoStr = '<div class="input-group"><div class="form-control form-inline" style="overflow: hidden; line-height: 25px">' + zipName + '</div><div class="input-group-btn"><a href="' + indexObj._blobUrl + '" download="' + zipName + '" class="btn btn-info" aria-label="Left Align">點擊下載</a></div></div>';
    $('#modalDownload .modal-body').html(infoStr);
  },
  downloadPanelClose: function() {
    siObj.actionCancel();
    URL.revokeObjectURL(indexObj._blobUrl);
    indexObj._blobUrl = false;
  },
  hashHandler: function() {
    $('#pathList').html('-');
    $('#pathInfo').html('-')
    $('#pathContent tbody').html('');
    $('#pathContent').hide();
    var _hash = indexObj.getHash();
    siObj.list(_hash, indexObj.listHandler);
  },
  getHash: function() {
    var _hash = window.location.hash.split('#')[1] || '';
    return _hash;
  },
  setHash: function(_hash) {
    window.location.hash = _hash;
  },
  formateBytes: function(bytes) {
    var sizes = ['byte', 'KB', 'MB', 'GB', 'TB'];
    if (bytes == 0) return '0 byte';
    var i = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)));
    return Math.round(bytes / Math.pow(1000, i), 2) + ' ' + sizes[i];
  },
  checkAll: function() {
    var _checked = $('#checkAll').prop('checked');
    $('.checkItem').prop('checked', _checked);
  }
}
$(document).ready(function() {
  $('#pathContent tbody').on('click', '.btn_del', indexObj.itemDelete);
  $('#pathContent tbody').on('click', '.btn_enter', indexObj.dirEnter);
  $('#pathContent tbody').on('click', '.btn_download', indexObj.fileDownload);

  $('.btn_download_all').on('click', indexObj.fileDonwloadZip);

  $('.btn_refresh').on('click', indexObj.folderRefresh);
  $('.btn_dirPanel').on('click', indexObj.dirPanel);
  $('.btn_filePanel').on('click', indexObj.filePanel);

  $('#modalDownload').on('hide.bs.modal', indexObj.downloadPanelClose);
  $('#modalFolder').on('hide.bs.modal', indexObj.dirPanelClose);
  $('#modalFile').on('hide.bs.modal', indexObj.filePanelClose);

  $('#btn_dirNew').on('click', indexObj.dirNew);
  $('#btn_fileNew').on('click', indexObj.fileNew);
  $('#modalFileUpload').on('change', indexObj.fileSelect);
  $('#modalFileRemove').on('click', indexObj.fileSelectRm);

  $('#checkAll').on('click', indexObj.checkAll);

  var fileDrag = $('#modalFileDrag');
  fileDrag.on('dragenter', function(e) {
    e.stopPropagation();
    e.preventDefault();
  });
  fileDrag.on('dragover', function(e) {
    e.stopPropagation();
    e.preventDefault();
  });
  fileDrag.on('drop', indexObj.fileDragSelect);

  $('#itemSearch').keyup(function() {
    var rex = new RegExp($(this).val(), 'i');
    $('#pathContent tbody tr').hide();
    $('#pathContent tbody tr').filter(function() {
      return rex.test($(this).find('td:first-child').text());
    }).show();
  })

  $(window).on('hashchange', indexObj.hashHandler);


  indexObj.init();
});