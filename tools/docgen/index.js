let {exec} = require('child_process')
let fs = require('fs')
let path = require('path')
let async = require('async')
let babelParser = require('@babel/parser')
let jsonselect = require('JSONSelect')
let uniq = require('lodash/uniq')
let compact = require('lodash/compact')

let projectPath = path.join(__dirname, '..', '..')
let srcPath = path.join(projectPath, 'src')
let docGenPath = path.join(projectPath, 'docs', 'gen')

let babelParserOpts = {
  sourceType: 'module'
}

let patterns = {
  asteriskStart: /^\*/,
  atStart: /^@/,
  lineBreak: /\n/g,
  optional: /\[.+\]/i,
  directive: /^@([a-z]+)(\s)?/i,
  types: /\{(.+)\}/i,
  // @param {string} (group0) (group1)
  paramNameDesc: /\}\s(?:\[)?([\w|\.]{1,})(?:\])?(?:\s)?(.+)?/,
  returnsDesc: /\}\s(.+)$/i,
  js: /\.js$/i,
  headingName: /@[a-zA-Z]+\s([\w|\$\.]{1,})/i,
  multiLineBreak: /\n{3,}/g,
  metaDesc: /\s(.+)/
}

let values = {
  doubleLineBreak: '\n\n'
}

let headingDirectives = [
  'method',
  'constructor',
  'class',
  'function',
  'member',
  'name'
]

let paramDirectives = ['param', 'callback']

let metaDirectives = ['deprecated', 'generator', 'instance', 'static']

let outputDirectives = ['returns', 'return', 'type']

let directivePatterns = ['module']
  .concat(headingDirectives, metaDirectives, outputDirectives)
  .map(item => new RegExp(`@${item}`))

let descriptiveMetaMap = {
  instance: 'instance member',
  static: 'static member'
}

function srcList(done) {
  let cmd = `find ${srcPath} -type f -iname "*.js"`
  exec(cmd, (err, stdout) => {
    if (err !== null && err !== undefined) {
      return console.error('error getting src list', err)
    }
    let op = stdout
      .toString()
      .trim()
      .split('\n')
      .filter(item => item !== undefined)
      .filter(item => item.length > 0)
      .map(item => item.trim())
      .filter(item => item.indexOf('/src/') > -1)
    done(null, op)
  })
}

function readFiles({srcList}, done) {
  async.map(srcList, fs.readFile, (err, res) => {
    if (err !== null && err !== undefined) {
      console.error('error reaind files', err)
      return done(err)
    }

    res = res.map(item => item.toString())
    done(null, res)
  })
}

function parse({readFiles}, done) {
  let op = readFiles.map(item => babelParser.parse(item))
  done(null, op)
}

function select({parse}, done) {
  let op = parse.map(item => jsonselect.match('string.value', item))

  done(null, op)
}

function fineRefine(comments, index) {
  let doc = {
    directives: [],
    description: ''
  }

  comments
    .split(patterns.lineBreak)
    .map(item => item.trim())
    .map(item => item.replace(patterns.asteriskStart, ''))
    .map(item => item.trim())
    .forEach((item, index) => {
      // just a description line
      if (patterns.atStart.test(item) === false) {
        doc.description += item + '\n'
      }

      // directive line
      let pLine = {
        directive: '',
        types: '',
        name: '',
        description: '',
        optional: patterns.optional.test(item)
      }

      let directive = patterns.directive.exec(item)
      let types = patterns.types.exec(item)

      if (directive !== null) {
        pLine.directive = directive[1]
      }

      if (types !== null) {
        pLine.types = types[1]
      }

      if (headingDirectives.indexOf(pLine.directive) > -1) {
        let name = patterns.headingName.exec(item)

        if (name !== null) {
          pLine.name = name[1]
        }
      }

      if (metaDirectives.indexOf(pLine.directive) > -1) {
        let description = patterns.metaDesc.exec(item)

        if (description !== null) {
          pLine.description = description[1]
        }
      }

      if (paramDirectives.indexOf(pLine.directive) > -1) {
        let paramNameDesc = patterns.paramNameDesc.exec(item)

        if (paramNameDesc !== null) {
          let name = paramNameDesc[1]
          let description = paramNameDesc[2]

          if (typeof name === 'string') {
            pLine.name = name
          }

          if (typeof description === 'string') {
            pLine.description = description
          }
        }
      }

      if (outputDirectives.indexOf(pLine.directive) > -1) {
        let returnsDesc = patterns.returnsDesc.exec(item)

        if (returnsDesc !== null) {
          pLine.description = returnsDesc[1]
        }
      }

      doc.directives.push(pLine)
    })

  return doc
}

