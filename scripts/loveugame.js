const {remote} = require('webdriverio');
const app  = require('../app.js');
const config = require('../config.js');
const now = new Date();
var browser = {};
var phoneList = [
    {
        brand: 'google',
        model: [ 'Pixel 4a', 'pixel3a', 'pixel5', 'Pixel 6' ]
    }
];
var windowHandlesAll = [];

async function runTest() {
    app.init(config);
    app.logger.info('开始：'+now.toLocaleString());

    //获取机型列表
    //phoneList = await app.resourceList();


    //随机获取机型
    let phone = phoneList[Math.floor(Math.random()*phoneList.length)];
    let model = phone.model[Math.floor(Math.random()*phone.model.length)];
    await app.changeModel(phone.brand, model);

    //切换IP
    await app.changeIp();

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

    runWeb();
}

const closeWeb = async function (){
    try {
        //随机获取机型
        let phone = phoneList[Math.floor(Math.random()*phoneList.length)];
        let model = phone.model[Math.floor(Math.random()*phone.model.length)];
        await app.changeModel(phone.brand, model);

        //切换IP
        await app.changeIp();

        await browser.switchContext('NATIVE_APP');
    } finally {
        runWeb();
    }
}

const gotoAdver = async function(adver,type){
    //获取广告框大小
    const adverSize = await adver.getSize();
    await adver.click({x:Math.floor(-(adverSize.width - 2) /2  + Math.random()*(adverSize.width - 2)),y:Math.floor(-(adverSize.height - 2) /2 + Math.random()*(adverSize.height - 2))});


    app.logger.info({'tip':'广告点击','time':(new Date()).toLocaleString(),'type':type});
    await browser.pause(5000);

    let wait = Math.floor(Math.random()*6) + 10; //10-15s 
    await browser.pause(wait);


    // 获取所有窗口句柄
    const windowHandles = await browser.getWindowHandles();

    console.log('windowHandles',windowHandles);


    //在所有窗口句柄中查找新窗口句柄
    const newWindowHandle = windowHandles.find(handle => windowHandlesAll.indexOf(handle) === -1);

    console.log('newWindowHandle',newWindowHandle);

    //切换到新窗口
    await browser.switchToWindow(newWindowHandle);

    windowHandlesAll.push(newWindowHandle);
    

    //等待网页加载完成
    await browser.waitUntil(async function () {
        return (await browser.$('html body'));
    },{timeout:20000,timeoutMsg:'广告网站加载超时'});

    await browser.back(); //返回


    await browser.closeWindow();

    closeWeb();
}

const runWeb = async function(){
  try {
    windowHandlesAll = [];
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

    app.logger.info({tip:'网站已打开',time:(new Date()).toLocaleString()});

    //悬浮框广告
    const pop = await body.$('#ats-interstitial-root #ats-interstitial-container #ats-interstitial-paper');
    app.logger.info({tip:'广告曝光',time:(new Date()).toLocaleString(),type:'pop'});
    //await loadCompleted(pop);
    if(Math.floor(Math.random()*100) <= config.frequency){
        gotoAdver(pop,'pop');
        return ;
    }else{
        //悬浮框广告关闭按钮
        const popClose = await body.$('#ats-interstitial-root #ats-interstitial-button');
        await popClose.click();
    }

    //页脚广告
    const foot = await body.$('.ats-overlay-bottom-wrapper-rendered #ats-overlay_bottom-1');
    app.logger.info({'tip':'广告曝光','time':(new Date()).toLocaleString(),'type':'foot'});

    if(Math.floor(Math.random()*100) <= config.frequency){
        gotoAdver(foot,'foot');
        return ;
    }else{
        //页脚广告关闭按钮
        const footClose = await body.$('.ats-overlay-bottom-wrapper-rendered .ats-overlay-bottom-close-button');
        await footClose.click();
    }

    
    //app内广告
    const app = await body.$('#ats-insert_ads-2-wrapper #ats-insert_ads-2');
    app.logger.info({'tip':'广告曝光','time':(new Date()).toLocaleString(),'type':'app'});

    // 获取当前窗口句柄
    const currentWindowHandle = await browser.getWindowHandle();
    console.log('currentWindowHandle',currentWindowHandle);
    windowHandlesAll.push(currentWindowHandle);

    
    if(Math.floor(Math.random()*100) <= config.frequency){
        gotoAdver(app,'app');
        return ;
    }else if (Math.floor(Math.random()*100) <= config.openChild){
        const gameItems = await body.$$('.game-item');
        const gameItem = gameItems[Math.floor(Math.random()*gameItems.length)];
        await gameItem.click();
        runChild();
        return ;
    }else{
        await browser.closeWindow();
        closeWeb();
    }

  } catch(err) {
    app.logger.error(err);
    closeWeb();
  }
}

const runChild = async function(){
    try {
        await browser.pause(3000);

        // 获取所有窗口句柄
        const windowHandles = await browser.getWindowHandles();
        console.log('windowHandles',windowHandles);
        //在所有窗口句柄中查找新窗口句柄
        const newWindowHandle = windowHandles.find(handle => windowHandlesAll.indexOf(handle) === -1);

        console.log('newWindowHandle',newWindowHandle);

        //切换到新窗口
        await browser.switchToWindow(newWindowHandle);

        windowHandlesAll.push(newWindowHandle);

        //等待网页加载完成
        await browser.waitUntil(async function () {
            return (await browser.$('html body'));
        },{timeout:20000,timeoutMsg:'子页面加载超时'});

        //悬浮框广告
        const pop = await body.$('#ats-interstitial-root #ats-interstitial-container #ats-interstitial-paper');
        app.logger.info({'tip':'广告曝光','time':(new Date()).toLocaleString(),'type':'c-pop'});

        //app内广告
        const app = await body.$('#ats-insert_ads-2-wrapper #ats-insert_ads-2');
        app.logger.info({'tip':'广告曝光','time':(new Date()).toLocaleString(),'type':'c-app'});

        //页脚广告
        const foot = await body.$('.ats-overlay-bottom-wrapper-rendered #ats-overlay_bottom-1');
        app.logger.info({'tip':'广告曝光','time':(new Date()).toLocaleString(),'type':'c-foot'});


        if(Math.floor(Math.random()*100) <= config.frequency){
            gotoAdver(pop,'c-pop');
            return ;
        }else{
            //悬浮框广告关闭按钮
            const popClose = await body.$('#ats-interstitial-root #ats-interstitial-button');
            await popClose.click();
        }


        if(Math.floor(Math.random()*100) <= config.frequency){
            gotoAdver(foot,'c-foot');
            return ;
        }else{
            //页脚广告关闭按钮
            const footClose = await body.$('.ats-overlay-bottom-wrapper-rendered .ats-overlay-bottom-close-button');
            await footClose.click();
        }

        if(Math.floor(Math.random()*100) <= config.frequency){
            gotoAdver(app,'c-app');
            return ;
        }else{
            await browser.closeWindow();
            closeWeb();
            return ;
        }
    }catch(err) {
        app.logger.error(err);
        closeWeb();
    }
    
}

runTest();