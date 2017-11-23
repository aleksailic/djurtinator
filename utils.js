let utils=(function(){
    let explode=function(el){
        let explosion=game.add.sprite(el.body.x,el.body.y,'explosion');
        explosion.animations.add('explode');
        explosion.animations.play('explode',60,false);
        el.kill();
    };

    return {
      explode
    };

})();