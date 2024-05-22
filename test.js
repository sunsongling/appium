const {remote} = require('webdriverio');
const request  = require('request');
const winston = require('winston');
const crypto = require('crypto');
//const url = 'https://supernewgame.com/';
const url = 'https://ip138.com/';
const token = 'ASRN570R0UMNE5ZJUZ2696X2E39GI86K';                     //代理ip token
const ipweb = 'http://api.ipweb.cc:8004/api/agent/release?account=';  //代理ip 切换ip api
const userName = '100121187064-OSE0t25Q';                             //代理ip 用户名
const passWord = 'a1c5a11cb488e3d3421c161a121833e5';                  //代理ip 密码
const proxyUrl = 'gate2.ipweb.cc';                                    //代理ip 服务器地址

const AK = '206adee0788f6e0e614260592f2cd0a3';    //云机秘钥
const email = '18937153620@163.com';              //云机注册邮箱
const domain = 'https://www.ogcloud.com';         //云机官网

const frequency = 4;   //点击率
var browser = {};
const now = new Date();
const date = now.toLocaleString().split(" ")[0];  // 获取日期部分

const capabilities = {
  platformName: 'Android',
  'appium:automationName': 'UiAutomator2',
  'appium:deviceName': 'Android',
  //'appium:appPackage': 'com.android.browser',
  //'appium:appActivity': 'com.android.browser.BrowserActivity',
  //'appium:appPackage': 'com.tunnelworkshop.postern',
  //'appium:appActivity': 'com.tunnelworkshop.postern.PosternMain',
  'appium:appPackage': 'com.android.chrome',
  'appium:appActivity': 'com.google.android.apps.chrome.Main',
};

//创建日志
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename:date+'.log' })
  ]
});

const hash = (data) => {
  // 使用SHA256算法创建哈希对象
  const hash = crypto.createHash('sha256');
  // 更新哈希对象与数据
  hash.update(data);
  // 获取哈希值的十六进制字符串
  const signString = hash.digest('hex');

  // 计算 HMAC SHA256 签名  
  const hmac = crypto.createHmac('sha256', AK);  
  hmac.update(signString);  
  const signature = hmac.digest('hex');

  return signature;
};

//切换代理IP
function changeIp(){
  const options = {
    url: ipweb+userName,
    headers: {
      'Token': token
    },
    method: 'GET' // 或者使用其他HTTP方法，比如'GET', 'PUT', 'DELETE'
  };
  return new Promise((resolve, reject) => {
    return request(options, function(error, response, body) {
      if (error) {
        logger.error({'tip':'切换代理IP出错','error':error});
        resolve(0);
        return;
      }
      logger.info({'tip':'切换代理IP成功','data':body});
      resolve(1);
    });
  });
}

//切换设备型号
function changeModel(){
  let date = new Date();
  const year = date.getFullYear(); // 获取当前年份，例如：2021
  const month = date.getMonth() + 1; // 获取当前月份，注意需要加1，例如：9
  const day = date.getDate(); // 获取当前日期，例如：22
  const headers = {
    'Account':email,
    'Lange':'CN',
    'X-Api-Key':AK,
    'X-Auth-Date':year.toString()+month.toString()+day.toString(),
  };

  let keys = Object.keys(headers);
  let vals = Object.values(headers);
  let keyStr = keys.join(';').toLowerCase();
  let valStr = vals.join(',');
  let signature = hash(keyStr+valStr);
  headers.signature = signature;
  headers['Content-Type'] = 'application/json';

  const data = {
    "action":'reboot',
    "device_ids":[
      'VM010010008056'
    ],
    "availability_zone":5
  };

  const options = {
    url: domain+'/apiv1/cloudphone/actionPhone',
    headers: headers,
    method: 'POST',
    body:JSON.stringify(data)
  };

  return new Promise((resolve, reject) => {
    return request(options, function(error, response, body) {
      if (error) {
        logger.error({'tip':'切换云机配置出错','error':error});
        resolve(0);
        return;
      }
      logger.info({'tip':'切换云机配置成功','data':body});
      resolve(1);
    });
  });
}

//webdriver 链接配置
const wdOpts = {
  hostname: process.env.APPIUM_HOST || 'localhost',
  port: parseInt(process.env.APPIUM_PORT, 10) || 4723,
  //path:'/wd/hub',
  logLevel: 'info',
  capabilities,
};
async function runTest() {
  /*
  logger.info('开始：'+now.toLocaleString());
  browser = await remote(wdOpts);
  const useAccount = await browser.$('//android.widget.Button[@resource-id="com.android.chrome:id/signin_fre_dismiss_button"]');
  await useAccount.click();
  runWeb();
  */

}

