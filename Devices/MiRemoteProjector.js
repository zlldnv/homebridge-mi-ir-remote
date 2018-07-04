var Service,Characteristic;

MiRemoteProjector = function(platform, config) {
    this.platform = platform;
    this.config = config;

    this.platform.log.debug("[MiRemoteProjector]Initializing MiRemoteProjector: " + this.config["ip"]);
    
    return new MiRemoteProjectorService(this);
}

MiRemoteProjectorService = function(dThis) {
    this.name = dThis.config['Name'];
    this.token = dThis.config['token'];
    this.data = dThis.config['data'];
    this.interval = dThis.config['interval'];

    this.readydevice = false;
    var configarray = {
        address: dThis.config['ip'],
        token: dThis.config['token']
    };
    this.device = dThis.platform.getMiioDevice(configarray,this);
    
    Service = dThis.platform.HomebridgeAPI.hap.Service;
    Characteristic = dThis.platform.HomebridgeAPI.hap.Characteristic;

    if(!this.interval){
        this.interval = 1;
    }
    this.platform = dThis.platform;
    this.onoffstate = false;
}

MiRemoteProjectorService.prototype.getServices = function() {
    var that = this;
    var services = [];
    var tokensan = this.token.substring(this.token.length-8);
    var infoService = new Service.AccessoryInformation();
    infoService
        .setCharacteristic(Characteristic.Manufacturer, "XiaoMi")
        .setCharacteristic(Characteristic.Model, "MiIRRemote-Projector")
        .setCharacteristic(Characteristic.SerialNumber, tokensan);
    services.push(infoService);   
    var MiRemoteProjectorServices = new Service.Switch(this.name);
    var MiRemoteProjectorServicesCharacteristic = MiRemoteProjectorServices.getCharacteristic(Characteristic.On);
    MiRemoteProjectorServicesCharacteristic
        .on('set',function(value, callback) {
            if(this.readydevice){
                var onoff = value ? "on" : "off";
                this.onoffstate = value;
                if(!value){
                    setTimeout(function() {  
                        this.device.call("miIO.ir_play", {"freq":38400,"code":this.data[onoff]}).then(result => {
                            that.platform.log.debug("[" + this.name + "]Projector: Second " + onoff);
                        }).catch(function(err) {
                            that.platform.log.error("[" + this.name + "][ERROR]Projector Error: " + err);
                        });
                    }.bind(this), this.interval * 1000);
                }
                this.device.call("miIO.ir_play", {"freq":38400,"code":this.data[onoff]}).then(result => {
                    that.platform.log.debug("[" + this.name + "]Projector: " + onoff);
                    callback(null);
                }).catch(function(err) {
                    that.platform.log.error("[" + this.name + "][ERROR]Projector Error: " + err);
                    callback(err);
                });
            }else{
                that.platform.log.info("[" + this.name + "]Projector: Unready");
                callback(null);
            }
        }.bind(this))
        .on('get', function(callback) {
            callback(null,this.onoffstate);
        }.bind(this))
        
    services.push(MiRemoteProjectorServices);
    return services;
}