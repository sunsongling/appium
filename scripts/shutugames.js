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

const capabilities = {
    platformName: 'Android',
    'appium:automationName': 'UiAutomator2',
    'appium:deviceName': config.deviceName,
    'appium:appPackage': config.appPackage,
    'appium:appActivity': config.appActivity
    // 'goog:chromeOptions': {
    //     args: ['--disable-web-security']
    // }
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

async function runTest() {
    app.init(config);
    app.logger.info('开始：'+now.toLocaleString());

    //获取机型列表
    //phoneList = await app.resourceList();

    /*
    //随机获取机型
    let phone = phoneList[Math.floor(Math.random()*phoneList.length)];
    let model = phone.model[Math.floor(Math.random()*phone.model.length)];
    await app.changeModel(phone.brand, model);
    */
    
    //切换IP
    await app.changeIp();
    
    browser = await remote(wdOpts);

    await browser.pause(2000);

    // await browser.waitUntil(async function () {
    //     return (await browser.$('//android.widget.Button[@resource-id="com.android.chrome:id/signin_fre_dismiss_button"]'));
    // },{timeout:20000,timeoutMsg:'浏览器打开超时'});
    

    // await browser.pause(1000);

    const useAccount = await browser.$('//android.widget.Button[@resource-id="com.android.chrome:id/signin_fre_dismiss_button"]');
    await useAccount.waitForExist({ timeout: 5000 }); // 等待元素存在
    await useAccount.waitForDisplayed({ timeout: 5000 }); // 等待元素显示
    await useAccount.click();
    
    await browser.pause(1000);

    const moreButton = await browser.$('//android.widget.Button[@resource-id="com.android.chrome:id/more_button"]');
    await moreButton.waitForExist({ timeout: 5000 });
    await moreButton.waitForDisplayed({ timeout: 5000 });
    await moreButton.click();
    
    await browser.pause(1000);

    const ackButton = await browser.$('//android.widget.Button[@resource-id="com.android.chrome:id/ack_button"]');
    await ackButton.waitForExist({ timeout: 5000 });
    await ackButton.waitForDisplayed({ timeout: 5000 });
    await ackButton.click();

    
    await browser.pause(1000);


    //切换上下文到webview
    await browser.switchContext('WEBVIEW_chrome');

    await browser.url(config.url);

    runWeb();
}

const closeWeb = async function (){

    try {

        await browser.back(); //返回一下
        await browser.pause(1000);
        // 获取所有窗口句柄
        const windowHandles = await browser.getWindowHandles();
        console.log('所有窗口句柄:', windowHandles);

        // 逐个清除Cookies和LocalStorage 关闭窗口
        for (let i = 0; i < windowHandles.length; i++) {
            let handle = windowHandles[i];
            await browser.switchToWindow(handle);
            app.logger.info({'tip':`切换到窗口 ${handle}`});
            //清空所有的 cookies
            await browser.deleteCookies();
            app.logger.info({'tip':`窗口 ${handle} Cookies 已成功清`});
            // 清空 localStorage
            await browser.execute(() => {
                localStorage.clear();
                sessionStorage.clear();
            });
            app.logger.info({'tip':`窗口 ${handle} LocalStorage 已成功清除`});

            //最后一个窗口不关闭 避免关闭所有窗口后失去上下文
            if(i < windowHandles.length - 1){
                await browser.closeWindow();
                app.logger.info({'tip':`窗口 ${handle} 已关闭`});
            }
        }
        /*
        //随机获取机型
        let phone = phoneList[Math.floor(Math.random()*phoneList.length)];
        let model = phone.model[Math.floor(Math.random()*phone.model.length)];
        await app.changeModel(phone.brand, model);
        */

        //切换IP
        await app.changeIp();
        

        // 切换到最后一个窗口并打开新页面
        await browser.switchToWindow(windowHandles[windowHandles.length - 1]);
        await browser.url(config.url);

        runWeb();
    } catch(err) {

        app.logger.error(err);
        const capabilities = {
            platformName: 'Android',
            'appium:automationName': 'UiAutomator2',
            'appium:deviceName': config.deviceName,
            'appium:appPackage': config.appPackage,
            'appium:appActivity': config.appActivity,
        };

        //await browser.deleteSession();

        //重启会话
        await browser.reloadSession();

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

        await browser.pause(1000);


        //切换上下文到webview
        await browser.switchContext('WEBVIEW_chrome');

        await browser.url(config.url);
        runWeb();
    } 
}


const gotoAdver = async function(adver,type){

    // 等待页面加载并获取 iframe 元素
    const iframe = await adver.$('iframe');
    await iframe.waitForExist({ timeout: 5000 }); // 等待元素存在
    await iframe.waitForDisplayed({ timeout: 5000 }); // 等待元素显示

    // 获取屏幕尺寸
    const { width, height } = await browser.getWindowSize();

    console.log(`窗口大小:`,width,height);
        
    // 设置滑动的起点和终点
    const startX = Math.floor(width / 2);
    const startY = Math.floor(height * 0.2);
    const endX = Math.floor(width / 2);
    const endY = Math.floor(height * 0.5);
    // 广告滑动到中间
    await browser.performActions([{
        type: 'pointer',
        id: 'finger1',
        parameters: { pointerType: 'touch' },
        actions: [
            { type: 'pointerMove', duration: 0, x: startX, y: startY },
            { type: 'pointerDown', button: 0 },
            { type: 'pause', duration: 100 },
            { type: 'pointerMove', duration: 1000, origin: 'viewport', x: endX, y: endY },
            { type: 'pointerUp', button: 0 }
        ]
    }]);



    //await adver.scrollIntoView();

    //获取广告框大小
    //const adverSize = await adver.getSize();
    //await adver.click({x:Math.floor(-(adverSize.width - 2) /2  + Math.random()*(adverSize.width - 2)),y:Math.floor(-(adverSize.height - 2) /2 + Math.random()*(adverSize.height - 2))});

    //获取页面总高
    // const pageSize = await browser.execute(() => {  
    //     return {  
    //         width: document.documentElement.clientWidth,  
    //         height: document.documentElement.clientHeight  
    //     };  
    // });  

    const scrollPosition = await browser.execute(() => {  
        // 优先使用 window.scrollY，如果不支持则回退到 document.documentElement.scrollTop  
        return (window.scrollY || document.documentElement.scrollTop) || document.body.scrollTop;  
    });  

    console.log(`页面大小:`,scrollPosition);

    // 获取元素的大小和位置
    const location = await iframe.getLocation();
    const size = await iframe.getSize();

    // 生成随机点击位置
    const randomX = Math.floor(Math.random() * size.width) + location.x;
    const randomY = Math.floor(Math.random() * size.height) + location.y - scrollPosition;

    console.log(`坐标:`,location,size);
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

    app.logger.info({'tip':'广告点击','time':(new Date()).toLocaleString(),'type':type});
    await browser.pause(5000);

    let wait = Math.floor(Math.random()*5) + 5; //5-9s 
    await browser.pause(wait*1000);

    //等待网页加载完成
    await browser.waitUntil(async function () {
        return (await browser.$('html body'));
    },{timeout:20000,timeoutMsg:'广告网站加载超时'});
    app.logger.info({'tip':'广告页面加载完成','time':(new Date()).toLocaleString(),'type':type});

    closeWeb();
}

const runWeb = async function(){
  try {

    app.logger.info({tip:'打开网站',time:(new Date()).toLocaleString()});

    await browser.waitUntil(async function () {
    return (await browser.$('html body'));
    },{timeout:10000,timeoutMsg:'网站打开超时'});

    const body = await browser.$('html body');

    // 获取屏幕尺寸
    const { width, height } = await browser.getWindowSize();
        
    // 设置滑动的起点和终点 滑动坐标必须是整数
    const startX = Math.floor( width / 2 );
    const startY = Math.floor(height * 0.8);
    const endX = Math.floor(width / 2);
    const endY = Math.floor(height * 0.2);
    // 模拟滑动到页面底部
    await browser.performActions([{
        type: 'pointer',
        id: 'finger1',
        parameters: { pointerType: 'touch' },
        actions: [
            { type: 'pointerMove', duration: 0, x: startX, y: startY },
            { type: 'pointerDown', button: 0 },
            { type: 'pause', duration: 100 },
            { type: 'pointerMove', duration: 1000, origin: 'viewport', x: endX, y: endY },
            { type: 'pointerUp', button: 0 },
            { type: 'pointerMove', duration: 0, x: startX, y: startY },
            { type: 'pointerDown', button: 0 },
            { type: 'pause', duration: 100 },
            { type: 'pointerMove', duration: 1000, origin: 'viewport', x: endX, y: endY },
            { type: 'pointerUp', button: 0 }
        ]
    }]);

    app.logger.info({tip:'网站已打开',time:(new Date()).toLocaleString()});
    let pop;
    let popV;
    try {
        //检测弹窗广告
        pop = await body.$('#google_esf');
        popV = await pop.isDisplayed();
        if(popV){
            app.logger.info({tip:'pop 广告曝光',time:(new Date()).toLocaleString(),type:'pop'});
        }
    }catch (error) {
        app.logger.info({tip:'弹框没加载',time:(new Date()).toLocaleString()});
    }

    if(pop && popV){
        if(Math.floor(Math.random()*100) < config.frequency){
            await pop.scrollIntoView();
            gotoAdver(pop,'pop');
            return;
        }else{
            await browser.switchToFrame(pop);
            //悬浮框广告关闭按钮
            const popClose = await browser.$('#mys-wrapper #mys-content #dismiss-button');
            await popClose.click();
            //返回父级
            await browser.switchToParentFrame();
        }
    }

    //广告
    let seattles;
    let seattlesShow = [];
    try {
        seattles = await body.$$('.adsbygoogle');
        app.logger.info({tip:'广告曝光',time:(new Date()).toLocaleString()});

        for(let i of seattles){
            let v = await i.isDisplayed();
            if(v){
                seattlesShow.push(i);
                break;
            }
        }

        app.logger.info({tip:'广告曝光 数量'+seattlesShow.length});
    }catch (error) {
        app.logger.info({tip:'adsbygoogle广告加载失败',time:(new Date()).toLocaleString()});
        closeWeb();
    }

    let wait = Math.floor(Math.random()*5) + 5; //5-9s 
    await browser.pause(wait*1000);

        
    if(Math.floor(Math.random()*100) < config.frequency && seattlesShow.length > 0){
        let seattle = seattlesShow[Math.floor(Math.random()*seattlesShow.length)];
        await seattle.scrollIntoView();
        gotoAdver(seattle,'adsbygoogle');
        return ;
    }else if (Math.floor(Math.random()*100) <= config.openChild){
        const gameItems = await body.$$('.item');
        const gameItem = gameItems[Math.floor(Math.random()*gameItems.length)];
        await gameItem.scrollIntoView();
        await gameItem.click();
        app.logger.info({tip:'进入子页面',time:(new Date()).toLocaleString()});
        runChild();
        return ;
    }else{
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

        //等待网页加载完成
        await browser.waitUntil(async function () {
            return (await browser.$('html body'));
        },{timeout:20000,timeoutMsg:'子页面加载超时'});

        const body = await browser.$('html body');

        // 获取屏幕尺寸
        const { width, height } = await browser.getWindowSize();
            
        // 设置滑动的起点和终点
        const startX = Math.floor(width / 2);
        const startY = Math.floor(height * 0.8);
        const endX = Math.floor(width / 2);
        const endY = Math.floor(height * 0.2);

        // 模拟滑动到页面底部
        await browser.performActions([{
            type: 'pointer',
            id: 'finger1',
            parameters: { pointerType: 'touch' },
            actions: [
                { type: 'pointerMove', duration: 0, x: startX, y: startY },
                { type: 'pointerDown', button: 0 },
                { type: 'pause', duration: 100 },
                { type: 'pointerMove', duration: 1000, origin: 'viewport', x: endX, y: endY },
                { type: 'pointerUp', button: 0 },
                { type: 'pointerMove', duration: 0, x: startX, y: startY },
                { type: 'pointerDown', button: 0 },
                { type: 'pause', duration: 100 },
                { type: 'pointerMove', duration: 1000, origin: 'viewport', x: endX, y: endY },
                { type: 'pointerUp', button: 0 }
            ]
        }]);


        let pop;
        let popV;
        try {
            //检测弹窗广告
            pop = await body.$('#google_esf');
            let popV = await pop.isDisplayed();
            if(popV){
                app.logger.info({tip:'c-pop 广告曝光',time:(new Date()).toLocaleString(),type:'c-pop'});
            }
        }catch (error) {
            app.logger.info({tip:'弹框没加载',time:(new Date()).toLocaleString()});
        }

        if(pop && popV){
            if(Math.floor(Math.random()*100) < config.frequency){
                await pop.scrollIntoView();
                gotoAdver(pop,'c-pop');
                return;
            }else{
                await browser.switchToFrame(pop);
                //悬浮框广告关闭按钮
                const popClose = await browser.$('#mys-wrapper #mys-content #dismiss-button');
                await popClose.click();
                //返回父级
                await browser.switchToParentFrame();
            }
        }

        //广告
        let seattles;
        let seattlesShow = [];
        try {
            seattles = await body.$$('.adsbygoogle');
            app.logger.info({tip:'c-广告曝光',time:(new Date()).toLocaleString()});

            for(let i of seattles){
                let v = await i.isDisplayed();
                if(v){
                    seattlesShow.push(i);
                    break;
                }
            }
            app.logger.info({tip:'c-广告曝光 数量'+seattlesShow.length});
        }catch (error) {
            app.logger.info({tip:'c-adsbygoogle广告加载失败',time:(new Date()).toLocaleString()});
            closeWeb();
        }

        let wait = Math.floor(Math.random()*5) + 5; //5-9s 
        await browser.pause(wait*1000);

        if(Math.floor(Math.random()*100) < config.frequency && seattlesShow.length > 0){
            let seattle = seattlesShow[Math.floor(Math.random()*seattlesShow.length)];
            await seattle.scrollIntoView();
            gotoAdver(seattle,'c-adsbygoogle');
            return ;
        }else{
            closeWeb();
            return ;
        }
        
    }catch(err) {
        app.logger.error(err);
        closeWeb();
    }
    
}

runTest();