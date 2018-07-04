var Service,Characteristic;

MiRemoteSwitch = function(platform, config) {
    this.platform = platform;
    this.config = config;

    this.platform.log.debug("[MiRemoteSwitch]Initializing MiRemoteSwitch: " + this.config["ip"]);
    
    return new MiRemoteSwitchService(this);
}

MiRemoteSwitchService = function(dThis) {
    this.name = dThis.config['Name'];
    this.token = dThis.config['token'];
    this.data = dThis.config['data'];
    this.platform = dThis.platform;

    this.readydevice = false;
    var configarray = {
        address: dThis.config['ip'],
        token: dThis.config['token']
    };
    this.device = dThis.platform.getMiioDevice(configarray,this);
    
    Service = dThis.platform.HomebridgeAPI.hap.Service;
    Characteristic = dThis.platform.HomebridgeAPI.hap.Characteristic;

    this.onoffstate = false;
}

MiRemoteSwitchService.prototype.getServices = function() {
    var that = this;
    var services = [];
    var tokensan = this.token.substring(this.token.length-8);
    var infoService = new Service.AccessoryInformation();
    infoService
        .setCharacteristic(Characteristic.Manufacturer, "XiaoMi")
        .setCharacteristic(Characteristic.Model, "MiIRRemote-Switch")
        .setCharacteristic(Characteristic.SerialNumber, tokensan);
    services.push(infoService);   
    var MiRemoteSwitchServices = new Service.Switch(this.name);
    var MiRemoteSwitchServicesCharacteristic = MiRemoteSwitchServices.getCharacteristic(Characteristic.On);
    MiRemoteSwitchServicesCharacteristic
        .on('set',function(value, callback) {
            if(this.readydevice){
                var onoff = value ? "on" : "off";
                this.onoffstate = value;
                this.device.call("miIO.ir_play", {"freq":38400,"code":this.data[onoff]}).then(result => {
                    that.platform.log.debug("[MiIRRemote][" + this.name + "]Switch: " + onoff);
                    callback(null);
                }).catch(function(err) {
                    that.platform.log.error("[MiIRRemote][" + this.name + "][ERROR]Switch Error: " + err);
                    callback(err);
                });
            }else{
                that.platform.log.info("[" + this.name + "]Switch: Unready");
                callback(null);
            }
        }.bind(this))
        .on('get', function(callback) {
            callback(null,this.onoffstate);
        }.bind(this))
        
    services.push(MiRemoteSwitchServices);
    return services;
}