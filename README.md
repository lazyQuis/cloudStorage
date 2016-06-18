Cloud Stroage Access - Javascript SDK
============================
Using javascript to access files in cloud storage services.

## Azure #
With [Azure File Storage][azure_fs], only run in Chrome.

**sdk**
+   storage-azure-config.js
+   storage-azure.js

**init**:set your azzure cloud data
```javascript
var storageConf = {
  account: 'your_account',
  secret: 'your_secret',
  container: 'your_container'
}
```

[azure_fs]: https://azure.microsoft.com/en-us/services/storage/files/