function refine({select}, done) {
  let op = select.map(item => {
    // for whatever reasons it duplicates it
    return uniq(item)
      .map(item => item.trim())
      .filter(item => item.length > 0)
      .filter(item => {
        return directivePatterns.some(pattern => {
          return pattern.test(item) === true
        })
      })
      .map(fineRefine)
  })
  done(null, op)
}

function outputMarkdown({srcList, refine}, done) {
  let op = refine.map((item, index) => {
    let markdown = ''
    let module = srcList[index]
      .replace(`${srcPath}/`, '')
      .replace(patterns.js, '')

    let toc = ''

    item.forEach(({directives, description}) => {
      let hasHeading = directives.some(item => {
        return headingDirectives.indexOf(item.directive) > -1
      })

      if (hasHeading === false) {
        return
      }

      directives.forEach(({directive, types, name, description, optional}) => {
        let heading = ''
        let line = ''

        if (metaDirectives.indexOf(directive) > -1) {
          return
        }

        if (directive === 'module') {
          module = name
        }

        if (headingDirectives.indexOf(directive) > -1) {
          let metas = directives
            .filter(item => metaDirectives.indexOf(item.directive) > -1)
            .map(({directive, description}) => {
              let dir = descriptiveMetaMap[directive] || directive

              if (description.length > 0) {
                return `${dir}: ${description}`
              }
              return dir
            })
            .map(item => `*${item}*`)

          heading += `## ${name}\n\n`

          if (metas.length > 0) {
            heading += metas.join(' / ') + '\n\n'
          }
          toc += `+ [${name}](#${name})\n`
        }

        if (outputDirectives.indexOf(directive) > -1) {
          line += `+ returns \`${types}\` ${description}\n`
        }

        if (paramDirectives.indexOf(directive) > -1) {
          // let paramName = name.replace('[', '').replace(']', '')

          line += `+ ${name}`

          if (types.length > 0) {
            line += `, \`${types}\``
          }

          if (description.length > 0) {
            line += `, ${description}`
          }

          if (optional === true) {
            line += `, *optional*`
          }
        }

        markdown += heading + line + '\n'
      })

      if (description.length > 0) {
        markdown += description + '\n'
      }
    })

    if (toc.length > 0) {
      markdown = `${toc}\n\n${markdown}`
    }

    if (module.length > 0) {
      markdown = `# ${module}\n\n${markdown}`
    }

    return markdown
  })

  done(null, op)
}

function writeDocGen({srcList, outputMarkdown}, done) {
  let indexLinks = '\n'

  let steps = srcList.map((filePath, index) => done => {
    let source = outputMarkdown[index].replace(
      patterns.multiLineBreak,
      values.doubleLineBreak
    )
    let outputPath = filePath
      .replace(srcPath, docGenPath)
      .replace(patterns.js, '.md')
    let parentPath = path.dirname(outputPath)
    let linkTitle = filePath.replace(`${srcPath}/`, '').replace(patterns.js, '')

    indexLinks += `+ [${linkTitle}](${linkTitle}.md)\n`

    fs.exists(parentPath, exists => {
      if (exists === false) {
        exec(`mkdir -p ${parentPath}`, (err, res) => {
          if (err !== null && err !== undefined) {
            console.error('error creating path', err)
            return done(err)
          }

          fs.writeFile(outputPath, source, (err, res) => {
            if (err !== null && err !== undefined) {
              console.error('error writing source', err)
              return done(err)
            }

            done()
          })
        })
        return
      }

      fs.writeFile(outputPath, source, (err, res) => {
        if (err !== null && err !== undefined) {
          console.error('error writing source', err)
          return done(err)
        }

        done()
      })
    })
  })

  async.parallel(steps, (err, res) => {
    if (err !== null && err !== undefined) {
      console.error('error writing markdown files', err)
      return
    }

    fs.writeFile(`${docGenPath}/index.md`, indexLinks, done)
  })
}

let steps = {
  srcList,
  readFiles: ['srcList', readFiles],
  parse: ['readFiles', parse],
  select: ['parse', select],
  refine: ['parse', refine],
  outputMarkdown: ['refine', outputMarkdown],
  writeDocGen: ['outputMarkdown', writeDocGen]
}

async.auto(steps, (err, res) => {
  if (err !== null && err !== undefined) {
    return console.error('generating docs', err)
  }
})
