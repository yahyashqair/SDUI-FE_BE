
import fs from 'fs';
import path from 'path';

// Helper to check imports in a file
function checkImports(filePath: string, allowedImports: string[]) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');
  const importRegex = /import .* from ['"](.*)['"]/;

  for (const line of lines) {
    const match = line.match(importRegex);
    if (match) {
      const importPath = match[1];
      // Skip relative imports within the same layer or third-party libraries (simplified check)
      if (importPath.startsWith('.')) {
         // Resolve path to see if it crosses layers
         // This is a simplified check. A robust one would resolve the full path.
         // For this demo, we'll check if the import path explicitly mentions forbidden layers.
         // But verifying relative paths like ../../domain is tricky without full resolution.
         // So we will look for specific layer keywords in the relative path.

         const forbidden = ['domain', 'application', 'infrastructure', 'interface'].filter(layer => !allowedImports.includes(layer));

         for (const layer of forbidden) {
           if (importPath.includes(`/${layer}/`)) {
             console.error(`Violation in ${filePath}: Importing from ${layer} is not allowed.`);
             return false;
           }
         }
      }
    }
  }
  return true;
}

// Check DDD Rules
function verifyDDD(backendPath: string) {
  console.log('Verifying DDD Architecture...');
  let valid = true;

  const layers = ['domain', 'application', 'infrastructure', 'interface'];

  // Rule 1: Domain layer cannot import from any other layer.
  // Allowed: None (internally only)
  if (!checkLayer(path.join(backendPath, 'src/domain'), [])) valid = false;

  // Rule 2: Application layer can only import from Domain.
  if (!checkLayer(path.join(backendPath, 'src/application'), ['domain'])) valid = false;

  // Rule 3: Infrastructure layer can import from Domain and Application.
  if (!checkLayer(path.join(backendPath, 'src/infrastructure'), ['domain', 'application'])) valid = false;

  // Rule 4: Interface layer can import from Application. (And maybe Domain types)
  if (!checkLayer(path.join(backendPath, 'src/interface'), ['application', 'domain'])) valid = false;

  return valid;
}

function checkLayer(layerPath: string, allowedLayers: string[]) {
  if (!fs.existsSync(layerPath)) return true; // Layer might be empty

  const files = fs.readdirSync(layerPath);
  let layerValid = true;

  for (const file of files) {
    if (file.endsWith('.ts') || file.endsWith('.js')) {
      if (!checkImports(path.join(layerPath, file), allowedLayers)) {
        layerValid = false;
      }
    }
  }
  return layerValid;
}

// Main Verification Function
async function verify(targetPath: string, type: 'backend' | 'frontend') {
  console.log(`Starting Verification Gate for ${type} at ${targetPath}`);

  let valid = true;

  // 1. Static Analysis (Architectural Conformance)
  if (type === 'backend') {
    if (!verifyDDD(targetPath)) {
        console.error('DDD Architecture checks failed.');
        valid = false;
    }
  }

  // 2. Build Check
  // TODO: Run build command

  // 3. Contract Testing
  // TODO: Run contract tests

  // 4. UI Validation
  // TODO: Run Playwright tests

  if (valid) {
    console.log('Verification Gate PASSED.');
    process.exit(0);
  } else {
    console.error('Verification Gate FAILED.');
    process.exit(1);
  }
}

const args = process.argv.slice(2);
const targetPath = args[0];
const type = args[1] as 'backend' | 'frontend';

if (!targetPath || !type) {
  console.error('Usage: ts-node verify.ts <path> <type>');
  process.exit(1);
}

verify(targetPath, type);
