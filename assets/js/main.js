Date.prototype.getStrDate = function() {
  var yyyy = this.getFullYear().toString();
  var mm = (this.getMonth() + 1).toString(); // getMonth() is zero-based
  var dd = this.getDate().toString();
  return yyyy + '/' + (mm[1] ? mm : "0" + mm[0]) + '/' + (dd[1] ? dd : "0" + dd[0]); // padding
};
Date.prototype.getStrDateTime = function() {
  var hh = this.getHours().toString();
  var mm = this.getMinutes().toString(); // getMonth() is zero-based
  var ss = this.getSeconds().toString();
  return this.getStrDate() + ' ' + (hh[1] ? hh : "0" + hh[0]) + ':' + (mm[1] ? mm : "0" + mm[0]) + ':' + (ss[1] ? ss : "0" + ss[0]); // padding
};

window.TextEncoder = window.TextDecoder = null;