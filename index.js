require('./Devices/MiRemoteirLearn');
require('./Devices/MiRemoteSwitch');
require('./Devices/MiRemoteCustom');
require('./Devices/MiRemoteLight');
require('./Devices/MiRemoteProjector');
require('./Devices/MiRemoteAirConditioner');
require('./Devices/MiRemoteMomentarySwitch');

const miio = require('miio');
var package = require('./package.json');
var HomebridgeAPI;

module.exports = function (homebridge) {
    if (!checkPlatformConfig(homebridge, 'ChuangmiIRPlatform')) {
        return;
    }
    
    HomebridgeAPI = homebridge;

    HomebridgeAPI.registerPlatform('homebridge-mi-ir-remote', 'ChuangmiIRPlatform', ChuangmiIRPlatform, true);
};

function checkPlatformConfig(homebridge, platform) {
    var configJSON = require(homebridge.user.configPath());
    var platforms = configJSON.platforms;
    for (var i in platforms) {
        if (platforms[i]['platform'] === platform) {
            return true;
        }
    }
    return false;
}

function ChuangmiIRPlatform(log, config, api) {
    if (null == config) {
        return;
    }

    this.HomebridgeAPI = HomebridgeAPI;

    this.log = log;
    this.config = config;

    if (api) {
        this.api = api;
    }

    this.log.info('Loading v%s ', package.version);

    this.api.on('didFinishLaunching', function () {
        this.log.info('Done!');
    }.bind(this));
}

ChuangmiIRPlatform.prototype.accessories = function (callback) {
    var LoadedAccessories = [];
    var deviceCfgs = [];
    var deviceCfg;

    if (this.config['hidelearn'] == false) {
        this.config['learnconfig'] = this.config['learnconfig'] || [];
        this.config['learnconfig']['type'] = 'Learn';
        deviceCfgs.push(this.config['learnconfig']);
    }

    if (this.config['deviceCfgs'] instanceof Array) {
        deviceCfgs = deviceCfgs.concat(this.config['deviceCfgs']);
    }

    for (var i = 0; i < deviceCfgs.length; i++) {
        deviceCfg = deviceCfgs[i];

        if (deviceCfg['ip'] == null || deviceCfg['ip'] === '' || deviceCfg['token'] == null || deviceCfg['token'] === '') {
            deviceCfg['ip'] = this.config['ip'];
            deviceCfg['token'] = this.config['token'];
        }

        if (deviceCfg['type'] == null || deviceCfg['type'] == ''
            || deviceCfg['token'] == null || deviceCfg['token'] == ''
            || deviceCfg['ip'] == null || deviceCfg['ip'] == ''
        ) {
            this.log.error('Device configuration incomplete');
            continue;
        }

        switch (deviceCfg['type']) {
            case 'Learn':
                LoadedAccessories.push(new MiRemoteirLearn(this, deviceCfg));
                break;
            case 'Switch':
                LoadedAccessories.push(new MiRemoteSwitch(this, deviceCfg));
                break;
            case 'Light':
                LoadedAccessories.push(new MiRemoteLight(this, deviceCfg));
                break;
            case 'Projector':
                LoadedAccessories.push(new MiRemoteProjector(this, deviceCfg));
                break;
            case 'AirConditioner':
                LoadedAccessories.push(new MiRemoteAirConditioner(this, deviceCfg));
                break;
            case 'Custom':
                LoadedAccessories.push(new MiRemoteCustom(this, deviceCfg));
                break;
            case 'MomentarySwitch':
                LoadedAccessories.push(new MiRemoteMomentarySwitch(this, deviceCfg));
                break;
            default:
                this.log.error("Device type: '" + deviceCfg['type'] + "' does not exist!");
                break;
        }
    }

    this.log.info('Loaded ' + LoadedAccessories.length + ' accessories');
    callback(LoadedAccessories);
};


ChuangmiIRPlatform.prototype.getMiioDevice = function (configarray, dthat) {
    var device = "";
    var that = this;
    try {
        device = new miio.Device(configarray); 
        dthat.device = device;
        dthat.readydevice = true;
        this.log.debug('Uppercase Success');
        return device;
    } catch(e) {
        this.log.debug('Uppercase failed');
    }
    try {
        device = new miio.device(configarray).then(function (device) {
            dthat.readydevice = true;
            dthat.device = device;
            that.log.debug('Linked To ' + configarray.address);
        });
        this.log.debug('Lowercase Success');
    } catch(e) {
        this.log.debug('Lowercase failed');
    }
};
    