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
    

    await browser.pause(1000);

    const useAccount = await browser.$('//android.widget.Button[@resource-id="com.android.chrome:id/signin_fre_dismiss_button"]');
    await useAccount.click();
    
    await browser.pause(1000);

    const moreButton = await browser.$('//android.widget.Button[@resource-id="com.android.chrome:id/more_button"]');
    await moreButton.click();
    
    await browser.pause(1000);

    const ackButton = await browser.$('//android.widget.Button[@resource-id="com.android.chrome:id/ack_button"]');
    await ackButton.click();

    
    await browser.pause(1000);

    runWeb();
}

const closeWeb = async function (){
    try {
        //await browser.deleteSession();
        //随机获取机型
        let phone = phoneList[Math.floor(Math.random()*phoneList.length)];
        let model = phone.model[Math.floor(Math.random()*phone.model.length)];
        await app.changeModel(phone.brand, model);

        //切换IP
        await app.changeIp();

        await browser.switchContext('NATIVE_APP');


        await browser.pause(2000);

       
        const capabilities = {
            platformName: 'Android',
            'appium:automationName': 'UiAutomator2',
            'appium:deviceName': config.deviceName,
            'appium:appPackage': config.appPackage,
            'appium:appActivity': config.appActivity,
        };

        browser.deleteSession();

        browser.reloadSession(capabilities);

        
        await browser.pause(2000);

        /*

        await browser.deleteCookies();

        let script = `localStorage.clear();`;

        await browser.execute(script)
        */
    
        await browser.waitUntil(async function () {
            return (await browser.$('//android.widget.Button[@resource-id="com.android.chrome:id/signin_fre_dismiss_button"]'));
        },{timeout:20000,timeoutMsg:'浏览器打开超时'});
    
        const useAccount = await browser.$('//android.widget.Button[@resource-id="com.android.chrome:id/signin_fre_dismiss_button"]');
        await useAccount.click();
    
        const moreButton = await browser.$('//android.widget.Button[@resource-id="com.android.chrome:id/more_button"]');
        await moreButton.click();
    
        const ackButton = await browser.$('//android.widget.Button[@resource-id="com.android.chrome:id/ack_button"]');
        await ackButton.click();
        

    
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

    let wait = Math.floor(Math.random()*5) + 5; //5-9s 
    await browser.pause(wait*1000);

    //const context = await browser.getContext();
    //console.log('context',context);

    /*
    try{
        // 获取所有窗口句柄
        const windowHandles = await browser.getWindowHandles();

        console.log('windowHandles',windowHandles);


        //在所有窗口句柄中查找新窗口句柄
        const newWindowHandle = windowHandles.find(handle => windowHandlesAll.indexOf(handle) === -1);
        if(newWindowHandle){
            console.log('newWindowHandle',newWindowHandle);
            //切换到新窗口
            await browser.switchToWindow(newWindowHandle);

            windowHandlesAll.push(newWindowHandle);
        }
    } finally {

    }
    */
    

    //等待网页加载完成
    await browser.waitUntil(async function () {
        return (await browser.$('html body'));
    },{timeout:20000,timeoutMsg:'广告网站加载超时'});
    app.logger.info({'tip':'广告页面加载完成','time':(new Date()).toLocaleString(),'type':type});

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
    app.logger.info({tip:'打开网站',time:(new Date()).toLocaleString()});

    await browser.waitUntil(async function () {
    return (await browser.$('html body'));
    },{timeout:10000,timeoutMsg:'网站打开超时'});

    const body = await browser.$('html body');

    app.logger.info({tip:'网站已打开',time:(new Date()).toLocaleString()});


    //广告
    const seattles = await body.$$('#adv1 .adsbygoogle');
    app.logger.info({tip:'广告曝光',time:(new Date()).toLocaleString()});

    let wait = Math.floor(Math.random()*5) + 5; //5-9s 
    await browser.pause(wait*1000);
   
    /*
    // 获取当前窗口句柄
    const currentWindowHandle = await browser.getWindowHandle();
    console.log('currentWindowHandle',currentWindowHandle);
    windowHandlesAll.push(currentWindowHandle);
    */

    
    if(Math.floor(Math.random()*100) < config.frequency){
        let seattle = seattles[Math.floor(Math.random()*seattles.length)];
        await seattle.scrollIntoView();
        gotoAdver(seattle,'adsbygoogle');
        return ;
    }else if (Math.floor(Math.random()*100) <= config.openChild){
        const gameItems = await body.$$('.item-game');
        const gameItem = gameItems[Math.floor(Math.random()*gameItems.length)];
        await gameItem.scrollIntoView();
        await gameItem.click();
        app.logger.info({tip:'进入子页面',time:(new Date()).toLocaleString()});
        runChild();
        return ;
    }else{
        await browser.back();
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

        /*
        try{
            // 获取所有窗口句柄
            const windowHandles = await browser.getWindowHandles();
    
            console.log('windowHandles',windowHandles);
    
    
            //在所有窗口句柄中查找新窗口句柄
            const newWindowHandle = windowHandles.find(handle => windowHandlesAll.indexOf(handle) === -1);
            if(newWindowHandle){
                console.log('newWindowHandle',newWindowHandle);
                //切换到新窗口
                await browser.switchToWindow(newWindowHandle);
    
                windowHandlesAll.push(newWindowHandle);
            }
        } finally {
    
        }*/
        
        //等待网页加载完成
        await browser.waitUntil(async function () {
            return (await browser.$('html body'));
        },{timeout:20000,timeoutMsg:'子页面加载超时'});

        const body = await browser.$('html body');

        //广告
        const seattles = await body.$$('#adv1 .adsbygoogle');
        app.logger.info({tip:'c-广告曝光',time:(new Date()).toLocaleString()});

        let wait = Math.floor(Math.random()*5) + 5; //5-9s 
        await browser.pause(wait*1000);

        if(Math.floor(Math.random()*100) < config.frequency){
            let seattle = seattles[Math.floor(Math.random()*seattles.length)];
            await seattle.scrollIntoView();
            gotoAdver(seattle,'c-adsbygoogle');
            return ;
        }else{
            await browser.back();
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