require('./Devices/MiRemoteirLearn');
require('./Devices/MiRemoteSwitch');
require('./Devices/MiRemoteCustom');
require('./Devices/MiRemoteLight');
require('./Devices/MiRemoteProjector');
require('./Devices/MiRemoteAirConditioner');
require('./Devices/MiRemoteMomentarySwitch');

const miio = require('miio');
var package = require("./package.json");
var HomebridgeAPI;

module.exports = function(homebridge) {
    if(!checkPlatformConfig(homebridge, "ChuangmiIRPlatform")){
        return ;
    }
    
    HomebridgeAPI = homebridge;

    HomebridgeAPI.registerPlatform('homebridge-mi-ir-remote', 'ChuangmiIRPlatform', ChuangmiIRPlatform, true);
}

function checkPlatformConfig(homebridge, platform){
    var configJSON = require(homebridge.user.configPath());
    var platforms = configJSON.platforms;
    for(var i in platforms) {
        if(platforms[i]['platform'] === platform) {
            return true;
        }
    }
    return false;
}


function ChuangmiIRPlatform(log, config, api) {
    if(null == config) {
        return;
    }
    
    this.HomebridgeAPI = HomebridgeAPI;
    
    this.log = log;
    this.config = config;

    if (api) {
        this.api = api;
    }
    
    
    this.log.info("Loading v%s ",package.version);

    this.api.on('didFinishLaunching', function() {
        this.log.info("Done!");
    }.bind(this));
    
}

ChuangmiIRPlatform.prototype.accessories = function(callback) {
    var LoadedAccessories = [];
        if(this.config['hidelearn'] == false){
            LoadedAccessories.push(new MiRemoteirLearn(this, this.config['learnconfig']));
        }
        var deviceCfgs = this.config['deviceCfgs'];
        
        if(deviceCfgs instanceof Array) {
            for (var i = 0; i < deviceCfgs.length; i++) {
                var deviceCfg = deviceCfgs[i];
                if(null == deviceCfg['type'] || "" == deviceCfg['type'] || null == deviceCfg['token'] || "" == deviceCfg['token'] || null == deviceCfg['ip'] || "" == deviceCfg['ip']) {
                    continue;
                }

                switch(deviceCfg['type'])
                {
                    case "Switch":
                        LoadedAccessories.push(new MiRemoteSwitch(this, deviceCfg));
                        break;
                    case "Light":
                        LoadedAccessories.push(new MiRemoteLight(this, deviceCfg));
                        break;
                    case "Projector":
                        LoadedAccessories.push(new MiRemoteProjector(this, deviceCfg));
                        break;
                    case "AirConditioner":
                        LoadedAccessories.push(new MiRemoteAirConditioner(this, deviceCfg));
                        break;
                    case "Custom":
                        LoadedAccessories.push(new MiRemoteCustom(this, deviceCfg));
                        break;
                    case "MomentarySwitch":
                        LoadedAccessories.push(new MiRemoteMomentarySwitch(this, deviceCfg));
                        break;    
                    default:
                        this.log.error("device type: " + deviceCfg['type'] + "Unexist!");
                        break;
                }

                
            }
            this.log.info("Loaded accessories: " + LoadedAccessories.length);
        }
        

        callback(LoadedAccessories);
}


ChuangmiIRPlatform.prototype.getMiioDevice = function(configarray,dthat) {
    var device = "";
    var that = this;
    try {
        device = new miio.Device(configarray); 
        dthat.device = device;
        dthat.readydevice = true;
        this.log.debug("Uppercase Success！");
        return device;
    } catch(e) {
        this.log.debug("Uppercase failed");
    }
    try {
        device = new miio.device(configarray)
        .then(function(device) {
            dthat.readydevice = true;
            dthat.device = device;
            that.log.debug("Linked To " + configarray.address);
        });
        this.log.debug("Lowercase Success！");
    } catch(e) {
        this.log.debug("Lowercase failed");
    }
}
    