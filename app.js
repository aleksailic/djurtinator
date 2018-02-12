let game = new Phaser.Game(800,600,Phaser.AUTO,'');

let slickUI;

let players=[
    {
        name:'djurta',
        weapon:{

        }
    },
    {
        name:'jafica',
        weapon:{
            scale:0.5
        }
    },
    {
        name:'smeki',
        weapon:{
            x:0,
            y:50,
            angularVelocity:400,
            scale:0.7
        }
    },
    {
        name:'baljak',
        weapon:{
	    x:40,
	    y:-20,
            scale:0.3
        }
    }
];
game.players=players;

let loadState={
    preload:function(){
        let loadingLabel=game.add.text(game.world.centerX,game.world.centerY,'loading...',
            {font:'30px Courier',fill:'#d2d2d2'});

        game.load.image('bg', 'assets/bg.png');
        game.load.image('ground', 'assets/platform.png');
        game.load.image('star', 'assets/star.png');

        game.load.image('baljakk','assets/baljakk.png',112,162);
        game.load.spritesheet('explosion','assets/explosion.png',64,64);

        game.load.audio('dsh',['audio/dsh.mp3','audio/dsh.ogg']);
        game.load.audio('boom',['audio/boom.mp3','audio/boom.ogg']);

        for(let i = 0;i<players.length;i++){
            let name = players[i].name;
            game.load.spritesheet(name,`assets/${name}.png`,100,200);
            game.load.image(`${name}_select`,`assets/${name}_select.jpg`);
            game.load.image(`${name}_bullet`,`assets/${name}_bullet.png`);
        }

    },
    create:function(){
        game.state.start('menu');
    }
};

let menuState={
    preload:function(){
        slickUI = game.plugins.add(Phaser.Plugin.SlickUI);
        slickUI.load('assets/keney/kenney.json');
    },
    create:function(){
        let panel = new SlickUI.Element.Panel(16, 16, game.width-32, game.height - 32)
        slickUI.add(panel);

        panel.add(new SlickUI.Element.Text(10,10, "Choose your player")).centerHorizontally().text.alpha = 0.5;
        let buttons=[];
        let margin=50;
        let w=168;
        let space_per_player=(game.width-2*margin)/players.length;
        let offset=(space_per_player-w)/2;

        for(let i =0; i<players.length;i++){
            let x=margin/2+offset+space_per_player*i;

            players[i].sprite=game.make.sprite(0,0,players[i].name+'_select');
            players[i].sprite.scale.setTo(0.6);
            panel.add(new SlickUI.Element.DisplayObject(x,70, players[i].sprite));

            let button;
            panel.add(button = new SlickUI.Element.Button(x,game.height - 150, w, 80)).events.onInputUp.add(function () {
                playState.player=players[i];
                game.state.start('play');
            });
            button.add(new SlickUI.Element.Text(0,0, players[i].name)).center();
            buttons.push({
                sprite:button
            });

        }
    }
};

