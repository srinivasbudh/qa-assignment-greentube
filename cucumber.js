module.exports = {
  // Load TypeScript support before binding feature steps and lifecycle hooks.
  default: [
    'features/**/*.feature',
    '--require-module ts-node/register',
    '--require support/**/*.ts',
    '--require step-definitions/**/*.ts',
    '--format progress',
    '--format html:reports/cucumber-report.html'
  ].join(' ')
};
