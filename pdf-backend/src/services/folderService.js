const Folder = require('../models/Folder');

class FolderService {
  async list(userId) {
    return Folder.find({ userId }).sort('order name');
  }

  async create(userId, name, parentId = null) {
    return Folder.create({ userId, name, parentId });
  }

  async rename(id, userId, name) {
    return Folder.findOneAndUpdate({ _id: id, userId }, { name }, { new: true });
  }

  async delete(id, userId) {
    // Move child folders to parent
    const folder = await Folder.findOne({ _id: id, userId });
    if (!folder) return null;
    await Folder.updateMany({ parentId: id, userId }, { parentId: folder.parentId });
    // Move documents in this folder to root (handled by caller)
    return Folder.findOneAndDelete({ _id: id, userId });
  }
}

module.exports = new FolderService();
