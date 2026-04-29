import { existsSync, readFileSync, readdirSync, realpathSync } from 'node:fs'
import { join, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const TEXT_FILE_EXTENSIONS = new Set(['.css', '.env', '.example', '.js', '.json', '.md', '.mjs', '.ts', '.vue'])

function walkVueFiles(rootDir, relativeDir) {
  const directory = join(rootDir, relativeDir)
  if (!existsSync(directory)) return []

  const files = []
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const absolutePath = join(directory, entry.name)
    if (entry.isDirectory()) {
      files.push(...walkVueFiles(rootDir, relative(rootDir, absolutePath)))
      continue
    }
    if (entry.isFile() && entry.name.endsWith('.vue')) {
      files.push(absolutePath)
    }
  }
  return files
}

function readDirectoryMarkdownNames(directory) {
  if (!existsSync(directory)) return []
  return readdirSync(directory)
    .filter((entry) => entry.endsWith('.md'))
    .sort()
}

function validateRequiredRules(rootDir, problems, contract) {
  const canonicalDir = join(rootDir, contract.canonicalRulesDir)
  const requiredFiles = [...(contract.requiredRuleFiles || [])].sort()
  const actualFiles = readDirectoryMarkdownNames(canonicalDir)

  if (!existsSync(canonicalDir)) {
    problems.push(`Canonical rules directory missing: ${contract.canonicalRulesDir}`)
    return
  }

  if (JSON.stringify(actualFiles) !== JSON.stringify(requiredFiles)) {
    problems.push(`Canonical rules file set mismatch in ${contract.canonicalRulesDir}: expected ${requiredFiles.join(', ')}, got ${actualFiles.join(', ')}`)
  }
}

function globToRegExp(pattern) {
  const escaped = pattern
    .replace(/[.+^${}()|[\]\\]/g, '\\$&')
    .replace(/\*\*/g, '::DOUBLE_STAR::')
    .replace(/\*/g, '[^/]*')
    .replace(/::DOUBLE_STAR::/g, '.*')
  return new RegExp(`^${escaped}$`)
}

function matchesAnyPattern(relativePath, patterns) {
  return patterns.some((pattern) => globToRegExp(pattern).test(relativePath))
}

function importSpecifiers(text) {
  const specs = []
  const importFromPattern = /(?:import|export)\s+(?:type\s+)?(?:[^'"]*?\s+from\s+)?['"]([^'"]+)['"]/g
  const dynamicImportPattern = /import\s*\(\s*['"]([^'"]+)['"]\s*\)/g

  for (const match of text.matchAll(importFromPattern)) specs.push(match[1])
  for (const match of text.matchAll(dynamicImportPattern)) specs.push(match[1])

  return specs
}

function walkTextFiles(rootDir, relativeDir = '') {
  const directory = join(rootDir, relativeDir)
  if (!existsSync(directory)) return []

  const files = []
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    if (entry.name === 'node_modules' || entry.name === '.git' || entry.name === '.nuxt' || entry.name === '.output') continue
    const absolutePath = join(directory, entry.name)
    const nextRelative = relative(rootDir, absolutePath)
    if (entry.isDirectory()) {
      files.push(...walkTextFiles(rootDir, nextRelative))
      continue
    }
    if (!entry.isFile()) continue
    if (TEXT_FILE_EXTENSIONS.has(entry.name.includes('.') ? entry.name.slice(entry.name.lastIndexOf('.')) : '')) {
      files.push(absolutePath)
    }
  }
  return files
}

function walkAllFiles(rootDir, relativeDir = '') {
  const directory = join(rootDir, relativeDir)
  if (!existsSync(directory)) return []

  const files = []
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    if (entry.name === 'node_modules' || entry.name === '.git' || entry.name === '.nuxt' || entry.name === '.output') continue
    const absolutePath = join(directory, entry.name)
    const nextRelative = relative(rootDir, absolutePath)
    if (entry.isDirectory()) {
      files.push(...walkAllFiles(rootDir, nextRelative))
      continue
    }
    if (entry.isFile()) {
      files.push(absolutePath)
    }
  }
  return files
}

function validateVueUiSource(rootDir, problems, contract) {
  const allowedStyleBlockFiles = new Set(contract.allowedStyleBlockFiles || [])
  const forbiddenVueAttributes = contract.forbiddenVueAttributes || []
  const forbiddenRawUiTags = contract.forbiddenRawUiTags || []

  for (const absolutePath of contract.uiRoots.flatMap((relativePath) => walkVueFiles(rootDir, relativePath))) {
    const relativePath = relative(rootDir, absolutePath)
    const text = readFileSync(absolutePath, 'utf8')

    for (const attribute of forbiddenVueAttributes) {
      if (text.includes(attribute)) {
        problems.push(`Forbidden Vue attribute "${attribute}" found in ${relativePath}`)
      }
    }

    if (/<style\b/i.test(text) && !allowedStyleBlockFiles.has(relativePath)) {
      problems.push(`Forbidden Vue style block found in ${relativePath}`)
    }

    for (const tag of forbiddenRawUiTags) {
      const pattern = new RegExp(`<\\s*${tag}(\\s|>|/)`, 'i')
      if (pattern.test(text)) {
        problems.push(`Forbidden raw UI tag <${tag}> found in ${relativePath}; use B24UI component`)
      }
    }
  }
}

