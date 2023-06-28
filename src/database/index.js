/**
 * ESTO NO ES UNA BASE DE DATOS REAL
 */
const fs = require('fs');
const path = require('path');

const DATABASE_DATA_FOLDER = path.join(__dirname, '/db-data');

class DataStorage {
  constructor(storageName, fields = []) {
    const storageFolder = path.join(DATABASE_DATA_FOLDER, storageName);
    const storageDocsFolder = path.join(storageFolder, 'docs');
    const metaFileName = path.join(storageFolder, 'meta');
    if (!fs.existsSync(DATABASE_DATA_FOLDER)) fs.mkdirSync(DATABASE_DATA_FOLDER);
    if (!fs.existsSync(storageFolder)) fs.mkdirSync(storageFolder)
    if (!fs.existsSync(storageDocsFolder)) fs.mkdirSync(storageDocsFolder)
    if (!fs.existsSync(metaFileName)) fs.writeFileSync(metaFileName, JSON.stringify({ count: 0, lastId: 0, fields }), { encoding: 'utf-8' });

    this.fileOptions = { encoding: 'utf-8' };
    this.storageFolder = storageFolder;
    this.storageDocsFolder = storageDocsFolder;
    this.metaFileName = metaFileName;
    this.count = 0;
    this.lastId = 0;
    this.fields = [];

    this._readMeta();
    this._updateLastId();
  }

  _readMeta() {
    const metaContents = JSON.parse(fs.readFileSync(this.metaFileName, this.fileOptions));
    this.count = metaContents.count;
    this.fields = metaContents.fields;
    this.lastId = metaContents.lastId;
  }

  _updateMeta(values) {
    const metaContents = JSON.parse(fs.readFileSync(this.metaFileName, this.fileOptions));
    if (values.count) metaContents.count = values.count;
    if (values.lastId) metaContents.lastId = values.lastId;
    fs.writeFileSync(this.metaFileName, this._transformData(metaContents), this.fileOptions);
  }

  _incCount() {
    this.count = this.count + 1;
    return this.count;
  }

  _decCount() {
    if (this.count > 0) this.count = this.count - 1;
    return this.count;
  }

  _updateLastId() {
    const docFolders = fs.readdirSync(this.storageDocsFolder);
    if (!docFolders.length) this.lastId = 0
    else this.lastId = parseInt(docFolders[docFolders.length - 1], 10);
    return this.lastId
  }

  _setLastId(id) {
    this.lastId = id;
    return this.lastId;
  }

  _incLastId() {
    this.lastId = this.lastId + 1;
    return this.lastId;
  }

  _decLastId() {
    this.lastId = this.lastId - 1;
    return this.lastId;
  }

  _transformData(data) {
    return JSON.stringify(data);
  }

  async _addDoc(data) {
    const docDataFolder = path.join(this.storageDocsFolder, this._incLastId().toString());
    fs.mkdirSync(docDataFolder);
    for (const key in data) {
      if (this.fields.includes(key)) {
        fs.writeFileSync(path.join(docDataFolder, key), this._transformData(data[key]), this.fileOptions)
      }
    }
    this._incCount();
    this._updateMeta({ count: this.count, lastId: this.lastId });
    return { __internalId: this.count, ...data };
  }

  async _deleteDocById(id) {
    const docFolder = path.join(this.storageDocsFolder, id.toString());
    fs.rmSync(docFolder, { recursive: true, force: true });
    this._decCount();
    this._updateMeta({ count: this.count });
    return id;
  }

  async _readFolders(directoryPath) {
    const dirs = fs.readdirSync(directoryPath, { withFileTypes: true });
    return dirs
      .filter((dd) => dd.isDirectory() && dd.name !== '.' && dd.name !== '..')
      .map((dd) => ({ path: path.join(directoryPath, dd.name), name: dd.name }));
  }

  _compareObjects(a, b) {
    if (Array.isArray(a) && Array.isArray(b)) {
      if (a.length !== b.length) return false;
      for (let i = 0; i < a.length; i++) {
        if (!this._compareObjects(a[i], b[i])) return false;
      }
      return true;
    }

    if (typeof a !== 'object' && typeof b !== 'object') return a === b;
    if (typeof a !== 'object' || typeof b !== 'object') return false;

    const keysA = Object.keys(a);
    const keysB = Object.keys(b);
    if (keysA.length !== keysB.length) return false;
    for (let key of keysA) {
      if (!keysB.includes(key)) return false;
      if (!this._compareObjects(a[key], b[key])) return false;
    }
    return true;
  }

  _sortByProperty(array, property, sortOrder = 'asc') {
    const compareFunction = (a, b) => {
      if (sortOrder === 'asc') {
        if (a[property] < b[property]) return -1;
        if (a[property] > b[property]) return 1;
      } else if (sortOrder === 'desc') {
        if (a[property] > b[property]) return -1;
        if (a[property] < b[property]) return 1;
      }
      return 0;
    };

    return array.sort(compareFunction);
  }

