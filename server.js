const childProcess = require('child_process');
const winston = require('winston');
const config = require('./config.js');
const now = new Date();
const date = now.toLocaleString().split(" ")[0];  // 获取日期部分

function wait(milliSeconds) {
    var startTime = new Date().getTime();
    while (new Date().getTime() < startTime + milliSeconds);
}

//创建日志
const loggerAppium = winston.createLogger({
    level: 'info',
    format: winston.format.json(),
    transports: [
        new winston.transports.File({ filename:'./logs/'+date+'/appium.log' })
    ]
});

const loggerRawTCP = winston.createLogger({
    level: 'info',
    format: winston.format.json(),
    transports: [
        new winston.transports.File({ filename:'./logs/'+date+'/rawtcp.log' })
    ]
});

const loggerChild = winston.createLogger({
    level: 'info',
    format: winston.format.json(),
    transports: [
        new winston.transports.File({ filename:'./logs/'+date+'/child.log' })
    ]
});
//运行 appium
let appium = null;

function runAppium(){
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
//rawTCP
let rawTCP = null;
function runRawTCP(){
    //子进程
    rawTCP = childProcess.exec('RawTcpTunnelConnector-amd64-windows.exe config=./config.json');
    rawTCP.stdout.on("data", function (data) {
        // 因为可能会有多次输出，所以需要将数据转换为字符串
        const output = data.toString();
        
        // 逐行输出
        output.split('\n').forEach((line) => {
            //判断字符串中是否包含error
            if(line.indexOf('error') !== -1){
                restartRawTCP();
            }
            loggerRawTCP.info((new Date()).toLocaleString()+' '+ line);
        });
    
    });

    // 错误
    rawTCP.stderr.on("data", function (data) {
        // 因为可能会有多次输出，所以需要将数据转换为字符串
        const output = data.toString();
        // 逐行输出
        output.split('\n').forEach((line) => {
            //判断字符串中是否包含error
            if(line.indexOf('error') !== -1){
                restartRawTCP();
            }
            loggerRawTCP.error((new Date()).toLocaleString()+' '+ line);
        });
    });

    rawTCP.on("close", function (code) {
        loggerRawTCP.error((new Date()).toLocaleString()+' '+ code);
        // 重启子进程
        restartRawTCP();
    });
}

function restartRawTCP (){
    if(rawTCP != null){
        rawTCP.kill();
        runRawTCP();
    }else{
        runRawTCP();
    }

    //重连 adb
    connectAdb();
}

//链接 adb
function connectAdb(){
    let command = "adb connect "+config.deviceName;
    childProcess.exec(command);
}

//检测 adb 链接转态
function detectionAdb(){
    childProcess.exec('adb devices', function (error, stdout, stderr) {
        if (error) {
          console.log(error.stack);
          console.log('Error code: ' + error.code);
        }
        const output = data.toString();
        if(output.indexOf(config.deviceName) == -1){
            connectAdb();
        }
    })
}

let child = null;

function runChild(){
    //子进程
    child = childProcess.spawn('node',['./index.js']);

    child.stdout.on("data", function (data) {
        // 因为可能会有多次输出，所以需要将数据转换为字符串
        const output = data.toString();
        
        // 逐行输出
        output.split('\n').forEach((line) => {
            loggerChild.info((new Date()).toLocaleString()+' '+ line);
        });
    
    });

    // 错误
    child.stderr.on("data", function (data) {
        // 因为可能会有多次输出，所以需要将数据转换为字符串
        const output = data.toString();
        
        // 逐行输出
        output.split('\n').forEach((line) => {
            loggerChild.error((new Date()).toLocaleString()+' '+ line);
        });
    });

    child.on("close", function (code) {
        loggerChild.error((new Date()).toLocaleString()+"child exists with code: "+ code);
        // 重启子进程
        runChild();
    });
}
runAppium();
wait(2000); //等待2秒
restartRawTCP();
wait(2000); //等待2秒
runChild();