function validateImportBoundaries(rootDir, problems, contract) {
  const boundaries = contract.forbiddenImportBoundaries || []
  if (!boundaries.length) return

  for (const absolutePath of walkTextFiles(rootDir)) {
    const relativePath = relative(rootDir, absolutePath)
    const text = readFileSync(absolutePath, 'utf8')
    const specs = importSpecifiers(text)

    for (const boundary of boundaries) {
      if (!matchesAnyPattern(relativePath, boundary.from || [])) continue
      for (const spec of specs) {
        if ((boundary.to || []).some((target) => spec.includes(target))) {
          problems.push(`Forbidden import boundary in ${relativePath}: "${spec}" (${boundary.message || 'boundary violation'})`)
        }
      }
    }
  }
}

function collectProblems(rootDir) {
  const contract = JSON.parse(
    readFileSync(join(rootDir, 'scripts/starter-contract.json'), 'utf8')
  )
  const problems = []

  for (const relativePath of contract.requiredFiles) {
    if (!existsSync(join(rootDir, relativePath))) {
      problems.push(`Missing required file: ${relativePath}`)
    }
  }

  for (const relativePath of contract.forbiddenFiles) {
    if (existsSync(join(rootDir, relativePath))) {
      problems.push(`Forbidden legacy file present: ${relativePath}`)
    }
  }

  for (const pattern of contract.forbiddenFileGlobs || []) {
    const matcher = globToRegExp(pattern)
    for (const absolutePath of walkAllFiles(rootDir)) {
      const relativePath = relative(rootDir, absolutePath)
      if (matcher.test(relativePath)) {
        problems.push(`Forbidden project file present: ${relativePath}`)
      }
    }
  }

  validateRequiredRules(rootDir, problems, contract)

  for (const [relativePath, requiredMarkers] of Object.entries(contract.requiredMarkersByFile)) {
    const absolutePath = join(rootDir, relativePath)
    if (!existsSync(absolutePath)) continue
    const text = readFileSync(absolutePath, 'utf8')

    for (const marker of requiredMarkers) {
      if (!text.includes(marker)) {
        problems.push(`Required marker missing in ${relativePath}: ${marker}`)
      }
    }

    for (const marker of contract.forbiddenDocMarkers) {
      if (text.includes(marker)) {
        problems.push(`Forbidden legacy marker found in ${relativePath}: ${marker}`)
      }
    }

    for (const marker of contract.staleReferenceMarkers) {
      if (text.includes(marker)) {
        problems.push(`Stale marker found in ${relativePath}: ${marker}`)
      }
    }
  }

  for (const relativePath of contract.staleCheckFiles) {
    const absolutePath = join(rootDir, relativePath)
    if (!existsSync(absolutePath)) continue
    const text = readFileSync(absolutePath, 'utf8')
    for (const marker of contract.forbiddenDocMarkers) {
      if (text.includes(marker)) {
        problems.push(`Forbidden legacy marker found in ${relativePath}: ${marker}`)
      }
    }
    for (const marker of contract.staleReferenceMarkers) {
      if (text.includes(marker)) {
        problems.push(`Stale marker found in ${relativePath}: ${marker}`)
      }
    }
  }

  for (const absolutePath of walkTextFiles(rootDir)) {
    const relativePath = relative(rootDir, absolutePath)
    if (relativePath === 'scripts/starter-contract.json') continue
    const text = readFileSync(absolutePath, 'utf8')
    for (const marker of contract.forbiddenProjectMarkers || []) {
      if (text.includes(marker)) {
        problems.push(`Forbidden project marker found in ${relativePath}: ${marker}`)
      }
    }
  }

  const allowedLayoutTokens = new Set(contract.allowedLayoutTokens)

  for (const absolutePath of contract.uiRoots.flatMap((relativePath) => walkVueFiles(rootDir, relativePath))) {
    const relativePath = relative(rootDir, absolutePath)
    const text = readFileSync(absolutePath, 'utf8')
    const classMatches = [...text.matchAll(/class="([^"]+)"/g)].map((match) => match[1])

    for (const classValue of classMatches) {
      for (const token of contract.forbiddenRawUiTokens) {
        if (classValue.includes(token)) {
          problems.push(`Forbidden raw UI token "${token}" found in ${relativePath}: ${classValue}`)
        }
      }

      for (const classToken of classValue.split(/\s+/)) {
        if (!classToken) continue
        if (!allowedLayoutTokens.has(classToken)) {
          problems.push(`Non-layout utility token found in ${relativePath}: ${classToken}`)
        }
      }
    }
  }

  validateVueUiSource(rootDir, problems, contract)
  validateImportBoundaries(rootDir, problems, contract)

  return problems
}

export function validateStarterContract(rootDir = process.cwd()) {
  const problems = collectProblems(rootDir)
  if (problems.length) {
    throw new Error(problems.join('\n'))
  }

  return { ok: true, rootDir }
}

function toRealPath(path) {
  try {
    return realpathSync(path)
  } catch {
    return resolve(path)
  }
}

if (toRealPath(fileURLToPath(import.meta.url)) === toRealPath(process.argv[1] || '')) {
  try {
    const rootDir = process.argv[2] || process.cwd()
    validateStarterContract(rootDir)
    console.log(`[OK] Starter contract valid: ${rootDir}`)
  } catch (error) {
    console.error(String((error && error.message) || error))
    process.exit(1)
  }
}
