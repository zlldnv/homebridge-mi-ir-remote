var Service,Characteristic;

MiRemoteMomentarySwitch = function(platform, config) {
    this.platform = platform;
    this.config = config;

    this.platform.log.debug("[MomentarySwitch]Initializing MomentarySwitch: " + this.config["ip"]);
    
    return new MiRemoteMomentarySwitchService(this);
}

MiRemoteMomentarySwitchService = function(dThis) {
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
    this.SwitchStatus;
}

MiRemoteMomentarySwitchService.prototype.getServices = function() {
    var that = this;
    var services = [];
    var tokensan = this.token.substring(this.token.length-8);
    var infoService = new Service.AccessoryInformation();
    infoService
        .setCharacteristic(Characteristic.Manufacturer, "XiaoMi")
        .setCharacteristic(Characteristic.Model, "MiIRRemote-MomentarySwitch")
        .setCharacteristic(Characteristic.SerialNumber, tokensan);
    services.push(infoService);   
    var MiRemoteMomentarySwitchServices = this.SwitchStatus = new Service.Switch(this.name);
    var MiRemoteMomentarySwitchServicesCharacteristic = MiRemoteMomentarySwitchServices.getCharacteristic(Characteristic.On);
    MiRemoteMomentarySwitchServicesCharacteristic
        .on('set',function(value, callback) {
            try{
                if(value && this.readydevice){
                    var codedata = this.data;
                    that.device.call("miIO.ir_play", {"freq":38400,"code":codedata}).then(result => {
                        that.platform.log.debug("[" + that.name + "]MomentarySwitch: Turned On");
                        setTimeout(function() {
                            that.SwitchStatus.getCharacteristic(Characteristic.On).updateValue(false);
                            that.onoffstate = false;
                            that.platform.log.debug("[" + that.name + "]MomentarySwitch: Auto Turned Off");
                        },0.3 * 1000)
                        callback(null);
                    }).catch(function(err) {
                        that.platform.log.error("[" + that.name + "][Custom][ERROR] Error: " + err);
                        callback(err);
                    });
                }else{
                    setTimeout(function() {
                            that.SwitchStatus.getCharacteristic(Characteristic.On).updateValue(false);
                            that.onoffstate = false;
                            that.platform.log.info("[" + that.name + "]MomentarySwitch: Unready Turned Off");
                        },0.3 * 1000)
                    callback(null);
                }
            }catch(err) {
                that.platform.log.error("[" + this.name + "][ERROR]MomentarySwitch Error: " + err);
                callback(err);
            }
        }.bind(this))
        .on('get', function(callback) {
            callback(null,this.onoffstate);
        }.bind(this))
        
    services.push(MiRemoteMomentarySwitchServices);
    return services;
}