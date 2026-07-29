// The certificate is now rendered from the client's actual artwork
// (src/assets/templates/mindq-certificate-template.jpg, sourced from their
// certificate_template_svg.svg) rather than being hand-drawn. Company name,
// tagline, "Certificate" script title, seal, signature and footer address are
// all baked into that image as static art — this config only covers what's
// genuinely per-render dynamic. Field pixel coordinates on the image live in
// pdfService.js (tightly coupled to this specific artwork's layout), not here.
module.exports = {
  version: 'v2-official-template',
  templateImage: 'mindq-certificate-template.jpg',
  verifyUrl: 'https://certificates.mindqnetwork.com/verify_certificate',
};
