import firebaseRulesPlugin from '@firebase/eslint-plugin-security-rules';

export default [
  {
    ignores: ['dist/**/*', 'build/**/*', 'node_modules/**/*', 'src/**/*', 'server.ts', 'scripts/**/*']
  },
  firebaseRulesPlugin.configs['flat/recommended']
];
