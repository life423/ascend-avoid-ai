// // Script to fix unused variables by prefixing them with underscore
// const fs = require('fs');
// const path = require('path');
// const { execSync } = require('child_process');

// // Run ESLint to get unused variables
// try {
//   console.log('Finding unused variables...');
  
//   // Get all TypeScript files
//   const findTsFiles = 'dir /s /b *.ts';
//   const tsFiles = execSync(findTsFiles, { encoding: 'utf8' })
//     .split('\n')
//     .filter(file => file.trim() && !file.includes('node_modules'));
  
//   // Process each file
//   let totalFixed = 0;
  
//   tsFiles.forEach(filePath => {
//     if (!filePath.trim()) return;
    
//     try {
//       const content = fs.readFileSync(filePath, 'utf8');
//       const lines = content.split('\n');
//       let modified = false;
      
//       // Find lines with unused variable declarations
//       for (let i = 0; i < lines.length; i++) {
//         const line = lines[i];
        
//         // Look for parameter declarations
//         if (line.includes('(') && line.includes(')') && !line.includes('_')) {
//           const paramMatch = line.match(/\(([^)]+)\)/);
//           if (paramMatch) {
//             const params = paramMatch[1].split(',');
//             let newParams = [];
//             let paramModified = false;
            
//             params.forEach(param => {
//               // Check if this parameter is unused (simple heuristic)
//               const paramName = param.trim().split(':')[0].trim();
//               if (paramName && !paramName.startsWith('_')) {
//                 // Check if this parameter is used in the next few lines
//                 let isUsed = false;
//                 for (let j = i + 1; j < Math.min(i + 10, lines.length); j++) {
//                   if (lines[j].includes(paramName)) {
//                     isUsed = true;
//                     break;
//                   }
//                 }
                
//                 if (!isUsed) {
//                   newParams.push(param.replace(paramName, `_${paramName}`));
//                   paramModified = true;
//                   totalFixed++;
//                 } else {
//                   newParams.push(param);
//                 }
//               } else {
//                 newParams.push(param);
//               }
//             });
            
//             if (paramModified) {
//               lines[i] = line.replace(paramMatch[0], `(${newParams.join(',')})`);
//               modified = true;
//             }
//           }
//         }
//       }
      
//       // Save the modified file
//       if (modified) {
//         fs.writeFileSync(filePath, lines.join('\n'), 'utf8');
//         console.log(`Fixed unused variables in: ${filePath}`);
//       }
//     } catch (err) {
//       console.error(`Error processing ${filePath}:`, err);
//     }
//   });
  
//   console.log(`Total unused variables fixed: ${totalFixed}`);
  
// } catch (error) {
//   console.error('Error:', error.message);
// }