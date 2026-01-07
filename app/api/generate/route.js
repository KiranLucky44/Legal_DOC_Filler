import { NextResponse } from 'next/server';
import PizZip from 'pizzip';

export async function POST(request) {
  try {
    const body = await request.json();
    const { fileBuffer, placeholders, values } = body;

    if (!fileBuffer || !placeholders || !values) {
      return NextResponse.json(
        { error: 'Missing required data' },
        { status: 400 }
      );
    }

    console.log('=== Document Generation Start ===');
    console.log('Placeholders:', JSON.stringify(placeholders));
    console.log('Values:', values.map(v => v.substring(0, 30) + (v.length > 30 ? '...' : '')));

    // Convert base64 buffer back to Buffer
    const buffer = Buffer.from(fileBuffer, 'base64');
    const zip = new PizZip(buffer);
    let xmlContent = zip.files['word/document.xml'].asText();
    
    const originalLength = xmlContent.length;
    console.log('Original XML length:', originalLength);

    // Create replacement map with properly escaped values
    const replacements = {};
    placeholders.forEach((placeholder, index) => {
      const value = values[index] || '';
      // Escape XML special characters
      const escapedValue = value
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');
      replacements[placeholder] = escapedValue;
      console.log(`Mapping: "{{${placeholder}}}" -> "${escapedValue.substring(0, 40)}${escapedValue.length > 40 ? '...' : ''}"`);
    });

    // Replace each placeholder using multiple strategies
    Object.keys(replacements).forEach(placeholder => {
      const replacementValue = replacements[placeholder];
      const placeholderName = placeholder;
      
      console.log(`\nProcessing placeholder: "{{${placeholderName}}}"`);
      
      // Strategy 1: Direct exact match (most reliable)
      const exactPattern = `{{${placeholderName}}}`;
      // Escape special regex characters in the pattern
      const escapedPattern = exactPattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const exactRegex = new RegExp(escapedPattern, 'g');
      
      const beforeCount = (xmlContent.match(exactRegex) || []).length;
      console.log(`  Found ${beforeCount} exact match(es)`);
      
      if (beforeCount > 0) {
        xmlContent = xmlContent.replace(exactRegex, replacementValue);
        console.log(`  ✓ Replaced ${beforeCount} instance(s)`);
      } else {
        // Strategy 2: Check if placeholder exists but with different spacing
        const flexiblePattern = `{{\\s*${placeholderName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*}}`;
        const flexibleRegex = new RegExp(flexiblePattern, 'g');
        const flexibleCount = (xmlContent.match(flexibleRegex) || []).length;
        
        if (flexibleCount > 0) {
          console.log(`  Found ${flexibleCount} flexible match(es)`);
          xmlContent = xmlContent.replace(flexibleRegex, replacementValue);
          console.log(`  ✓ Replaced ${flexibleCount} instance(s)`);
        } else {
          // Strategy 3: Search for the placeholder name anywhere and try to match it with braces
          // Look for the placeholder name and check if it's surrounded by braces (even if split)
          const nameOnlyRegex = new RegExp(placeholderName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
          const nameMatches = (xmlContent.match(nameOnlyRegex) || []).length;
          
          console.log(`  Found "${placeholderName}" text ${nameMatches} time(s) in XML`);
          
          if (nameMatches > 0) {
            // Try to find the placeholder by looking for the name with surrounding braces
            // This handles cases where the placeholder might be split across XML tags
            
            // Extract all text nodes and their content
            const textNodes = [];
            const nodeRegex = /<w:t[^>]*>([^<]*)<\/w:t>/g;
            let match;
            
            while ((match = nodeRegex.exec(xmlContent)) !== null) {
              textNodes.push({
                fullMatch: match[0],
                content: match[1],
                index: match.index
              });
            }
            
            // Check if placeholder name appears in any text node
            let foundInNode = false;
            textNodes.forEach(node => {
              if (node.content.includes(placeholderName)) {
                console.log(`  Found placeholder name in text node: "${node.content.substring(0, 100)}"`);
                
                // Check if this node or adjacent nodes form a complete placeholder pattern
                // Look for {{ and }} nearby
                const nodeIndex = textNodes.indexOf(node);
                
                // Check current node
                if (node.content.includes('{{') || node.content.includes('}}')) {
                  // Try to reconstruct the placeholder pattern
                  const reconstructed = node.content.replace(
                    new RegExp(`\\{\\{[^}]*${placeholderName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}[^}]*\\}\\}`, 'g'),
                    replacementValue
                  );
                  
                  if (reconstructed !== node.content) {
                    xmlContent = xmlContent.replace(node.fullMatch, node.fullMatch.replace(node.content, reconstructed));
                    foundInNode = true;
                    console.log(`  ✓ Replaced in text node`);
                  }
                }
                
                // Check if placeholder spans multiple nodes (look at surrounding nodes)
                if (!foundInNode && nodeIndex > 0 && nodeIndex < textNodes.length - 1) {
                  const prevNode = textNodes[nodeIndex - 1];
                  const nextNode = textNodes[nodeIndex + 1];
                  
                  // Check if we have {{ in previous, name in current, }} in next
                  if ((prevNode.content.includes('{{') || prevNode.content.includes('{')) &&
                      (nextNode.content.includes('}}') || nextNode.content.includes('}'))) {
                    console.log(`  ⚠ Placeholder appears to span multiple nodes - attempting replacement`);
                    
                    // Replace in the current node (contains the name)
                    const updatedContent = node.content.replace(
                      new RegExp(placeholderName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'),
                      replacementValue
                    );
                    
                    if (updatedContent !== node.content) {
                      xmlContent = xmlContent.replace(node.fullMatch, node.fullMatch.replace(node.content, updatedContent));
                      
                      // Clean up braces in adjacent nodes
                      const prevUpdated = prevNode.content.replace(/[\{\{]+/g, '');
                      const nextUpdated = nextNode.content.replace(/[\}\}]+/g, '');
                      
                      if (prevUpdated !== prevNode.content) {
                        xmlContent = xmlContent.replace(prevNode.fullMatch, prevNode.fullMatch.replace(prevNode.content, prevUpdated));
                      }
                      if (nextUpdated !== nextNode.content) {
                        xmlContent = xmlContent.replace(nextNode.fullMatch, nextNode.fullMatch.replace(nextNode.content, nextUpdated));
                      }
                      
                      foundInNode = true;
                      console.log(`  ✓ Replaced across multiple nodes`);
                    }
                  }
                }
              }
            });
            
            if (!foundInNode) {
              console.warn(`  ⚠ Could not find or replace "{{${placeholderName}}}"`);
            }
          } else {
            console.warn(`  ⚠ Placeholder "{{${placeholderName}}}" not found in XML at all`);
          }
        }
      }
    });

    // Handle headers and footers
    Object.keys(zip.files).forEach(filename => {
      if ((filename.startsWith('word/header') || filename.startsWith('word/footer')) && filename.endsWith('.xml')) {
        let content = zip.files[filename].asText();
        const original = content;
        
        Object.keys(replacements).forEach(placeholder => {
          const pattern = `{{${placeholder}}}`;
          const escapedPattern = pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
          const regex = new RegExp(escapedPattern, 'g');
          content = content.replace(regex, replacements[placeholder]);
        });
        
        if (content !== original) {
          zip.file(filename, content);
          console.log(`Updated ${filename}`);
        }
      }
    });

    // Save changes
    zip.file('word/document.xml', xmlContent);
    
    console.log('\n=== Generation Complete ===');
    console.log('Final XML length:', xmlContent.length);
    console.log('Length change:', xmlContent.length - originalLength);

    // Generate output
    const docBuffer = zip.generate({
      type: 'nodebuffer',
      compression: 'DEFLATE',
    });

    return NextResponse.json({
      success: true,
      document: docBuffer.toString('base64'),
      message: 'Document generated successfully'
    });

  } catch (error) {
    console.error('Generation error:', error);
    console.error('Stack:', error.stack);
    return NextResponse.json(
      { error: 'Failed to generate document', details: error.message },
      { status: 500 }
    );
  }
}
