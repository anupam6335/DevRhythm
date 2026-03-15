const Mailjet = require('node-mailjet');
const BaseEmailProvider = require('./base.provider');

class MailjetProvider extends BaseEmailProvider {
  constructor(apiKey, secretKey) {
    super();
    this.client = Mailjet.apiConnect(apiKey, secretKey);
  }

  async sendEmail({ to, subject, html, text, from }) {
    const request = this.client.post('send', { version: 'v3.1' }).request({
      Messages: [
        {
          From: {
            Email: from.email,
            Name: from.name,
          },
          To: [
            {
              Email: to,
            },
          ],
          Subject: subject,
          HTMLPart: html,
          TextPart: text,
        },
      ],
    });

    try {
      const response = await request;
      return response.body;
    } catch (error) {
      console.error('Mailjet error:', error.statusCode, error.message);
      throw error;
    }
  }
}

module.exports = MailjetProvider;