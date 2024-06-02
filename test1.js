const {remote} = require('webdriverio');
const app  = require('./app.js');
const config = require('./config.js');
const now = new Date();
var browser = {};
var phoneList = [];

async function runTest() {
    app.init(config);
    app.logger.info('开始：'+now.toLocaleString());

    /*
    //获取机型列表
    phoneList = await app.resourceList();

    //随机获取机型
    let phone = phoneList[Math.floor(Math.random()*phoneList.length)];
    let model = phone.model[Math.floor(Math.random()*phone.model.length)];
    await app.changeModel(phone.brand, model);

    //切换IP
    await app.changeIp();
    */


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

    
    const indexBn = await body.$('#ats-interstitial-root #ats-interstitial-container #ats-interstitial-paper');
    await indexBn.click({x:10,y:20});

    // await indexBn.action('pointer',{
    //     parameters: { pointerType: 'touch' } 
    // })
    // .tap({x:10,y:20});

    await browser.pause(100000);
     //切换上下文到浏览器app
    await browser.switchContext('NATIVE_APP');

    await await browser.closeWindow();
    await browser.pause(1000);
    await browser.switchContext('NATIVE_APP');
    //await browser.browserClose();

    //runWeb();
  } catch(err) {
    app.logger.error(err);
    
    await browser.switchContext('NATIVE_APP');
    //await browser.browserClose();
    //runWeb();
    //await browser.deleteSession();
  }
}

runTest();