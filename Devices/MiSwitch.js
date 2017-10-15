require('./Base');

const inherits = require('util').inherits;
const miio = require('miio');

var Accessory, PlatformAccessory, Service, Characteristic, UUIDGen;
MiSwitch = function(platform, config) {
    this.init(platform, config);
    
    Accessory = platform.Accessory;
    PlatformAccessory = platform.PlatformAccessory;
    Service = platform.Service;
    Characteristic = platform.Characteristic;
    UUIDGen = platform.UUIDGen;
    
    this.device = new miio.Device({
        address: this.config['ip'],
        token: this.config['token']
    });
    
    this.accessories = {};
    if(this.config['Name'] && this.config['Name'] != "") {
        this.accessories['SwitchAccessory'] = new SwitchService(this);
    }
    var accessoriesArr = this.obj2array(this.accessories);
    
    this.platform.log.debug("[MiIRRemote][DEBUG]Initializing " + this.config["type"] + " device: " + this.config["ip"] + ", accessories size: " + accessoriesArr.length);
    
    
    return accessoriesArr;
}
inherits(MiSwitch, Base);

SwitchService = function(dThis) {
    this.device = dThis.device;
    this.name = dThis.config['Name'];
    this.token = dThis.config['token'];
    this.data = dThis.config['data'];
    this.platform = dThis.platform;
    this.onoffstate = false;
}

SwitchService.prototype.getServices = function() {
    var that = this;
    var services = [];
    var tokensan = this.token.substring(this.token.length-8);
    var infoService = new Service.AccessoryInformation();
    infoService
        .setCharacteristic(Characteristic.Manufacturer, "XiaoMi")
        .setCharacteristic(Characteristic.Model, "MiIRRemote-Switch")
        .setCharacteristic(Characteristic.SerialNumber, tokensan);
    services.push(infoService);   
    var SwitchServices = new Service.Switch(this.name);
    var SwitchServicesCharacteristic = SwitchServices.getCharacteristic(Characteristic.On);
    SwitchServicesCharacteristic
        .on('set',function(value, callback) {
            var onoff = value ? "on" : "off";
            this.onoffstate = value;
            this.device.call("miIO.ir_play", {"freq":38400,"code":this.data[onoff]}).then(result => {
                that.platform.log.info("[MiIRRemote][" + this.name + "]Switch: " + onoff);
                callback(null);
            }).catch(function(err) {
                that.platform.log.error("[MiIRRemote][ERROR]Switch Error: " + err);
                callback(err);
            });
        }.bind(this))
        .on('get', function(callback) {
            callback(null,this.onoffstate);
        }.bind(this))
        
    services.push(SwitchServices);
    return services;
}