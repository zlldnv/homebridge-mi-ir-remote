require('./Base');

const inherits = require('util').inherits;
const miio = require('miio');

var Accessory, PlatformAccessory, Service, Characteristic, UUIDGen;
MiLight = function(platform, config) {
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
        this.accessories['LightAccessory'] = new LightService(this);
    }
    var accessoriesArr = this.obj2array(this.accessories);
    
    this.platform.log.debug("[MiIRRemote][DEBUG]Initializing " + this.config["type"] + " device: " + this.config["ip"] + ", accessories size: " + accessoriesArr.length);
    
    
    return accessoriesArr;
}
inherits(MiLight, Base);

LightService = function(dThis) {
    this.device = dThis.device;
    this.name = dThis.config['Name'];
    this.token = dThis.config['token'];
    this.data = dThis.config['data'];
    this.platform = dThis.platform;
    this.onoffstate = false;
    this.brightness = 100;
}

LightService.prototype.getServices = function() {
    var that = this;
    var services = [];
    var tokensan = this.token.substring(this.token.length-8);
    var infoService = new Service.AccessoryInformation();
    infoService
        .setCharacteristic(Characteristic.Manufacturer, "XiaoMi")
        .setCharacteristic(Characteristic.Model, "MiIRRemote-Light")
        .setCharacteristic(Characteristic.SerialNumber, tokensan);
    services.push(infoService);   
    var LightServices = new Service.Lightbulb(this.name);
    var LightServicesCharacteristic = LightServices.getCharacteristic(Characteristic.On);
    LightServicesCharacteristic
        .on('set',function(value, callback) {
            if(this.onoffstate == "on" && value){
                that.platform.log.debug("[MiIRRemote][" + this.name + "]Light: Already On");
                callback(null);
            }else if(this.onoffstate == "off" && value){
                this.onoffstate = value ? "on" : "off";
                this.device.call("miIO.ir_play", {"freq":38400,"code":this.data["100"]}).then(result => {
                    that.platform.log.debug("[MiIRRemote][" + this.name + "]Light: 100");
                    callback(null);
                }).catch(function(err) {
                    that.platform.log.error("[MiIRRemote][ERROR]Light Error: " + err);
                    callback(err);
                });
            }else{   
                this.onoffstate = value ? "on" : "off";
                this.device.call("miIO.ir_play", {"freq":38400,"code":this.data["off"]}).then(result => {
                    that.platform.log.debug("[MiIRRemote][" + this.name + "]Light: Off");
                    callback(null);
                }).catch(function(err) {
                    that.platform.log.error("[MiIRRemote][ERROR]Light Error: " + err);
                    callback(err);
                });
            }
        }.bind(this))
        .on('get', function(callback) {
            callback(null,this.onoffstate);
        }.bind(this))
    LightServices
        .addCharacteristic(Characteristic.Brightness)
        .on('get', function(callback) {
            callback(null, this.brightness);
        }.bind(this))
        .on('set', function(value, callback) {
            var brightne;
            if(this.data[value]){
                this.brightness = brightne = value;
            }else if(value == 0){
                this.brightness = 0;
                brightne = "off";
            }else{
                var min = 0;
                var max = 100;
                for(var i = value; i > 0; i--) {
                    if(this.data[i]){
                        min = i;
                        i = -1;
                    }
                }
                for(var i = value; i <= 100; i++) {
                    if(this.data[i]){
                        max = i;
                        i = 101;
                    }
                }
                if(min > 0 && max < 100){
                    vmin = value - min;
                    vmax = max - value;
                    if(vmin > vmax){
                        this.brightness = brightne = min;
                    }else{
                        this.brightness = brightne = max;
                    }
                    that.platform.log.error("[MiIRRemote][" + this.name + "]Light: Illegal Brightness, Unisset: " + value + " Use " + brightne + " instead"); 
                }else{ 
                    this.brightness = brightne = 100;
                    that.platform.log.error("[MiIRRemote][" + this.name + "]Light: Illegal Brightness, Unisset: " + value + " Use " + brightne + " instead");      
                }
            }
            this.device.call("miIO.ir_play", {"freq":38400,"code":this.data[brightne]}).then(result => { 
                that.platform.log.debug("[MiIRRemote][" + this.name + "]Light: Set to " + this.brightness);
                callback(null, this.brightness);
            }).catch(function(err) {
                that.platform.log.error("[MiIRRemote][ERROR]Light Error: " + err);
                callback(err);
            });
        }.bind(this));
    
    services.push(LightServices);
    return services;
}