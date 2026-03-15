class BaseEmailProvider {
  async sendEmail({ to, subject, html, text, from }) {
    throw new Error('Method not implemented');
  }
}

module.exports = BaseEmailProvider;