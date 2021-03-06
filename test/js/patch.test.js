require('segfault-handler').registerHandler()

const Random = require('random-seed')
const {assert} = require('chai')
const TestDocument = require('./helpers/test-document')
const {
  traverse, traversalDistance, compare, format: formatPoint
} = require('./helpers/point-helpers')

const {Patch} = require('../..')

describe('Patch', function () {
  it('honors the mergeAdjacentHunks option set to false', function () {
    const patch = new Patch({ mergeAdjacentHunks: false })

    patch.splice({row: 0, column: 10}, {row: 0, column: 0}, {row: 1, column: 5})
    patch.splice({row: 1, column: 5}, {row: 0, column: 2}, {row: 0, column: 8})

    assert.deepEqual(JSON.parse(JSON.stringify(patch.getHunks())), [
      {
        oldStart: {row: 0, column: 10},
        oldEnd: {row: 0, column: 10},
        newStart: {row: 0, column: 10},
        newEnd: {row: 1, column: 5}
      },
      {
        oldStart: {row: 0, column: 10},
        oldEnd: {row: 0, column: 12},
        newStart: {row: 1, column: 5},
        newEnd: {row: 1, column: 13}
      }
    ])

    patch.delete();
  })

  it('honors the mergeAdjacentHunks option set to true', function () {
    const patch = new Patch({ mergeAdjacentHunks: true })

    patch.splice({row: 0, column: 5}, {row: 0, column: 1}, {row: 0, column: 2})
    patch.splice({row: 0, column: 10}, {row: 0, column: 3}, {row: 0, column: 4})
    assert.deepEqual(JSON.parse(JSON.stringify(patch.getHunks())), [
      {
        oldStart: {row: 0, column: 5}, oldEnd: {row: 0, column: 6},
        newStart: {row: 0, column: 5}, newEnd: {row: 0, column: 7}
      },
      {
        oldStart: {row: 0, column: 9}, oldEnd: {row: 0, column: 12},
        newStart: {row: 0, column: 10}, newEnd: {row: 0, column: 14}
      }
    ])

    patch.spliceOld({row: 0, column: 6}, {row: 0, column: 3}, {row: 0, column: 0})
    assert.deepEqual(JSON.parse(JSON.stringify(patch.getHunks())), [
      {
        oldStart: {row: 0, column: 5}, oldEnd: {row: 0, column: 9},
        newStart: {row: 0, column: 5}, newEnd: {row: 0, column: 11}
      }
    ])

    patch.delete();
  })

  it('can compose multiple patches together', function () {
    const patches = [new Patch(), new Patch(), new Patch()]
    patches[0].splice({row: 0, column: 3}, {row: 0, column: 4}, {row: 0, column: 5}, 'ciao', 'hello')
    patches[0].splice({row: 1, column: 1}, {row: 0, column: 0}, {row: 0, column: 3}, '', 'hey')
    patches[1].splice({row: 0, column: 15}, {row: 0, column: 10}, {row: 0, column: 0}, '0123456789', '')
    patches[1].splice({row: 0, column: 0}, {row: 0, column: 0}, {row: 3, column: 0}, '', '\n\n\n')
    patches[2].splice({row: 4, column: 2}, {row: 0, column: 2}, {row: 0, column: 2}, 'so', 'ho')

    const composedPatch = Patch.compose(patches)
    assert.deepEqual(JSON.parse(JSON.stringify(composedPatch.getHunks())), [
      {
        oldStart: {row: 0, column: 0}, oldEnd: {row: 0, column: 0},
        newStart: {row: 0, column: 0}, newEnd: {row: 3, column: 0},
        oldText: '', newText: '\n\n\n'
      },
      {
        oldStart: {row: 0, column: 3}, oldEnd: {row: 0, column: 7},
        newStart: {row: 3, column: 3}, newEnd: {row: 3, column: 8},
        oldText: 'ciao', newText: 'hello'
      },
      {
        oldStart: {row: 0, column: 14}, oldEnd: {row: 0, column: 24},
        newStart: {row: 3, column: 15}, newEnd: {row: 3, column: 15},
        oldText: '0123456789', newText: ''
      },
      {
        oldStart: {row: 1, column: 1}, oldEnd: {row: 1, column: 1},
        newStart: {row: 4, column: 1}, newEnd: {row: 4, column: 4},
        oldText: '', newText: 'hho'
      }
    ])

    assert.throws(() => Patch.compose([{}, {}]))
    assert.throws(() => Patch.compose([1, 'a']))

    for (let patch of patches)
      patch.delete();

    composedPatch.delete();
  })

  it('can invert patches', function () {
    const patch = new Patch()
    patch.splice({row: 0, column: 3}, {row: 0, column: 4}, {row: 0, column: 5}, 'ciao', 'hello')
    patch.splice({row: 0, column: 10}, {row: 0, column: 5}, {row: 0, column: 5}, 'quick', 'world')

    const invertedPatch = patch.invert()
    assert.deepEqual(JSON.parse(JSON.stringify(invertedPatch.getHunks())), [
      {
        oldStart: {row: 0, column: 3}, oldEnd: {row: 0, column: 8},
        newStart: {row: 0, column: 3}, newEnd: {row: 0, column: 7},
        oldText: 'hello',
        newText: 'ciao'
      },
      {
        oldStart: {row: 0, column: 10}, oldEnd: {row: 0, column: 15},
        newStart: {row: 0, column: 9}, newEnd: {row: 0, column: 14},
        oldText: 'world',
        newText: 'quick'
      }
    ])

    const patch2 = new Patch()
    patch2.splice({row: 0, column: 3}, {row: 0, column: 4}, {row: 0, column: 5})
    patch2.splice({row: 0, column: 10}, {row: 0, column: 5}, {row: 0, column: 5})
    assert.deepEqual(JSON.parse(JSON.stringify(patch2.invert().getHunks())), [
      {
        oldStart: {row: 0, column: 3}, oldEnd: {row: 0, column: 8},
        newStart: {row: 0, column: 3}, newEnd: {row: 0, column: 7}
      },
      {
        oldStart: {row: 0, column: 10}, oldEnd: {row: 0, column: 15},
        newStart: {row: 0, column: 9}, newEnd: {row: 0, column: 14}
      }
    ])

    patch.delete();
    invertedPatch.delete();
    patch2.delete();
  })

  it('can copy patches', function () {
    const patch = new Patch()
    patch.splice({row: 0, column: 3}, {row: 0, column: 4}, {row: 0, column: 5}, 'ciao', 'hello')
    patch.splice({row: 0, column: 10}, {row: 0, column: 5}, {row: 0, column: 5}, 'quick', 'world')
    assert.deepEqual(patch.copy().getHunks(), patch.getHunks())

    const patch2 = new Patch()
    patch2.splice({row: 0, column: 3}, {row: 0, column: 4}, {row: 0, column: 5})
    patch2.splice({row: 0, column: 10}, {row: 0, column: 5}, {row: 0, column: 5})
    assert.deepEqual(patch2.copy().getHunks(), patch2.getHunks())

    patch.delete();
    patch2.delete();
  })

  it('can serialize/deserialize patches', () => {
    const patch1 = new Patch()
    patch1.splice({row: 0, column: 3}, {row: 0, column: 5}, {row: 0, column: 5}, 'hello', 'world')

    const patch2 = Patch.deserialize(patch1.serialize())
    assert.deepEqual(JSON.parse(JSON.stringify(patch2.getHunks())), [{
      oldStart: {row: 0, column: 3},
      newStart: {row: 0, column: 3},
      oldEnd: {row: 0, column: 8},
      newEnd: {row: 0, column: 8},
      oldText: 'hello',
      newText: 'world'
    }])

    patch1.delete();
    patch2.delete();
  })

  it('removes a hunk when it becomes empty', () => {
    const patch = new Patch()
    patch.splice({row: 1, column: 0}, {row: 0, column: 0}, {row: 0, column: 5})
    patch.splice({row: 2, column: 0}, {row: 0, column: 0}, {row: 0, column: 5})
    patch.splice({row: 1, column: 0}, {row: 0, column: 5}, {row: 0, column: 0})

    assert.deepEqual(JSON.parse(JSON.stringify(patch.getHunks())), [{
      oldStart: {row: 2, column: 0},
      newStart: {row: 2, column: 0},
      oldEnd: {row: 2, column: 0},
      newEnd: {row: 2, column: 5}
    }])
  })

  it('correctly records random splices', function () {
    this.timeout(Infinity)

    for (let i = 0; i < 100; i++) {
      let seed = Date.now()
      const seedMessage = `Random seed: ${seed}`

      const random = new Random(seed)
      const originalDocument = new TestDocument(seed)
      const mutatedDocument = originalDocument.clone()
      const mergeAdjacentHunks = random(2)
      const patch = new Patch({ mergeAdjacentHunks })

      for (let j = 0; j < 20; j++) {
        if (random(10) < 1) {
          patch.rebalance()
        } else if (random(10) < 4) {
          const originalSplice = originalDocument.performRandomSplice(false)
          const mutatedSplice = translateSpliceFromOriginalDocument(
            originalDocument,
            patch,
            originalSplice
          )

          mutatedDocument.splice(
            mutatedSplice.start,
            mutatedSplice.deletionExtent,
            mutatedSplice.insertedText
          )

          // process.stderr.write(`graph message {
          //   label="spliceOld(${formatPoint(originalSplice.start)}, ${formatPoint(originalSplice.deletedExtent)}, ${formatPoint(originalSplice.insertedExtent)}, ${originalSplice.deletedText}, ${originalSplice.insertedText})"
          // }\n`)
          //
          // process.stderr.write(`graph message {
          //   label="document: ${mutatedDocument.getText()}"
          // }\n`)

          patch.spliceOld(
            originalSplice.start,
            originalSplice.deletedExtent,
            originalSplice.insertedExtent
          )
        } else {
          const splice = mutatedDocument.performRandomSplice(true)

          // process.stderr.write(`graph message {
          //   label="splice(${formatPoint(splice.start)}, ${formatPoint(splice.deletedExtent)}, ${formatPoint(splice.insertedExtent)}, '${splice.deletedText}', '${splice.insertedText}')"
          // }\n`)
          //
          // process.stderr.write(`graph message {
          //   label="document: ${mutatedDocument.getText()}"
          // }\n`)

          patch.splice(
            splice.start,
            splice.deletedExtent,
            splice.insertedExtent,
            splice.deletedText,
            splice.insertedText
          )
        }

        // process.stderr.write(patch.getDotGraph())

        const originalDocumentCopy = originalDocument.clone()
        const hunks = patch.getHunks()
        assert.equal(patch.getHunkCount(), hunks.length, seedMessage)

        let previousHunk
        for (let hunk of patch.getHunks()) {
          const oldExtent = traversalDistance(hunk.oldEnd, hunk.oldStart)
          assert.equal(hunk.newText, mutatedDocument.getTextInRange(hunk.newStart, hunk.newEnd), seedMessage)
          assert.equal(hunk.oldText, originalDocument.getTextInRange(hunk.oldStart, hunk.oldEnd), seedMessage)
          originalDocumentCopy.splice(hunk.newStart, oldExtent, hunk.newText)
          if (previousHunk && mergeAdjacentHunks) {
            assert.notDeepEqual(previousHunk.oldEnd, hunk.oldStart, seedMessage)
            assert.notDeepEqual(previousHunk.newEnd, hunk.newStart, seedMessage)
          }
          previousHunk = hunk
        }

        assert.deepEqual(originalDocumentCopy.getLines(), mutatedDocument.getLines(), seedMessage)

        for (let k = 0; k < 5; k++) {
          let oldRange = originalDocument.buildRandomRange()
          assert.deepEqual(
            patch.getHunksInOldRange(oldRange.start, oldRange.end),
            hunks.filter(hunk =>
              compare(hunk.oldEnd, oldRange.start) > 0 &&
              compare(hunk.oldStart, oldRange.end) < 0
            ),
            `old range: ${formatPoint(oldRange.start)} - ${formatPoint(oldRange.end)}, seed: ${seed}`
          )

          let newRange = mutatedDocument.buildRandomRange()
          assert.deepEqual(
            patch.getHunksInNewRange(newRange.start, newRange.end),
            hunks.filter(hunk =>
              compare(hunk.newEnd, newRange.start) > 0 &&
              compare(hunk.newStart, newRange.end) < 0
            ),
            `new range: ${formatPoint(newRange.start)} - ${formatPoint(newRange.end)}, seed: ${seed}`
          )

          let oldPoint = originalDocument.buildRandomPoint()
          assert.deepEqual(
            patch.hunkForOldPosition(oldPoint),
            last(hunks.filter(hunk => compare(hunk.oldStart, oldPoint) <= 0)),
            seedMessage
          )

          let newPoint = mutatedDocument.buildRandomPoint()
          assert.deepEqual(
            patch.hunkForNewPosition(newPoint),
            last(hunks.filter(hunk => compare(hunk.newStart, newPoint) <= 0)),
            seedMessage
          )
        }

        let oldPoint = originalDocument.buildRandomPoint()

        let blob = patch.serialize()
        const patchCopy1 = Patch.deserialize(blob)
        assert.deepEqual(patchCopy1.getHunks(), patch.getHunks(), seedMessage)
        assert.deepEqual(patchCopy1.hunkForOldPosition(oldPoint), patch.hunkForOldPosition(oldPoint), seedMessage)

        const patchCopy2 = patch.copy()
        assert.deepEqual(patchCopy2.getHunks(), patch.getHunks(), seedMessage)
        assert.deepEqual(patchCopy2.hunkForOldPosition(oldPoint), patch.hunkForOldPosition(oldPoint), seedMessage)
      }

      patch.delete();
    }
  })
})