let playState=(function(){
    let __lives=3;
    let __score_inc=10;
    let __score_offset=120;

    let timer;
    let enemies;
    let players=[];
    let platforms;
    let audio={
        dsh:null,
        boom:null
    };

    class Score{
        constructor(x,y,txt){
            this.value=0;
            if(!txt)
                this.txt="Score: ";
            else
                this.txt=txt;
            this.sprite=game.add.text(x+Score.offset, y, this.txt+this.value, { fontSize: '20px', fill: '#000' });
            Score.offset+=__score_offset;
        }
        increment(){
            this.value+=__score_inc;
            this.sprite.text=this.txt + this.value;
        }
    }
    Score.offset=0;
    class Player{
        //collision as array of collision obj
        //controller as obj with mapped LEFT,RIGHT,JUMP,FIRE
        // name same as img!
        constructor(x,y,obj,controller,collision){
            this.lives=__lives;

            this.sprite=game.add.sprite(x,y,obj.name);
            game.physics.arcade.enable(this.sprite);
            this.sprite.body.bounce.y=0;
            this.sprite.body.gravity.y=600;
            this.sprite.body.collideWorldBounds=true;
            this.sprite.scale.setTo(0.7);
            this.sprite.animations.add('fire',1,60,true);

            this.weapon=game.add.weapon(30,obj.name+'_bullet');
            this.weapon.bulletKillType=Phaser.Weapon.KILL_WORLD_BOUNDS;
            this.weapon.bulletSpeed=400;
            this.weapon.fireRate=400;
            this.weapon.bulletAngleOffset=90;

            this.weapon.trackSprite(this.sprite,obj.weapon.x || 22,obj.weapon.y || 30);
            this.weapon.bullets.setAll('scale.x', obj.weapon.scale || 1);
            this.weapon.bullets.setAll('scale.y', obj.weapon.scale || 1);
            this.weapon.bullets.setAll('body.angularVelocity',obj.weapon.angularVelocity || 500);

            this.img=obj.name;

            this.score=new Score(16,16); //default score position, can change with static fields?

            this.controller=controller;

            this.collision=collision || [];
        }
        update(){
            this.sprite.body.velocity.x = 0;
            if (this.controller.LEFT.isDown)
                this.sprite.body.velocity.x = -300;
            else if (this.controller.RIGHT.isDown)
                this.sprite.body.velocity.x = 300;

            for(let i=0;i<this.collision.length;i++) { // prolazimo kroz kolizione objekte
                if (this.collision[i].type === 'ground') {
                    game.physics.arcade.collide(this.sprite, this.collision[i].el);
                    if (this.controller.JUMP.isDown && this.sprite.body.touching.down && this.collision[i].el)
                        this.sprite.body.velocity.y = -300;
                }
                if (this.collision[i].type === 'bullet') {
                    game.physics.arcade.collide(this.weapon.bullets, this.collision[i].el, (bullet, enemy) => {
                        bullet.kill();
                        audio.boom.play();
                        this.score.increment();
                        utils.explode(enemy);
                    });
                }
            }
            if(this.controller.FIRE.isDown){
                this.oldTimestamp=this.oldTimestamp || 10; // mock value
                let newTimestamp=window.performance && window.performance.now && window.performance.timing && window.performance.timing.navigationStart ? window.performance.now() + window.performance.timing.navigationStart : Date.now();

                if((newTimestamp - this.oldTimestamp) >= this.weapon.fireRate ){
                    console.log(newTimestamp);
                    this.weapon.fire();
                    this.sprite.loadTexture(this.img,1);
                    audio.dsh.play();
                    this.oldTimestamp=newTimestamp;
                }
            }else
                this.sprite.loadTexture(this.img,0);


        }
        addCollision(el,type){
            this.collision.push({'el':el,'type':type});
        }
    }
    class Enemy{
        constructor(img){
            this.sprite=enemies.create(game.rnd.integerInRange(0, game.width),-200,img);
            let rand=game.rnd.realInRange(0.5,0.8);
            this.sprite.scale.setTo(rand, rand);
            game.physics.arcade.enable(this.sprite);
            this.sprite.body.gravity.y=game.rnd.integerInRange(0,150);
            this.sprite.body.velocity.y=game.rnd.integerInRange(0,300);
            this.sprite.body.velocity.x=game.rnd.integerInRange(-50,50);
        }
    }

    window.addEventListener("load",function(){
        document.getElementById("pl_add").addEventListener("click",function(){
            let sava=new Player(
                game.rnd.integerInRange(0, game.width),
                game.world.height-300,
                game.players[2],
                {
                    LEFT:game.input.keyboard.addKey(Phaser.KeyCode.A),
                    RIGHT:game.input.keyboard.addKey(Phaser.KeyCode.D),
                    JUMP:game.input.keyboard.addKey(Phaser.KeyCode.W),
                    FIRE:game.input.keyboard.addKey(Phaser.KeyCode.S)
                }
            );
            players.push(sava);
            sava.addCollision(platforms,'ground');
            sava.addCollision(enemies,'bullet');
        });
    });


    return{
    create:function(){
        game.physics.startSystem(Phaser.Physics.ARCADE);
        game.add.sprite(0,0,'bg');

        platforms=game.add.group();
        platforms.enableBody=true;

        enemies=game.add.group();
        enemies.enableBody=true;

        let ground = platforms.create(0,game.world.height-1,'ground');
        ground.scale.setTo(2,2);
        ground.body.immovable=true;

        players.push(new Player(
            32,
            game.world.height-300,
            playState.player,
            {
                LEFT:game.input.keyboard.addKey(Phaser.KeyCode.LEFT),
                RIGHT:game.input.keyboard.addKey(Phaser.KeyCode.RIGHT),
                JUMP:game.input.keyboard.addKey(Phaser.KeyCode.UP),
                FIRE:game.input.keyboard.addKey(Phaser.KeyCode.DOWN)
            }
        ));

        for(let i=0;i<players.length;i++){
            players[i].addCollision(platforms,'ground');
            players[i].addCollision(enemies,'bullet');
        }

        timer=game.time.create(false);
        timer.loop(1000,function(){
            return new Enemy('baljakk');
        },this);
        timer.start();

        for(let key in audio)
            audio[key]=game.add.audio(key);
    },
    update(){
        for(let i=0;i<players.length;i++)
            players[i].update();
        game.physics.arcade.collide(enemies, platforms,utils.explode);
    },
    render(){
        game.debug.text(game.time.fps || '--', 2, 14, "#00ff00");
    }
    };
})();



game.state.add('load',loadState);
game.state.add('menu',menuState);
game.state.add('play',playState);
game.state.start('load');