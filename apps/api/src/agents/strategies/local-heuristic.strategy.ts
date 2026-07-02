import { Injectable } from '@nestjs/common';
import { CodeAnalysisStrategy } from './code-analysis.strategy';
import { Finding } from '../types/finding.interface';

@Injectable()
export class LocalHeuristicStrategy implements CodeAnalysisStrategy {
  name = 'local-heuristic';

  async analyze(fileText: string, filePath: string, context: any): Promise<Finding[]> {
    const findings: Finding[] = [];
    const lines = fileText.split('\n');
    const ext = filePath.split('.').pop()?.toLowerCase();

    // Style checks
    findings.push(...this.checkStyle(lines, filePath, ext));

    // Bug checks
    findings.push(...this.checkBugs(lines, filePath, ext));

    // Security checks
    findings.push(...this.checkSecurity(lines, filePath, ext));

    // Performance checks
    findings.push(...this.checkPerformance(lines, filePath, ext));

    return findings;
  }

  private checkStyle(lines: string[], filePath: string, ext: string | undefined): Finding[] {
    const findings: Finding[] = [];

    // Check for long functions (> 50 lines)
    let inFunction = false;
    let funcStartLine = 0;
    let braceCount = 0;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // Detect function start
      if (!inFunction && /\b(function|def|\w+\s*\([^)]*\)\s*\{)/.test(line)) {
        inFunction = true;
        funcStartLine = i;
        braceCount = (line.match(/\{/g) || []).length - (line.match(/\}/g) || []).length;
        continue;
      }

      if (inFunction) {
        braceCount += (line.match(/\{/g) || []).length;
        braceCount -= (line.match(/\}/g) || []).length;

        const funcLength = i - funcStartLine;
        if (braceCount <= 0 && funcLength > 50) {
          findings.push({
            file: filePath,
            line: funcStartLine + 1,
            severity: 'major',
            category: 'style',
            message: `Function is too long (${funcLength} lines). Consider refactoring into smaller functions.`,
            suggestion: 'Break down the function into smaller, single-responsibility functions.',
            ruleId: 'STYLE-001',
          });
          inFunction = false;
        } else if (braceCount <= 0) {
          inFunction = false;
        }
      }
    }

    // Check for inconsistent naming
    const camelCase = /^[a-z][a-zA-Z0-9]*$/;
    const snakeCase = /^[a-z][a-z0-9_]*$/;
    let hasCamel = false;
    let hasSnake = false;

    for (const line of lines) {
      const vars = line.match(/(?:const|let|var)\s+(\w+)/g);
      if (vars) {
        for (const v of vars) {
          const name = v.split(/\s+/)[1];
          if (camelCase.test(name)) hasCamel = true;
          if (snakeCase.test(name)) hasSnake = true;
        }
      }
    }

    if (hasCamel && hasSnake) {
      findings.push({
        file: filePath,
        line: 1,
        severity: 'minor',
        category: 'style',
        message: 'Inconsistent naming conventions detected. Mixing camelCase and snake_case.',
        suggestion: 'Choose a single naming convention and apply it consistently throughout the file.',
        ruleId: 'STYLE-002',
      });
    }

    // Check for missing semicolons in JS/TS
    if (ext === 'ts' || ext === 'js' || ext === 'tsx' || ext === 'jsx') {
      for (let i = 0; i < lines.length; i++) {
        const trimmed = lines[i].trim();
        if (
          trimmed &&
          !trimmed.endsWith(';') &&
          !trimmed.endsWith('{') &&
          !trimmed.endsWith('}') &&
          !trimmed.endsWith('(') &&
          !trimmed.endsWith(')') &&
          !trimmed.startsWith('//') &&
          !trimmed.startsWith('/*') &&
          !trimmed.startsWith('*') &&
          !trimmed.startsWith('import') &&
          !trimmed.startsWith('export') &&
          !/^(if|else|for|while|do|switch|case|default|try|catch|finally)\b/.test(trimmed) &&
          !trimmed.includes('=>') &&
          !trimmed.includes('://')
        ) {
          const hasStatement = /^(return|throw|break|continue|const|let|var|this\.\w+\s*=)/.test(trimmed);
          if (hasStatement) {
            findings.push({
              file: filePath,
              line: i + 1,
              severity: 'minor',
              category: 'style',
              message: 'Missing semicolon at end of statement.',
              suggestion: 'Add a semicolon to the end of the statement.',
              ruleId: 'STYLE-003',
            });
          }
        }
      }
    }

