require('./Base');

const inherits = require('util').inherits;
const miio = require('miio');

var Accessory, PlatformAccessory, Service, Characteristic, UUIDGen;
MiProjector = function(platform, config) {
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
        this.accessories['ProjectorAccessory'] = new ProjectorService(this);
    }
    var accessoriesArr = this.obj2array(this.accessories);
    
    this.platform.log.debug("[MiIRRemote][DEBUG]Initializing " + this.config["type"] + " device: " + this.config["ip"] + ", accessories size: " + accessoriesArr.length);
    
    
    return accessoriesArr;
}
inherits(MiProjector, Base);

ProjectorService = function(dThis) {
    this.device = dThis.device;
    this.name = dThis.config['Name'];
    this.token = dThis.config['token'];
    this.data = dThis.config['data'];
    this.interval = dThis.config['interval'];
    if(!this.interval){
        this.interval = 1;
    }
    this.platform = dThis.platform;
    this.onoffstate = false;
}

ProjectorService.prototype.getServices = function() {
    var that = this;
    var services = [];
    var tokensan = this.token.substring(this.token.length-8);
    var infoService = new Service.AccessoryInformation();
    infoService
        .setCharacteristic(Characteristic.Manufacturer, "XiaoMi")
        .setCharacteristic(Characteristic.Model, "MiIRRemote-Projector")
        .setCharacteristic(Characteristic.SerialNumber, tokensan);
    services.push(infoService);   
    var ProjectorServices = new Service.Switch(this.name);
    var ProjectorServicesCharacteristic = ProjectorServices.getCharacteristic(Characteristic.On);
    ProjectorServicesCharacteristic
        .on('set',function(value, callback) {
            var onoff = value ? "on" : "off";
            this.onoffstate = value;
            if(!value){
                setTimeout(function() {  
                    this.device.call("miIO.ir_play", {"freq":38400,"code":this.data[onoff]}).then(result => {
                        that.platform.log.debug("[MiIRRemote][" + this.name + "]Projector: Second " + onoff);
                    }).catch(function(err) {
                        that.platform.log.error("[MiIRRemote][ERROR]Projector Error: " + err);
                    });
                }.bind(this), this.interval * 1000);
            }
            this.device.call("miIO.ir_play", {"freq":38400,"code":this.data[onoff]}).then(result => {
                that.platform.log.debug("[MiIRRemote][" + this.name + "]Projector: " + onoff);
                callback(null);
            }).catch(function(err) {
                that.platform.log.error("[MiIRRemote][ERROR]Projector Error: " + err);
                callback(err);
            });
        }.bind(this))
        .on('get', function(callback) {
            callback(null,this.onoffstate);
        }.bind(this))
        
    services.push(ProjectorServices);
    return services;
}