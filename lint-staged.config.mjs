export default {
  // TODO: drop the flag once ESLint 10 makes config lookup from file the default
  '*.ts': ['eslint --flag v10_config_lookup_from_file --fix', 'prettier --write'],
  '!(*.ts)': 'prettier --write --ignore-unknown',
};
