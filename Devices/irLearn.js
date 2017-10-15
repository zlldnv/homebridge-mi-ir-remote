require('./Base');

const inherits = require('util').inherits;
const miio = require('miio');

var Accessory, PlatformAccessory, Service, Characteristic, UUIDGen;
irLearn = function(platform, config) {
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
    this.accessories['RemoteAccessory'] = new irLearnButton(this);
    var accessoriesArr = this.obj2array(this.accessories);
    
    this.platform.log.debug("[MiIRRemote][irLearn][DEBUG]Initializing learn: " + this.config["ip"] + ", accessories size: " + accessoriesArr.length);
    
    
    return accessoriesArr;
}
inherits(irLearn, Base);

irLearnButton = function(dThis) {
    this.device = dThis.device;
    this.name = "MiLearn";
    this.token = dThis.config['token'];
    this.platform = dThis.platform;
    this.updatetimere = false;
    this.timer;
    this.upt;
    this.irLearnService;
    this.timekey;
}

irLearnButton.prototype.getServices = function() {
    var that = this;
    var services = [];
    var tokensan = this.token.substring(this.token.length-8);
    var infoService = new Service.AccessoryInformation();
    infoService
        .setCharacteristic(Characteristic.Manufacturer, "XiaoMi")
        .setCharacteristic(Characteristic.Model, "ChuangMi IR Remote")
        .setCharacteristic(Characteristic.SerialNumber, tokensan);
    services.push(infoService);
    var irLearnButtonService = this.irLearnService = new Service.Switch(this.name);
    var irLearnButtonOnCharacteristic = irLearnButtonService.getCharacteristic(Characteristic.On);
    irLearnButtonOnCharacteristic
        .on('set',function(value, callback) {
            this.platform.log.info("[MiIRRemote][irLearn] Learn Started");
            if(value == true){
                this.updatetimere = true;
                this.upt = 5;
                this.updateTimer();
            }            
            callback(null);
        }.bind(this))
        .on('get', function(callback) {
            callback(null, false);
        }.bind(this))
        
    services.push(irLearnButtonService);
    return services;
}

irLearnButton.prototype.updateTimer = function() {
    if (this.updatetimere) {
        clearTimeout(this.timer);
        this.timer = setTimeout(function() {
            this.runTimer();
            this.updateTimer();
        }.bind(this), 1 * 1000);
    }
}

irLearnButton.prototype.runTimer = function() {
    var that = this;
    this.upt = this.upt - 1;
    if(this.upt <= 0){
        this.updatetimere = false;
        this.irLearnService.getCharacteristic(Characteristic.On).updateValue(false);
        that.platform.log.info("[MiIRRemote][irLearn] Learn Stopped");
    }else{
        this.timekey = "123456789012345";
        if(this.upt == 4){
            this.device.call("miIO.ir_learn", {"key":this.timekey}).then(result => {
                that.platform.log.info("[MiIRRemote][irLearn]irLearn Waiting...");
            }).catch(function(err) {
                if(err == "Error: Call to device timed out"){
                    that.platform.log.debug("[MiIRRemote][ERROR]irLearn - Remote Offline");
                }else{
                    that.platform.log.debug("[MiIRRemote][irLearn][ERROR] Error: " + err);
                }
            });
        }else{
            this.device.call("miIO.ir_read", {"key":this.timekey}).then(result => {
                if(result['code'] !== ""){
                    that.platform.log.info("[MiIRRemote][irLearn]Learned Code: " + result['code']);
                    this.updatetimere = false;
                    this.upt = 0;
                    this.irLearnService.getCharacteristic(Characteristic.On).updateValue(false);
                    that.platform.log.info("[MiIRRemote][irLearn] Learn Success!");
                }else{
                    that.platform.log.debug("[MiIRRemote][irLearn][DEBUG]Learn Waiting...");
                }
            }).catch(function(err) {
                if(err == "Error: Call to device timed out"){
                    that.platform.log.debug("[MiIRRemote][ERROR]irLearn - Remote Offline");
                }else{
                    that.platform.log.error("[MiIRRemote][irLearn][ERROR] Error: " + err);
                }
            });
        }
        that.platform.log.debug("[MiIRRemote][irLearn] " + this.upt + " Seconds left");
    }
}
