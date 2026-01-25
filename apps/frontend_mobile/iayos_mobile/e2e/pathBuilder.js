/**
 * Custom Detox Artifacts Path Builder
 * Creates organized artifact directory structure
 */
const path = require('path');

class CustomPathBuilder {
  constructor({ rootDir }) {
    this._rootDir = rootDir;
  }

  buildPathForTestArtifact(artifactName, testSummary) {
    const { title, fullName, status } = testSummary;
    
    // Create sanitized test name
    const sanitizedName = fullName
      .replace(/[^a-zA-Z0-9]/g, '_')
      .replace(/_+/g, '_')
      .substring(0, 100);
    
    // Add status prefix for easy sorting
    const statusPrefix = status === 'failed' ? '❌_FAILED' : '✅_PASSED';
    
    // Build path: artifacts/{status}/{testName}/{artifactName}
    return path.join(
      this._rootDir,
      status,
      sanitizedName,
      artifactName
    );
  }
}

module.exports = CustomPathBuilder;
