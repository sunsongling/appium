const {remote} = require('webdriverio');
const app  = require('./app.js');
const config = require('./config.js');
const now = new Date();
var browser = {};
var phoneList = [];

async function runTest() {
    app.init(config);
    app.logger.info('开始：'+now.toLocaleString());


    const capabilities = {
        platformName: 'Android',
        'appium:automationName': 'UiAutomator2',
        'appium:deviceName': config.deviceName,
        'appium:appPackage': config.appPackage,
        'appium:appActivity': config.appActivity,
    };
    //webdriver 链接配置
    const wdOpts = {
        hostname: process.env.APPIUM_HOST || 'localhost',
        //port: parseInt(process.env.APPIUM_PORT, 10) || 4723,
        port: config.appiumPort,
        //path:'/wd/hub',
        logLevel: 'info',
        capabilities,
    };
    browser = await remote(wdOpts);

    await browser.pause(2000);

    await browser.waitUntil(async function () {
        return (await browser.$('//android.widget.Button[@resource-id="com.android.chrome:id/signin_fre_dismiss_button"]'));
    },{timeout:20000,timeoutMsg:'浏览器打开超时'});

    const useAccount = await browser.$('//android.widget.Button[@resource-id="com.android.chrome:id/signin_fre_dismiss_button"]');
    await useAccount.click();

    const moreButton = await browser.$('//android.widget.Button[@resource-id="com.android.chrome:id/more_button"]');
    await moreButton.click();

    const ackButton = await browser.$('//android.widget.Button[@resource-id="com.android.chrome:id/ack_button"]');
    await ackButton.click();

    //const useAccount = await browser.$('//android.widget.Button[@resource-id="com.android.chrome:id/signin_fre_continue_button"]');
    //await useAccount.click();

    runWeb();
}

//android.widget.Button[@text="×Close"]

const runWeb = async function(){
  try {

    //获取当前上下文
    const contexts = await browser.getContexts();
    console.log('contexts',contexts);

    //切换上下文到webview
    await browser.switchContext('WEBVIEW_chrome');
    //await browser.switchContext('WEBVIEW_com.android.browser');

    await browser.url(config.url);

    await browser.waitUntil(async function () {
    return (await browser.$('html body'));
    },{timeout:10000,timeoutMsg:'网站打开超时'});

    const body = await browser.$('html body');

    const adver = await browser.$('.SDkEP');
    // 获取元素的大小和位置
    const location = await adver.getLocation();
    const size = await adver.getSize();

    // 生成随机点击位置
    const randomX = Math.floor(Math.random() * size.width) + location.x;
    const randomY = Math.floor(Math.random() * size.height) + location.y;

    console.log(`随机点击坐标: (${randomX}, ${randomY})`);

    // 在随机坐标位置执行点击操作
    await browser.performActions([{
        type: 'pointer',
        id: 'finger1',
        parameters: { pointerType: 'touch' },
        actions: [
            { type: 'pointerMove', duration: 0, x: randomX, y: randomY },
            { type: 'pointerDown', button: 0 },
            { type: 'pause', duration: 100 },
            { type: 'pointerUp', button: 0 }
        ]
    }]);

  } catch(err) {
    app.logger.error(err);
    
    await browser.deleteSession();
  }
}

runTest();