    // Check for TODO comments
    for (let i = 0; i < lines.length; i++) {
      if (/(TODO|FIXME|HACK|XXX)/i.test(lines[i]) && !lines[i].trim().startsWith('//')) {
        // Only flag if it's actually in a comment
        const commentMatch = lines[i].match(/\/\/.*(TODO|FIXME|HACK|XXX)/i);
        if (commentMatch) {
          findings.push({
            file: filePath,
            line: i + 1,
            severity: 'info',
            category: 'style',
            message: `Found "${commentMatch[1]}" comment. This indicates incomplete work.`,
            suggestion: 'Address the TODO/FIXME item or create a task to track it.',
            ruleId: 'STYLE-004',
          });
        }
      }
    }

    // Check for large imports
    if (ext === 'ts' || ext === 'tsx') {
      for (let i = 0; i < lines.length; i++) {
        const match = lines[i].match(/^import\s*\{([^}]+)\}\s*from/);
        if (match) {
          const imports = match[1].split(',').length;
          if (imports > 10) {
            findings.push({
              file: filePath,
              line: i + 1,
              severity: 'minor',
              category: 'style',
              message: `Large import statement with ${imports} items. Consider using namespace imports.`,
              suggestion: 'Use `import * as` syntax or split imports into logical groups.',
              ruleId: 'STYLE-005',
            });
          }
        }
      }
    }

    return findings;
  }

  private checkBugs(lines: string[], filePath: string, ext: string | undefined): Finding[] {
    const findings: Finding[] = [];

    // Check for == instead of ===
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const matches = line.match(/[^=!]==[^=]/g);
      if (matches && !line.trim().startsWith('//') && !line.includes('===')) {
        for (const match of matches) {
          // Filter out common false positives
          if (match.includes('!==')) continue;
          findings.push({
            file: filePath,
            line: i + 1,
            severity: 'major',
            category: 'bug',
            message: 'Using loose equality (==) instead of strict equality (===).',
            suggestion: 'Replace == with === to avoid type coercion bugs.',
            ruleId: 'BUG-001',
          });
        }
      }
    }

    // Check for var usage
    for (let i = 0; i < lines.length; i++) {
      if (/^[ \t]*var\s+\w+/.test(lines[i]) && !lines[i].trim().startsWith('//')) {
        findings.push({
          file: filePath,
          line: i + 1,
          severity: 'major',
          category: 'bug',
          message: 'Using "var" declaration. Prefer "const" or "let" for block scoping.',
          suggestion: 'Replace "var" with "const" (if not reassigned) or "let" (if reassigned).',
          ruleId: 'BUG-002',
        });
      }
    }

    // Check for parseInt without radix
    for (let i = 0; i < lines.length; i++) {
      if (/parseInt\s*\([^,)]+\)/.test(lines[i]) && !lines[i].includes('parseInt(') && !lines[i].includes(',')) {
        // Actually, let's check more precisely
        const matches = lines[i].match(/parseInt\s*\([^,)]+\)/g);
        if (matches) {
          for (const m of matches) {
            if (!m.includes(',')) {
              findings.push({
                file: filePath,
                line: i + 1,
                severity: 'major',
                category: 'bug',
                message: 'parseInt() called without radix parameter.',
                suggestion: 'Add radix parameter: parseInt(value, 10)',
                ruleId: 'BUG-003',
              });
            }
          }
        }
      }
    }

    // Check for null checks without undefined
    for (let i = 0; i < lines.length; i++) {
      if (/===?\s*null\b/.test(lines[i]) && !/===?\s*undefined/.test(lines[i])) {
        findings.push({
          file: filePath,
          line: i + 1,
          severity: 'minor',
          category: 'bug',
          message: 'Comparing to null without checking for undefined.',
          suggestion: 'Use "== null" to check for both null and undefined, or check both explicitly.',
          ruleId: 'BUG-004',
        });
      }
    }

    return findings;
  }

  private checkSecurity(lines: string[], filePath: string, ext: string | undefined): Finding[] {
    const findings: Finding[] = [];

    // Check for innerHTML
    for (let i = 0; i < lines.length; i++) {
      if (/\.innerHTML\s*=/.test(lines[i]) && !lines[i].trim().startsWith('//')) {
        findings.push({
          file: filePath,
          line: i + 1,
          severity: 'critical',
          category: 'security',
          message: 'Using innerHTML exposes to XSS attacks.',
          suggestion: 'Use textContent or safe DOM manipulation methods. Or use DOMPurify if HTML is necessary.',
          ruleId: 'SEC-001',
        });
      }
    }

    // Check for eval()
    for (let i = 0; i < lines.length; i++) {
      if (/\beval\s*\(/.test(lines[i]) && !lines[i].trim().startsWith('//')) {
        findings.push({
          file: filePath,
          line: i + 1,
          severity: 'critical',
          category: 'security',
          message: 'Using eval() is dangerous and exposes to code injection attacks.',
          suggestion: 'Avoid eval() entirely. Use safer alternatives like JSON.parse() or Function constructor with caution.',
          ruleId: 'SEC-002',
        });
      }
    }

    // Check for document.write
    for (let i = 0; i < lines.length; i++) {
      if (/document\.write\s*\(/.test(lines[i]) && !lines[i].trim().startsWith('//')) {
        findings.push({
          file: filePath,
          line: i + 1,
          severity: 'critical',
          category: 'security',
          message: 'Using document.write() can lead to XSS vulnerabilities.',
          suggestion: 'Use DOM manipulation methods like createElement() and appendChild() instead.',
          ruleId: 'SEC-003',
        });
      }
    }

    // Check for hardcoded credentials
    const credPatterns = [
      /password\s*[:=]\s*['"][^'"]+['"]/i,
      /api_key\s*[:=]\s*['"][^'"]+['"]/i,
      /apikey\s*[:=]\s*['"][^'"]+['"]/i,
      /secret\s*[:=]\s*['"][^'"]+['"]/i,
      /token\s*[:=]\s*['"][^'"]+['"]/i,
      /sk-[A-Za-z0-9]{20,}/,
    ];

    for (let i = 0; i < lines.length; i++) {
      for (const pattern of credPatterns) {
        if (pattern.test(lines[i]) && !lines[i].trim().startsWith('//') && !lines[i].trim().startsWith('#')) {
          findings.push({
            file: filePath,
            line: i + 1,
            severity: 'critical',
            category: 'security',
            message: 'Potential hardcoded credential detected.',
            suggestion: 'Use environment variables or a secrets manager instead of hardcoding credentials.',
            ruleId: 'SEC-004',
          });
          break;
        }
      }
    }

    // Check for SQL injection risk (string concatenation in SQL)
    for (let i = 0; i < lines.length; i++) {
      if (
        /(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE)\s.+['"`]\s*\+/.test(lines[i]) &&
        !lines[i].trim().startsWith('//')
      ) {
        findings.push({
          file: filePath,
          line: i + 1,
          severity: 'critical',
          category: 'security',
          message: 'Possible SQL injection vulnerability. String concatenation in SQL query.',
          suggestion: 'Use parameterized queries or an ORM to prevent SQL injection.',
          ruleId: 'SEC-005',
        });
      }
    }

    // Check for path traversal
    for (let i = 0; i < lines.length; i++) {
      if (/\.\.\//.test(lines[i]) && /(readFile|writeFile|open|require|import)/.test(lines[i])) {
        findings.push({
          file: filePath,
          line: i + 1,
          severity: 'major',
          category: 'security',
          message: 'Possible path traversal vulnerability. Using "../" in file operations.',
          suggestion: 'Validate and sanitize file paths. Use path.resolve() and ensure paths are within allowed directories.',
          ruleId: 'SEC-006',
        });
      }
    }

    return findings;
  }

  private checkPerformance(lines: string[], filePath: string, ext: string | undefined): Finding[] {
    const findings: Finding[] = [];

    // Check for inline style manipulation in loops
    let inLoop = false;
    for (let i = 0; i < lines.length; i++) {
      if (/\b(for|while)\s*\(/.test(lines[i]) || /\bforEach\s*\(/.test(lines[i])) {
        inLoop = true;
      } else if (inLoop && /^\s*\}/.test(lines[i])) {
        inLoop = false;
      } else if (inLoop && /\.style\s*=/.test(lines[i])) {
        findings.push({
          file: filePath,
          line: i + 1,
          severity: 'major',
          category: 'performance',
          message: 'Modifying element styles inside a loop causes layout thrashing.',
          suggestion: 'Batch style changes or use CSS classes instead of inline styles.',
          ruleId: 'PERF-001',
        });
        inLoop = false;
      }
    }

    // Check for innerHTML in loops
    inLoop = false;
    for (let i = 0; i < lines.length; i++) {
      if (/\b(for|while)\s*\(/.test(lines[i]) || /\bforEach\s*\(/.test(lines[i])) {
        inLoop = true;
      } else if (inLoop && /^\s*\}/.test(lines[i])) {
        inLoop = false;
      } else if (inLoop && /\.innerHTML\s*=/.test(lines[i])) {
        findings.push({
          file: filePath,
          line: i + 1,
          severity: 'major',
          category: 'performance',
          message: 'Setting innerHTML inside a loop causes repeated DOM updates.',
          suggestion: 'Build the HTML string first, then set innerHTML once after the loop.',
          ruleId: 'PERF-002',
        });
        inLoop = false;
      }
    }

    // Check for large array operations
    for (let i = 0; i < lines.length; i++) {
      if (/\.filter\(.*\)\.map\(/.test(lines[i])) {
        findings.push({
          file: filePath,
          line: i + 1,
          severity: 'minor',
          category: 'performance',
          message: 'Chaining .filter().map() iterates the array twice.',
          suggestion: 'Use .reduce() or flatMap() to iterate once and combine filter + map logic.',
          ruleId: 'PERF-003',
        });
      }
    }

    // Check for nested loops
    let loopDepth = 0;
    for (let i = 0; i < lines.length; i++) {
      if (/\b(for|while)\s*\(/.test(lines[i]) || /\bforEach\s*\(/.test(lines[i])) {
        loopDepth++;
        if (loopDepth >= 2) {
          findings.push({
            file: filePath,
            line: i + 1,
            severity: 'major',
            category: 'performance',
            message: 'Nested loop detected. This can lead to O(n²) complexity.',
            suggestion: 'Consider using hash maps or other data structures to reduce time complexity.',
            ruleId: 'PERF-004',
          });
          loopDepth = 0; // Reset to avoid duplicate reports
        }
      } else if (/^\s*\}/.test(lines[i]) && loopDepth > 0) {
        loopDepth--;
      }
    }

    // Check for using objects as maps
    for (let i = 0; i < lines.length; i++) {
      if (/\{\s*\}\s*$/.test(lines[i]) && /const|let|var/.test(lines[i])) {
        const trimmed = lines[i].trim();
        if (
          !trimmed.includes('new Map') &&
          !trimmed.includes('new Set') &&
          (trimmed.includes('map') || trimmed.includes('cache') || trimmed.includes('lookup'))
        ) {
          findings.push({
            file: filePath,
            line: i + 1,
            severity: 'minor',
            category: 'performance',
            message: 'Using plain object as a map. Map offers better performance for frequent additions/deletions.',
            suggestion: 'Use `new Map()` instead of plain objects for dynamic key-value stores.',
            ruleId: 'PERF-005',
          });
        }
      }
    }

    return findings;
  }
}
