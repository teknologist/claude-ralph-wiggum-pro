#!/usr/bin/env node
/**
 * Calculate coverage summary from Istanbul JSON coverage report.
 */

import fs from 'fs';

function calculateSummary(coverageData) {
  let totalStatements = 0;
  let coveredStatements = 0;
  let totalBranches = 0;
  let coveredBranches = 0;
  let totalFunctions = 0;
  let coveredFunctions = 0;
  let totalLines = 0;
  let coveredLines = 0;

  for (const filepath of Object.keys(coverageData)) {
    const fileData = coverageData[filepath];

    // Skip files that don't have coverage data
    if (!fileData.statementMap) continue;

    // Statements
    if (fileData.s) {
      for (const key of Object.keys(fileData.s)) {
        if (fileData.statementMap[key]) {
          totalStatements++;
          if (fileData.s[key] > 0) coveredStatements++;
        }
      }
    }

    // Branches
    if (fileData.b && fileData.branchMap) {
      for (const key of Object.keys(fileData.b)) {
        if (fileData.branchMap[key]) {
          const branchCounts = fileData.b[key];
          for (let i = 0; i < branchCounts.length; i++) {
            totalBranches++;
            if (branchCounts[i] > 0) coveredBranches++;
          }
        }
      }
    }

    // Functions
    if (fileData.f && fileData.fnMap) {
      for (const key of Object.keys(fileData.f)) {
        if (fileData.fnMap[key]) {
          totalFunctions++;
          if (fileData.f[key] > 0) coveredFunctions++;
        }
      }
    }

    // Lines - count unique lines from statementMap
    if (fileData.statementMap) {
      const lines = new Set();
      const coveredLinesSet = new Set();
      for (const [key, stmt] of Object.entries(fileData.statementMap)) {
        const line = stmt.end.line; // Use end line to count each line once
        lines.add(line);
        if (fileData.s && fileData.s[key] > 0) {
          coveredLinesSet.add(line);
        }
      }
      totalLines += lines.size;
      coveredLines += coveredLinesSet.size;
    }
  }

  const stmtPct = totalStatements > 0 ? (coveredStatements / totalStatements) * 100 : 100;
  const branchPct = totalBranches > 0 ? (coveredBranches / totalBranches) * 100 : 100;
  const funcPct = totalFunctions > 0 ? (coveredFunctions / totalFunctions) * 100 : 100;
  const linePct = totalLines > 0 ? (coveredLines / totalLines) * 100 : 100;

  return {
    statements: { pct: stmtPct, covered: coveredStatements, total: totalStatements },
    branches: { pct: branchPct, covered: coveredBranches, total: totalBranches },
    functions: { pct: funcPct, covered: coveredFunctions, total: totalFunctions },
    lines: { pct: linePct, covered: coveredLines, total: totalLines },
  };
}

const args = process.argv.slice(2);
if (args.length === 0) {
  console.error('Usage: node calc-coverage.mjs <coverage-file.json>');
  process.exit(1);
}

const coverageFile = args[0];

let coverageData;
try {
  const content = fs.readFileSync(coverageFile, 'utf-8');
  coverageData = JSON.parse(content);
} catch (error) {
  if (error.code === 'ENOENT') {
    console.error(`Error: Coverage file not found: ${coverageFile}`);
    console.error('Please ensure the file path is correct and the file exists.');
  } else if (error instanceof SyntaxError) {
    console.error(`Error: Invalid JSON in coverage file: ${coverageFile}`);
    console.error('The file appears to be corrupted or not a valid JSON file.');
  } else {
    console.error(`Error reading coverage file: ${error.message}`);
  }
  process.exit(1);
}

const summary = calculateSummary(coverageData);

console.log('Coverage Summary:');
console.log(`  Statements: ${summary.statements.pct.toFixed(2)}% (${summary.statements.covered}/${summary.statements.total})`);
console.log(`  Branches:   ${summary.branches.pct.toFixed(2)}% (${summary.branches.covered}/${summary.branches.total})`);
console.log(`  Functions:  ${summary.functions.pct.toFixed(2)}% (${summary.functions.covered}/${summary.functions.total})`);
console.log(`  Lines:      ${summary.lines.pct.toFixed(2)}% (${summary.lines.covered}/${summary.lines.total})`);
