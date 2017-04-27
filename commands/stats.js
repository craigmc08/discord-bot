const {Command} = require('discord-corda')
const {RichEmbed} = require('discord.js')
const db = require('../src/database.js')
const Color = require('easy-color')
const Canvas = require('canvas')

module.exports = class StatsCommand extends Command {
  constructor () {
    super()
  }

  async run (message, channel, args) {
    try {
      if (args[0] === 'set') {
        await this.commandSet(message, channel, args)
      } else if (/^(?:win)|(?:loss)$/.test(args[0])) {
        await this.commandAdd(message, channel, args[0])
      } else if (args[0] === 'graph') {
        await this.commandGraph(message, channel)
      } else if (args.length === 0){
        await this.commandGet(message, channel)
      } else {
        channel.send('Invalid argument!')
      }
    } catch (e) {
      console.log(e)
    }
  }

  async commandGet(message, channel) {
    const {wins, losses} = await db.getStats()
    // TODO: Remove this old dumb code when I'm satisfied with new kewl code
//     const t = wins < losses ?
//       Math.max(wins / losses - 0.5, 0) :
//       Math.min((wins - losses) / (2 * losses) + 0.5, 1)
//     const hue = 0 + t * (120 - 0)
//     const color = new Color.fromHSL(Math.round(hue), 100, 70)
//     const embed = new RichEmbed()
//       .setTitle('NB! Stats')
//       .setAuthor(message.author.username, message.author.avatarURL)
//       .setColor(parseInt(color.to('HEX').slice(1), 16))
//       .setDescription(`Wins: ${wins}
// Losses: ${losses}`)
//     channel.sendEmbed(embed)
    const canvas = new Canvas(400, 250)
    const ctx = canvas.getContext('2d')

    function roundRect (ctx, x, y, width, height, radius, fill, stroke) {
      var cornerRadius = { upperLeft: 0, upperRight: 0, lowerLeft: 0, lowerRight: 0 };
      if (typeof stroke == "undefined") {
          stroke = true;
      }
      if (typeof radius === "object") {
          for (var side in radius) {
              cornerRadius[side] = radius[side];
          }
      }

      ctx.beginPath();
      ctx.moveTo(x + cornerRadius.upperLeft, y);
      ctx.lineTo(x + width - cornerRadius.upperRight, y);
      ctx.quadraticCurveTo(x + width, y, x + width, y + cornerRadius.upperRight);
      ctx.lineTo(x + width, y + height - cornerRadius.lowerRight);
      ctx.quadraticCurveTo(x + width, y + height, x + width - cornerRadius.lowerRight, y + height);
      ctx.lineTo(x + cornerRadius.lowerLeft, y + height);
      ctx.quadraticCurveTo(x, y + height, x, y + height - cornerRadius.lowerLeft);
      ctx.lineTo(x, y + cornerRadius.upperLeft);
      ctx.quadraticCurveTo(x, y, x + cornerRadius.upperLeft, y);
      ctx.closePath();
      if (stroke) {
          ctx.stroke();
      }
      if (fill) {
          ctx.fill();
      }
    }

    const w = 400
    const h = 250
    const cw = w - 16
    const ch = h - 16

    ctx.save()
    roundRect(ctx, 8, 8, cw, ch, {upperLeft: 8, upperRight: 8, lowerLeft: 8, lowerRight: 8}, false, false)
    ctx.clip()

    const gradient = ctx.createLinearGradient(0, h, w, 0)
    gradient.addColorStop(0, 'rgb(55, 219, 252)')
    gradient.addColorStop(1, 'rgb(140, 235, 255)')
    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, w, h)

    ctx.fillStyle = 'rgba(255, 255, 255, 0.3)'
    ctx.fillRect(0, 2 * h / 3, w, h / 3)

    // Draw bunch of random circles all over the place
    const circles = 20
    for (let i = 0; i < circles; i++) {
      const x = Math.floor(Math.random() * w)
      const y = Math.floor(Math.random() * h)
      const r = Math.floor(Math.random() * 15 + 5)
      ctx.fillStyle = `rgba(255, 255, 255, ${Math.random() * 0.1 + 0.05})`
      ctx.beginPath()
      ctx.arc(x, y, r, 0, 2 * Math.PI, false);
      ctx.fill()
      ctx.closePath()
    }

    // Draw some line to show wins/losses
    const winpart = wins / (wins + losses)
    const width = cw - 32
    ctx.translate(8, 2 * h / 3)
    ctx.fillStyle = '#6f6'
    ctx.shadowColor = 'rgba(0, 0, 0, 0.2)';
    ctx.shadowBlur = 5;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 3;
    roundRect(ctx, 16, h / 6 - 8, width * winpart, 8, {upperLeft: 4, lowerLeft: 4}, true, false)
    ctx.fillStyle = '#f66'
    roundRect(ctx, 16 + width * winpart, h / 6 - 8, width * (1-winpart), 8, {upperRight: 4, lowerRight: 4}, true, false)

    // Draw text with labels for wins/losses
    ctx.translate(0, -2 * h / 3 + 8)
    ctx.font = '32px Arial'
    ctx.textAlign = 'left'
    ctx.textBaseline = 'top'
    ctx.fillStyle = 'white'
    ctx.fillText(`NB! Stats`, 16, 16)
    ctx.font = '20px Arial'
    ctx.fillText(`Wins: ${wins}`, 16, 16 + 32 + 16)
    ctx.fillText(`Losses: ${losses}`, 16, 24 + 20 + 32 + 16)

    ctx.restore()

    channel.sendFile(canvas.toBuffer())
  }

  async commandSet(message, channel, args) {
    const command = this.processArgs(args)
    let {wins, losses} = await db.getStats()
    if (command.wins.op === '=') wins = command.wins.val
    if (command.wins.op === '+') wins += command.wins.val
    if (command.losses.op === '=') losses = command.losses.val
    if (command.losses.op === '+') losses += command.losses.val
    await db.setStats(wins, losses)
    channel.send('Successfully edited values!')
  }

  async commandAdd(message, channel, arg) {
    const {wins, losses} = await db.getStats()
    if (arg === 'win') {
      db.setStats(wins + 1, losses)
      channel.send('Wow! Good job boys, this one\'s been counted')
    } else if (arg === 'loss') {
      db.setStats(wins, losses + 1)
      channel.send('Oh no, I\'d like not to save this, but you told me to, so I guess I will ):')
    }
  }

  async commandGraph(message, channel) {
    const data = await db.getStatsTimes()
    const number = await data.count()

    const w = 400
    const h = 300
    const cw = w - 20
    const ch = h - 20
    const gw = cw - 16
    const gh = ch - 16 - 32 - 32
    const xLines = 10
    const yLines = 5

    const canvas = new Canvas(400, 300)
    const ctx = canvas.getContext('2d')

    function roundRect(ctx, x, y, w, h, r) {
      if (w < 2 * r) r = w / 2;
      if (h < 2 * r) r = h / 2;
      ctx.beginPath();
      ctx.moveTo(x+r, y);
      ctx.arcTo(x+w, y,   x+w, y+h, r);
      ctx.arcTo(x+w, y+h, x,   y+h, r);
      ctx.arcTo(x,   y+h, x,   y,   r);
      ctx.arcTo(x,   y,   x+w, y,   r);
      ctx.closePath();
    }

    // Card
    ctx.fillStyle = '#fff'
    roundRect(ctx, 10, 10, cw, ch, 4)
    ctx.fill()

    // Title
    ctx.translate(10, 10)
    ctx.fillStyle = '#000'
    ctx.font = '16px Arial'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'top'
    ctx.fillText('Stats over time', w / 2, 8)

    // Title Separator
    ctx.translate(0, 32)
    ctx.lineCap = 'round'
    ctx.lineWidth = 1
    ctx.strokeStyle = '#aaa'
    ctx.beginPath()
    ctx.moveTo(8, 0)
    ctx.lineTo(w - 28, 0)
    ctx.stroke()
    ctx.closePath()

    // Figure out parameters for graph
    let timeMin = Infinity
    let timeMax = 0
    let dataMax = 0
    let dat = await data.nextObject()
    while (dat !== null) {
      timeMin = Math.min(timeMin, dat.time)
      timeMax = Math.max(timeMax, dat.time)
      dataMax = Math.max(dataMax, dat.wins, dat.losses)
      dat = await data.nextObject()
    }
    dataMax = Math.round(dataMax * 1.5)
    const xStart = timeMin
    const xScale = (timeMax - timeMin) / xLines
    const yStart = 0
    const yScale = dataMax / yLines

    function toGraphCoord(p) {
      p[0] = (p[0] - timeMin) / (timeMax - timeMin) * gw
      p[1] = p[1] / dataMax * gh
      return p
    }

    // Draw graph lines
    ctx.translate(8, 8)
    ctx.strokeWidth = 0.5
    ctx.strokeStyle = '#eee'
    for (let i = 0; i <= xLines; i++) {
      ctx.beginPath()
      ctx.moveTo(i * gw / xLines, 0)
      ctx.lineTo(i * gw / xLines, gh)
      ctx.closePath()
      ctx.stroke()
    }
    for (let i = 0; i <= yLines; i++) {
      ctx.beginPath()
      ctx.moveTo(0, i * gh / yLines)
      ctx.lineTo(gw, i * gh / yLines)
      ctx.closePath()
      ctx.stroke()
    }

    // Draw Losses Line
    ctx.strokeStyle = '#f66'
    ctx.beginPath()
    ctx.moveTo(0, gh)
    await data.rewind()
    let d = await data.nextObject()
    let i = 0
    while (d !== null) {
      let p = toGraphCoord([d.time, d.losses])
      if (i === 0) ctx.moveTo(p[0], gh - p[1])
    	else ctx.lineTo(p[0], gh - p[1])
      d = await data.nextObject()
      i++
    }
    ctx.stroke()
    ctx.closePath()

    // Draw Wins Line
    ctx.strokeStyle = '#6f6'
    ctx.beginPath()
    ctx.moveTo(0, gh)
    await data.rewind()
    d = await data.nextObject()
    i = 0
    while (d !== null) {
      let p = toGraphCoord([d.time, d.wins])
      if (i === 0) ctx.moveTo(p[0], gh - p[1])
    	else ctx.lineTo(p[0], gh - p[1])
      d = await data.nextObject()
      i++
    }
    ctx.stroke()
    ctx.closePath()

    // Draw labels text
    ctx.translate(-8, gh + 16 + 4)
    ctx.fillStyle = '#000'
    ctx.font = '14px Arial'
    ctx.textBaseline = 'middle'
    ctx.fillText('GREEN: WINS   RED: LOSSES', cw / 2, 0)

    channel.sendFile(canvas.toBuffer())
  }

  processArgs(args) {
    let state = 'none'
    let target = 'none'
    let command = {
      wins: {},
      losses: {},
    }
    for (let i in args) {
      if (args.hasOwnProperty(i)) {
        const arg = args[i]
        if (arg === 'wins') {
          state = 'process'
          target = 'wins'
        } else if (arg == 'losses') {
          state = 'process'
          target = 'losses'
        } else if (state === 'process') {
          if (!(/^(?:\+|-)?\d*$/g.test(arg))) {
          } else {
            if (arg.startsWith('+')) {
              command[target] = {
                op: '+',
                val: parseInt(arg.slice(1)),
              }
            } else if (arg.startsWith('-')) {
              command[target] = {
                op: '+',
                val: -1 * parseInt(arg.slice(1)),
              }
            } else {
              command[target] = {
                op: '=',
                val: parseInt(arg),
              }
            }
          }
          state = 'none'
        }
      }
    }
    return command
  }

  static get prefix() {
    return 'stats'
  }

  static get aliases() {
    return [
      {
        prefix: 'win',
        run: (message, channel, args) => {
          new this().commandAdd(message, channel, 'win')
        }
      },
      {
        prefix: 'loss',
        run: (message, channel, args) => {
          new this().commandAdd(message, channel, 'loss')
        }
      }
    ]
  }
}
