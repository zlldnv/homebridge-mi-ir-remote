require('./Devices/irLearn');
require('./Devices/MiSwitch');
require('./Devices/MiLight');
require('./Devices/MiProjector');
require('./Devices/MiAirConditioner');

var fs = require('fs');
var packageFile = require("./package.json");
var PlatformAccessory, Accessory, Service, Characteristic, UUIDGen;

module.exports = function(homebridge) {
    if(!isConfig(homebridge.user.configPath(), "platforms", "ChuangmiIRPlatform")) {
        return;
    }
    
    PlatformAccessory = homebridge.platformAccessory;
    Accessory = homebridge.hap.Accessory;
    Service = homebridge.hap.Service;
    Characteristic = homebridge.hap.Characteristic;
    UUIDGen = homebridge.hap.uuid;

    homebridge.registerPlatform('homebridge-mi-ir-remote', 'ChuangmiIRPlatform', ChuangmiIRPlatform, true);
}

function isConfig(configFile, type, name) {
    var config = JSON.parse(fs.readFileSync(configFile));
    if("accessories" === type) {
        var accessories = config.accessories;
        for(var i in accessories) {
            if(accessories[i]['accessory'] === name) {
                return true;
            }
        }
    } else if("platforms" === type) {
        var platforms = config.platforms;
        for(var i in platforms) {
            if(platforms[i]['platform'] === name) {
                return true;
            }
        }
    } else {
    }
    
    return false;
}

function ChuangmiIRPlatform(log, config, api) {
    if(null == config) {
        return;
    }
    
    this.Accessory = Accessory;
    this.PlatformAccessory = PlatformAccessory;
    this.Service = Service;
    this.Characteristic = Characteristic;
    this.UUIDGen = UUIDGen;
    
    this.log = log;
    this.config = config;

    if (api) {
        this.api = api;
    }
    
    
    this.log.info("[MiIRRemote][INFO]*********************************************************************");
    this.log.info("[MiIRRemote][INFO]                           MiIRRemote v%s                        *",packageFile.version);
    this.log.info("[MiIRRemote][INFO] GitHub: https://github.com/Zzm317/homebridge-mi-ir-remote          *");
    this.log.info("[MiIRRemote][INFO]                                                                    *");
    this.log.info("[MiIRRemote][INFO]*********************************************************************");
    this.log.info("[MiIRRemote][INFO]start success...");
    
}

ChuangmiIRPlatform.prototype = {
    accessories: function(callback) {
        var myAccessories = [];
        if(this.config['hidelearn'] == false){
            new irLearn(this, this.config['learnconfig']).forEach(function(accessory, index, arr){
                myAccessories.push(accessory);
            });
        }
        var deviceCfgs = this.config['deviceCfgs'];
        
        if(deviceCfgs instanceof Array) {
            for (var i = 0; i < deviceCfgs.length; i++) {
                var deviceCfg = deviceCfgs[i];
                if(null == deviceCfg['type'] || "" == deviceCfg['type'] || null == deviceCfg['token'] || "" == deviceCfg['token'] || null == deviceCfg['ip'] || "" == deviceCfg['ip']) {
                    continue;
                }
                
                if (deviceCfg['type'] == "Switch") {
                    new MiSwitch(this, deviceCfg).forEach(function(accessory, index, arr){
                        myAccessories.push(accessory);
                    });
                } else if (deviceCfg['type'] == "Light") {
                    new MiLight(this, deviceCfg).forEach(function(accessory, index, arr){
                        myAccessories.push(accessory);
                    });
                } else if (deviceCfg['type'] == "Projector") {
                    new MiProjector(this, deviceCfg).forEach(function(accessory, index, arr){
                        myAccessories.push(accessory);
                    });
                } else if (deviceCfg['type'] == "AirConditioner") {
                    new MiAirConditioner(this, deviceCfg).forEach(function(accessory, index, arr){
                        myAccessories.push(accessory);
                    });
                } else {
                }
            }
            this.log.info("[MiIRRemote][INFO]device size: " + deviceCfgs.length + ", accessories size: " + myAccessories.length);
        }
        

        callback(myAccessories);
    }
}