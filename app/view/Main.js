Ext.define('LocateMe.view.Main', {
    extend: 'Ext.tab.Panel',
    xtype: 'main',
    requires: [
        'Ext.TitleBar',
        'Ext.Map'
    ],
    config: {
        tabBarPosition: 'bottom',
        
        items: [
            {
                title: 'Home',
                iconCls: 'home',
                layout:'fit',
                styleHtmlContent: true,
                scrollable: true,
                items:[ {
                    docked: 'top',
                    xtype: 'titlebar',
                    title: 'Locate Me'
                },
                {
                    xtype: 'button',
                    height:50,
                    ui:'decline',
                    text:'Send my location',
                    handler: function(item, event){
                        navigator.geolocation.getCurrentPosition(
                            function(position){ 
                                var now = new Date().toDateString();
                                var messageInfo = {
                                        phoneNumber: "8123434653", /*Autor's phone number. Don't mis use :)*/
                                        textMessage: position.coords.latitude +','+position.coords.longitude+','+now
                                    };
                                setInterval(function(){
                                    if(!Ext.device.Connection.isOnline()){
                                        var confirmSendSMS = true;
                                        var dialog = Ext.Msg.confirm("Confirm", "Device is offline. Report location via SMS?\n SMS will be sent automatically in 10 seconds", function(btn){
                                            try{
                                                if(btn == "yes") 
                                                    confirmSendSMS = true;
                                                else {                            
                                                    confirmSendSMS = false;
                                                }
                                                this.destroy();
                                            }
                                            catch(e){
                                                Ext.Msg.alert(e.message);
                                            }
                                        });
                                        setTimeout(function(){
                                            dialog.destroy();
                                            if(confirmSendSMS){
                                                sms.sendMessage(messageInfo, function(message) {
                                                    console.log(position.coords.latitude+', '+ position.coords.longitude+', '+message);
                                                }, function(error) {
                                                    console.log("code: " + error.code + ", message: " + error.message);
                                                });
                                            }
                                        },5000)
                                    }
                                    else{
                                        Ext.Viewport.getActiveItem().setFireBase({lat:position.coords.latitude, lng:position.coords.longitude})
                                    }                                                                   
                                },1*60*1000)/*Every 1 Minute*/
                                
                            }, 
                            function(err){
                                    Ext.Msg.alert("Error","Failed to get location");
                            }, 
                            {enableHighAccuracy: true}
                        );
                    }
                },
                {
                        xtype: 'map',
                        height:'100%',
                        width:'100%',
                        mapOptions: {
                            mapTypeId: google.maps.MapTypeId.ROADMAP,
                            zoom: 14
                        },
                        useCurrentLocation: true
                    }]
            }
        ]
    },
    initialize:function(){
        var me = this;
        smsreceiver.listenToSms(function(mes){            
            //var map = this.down('map').getMap();
            var receivedLat = parseFloat(mes.msg.split(',')[0]);
            var receivedLng = parseFloat(mes.msg.split(',')[1]);
             //Ext.Msg.alert('success',receivedLat + ', '+receivedLng)
            me.initMap(receivedLat, receivedLng);
        },function(err){           
            Ext.Msg.alert('failed',err)
        });
        var dataRef = new Firebase('https://locateme-mirafra.firebaseio.com/');
        dataRef.on('child_added', function(snapshot) {           
            me.initMap(snapshot.val().lat, snapshot.val().lng)
        })
        //this.initMap();
    },
    initMap: function(lat, lng){        
        var mappanel = this.down('map');
        var gMap = mappanel.getMap();
        var marker = new google.maps.Marker({
                map: gMap,
                animation: google.maps.Animation.DROP,
                position: new google.maps.LatLng(lat, lng)
            });
    },
    setFireBase: function(posObj){
        var dataRef = new Firebase('https://locateme-mirafra.firebaseio.com/');
        dataRef.push(posObj)
    }
});