const runWeb = async function(){
  try {
    //await changeModel();
    //await changeIp();
    //获取当前上下文
    await browser.url(url);
    await browser.pause(2000);
    const contexts = await browser.getContexts();
    console.log('contexts',contexts);

    //切换上下文到webview
    await browser.switchContext('WEBVIEW_chrome');
    await browser.waitUntil(async function () {
      return (await browser.$('html body'));
    },{timeout:10000,timeoutMsg:'网站打开超时'});

    const body = await browser.$('html body');

    /*
    await body.waitUntil(async function () {
      return (await body.$('#seattle-ad-10001'));
    },{timeout:10000,timeoutMsg:'广告加载超时'});

    const seattle = await body.$('#seattle-ad-10001');
    seattle.scrollIntoView();
    const iframe = await seattle.$$('iframe')[0];

    // 获取当前窗口句柄
    const currentWindowHandle = await browser.getWindowHandle();
    console.log('currentWindowHandle',currentWindowHandle);

    //滚动到可视区域
    await iframe.scrollIntoView();

    //切换到 iframe
    await browser.switchToFrame(iframe);

    //等待广告加载完成
    await browser.waitUntil(async function () {
      return (await browser.$('html body'));
    },{timeout:20000,timeoutMsg:'广告iframe加载超时'});

    const iframeBody = await browser.$('html body');
    
    await browser.waitUntil(async function () {
      return (await iframeBody.$$('a')[0]);
    },{timeout:20000,timeoutMsg:'获取a 标签超时'});

    const a = await iframeBody.$$('a')[0];
    await a.waitForStable({ timeout: 10000 }); //等待稳定
   
    if(Math.floor(Math.random()*100) < frequency){
      //返回父级
      await browser.switchToParentFrame();

      //切换上下文到浏览器app
      await browser.switchContext('NATIVE_APP');

      const seattleAd = await browser.$('//android.view.View[@resource-id="seattle-ad-10001"]');

      console.log(await seattleAd.getWindowRect());

      seattleAd.click();

      logger.info({'tip':'完成广告点击操作','time':(new Date()).toLocaleString()});


      //切换上下文到webview
      await browser.switchContext('WEBVIEW_com.android.browser');

      //等待一段时间确保新窗口已打开
      await browser.pause(2000);

      // 获取所有窗口句柄
      const windowHandles = await browser.getWindowHandles();
    
      //在所有窗口句柄中查找新窗口句柄
      const newWindowHandle = windowHandles.find(handle =>handle !== currentWindowHandle);

      //切换到新窗口
      await browser.switchToWindow(newWindowHandle);

      //等待网页加载完成
      await browser.waitUntil(async function () {
        return (await browser.$('html body'));
      },{timeout:20000,timeoutMsg:'广告网站加载超时'});

      logger.info({'tip':'广告详情页面加载完成','time':(new Date()).toLocaleString()});

      let wait = Math.floor(Math.random()*6) + 10; //10-15s 
      await browser.pause(wait);

      await browser.deleteAllCookies();
      //关闭当前窗口
      await browser.closeWindow()

      logger.info({'tip':'关闭广告详情页','time':(new Date()).toLocaleString()});

      //切换回原来的窗口
      await browser.switchToWindow(currentWindowHandle);
      
    }
    */
    await await browser.closeWindow();
    await browser.pause(1000);
    //await browser.deleteAllCookies();
    //await browser.forward(); //下一页面
    //await browser.back(); //返回
    await browser.pause(2000);
    //await browser.refresh(); //刷新页面
    //切换上下文到浏览器app
    await browser.switchContext('NATIVE_APP');
    //await browser.closeApp();
    //await browser.launchApp();
    //await browser.deleteSession(capabilities)
    //console.log('status',await browser.status());
    //await browser.newSession(capabilities)
    runWeb();
  } catch(err) {
    logger.error(err);
    //await browser.deleteSession(capabilities);
    //console.log('status',await browser.status());
    //await browser.newSession(capabilities)
    //await browser.closeApp();
    //await browser.launchApp();
    await browser.switchContext('NATIVE_APP');
    //await browser.closeApp();
    //await browser.launchApp();
    runWeb();
  }
}

runTest();


process.on('uncaughtException', (error) => {
  console.error(error); 
  logger.error(error);
});