  async _rewriteDocById(id, data) {
    const docFolder = path.join(this.storageDocsFolder, id.toString());

    for (const key in data) {
      const dataValue = this._transformData(data[key]);
      fs.writeFileSync(path.join(docFolder, key), dataValue, this.fileOptions);
    }
  }

  async _updateDoc(filter, data) {
    const docFolders = await this._readFolders(this.storageDocsFolder);
    const matching = await this._filterLookup(filter, '__internalId', 'asc', docFolders, 1);

    for (const key in data) {
      const dataValue = data[key];
      if (key in matching) matching[key] = dataValue;
      await this._rewriteDocById(matching.__internalId, matching);
    }
  }

  async _updateDocs(filter, data) {
    const docFolders = await this._readFolders(this.storageDocsFolder);
    const matching = await this._filterLookup(filter, '__internalId', 'asc', docFolders);

    for (const match of matching) {
      for (const key of data) {
        const dataValue = data[key];
        if (key in match) match[key] = dataValue;
        await this._rewriteDocById(match.__internalId, match);
      }
    }
  }

  async _deleteDoc(filter) {
    const docFolders = await this._readFolders(this.storageDocsFolder);
    const matching = await this._filterLookup(filter, '__internalId', 'asc', docFolders, 1);
    await this._deleteDocById(matching.__internalId);
    return matching;
  }

  async _deleteDocs(filter) {
    const docFolders = await this._readFolders(this.storageDocsFolder);
    const matching = await this._filterLookup(filter, '__internalId', 'asc', docFolders);
    for (const match of matching) await this._deleteDocById(match.__internalId);
    return matching;
  }

  async _filterLookup(filter, sortBy, order, docFolders, limit = null) {
    const filteredDocs = [];
    for (const docFolder of docFolders) {
      const folderPath = docFolder.path;
      const docId = docFolder.name;
      const files = fs
        .readdirSync(folderPath, { withFileTypes: true })
        .filter((f) => !f.isDirectory())
        .map((f) => f.name);

      if (!Object.keys(filter || {}).length) {
        filteredDocs.push(this.fields.map(field => {
          return { [field]: JSON.parse(fs.readFileSync(path.join(folderPath, field), this.fileOptions)) };
        }).reduce((result, currentObject) => {
          return { ...result, ...currentObject };
        }, { __internalId: parseInt(docId, 10) }));
        if (limit === 1) break;
      } else {
        for (const file of files) {
          const fullFilePath = path.join(folderPath, file);
          if (file in filter) {
            const contents = JSON.parse(fs.readFileSync(fullFilePath, this.fileOptions));
            if (filter[file] === contents) {
              // Plain check of contents
              filteredDocs.push(this.fields.map(field => {
                if (field === file) return { [file]: contents };
                return { [field]: JSON.parse(fs.readFileSync(path.join(folderPath, field), this.fileOptions)) };
              }).reduce((result, currentObject) => {
                return { ...result, ...currentObject };
              }, { __internalId: parseInt(docId, 10) }));
              if (limit === 1) break;
            } else {
              // Deep check of contents
              if (this._compareObjects(filter[file], contents)) {
                filteredDocs.push(this.fields.map(field => {
                  if (field === file) return { [file]: contents };
                  return { [field]: JSON.parse(fs.readFileSync(path.join(folderPath, field), this.fileOptions)) };
                }).reduce((result, currentObject) => {
                  return { ...result, ...currentObject };
                }, { __internalId: parseInt(docId, 10) }))
                if (limit === 1) break;
              }
            }
          }
        }
      }

    }
    if (limit === 1) return filteredDocs?.[0] || null;
    return this._sortByProperty(filteredDocs, sortBy, order)
  }

  async _readDocs(filter, limit = null) {
    const docFolders = await this._readFolders(this.storageDocsFolder);
    return this._filterLookup(filter, '__internalId', 'asc', docFolders, limit);
  }

  async insertOne(data) {
    if (Array.isArray(data)) {
      throw new Error(DataStorage.name + '.insertOne only accepts object as data');
    }
    return this._addDoc(data);
  }

  async insertMany(data = []) {
    const results = [];
    for (const item in data) {
      results.push(this.insertOne(item));
    }

    return Promise.all(results);
  }

  async updateOne(filter, data) {
    return this._updateDoc(filter, data);
  }

  async updateMany(filter, data) {
    return this._updateDocs(filter, data);
  }

  async findOne(filter) {
    return this._readDocs(filter, 1);
  }

  async find(filter) {
    return this._readDocs(filter);
  }

  async deleteOne(filter) {
    return this._deleteDoc(filter);
  }

  async deleteMany(filter) {
    return this._deleteDocs(filter);
  }

  async getCount() {
    return this.count;
  }
}

module.exports.DataStorage = DataStorage;