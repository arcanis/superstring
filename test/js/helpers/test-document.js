const Random = require('random-seed')
const WORDS = require('./words')
const pointHelpers = require('./point-helpers')
const textHelpers = require('./text-helpers')

module.exports =
class TestDocument {
  constructor (randomSeed, text) {
    this.random = new Random(randomSeed)
    this.lines = this.buildRandomLines(1, 50)
  }

  clone () {
    let clone = Object.create(Object.getPrototypeOf(this))
    clone.random = this.random
    clone.lines = this.lines.slice()
    return clone
  }

  getLines () {
    return this.lines.slice()
  }

  getText () {
    return this.lines.join('\n')
  }

  getTextInRange (start, end) {
    let endRow = Math.min(end.row, this.lines.length - 1)
    if (start.row === endRow) {
      return this.lines[start.row].substring(start.column, end.column)
    } else if (!pointHelpers.isInfinity(start)) {
      let text = this.lines[start.row].substring(start.column) + '\n'
      for (let row = start.row + 1; row < endRow; row++) {
        text += this.lines[row] + '\n'
      }
      text += this.lines[endRow].substring(0, end.column)
      return text
    } else {
      return ""
    }
  }

  performRandomSplice (upperCase) {
    let deletedRange = this.buildRandomRange()
    let start = deletedRange.start
    let deletedText = this.getTextInRange(start, deletedRange.end)
    let deletedExtent = pointHelpers.traversalDistance(deletedRange.end, deletedRange.start)
    let insertedText = this.buildRandomLines(0, 3, upperCase).join('\n')
    let insertedExtent = textHelpers.getExtent(insertedText)
    this.splice(start, deletedExtent, insertedText)
    return {start, deletedExtent, insertedExtent, deletedText, insertedText}
  }

  splice (start, deletedExtent, insertedText) {
    let deletedText = this.getTextInRange(start, pointHelpers.traverse(start, deletedExtent))
    let end = pointHelpers.traverse(start, deletedExtent)
    let replacementLines = insertedText.split('\n')

    replacementLines[0] =
      this.lines[start.row].substring(0, start.column) + replacementLines[0]
    replacementLines[replacementLines.length - 1] =
      replacementLines[replacementLines.length - 1] + this.lines[end.row].substring(end.column)

    this.lines.splice(start.row, deletedExtent.row + 1, ...replacementLines)
    return deletedText
  }

  characterAtPosition ({row, column}) {
    return this.lines[row][column]
  }

  buildRandomLines (min, max, upperCase) {
    let lineCount = this.random.intBetween(min, max - 1)
    let lines = []
    for (let i = 0; i < lineCount; i++) {
      lines.push(this.buildRandomLine(upperCase))
    }
    return lines
  }

  buildRandomLine (upperCase) {
    let wordCount = this.random(5)
    let words = []
    for (let i = 0; i < wordCount; i++) {
      words.push(this.buildRandomWord(upperCase))
    }
    return words.join(' ')
  }

  buildRandomWord (upperCase) {
    let word = WORDS[this.random(WORDS.length)]
    if (upperCase) word = word.toUpperCase()
    return word
  }

  buildRandomRange () {
    const start = this.buildRandomPoint()
    let end = start

    while (this.random(10) < 5) {
      end = pointHelpers.traverse(end, {
        row: this.random(3),
        column: this.random(5)
      })
    }

    return {start, end: this.clipPosition(end)}
  }

  buildRandomPoint () {
    let row = this.random(this.lines.length)
    let column = this.random(this.lines[row].length)
    return {row, column}
  }

  clipPosition ({row, column}) {
    if (row >= this.lines.length) {
      row = this.lines.length - 1
      column = this.lines[row].length
    } else if (column > this.lines[row].length) {
      column = this.lines[row].length
    }
    return {row, column}
  }
}
