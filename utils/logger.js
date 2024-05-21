import chalk from 'chalk';

export const log = {
  system: (msg) => console.log(chalk.blue(`[ SYSTEM ] ${msg}`)),
  postRequest: (msg) => console.log(chalk.yellow(`[ POST ] ${msg}`)),
  successPost: (msg) => console.log(chalk.green(`[ SUCCESS POST ] ${msg}`)),
  userAction: (msg) => console.log(chalk.hex('#FF69B4')(`[ USER ACTION ] ${msg}`)),
  friendRequest: (msg) => console.log(chalk.magenta(`[ FRIEND REQUEST ] ${msg}`)),
  writingFile: (msg) => console.log(chalk.hex('#FFA500')(`[ WRITING FILE ] ${msg}`)),
  fileWritingSuccess: (msg) => console.log(chalk.hex('#FFD580')(`[ FILE WRITING SUCCESS ] ${msg}`)),
  buttonInteraction: (msg) => console.log(chalk.white(`[ BUTTON INTERACTION ] ${msg}`)),
  failedAttempt: (msg) => console.log(chalk.red(`[ FAILED ATTEMPT ] ${msg}`))
};
