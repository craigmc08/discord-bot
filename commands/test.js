const {Command} = require('discord-corda')

module.exports = class TestCommand extends Command {
  constructor () {
    super({
      name: 'test',
      description: 'Test command to test workflow',
    })
  }

  async run (message, channel, args) {
    message.reply('It worked!')
  }

  static get prefix() {
    return 'test'
  }
}
