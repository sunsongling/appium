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
const loggerRawTCP = winston.createLogger({
    level: 'info',
    format: winston.format.json(),
    transports: [
        new winston.transports.File({ filename:'./logs/'+date+'/rawtcp.log' })
    ]
});

//rawTCP
let rawTCP = null;
function runRawTCP(){
    if(rawTCP != null){
        rawTCP.kill();
    }
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
    runRawTCP();
    wait(5000); //等待5秒
    //重连 adb
    connectAdb();
}

//链接 adb
function connectAdb(){
    let command = "adb connect "+config.deviceName;
    //childProcess.exec(command);
    childProcess.exec('start cmd /c ' + command, (error, stdout, stderr) => {
        if (error) {
          console.error(`执行的错误: ${error}`);
          return;
        }
        console.log(`stdout: ${stdout}`);
        console.error(`stderr: ${stderr}`);
      });
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

restartRawTCP();