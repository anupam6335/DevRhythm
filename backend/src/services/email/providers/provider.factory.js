const config = require('../../../config');
const MailjetProvider = require('./mailjet.provider');
// Future providers can be imported here

class EmailProviderFactory {
  static createProvider() {
    const provider = config.email.provider;

    switch (provider) {
      case 'mailjet':
        return new MailjetProvider(
          config.email.mailjet.apiKey,
          config.email.mailjet.secretKey
        );
      // case 'sendgrid':
      //   return new SendgridProvider(...);
      default:
        throw new Error(`Unsupported email provider: ${provider}`);
    }
  }
}

module.exports = EmailProviderFactory;