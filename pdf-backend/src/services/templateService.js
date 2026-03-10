const CustomTemplate = require('../models/CustomTemplate');

class TemplateService {
  async list() {
    return CustomTemplate.find().sort('-createdAt');
  }

  async create(data) {
    return CustomTemplate.create(data);
  }

  async delete(id) {
    return CustomTemplate.findByIdAndDelete(id);
  }

  async getById(id) {
    return CustomTemplate.findById(id);
  }
}

module.exports = new TemplateService();
