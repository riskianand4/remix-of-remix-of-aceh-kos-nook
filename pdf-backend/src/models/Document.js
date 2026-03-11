const mongoose = require('mongoose');

const ImageSchema = new mongoose.Schema({
  id: String,
  dataUrl: String,
  caption: { type: String, default: '' },
  order: { type: Number, default: 0 },
}, { _id: false });

const ImageSectionSchema = new mongoose.Schema({
  id: String,
  title: { type: String, default: '' },
  gridLayout: { type: String, default: '1x1' },
  images: [ImageSchema],
}, { _id: false });

const TextBlockSchema = new mongoose.Schema({
  type: { type: String, default: 'text' },
  id: String,
  title: { type: String, default: '' },
  body: { type: String, default: '' },
  htmlContent: String,
  indent: { type: Number, default: 0 },
  attachedImages: [ImageSchema],
}, { _id: false });

const FieldsBlockSchema = new mongoose.Schema({
  type: { type: String, default: 'fields' },
  id: String,
  title: { type: String, default: '' },
  fields: [{ key: String, value: String }],
}, { _id: false });

const TableSchema = new mongoose.Schema({
  id: String,
  title: { type: String, default: '' },
  columns: [String],
  rows: [[String]],
  columnCalcs: { type: mongoose.Schema.Types.Mixed, default: {} },
}, { _id: false });

const SigneeSchema = new mongoose.Schema({
  id: String,
  name: { type: String, default: '' },
  role: { type: String, default: '' },
  signatureDataUrl: String,
  stampDataUrl: String,
  signatureSize: { type: Number, default: 80 },
  stampSize: { type: Number, default: 100 },
}, { _id: false });

const CoverTextElementSchema = new mongoose.Schema({
  id: String,
  text: { type: String, default: '' },
  fontSize: { type: Number, default: 14 },
  bold: { type: Boolean, default: false },
  color: { type: String, default: '#000000' },
  pos: { x: { type: Number, default: 50 }, y: { type: Number, default: 50 } },
  width: { type: Number, default: 80 },
}, { _id: false });

const CoverImageElementSchema = new mongoose.Schema({
  id: String,
  dataUrl: String,
  pos: { x: { type: Number, default: 50 }, y: { type: Number, default: 50 } },
  width: { type: Number, default: 30 },
}, { _id: false });

const CoverLayoutSchema = new mongoose.Schema({
  logos: { x: { type: Number, default: 50 }, y: { type: Number, default: 12 } },
  logoGap: { type: Number, default: 40 },
  logoWidth: { type: Number, default: 30 },
  textElements: [CoverTextElementSchema],
  imageElements: [CoverImageElementSchema],
}, { _id: false });

const CustomThemeSchema = new mongoose.Schema({
  fontFamily: { type: String, default: "'Times New Roman', Times, serif" },
  fontSize: { type: Number, default: 11 },
  fontColor: { type: String, default: '#000000' },
  dividerColor: { type: String, default: '#000000' },
  tableHeaderBg: { type: String, default: '#e5e7eb' },
  tableHeaderColor: { type: String, default: '#000000' },
  altRowColor: { type: String, default: '#f9f9f9' },
}, { _id: false });

const MarginsSchema = new mongoose.Schema({
  top: { type: Number, default: 20 },
  bottom: { type: Number, default: 25 },
  left: { type: Number, default: 15 },
  right: { type: Number, default: 15 },
}, { _id: false });

const DocumentSchema = new mongoose.Schema({
  _id: { type: String, default: () => require('crypto').randomUUID() },
  title: { type: String, default: '' },
  subtitle: { type: String, default: '' },
  date: { type: String, default: '' },
  companyDetails: { type: String, default: '' },
  logo1DataUrl: String,
  logo2DataUrl: String,
  coverLogoSize: { type: Number, default: 80 },
  includeCover: { type: Boolean, default: true },
  includeToc: { type: Boolean, default: true },
  includeImageList: { type: Boolean, default: true },
  includeTableList: { type: Boolean, default: true },
  coverLayout: { type: CoverLayoutSchema, default: () => ({}) },
  kopText: { type: String, default: '' },
  kopLogoDataUrl: String,
  kopLogoRightDataUrl: String,
  kopLogoPosition: { type: String, default: 'left' },
  kopPosition: { type: String, default: 'top' },
  kopDividerEnabled: { type: Boolean, default: false },
  kopSpacing: { type: Number, default: 8 },
  footerEnabled: { type: Boolean, default: true },
  footerText: { type: String, default: '' },
  docNumber: { type: String, default: '' },
  docCode: { type: String, default: '', index: true },
  qrEnabled: { type: Boolean, default: true },
  revision: { type: Number, default: 1 },
  watermarkEnabled: { type: Boolean, default: false },
  watermarkText: { type: String, default: 'DRAFT' },
  watermarkOpacity: { type: Number, default: 0.1 },
  pageOrientation: { type: String, default: 'portrait' },
  paperSize: { type: String, default: 'A4' },
  sections: [ImageSectionSchema],
  contentBlocks: [mongoose.Schema.Types.Mixed],
  tables: [TableSchema],
  signees: [SigneeSchema],
  customTheme: { type: CustomThemeSchema, default: () => ({}) },
  coverLineSpacing: { type: Number, default: 1.5 },
  contentLineSpacing: { type: Number, default: 1.5 },
  margins: { type: MarginsSchema, default: () => ({}) },
  documentType: { type: String, default: 'dokumentasi' },
  suratResmi: { type: mongoose.Schema.Types.Mixed, default: {} },
  status: { type: String, default: 'draft', enum: ['draft', 'finished'] },
}, {
  timestamps: true,
  toJSON: { virtuals: true, transform: (_, ret) => { ret.id = ret._id; delete ret._id; delete ret.__v; return ret; } },
  toObject: { virtuals: true },
});

DocumentSchema.index({ title: 'text', subtitle: 'text' });
DocumentSchema.index({ status: 1 });
DocumentSchema.index({ createdAt: -1 });
DocumentSchema.index({ updatedAt: -1 });
DocumentSchema.index({ docCode: 1 }, { unique: true, sparse: true });

module.exports = mongoose.model('Document', DocumentSchema);