function last (array) {
  return array[array.length - 1]
}

function translateSpliceFromOriginalDocument (originalDocument, patch, originalSplice) {
  const originalDeletionEnd = traverse(originalSplice.start, originalSplice.deletedExtent)
  const originalInsertionEnd = traverse(originalSplice.start, originalSplice.insertedExtent)

  let oldStart, newStart
  const startHunk = patch.hunkForOldPosition(originalSplice.start)
  if (startHunk) {
    if (compare(originalSplice.start, startHunk.oldEnd) < 0) {
      oldStart = startHunk.oldStart
      newStart = startHunk.newStart
    } else {
      oldStart = originalSplice.start
      newStart = traverse(startHunk.newEnd, traversalDistance(originalSplice.start, startHunk.oldEnd))
    }
  } else {
    oldStart = originalSplice.start
    newStart = originalSplice.start
  }

  let endHunk
  for (const hunk of patch.getHunks()) {
    const comparison = compare(hunk.oldStart, originalDeletionEnd)
    if (comparison <= 0) endHunk = hunk
    if (comparison >= 0 && compare(hunk.oldStart, originalSplice.start) > 0) break
  }

  let oldInsertionEnd, newDeletionEnd
  if (endHunk) {
    if (compare(originalDeletionEnd, endHunk.oldStart) === 0 &&
        compare(originalSplice.start, endHunk.oldStart) < 0) {
      oldInsertionEnd = originalInsertionEnd
      newDeletionEnd = endHunk.newStart
    } else if (compare(originalDeletionEnd, endHunk.oldEnd) < 0) {
      oldInsertionEnd = traverse(originalInsertionEnd, traversalDistance(endHunk.oldEnd, originalDeletionEnd))
      newDeletionEnd = endHunk.newEnd
    } else {
      oldInsertionEnd = originalInsertionEnd
      newDeletionEnd = traverse(endHunk.newEnd, traversalDistance(originalDeletionEnd, endHunk.oldEnd))
    }
  } else {
    oldInsertionEnd = originalInsertionEnd
    newDeletionEnd = originalDeletionEnd
  }

  return {
    start: newStart,
    deletionExtent: traversalDistance(newDeletionEnd, newStart),
    insertedText: originalDocument.getTextInRange(oldStart, oldInsertionEnd)
  }
}
