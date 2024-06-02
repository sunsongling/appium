const {remote} = require('webdriverio');
const app  = require('./app.js');
const config = require('./config.js');
const now = new Date();
var browser = {};
var phoneList = [];

async function runTest() {
    app.init(config);
    app.logger.info('开始：'+now.toLocaleString());

    //获取机型列表
    phoneList = await app.resourceList();

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

    //const useAccount = await browser.$('//android.widget.Button[@resource-id="com.android.chrome:id/signin_fre_continue_button"]');
    //await useAccount.click();

    runWeb();
}

//android.widget.Button[@text="×Close"]

const runWeb = async function(){
  try {

    let windowHandlesAll = [];


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

    // 获取当前窗口句柄
    const currentWindowHandle = await browser.getWindowHandle();
    console.log('currentWindowHandle',currentWindowHandle);
    windowHandlesAll.push(currentWindowHandle);

    await body.waitUntil(async function () {
        return (await body.$$('.container .site-content .adsbygoogle'));
    },{timeout:30000,timeoutMsg:'广告加载超时'});

    const seattles = await body.$$('.container .site-content .adsbygoogle');

    console.log('seattles',seattles.length);


    let seattle = seattles[Math.floor(Math.random()*seattles.length)];
    await seattle.scrollIntoView();

    await seattle.waitUntil(async function () {
    return (seattle.$$('iframe'));
    },{timeout:30000,timeoutMsg:'广告加载超时'});

    let iframes = await seattle.$$('iframe');
    let iframe 
    for(let i of iframes){
        let v = await i.isDisplayed();
        if(v){
            iframe = i;
            break;
        }
    }
    
    if(Math.floor(Math.random()*100) <= config.frequency && iframe){
        await iframe.scrollIntoView();
        //切换到 iframe
        await browser.switchToFrame(iframe);
        //等待广告加载完成
        await browser.waitUntil(async function () {
            return (await browser.$('html body'));
        },{timeout:30000,timeoutMsg:'广告iframe加载超时'});
    
        const iframeBody = await browser.$('html body');
        
        await browser.waitUntil(async function () {
            return (await iframeBody.$('#mys-wrapper #mys-content').$$('a')[0]);
        },{timeout:100000,timeoutMsg:'获取a 标签超时'});
      
        const a = await iframeBody.$('#mys-wrapper #mys-content').$$('a')[0];
        await a.waitForStable({ timeout: 10000 }); //等待稳定
       
        await a.click();

        //返回父级
        await browser.switchToParentFrame();

        //等待一段时间确保新窗口已打开
        await browser.pause(2000);

        // 获取所有窗口句柄
        const windowHandles = await browser.getWindowHandles();

        console.log('windowHandles',windowHandles);
        
        //在所有窗口句柄中查找新窗口句柄
        const newWindowHandle = windowHandles.find(handle => windowHandlesAll.indexOf(handle) === -1);

        //切换到新窗口
        await browser.switchToWindow(newWindowHandle);

        windowHandlesAll.push(newWindowHandle);

        //等待网页加载完成
        await browser.waitUntil(async function () {
            return (await browser.$('html body'));
        },{timeout:20000,timeoutMsg:'广告网站加载超时'});

        app.logger.info({'tip':'广告详情页面加载完成','time':(new Date()).toLocaleString()});

        let wait = Math.floor(Math.random()*6) + 10; //10-15s 
        await browser.pause(wait);

        //关闭当前窗口
        await browser.closeWindow()

        app.logger.info({'tip':'关闭广告详情页','time':(new Date()).toLocaleString()});

        //切换回原来的窗口
        await browser.switchToWindow(currentWindowHandle);
    }else if(Math.floor(Math.random()*100) <= config.openChild){
        const grids = await body.$$('.container .game-container .grid-item');
        const grid = grids[Math.floor(Math.random()*grids.length)];
        await grid.scrollIntoView();
        const a = await grid.$$('a')[0];
        await a.click();
        //等待一段时间确保新窗口已打开
        await browser.pause(2000);
        // 获取所有窗口句柄
        const windowHandles = await browser.getWindowHandles();

        console.log('windowHandles',windowHandles);

        //在所有窗口句柄中查找新窗口句柄
        const newWindowHandle = windowHandles.find(handle => windowHandlesAll.indexOf(handle) === -1);
        windowHandlesAll.push(newWindowHandle);
        //切换到新窗口
        await browser.switchToWindow(newWindowHandle);

        //等待网页加载完成
        await browser.waitUntil(async function () {
            return (await browser.$('html body'));
        },{timeout:20000,timeoutMsg:'子页面加载超时'});

        await body.waitUntil(async function () {
            return (await body.$$('.container .site-content .adsbygoogle'));
        },{timeout:30000,timeoutMsg:'广告加载超时'});
    
        const seattles = await body.$$('.container .site-content .adsbygoogle');
    
        console.log('seattles',seattles.length);
    
    
        let seattle = seattles[Math.floor(Math.random()*seattles.length)];
        await seattle.scrollIntoView();
    
        await seattle.waitUntil(async function () {
        return (seattle.$$('iframe'));
        },{timeout:30000,timeoutMsg:'广告加载超时'});
    
        let iframes = await seattle.$$('iframe');
        let iframe 
        for(let i of iframes){
            let v = await i.isDisplayed();
            if(v){
                iframe = i;
                break;
            }
        }
        
        if(Math.floor(Math.random()*100) <= config.frequency && iframe){
            await iframe.scrollIntoView();
            //切换到 iframe
            await browser.switchToFrame(iframe);
            //等待广告加载完成
            await browser.waitUntil(async function () {
                return (await browser.$('html body'));
            },{timeout:30000,timeoutMsg:'广告iframe加载超时'});
        
            const iframeBody = await browser.$('html body');
            
            await browser.waitUntil(async function () {
                return (await iframeBody.$('#mys-wrapper #mys-content').$$('a')[0]);
            },{timeout:30000,timeoutMsg:'获取a 标签超时'});
          
            const a = await iframeBody.$('#mys-wrapper #mys-content').$$('a')[0];
            await a.waitForStable({ timeout: 10000 }); //等待稳定
           
            await a.click();
    
            //返回父级
            await browser.switchToParentFrame();
    
            //等待一段时间确保新窗口已打开
            await browser.pause(2000);
    
            // 获取所有窗口句柄
            const windowHandles = await browser.getWindowHandles();
    
            console.log('windowHandles',windowHandles);
            
            //在所有窗口句柄中查找新窗口句柄
            const newWindowHandle = windowHandles.find(handle => windowHandlesAll.indexOf(handle) === -1);
    
            //切换到新窗口
            await browser.switchToWindow(newWindowHandle);
    
            windowHandlesAll.push(newWindowHandle);
    
            //等待网页加载完成
            await browser.waitUntil(async function () {
                return (await browser.$('html body'));
            },{timeout:20000,timeoutMsg:'广告网站加载超时'});
    
            app.logger.info({'tip':'广告详情页面加载完成','time':(new Date()).toLocaleString()});
    
            let wait = Math.floor(Math.random()*6) + 10; //10-15s 
            await browser.pause(wait);
    
            //关闭当前窗口
            await browser.closeWindow()
    
            app.logger.info({'tip':'关闭广告详情页','time':(new Date()).toLocaleString()});
    
            //切换回原来的窗口
            await browser.switchToWindow(currentWindowHandle);
        }
    }
    
    await browser.closeWindow();
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