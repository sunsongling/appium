module.exports = {
  apps : [{
    name:'广告',
    script: 'server.js',
    //watch: '.',
    "error_file" : "./logs/app-err.log",  // 错误日志路径
    "out_file"   : "./logs/app-out.log",  // 普通日志路径
  }],

  deploy : {
    production : {
      user : 'SSH_USERNAME',
      host : 'SSH_HOSTMACHINE',
      ref  : 'origin/master',
      repo : 'GIT_REPOSITORY',
      path : 'DESTINATION_PATH',
      'pre-deploy-local': '',
      'post-deploy' : 'npm install && pm2 reload ecosystem.config.js --env production',
      'pre-setup': ''
    }
  }
};
