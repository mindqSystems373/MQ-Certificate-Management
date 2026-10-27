// The certificate is rendered directly onto the client's own artwork
// (src/assets/templates/*) rather than being hand-drawn. Company name, seal,
// signature and decorative border are all baked into that image as static
// art — this config only covers what's genuinely per-render dynamic. Field
// pixel coordinates on the image live in pdfService.js (tightly coupled to
// this specific artwork's layout), not here.
//
// There is deliberately only ever ONE template now — the client's original
// certificate artwork (the same image their legacy PHP site used). Earlier
// versions of this project used newer redesigned artwork and stored each
// certificate's own rendered PDF so historical ones would stay visually
// frozen across a template change; that's no longer how this works. Nothing
// is stored anymore — every certificate is regenerated fresh from the
// Certificate document's own snapshot fields on every view/download (see
// pdfService.js's top-of-file note), so sticking to one template forever is
// what keeps that regeneration visually stable with no version-switching
// logic needed.
module.exports = {
  version: 'v1-legacy-template',
  templateImage: 'mq_certificate_legacy.jpg',
};
