module.exports = {
  apps : [
  {
    name:'appium',
    script: 'server_appium.js',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    "error_file" : "./logs/appium-err.log",  // 错误日志路径
    "out_file"   : "./logs/appium-out.log",  // 普通日志路径
  },
  {
    name:'rawTCP',
    script: 'server_raw.js',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    "error_file" : "./logs/raw-err.log",  // 错误日志路径
    "out_file"   : "./logs/raw-out.log",  // 普通日志路径
  },{
    name:'child',
    script: 'server.js',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    "error_file" : "./logs/child-err.log",  // 错误日志路径
    "out_file"   : "./logs/child-out.log",  // 普通日志路径
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
