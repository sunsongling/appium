const childProcess = require('child_process');
const winston = require('winston');
const config = require('./config.js');
const now = new Date();
const date = now.toLocaleString().split(" ")[0];  // 获取日期部分

//创建日志
const loggerAppium = winston.createLogger({
    level: 'info',
    format: winston.format.json(),
    transports: [
        new winston.transports.File({ filename:'./logs/'+date+'/appium.log' })
    ]
});
//运行 appium
let appium = null;

function runAppium(){
    if(appium != null){
        appium.kill();
    }
    //子进程
    appium = childProcess.exec('appium server --allow-insecure chromedriver_autodownload  --port '+config.appiumPort);
    appium.stdout.on("data", function (data) {
        // 因为可能会有多次输出，所以需要将数据转换为字符串
        const output = data.toString();
        
        // 逐行输出
        output.split('\n').forEach((line) => {
            loggerAppium.info((new Date()).toLocaleString()+' '+ line);
        });
    
    });

    // 错误
    appium.stderr.on("data", function (data) {
        // 因为可能会有多次输出，所以需要将数据转换为字符串
        const output = data.toString();
        // 逐行输出
        output.split('\n').forEach((line) => {
            loggerAppium.error((new Date()).toLocaleString()+' '+ line);
        });
    });

    appium.on("close", function (code) {
        loggerAppium.error((new Date()).toLocaleString()+' '+ code);
        // 重启子进程
        runAppium();
    });

}


runAppium();
