import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const antdComponentsMap = {
  'Table': 'antd/es/table',
  'Input': 'antd/es/input',
  'Card': 'antd/es/card',
  'Badge': 'antd/es/badge',
  'Button': 'antd/es/button',
  'Space': 'antd/es/space',
  'Form': 'antd/es/form',
  'InputNumber': 'antd/es/input-number',
  'Select': 'antd/es/select',
  'DatePicker': 'antd/es/date-picker',
  'Row': 'antd/es/row',
  'Col': 'antd/es/col',
  'Modal': 'antd/es/modal',
  'Switch': 'antd/es/switch',
  'Statistic': 'antd/es/statistic',
  'Typography': 'antd/es/typography',
  'Dropdown': 'antd/es/dropdown',
  'Descriptions': 'antd/es/descriptions',
  'Tag': 'antd/es/tag',
  'Checkbox': 'antd/es/checkbox',
  'Divider': 'antd/es/divider',
  'message': 'antd/es/message',
};

function optimizeImports(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    const originalContent = content;

    const antdImportRegex = /import\s+{([^}]+)}\s+from\s+['"]antd['"];?/g;
    const matches = [...content.matchAll(antdImportRegex)];

    if (matches.length === 0) {
      return false;
    }

    matches.forEach(match => {
      const imports = match[1]
        .split(',')
        .map(i => i.trim())
        .filter(i => i);

      const individualImports = imports
        .map(imp => {
          const componentName = imp.split(' as ')[0].trim();
          if (antdComponentsMap[componentName]) {
            return `import ${imp} from '${antdComponentsMap[componentName]}';`;
          }
          return null;
        })
        .filter(Boolean)
        .join('\n');

      if (individualImports) {
        content = content.replace(match[0], individualImports);
      }
    });

    if (content !== originalContent) {
      fs.writeFileSync(filePath, content, 'utf8');
      return true;
    }

    return false;
  } catch (error) {
    console.error(`Error optimizing ${filePath}:`, error.message);
    return false;
  }
}

function findJSXFiles(dir) {
  const files = [];
  const items = fs.readdirSync(dir);

  items.forEach(item => {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory() && !item.includes('node_modules')) {
      files.push(...findJSXFiles(fullPath));
    } else if (item.endsWith('.jsx') || item.endsWith('.js')) {
      files.push(fullPath);
    }
  });

  return files;
}

const srcDir = path.join(__dirname, 'src');
const files = findJSXFiles(srcDir);

let optimizedCount = 0;

files.forEach(file => {
  if (optimizeImports(file)) {
    optimizedCount++;
    console.log(`Optimized: ${path.relative(__dirname, file)}`);
  }
});

console.log(`Optimized ${optimizedCount} file(s)`);

