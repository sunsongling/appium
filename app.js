const request  = require('request');
const winston = require('winston');
const crypto = require('crypto');
const NodeCache = require("node-cache");

const token = 'ASRN570R0UMNE5ZJUZ2696X2E39GI86K';                     //代理ip token
const ipweb = 'http://api.ipweb.cc:8004/api/agent/release?account=';  //代理ip 切换ip api
const AK = '206adee0788f6e0e614260592f2cd0a3';    //云机秘钥
const email = '18937153620@163.com';              //云机注册邮箱
const domain = 'https://www.ogcloud.com/api/';         //云机官网

const cache = new NodeCache();
const now = new Date();
const date = now.toLocaleString().split(" ")[0];  // 获取日期部分

var config = {};

//创建日志
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({filename:'logs/'+date+'.log' })
  ]
});

const hash = (data) => {
  // 使用SHA256算法创建哈希对象
  const hash = crypto.createHash('sha256');
  // 更新哈希对象与数据
  hash.update(data);
 
  const signString = hash.digest('hex');

  // 计算 HMAC SHA256 签名  
  const hmac = crypto.createHmac('sha256', AK);  
  hmac.update(signString);  
  // 获取哈希值的十六进制字符串
  const signature = hmac.digest('hex');

  return signature;
};

//切换代理IP
function changeIp(){
  const options = {
    url: ipweb+config.userName,
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

function getHeaders(){
  let date = new Date();
  const year = date.getFullYear(); // 获取当前年份，例如：2021
  let month = date.getMonth() + 1; // 获取当前月份，注意需要加1，例如：9
  month = month < 10 ? '0' + month.toString() : month;
  let day = date.getDate(); // 获取当前日期，例如：22
  day = day < 10 ? '0' + day.toString() : day;
  const headers = {
    'account':email,
    'lang':'CN',
    'x-api-key':AK,
    'x-auth-date':year.toString()+month.toString()+day.toString(),
  };

  const sortedObj = Object.fromEntries(Object.entries(headers).sort());
  let keys = Object.keys(sortedObj);
  let vals = Object.values(sortedObj); 
  let keyStr = keys.join(';').toLowerCase();
  let valStr = vals.join(',');
  let signature = hash(keyStr+valStr);
  headers.signature = signature;
  headers['Content-Type'] = 'application/json';

  return headers;
}

//获取机型列表
function resourceList(){
  const headers = getHeaders();
  const data = {
    "resource_type":'brand',
    "availability_zone":config.availability_zone
  };

  const options = {
    url: domain+'apiv1/cloudphone/phoneResourceList',
    headers: headers,
    method: 'POST',
    body:JSON.stringify(data)
  };

  return new Promise((resolve, reject) => {
    return request(options, function(error, response, body) {
      let bodyObj = JSON.parse(body);
      if(bodyObj.code == 200){
        logger.info(body);
        let phoneList = bodyObj.data;
        resolve(phoneList);
        return;
      }else if (error) {
        logger.error({'tip':'获取机型列表出错','error':error});
        resolve(0);
        return;
      } else {
        logger.error({'tip':'获取机型列表出错','body':body});
        resolve(0);
        return;
      }
    });
  });
}

//切换设备型号
function changeModel(brand,model,simInfo='美国'){
  
  const headers = getHeaders();
  const data = {
    "action": "change_model",
    "device_id": config.device_id,
    "brand": brand,
    "model": model,
    "sim_info": simInfo,
    "availability_zone": config.availability_zone
  };

  const options = {
    url: domain+'apiv1/cloudphone/deviceBrand',
    headers: headers,
    method: 'POST',
    body:JSON.stringify(data)
  };

  return new Promise((resolve, reject) => {
    let modifyModel = cache.get('modifyModel');
    if(modifyModel != null){
      resolve(0);
      return ;
    }
    return request(options, function(error, response, body) {
      let bodyObj = JSON.parse(body);
      if(bodyObj.code == 200){
        logger.info({'tip':'重置机型成功','brand':brand,'model':model,'body':body});
        let timestamp = Date.now();
        //设置更换机型请时间
        cache.set('modifyModel',timestamp,30);
        resolve(1);
        return;
      }else if (error) {
        logger.error({'tip':'重置机型出错','error':error});
        resolve(0);
        return;
      } else {
        logger.error({'tip':'重置机型出错','body':body});
        resolve(0);
        return;
      }
    });
  });
}

//打开root
function openRoot(){
  const headers = getHeaders();
  const data = {
    "action": "root",
    "device_ids": [
      config.device_id
    ],
    "enable": "1",
    "availability_zone": config.availability_zone
  };

  const options = {
    url: domain+'apiv1/cloudphone/actionPhone',
    headers: headers,
    method: 'POST',
    body:JSON.stringify(data)
  };

  return new Promise((resolve, reject) => {
    return request(options, function(error, response, body) {
      let bodyObj = JSON.parse(body);
      if(bodyObj.code == 200){
        logger.info({'tip':'打开root成功','body':body});
        resolve(1);
        return;
      }else if (error) {
        logger.error({'tip':'打开root出错','error':error});
        resolve(0);
        return;
      } else {
        logger.error({'tip':'打开root出错','body':body});
        resolve(0);
        return;
      }
    });
  });
}
//添加代理
function addProxy(){
  const headers = getHeaders();
  const data = {
    "action": "add",
    "availability_zone": config.availability_zone,
    "mode": "socks5",
    "outbound_ip": "1.2.3.5", //随便填
    "server_ip": config.proxyUrl,
    "server_port": config.proxyPort,
    "username": config.userName,
    "password": config.password,
  };

  const options = {
    url: domain+'apiv1/cloudphone/actionProxy',
    headers: headers,
    method: 'POST',
    body:JSON.stringify(data)
  };

  return new Promise((resolve, reject) => {
    return request(options, function(error, response, body) {
      let bodyObj = JSON.parse(body);
      if(bodyObj.code == 200){
        logger.info({'tip':'添加proxy列表成功','body':body});
        resolve(1);
        return;
      }else if (error) {
        logger.error({'tip':'添加proxy列表出错','error':error});
        resolve(0);
        return;
      } else {
        logger.error({'tip':'添加proxy列表出错','body':body});
        resolve(0);
        return;
      }
    });
  });
}

//获取代理列表
function proxyList(){
  const headers = getHeaders();
  const data = {
    "action": "list",
    "availability_zone": config.availability_zone
  };

  const options = {
    url: domain+'apiv1/cloudphone/actionProxy',
    headers: headers,
    method: 'POST',
    body:JSON.stringify(data)
  };

  return new Promise((resolve, reject) => {
    return request(options, function(error, response, body) {
      let bodyObj = JSON.parse(body);
      if(bodyObj.code == 200){
        logger.info({'tip':'获取proxy列表成功','body':body});
        resolve(body);
        return;
      }else if (error) {
        logger.error({'tip':'获取proxy列表出错','error':error});
        resolve(0);
        return;
      } else {
        logger.error({'tip':'获取proxy列表出错','body':body});
        resolve(0);
        return;
      }
    });
  });
}

//绑定代理
function proxyBind(title){
  const headers = getHeaders();
  const data = {
    "action": "bind",
    "availability_zone": config.availability_zone,
    "title": title,
    "device_id": config.device_id
  }

  const options = {
    url: domain+'apiv1/cloudphone/actionProxy',
    headers: headers,
    method: 'POST',
    body:JSON.stringify(data)
  };

  return new Promise((resolve, reject) => {
    return request(options, function(error, response, body) {
      let bodyObj = JSON.parse(body);
      if(bodyObj.code == 200){
        logger.info({'tip':'绑定proxy列表成功','body':body});
        resolve(1);
        return;
      }else if (error) {
        logger.error({'tip':'绑定proxy列表出错','error':error});
        resolve(0);
        return;
      } else {
        logger.error({'tip':'绑定proxy列表出错','body':body});
        resolve(0);
        return;
      }
    });
  });
}



// 设置缓存
function setCache(key, value, ttl) {
    cache.set(key, value, ttl);
}

// 获取缓存
function getCache(key) {
    return cache.get(key);
}

// 清除缓存
function clearCache() {
    cache.flushAll();
}

function init(_config) {
    config = _config;
}

module.exports = {
    logger:logger,
    changeIp:changeIp,
    resourceList:resourceList,
    changeModel:changeModel,
    openRoot:openRoot,
    proxyList:proxyList,
    proxyBind:proxyBind,
    addProxy:addProxy,
    init:init
}