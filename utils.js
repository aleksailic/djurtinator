let utils=(function(){
    let explode=function(el){
        let explosion=game.add.sprite(el.body.x,el.body.y,'explosion');
        explosion.animations.add('explode');
        explosion.animations.play('explode',60,false);
        el.kill();
    };
    let once=function(seconds, callback) {
        let counter = 0;
        let time = window.setInterval( function () {
            counter++;
            if ( counter >= seconds ) {
                callback();
                window.clearInterval( time );
            }
        }, 10);
    };
    return {
      explode,
      once
    };

})();