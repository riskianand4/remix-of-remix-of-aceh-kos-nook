const CustomTemplate = require('../models/CustomTemplate');

class TemplateService {
  async list(userId) {
    return CustomTemplate.find({ userId }).sort('-createdAt');
  }

  async create(data) {
    return CustomTemplate.create(data);
  }

  async delete(id, userId) {
    return CustomTemplate.findOneAndDelete({ _id: id, userId });
  }

  async getById(id, userId) {
    // Allow getById without userId for createDocFromTemplate (userId is passed separately)
    if (userId) return CustomTemplate.findOne({ _id: id, userId });
    return CustomTemplate.findById(id);
  }
}

module.exports = new TemplateService();
