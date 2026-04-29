import { existsSync, readFileSync, readdirSync } from 'node:fs'
import { join, relative } from 'node:path'

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

function compareRuleDirs(rootDir, problems, contract) {
  const canonicalDir = join(rootDir, contract.canonicalRulesDir)
  if (!existsSync(canonicalDir)) return

  const readRuleSnapshot = (directory) =>
    readdirSync(directory)
      .filter((entry) => entry.endsWith('.md'))
      .sort()
      .map((entry) => [entry, readFileSync(join(directory, entry), 'utf8')])

  const canonicalSnapshot = readRuleSnapshot(canonicalDir)

  for (const mirrorDir of contract.mirrorRuleDirs) {
    const absoluteMirrorDir = join(rootDir, mirrorDir)
    if (!existsSync(absoluteMirrorDir)) continue
    const mirrorSnapshot = readRuleSnapshot(absoluteMirrorDir)
    if (JSON.stringify(mirrorSnapshot.map(([filename]) => filename)) !== JSON.stringify(canonicalSnapshot.map(([filename]) => filename))) {
      problems.push(`Rule mirror mismatch in ${mirrorDir}: file set differs from ${contract.canonicalRulesDir}`)
      continue
    }
    for (const [filename, content] of canonicalSnapshot) {
      const mirrorContent = mirrorSnapshot.find(([candidate]) => candidate === filename)?.[1] || ''
      if (mirrorContent !== content) {
        problems.push(`Rule mirror mismatch in ${mirrorDir}: content differs for ${filename}`)
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

  compareRuleDirs(rootDir, problems, contract)

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

  return problems
}

export function validateStarterContract(rootDir = process.cwd()) {
  const problems = collectProblems(rootDir)
  if (problems.length) {
    throw new Error(problems.join('\n'))
  }

  return { ok: true, rootDir }
}

if (import.meta.url === new URL(`file://${process.argv[1]}`).href) {
  try {
    const rootDir = process.argv[2] || process.cwd()
    validateStarterContract(rootDir)
    console.log(`[OK] Starter contract valid: ${rootDir}`)
  } catch (error) {
    console.error(String((error && error.message) || error))
    process.exit(1)
  }
}
