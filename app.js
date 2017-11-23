let game = new Phaser.Game(800,600,Phaser.AUTO,'',{preload:preload,create:create,update:update});

function preload(){
    game.load.image('sky', 'assets/sky.png');
    game.load.image('ground', 'assets/platform.png');
    game.load.image('star', 'assets/star.png');
    game.load.spritesheet('djurta','assets/djurtasheet.png',73,118);
    game.load.image('baljak','assets/baljak.png',112,162);
    game.load.image('bullet','assets/bullet.png');
    game.load.spritesheet('explosion','assets/explosion.png',64,64);
    game.load.audio('dsh',['audio/dsh.mp3','audio/dsh.ogg']);
    game.load.audio('boom',['audio/boom.mp3','audio/boom.ogg']);
}

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
    constructor(x,y,img,controller,collision){
        this.lives=__lives;

        this.sprite=game.add.sprite(x,y,img);
        game.physics.arcade.enable(this.sprite);
        this.sprite.body.bounce.y=0;
        this.sprite.body.gravity.y=600;
        this.sprite.body.collideWorldBounds=true;
        this.sprite.animations.add('fire',1,60,true);

        this.weapon=game.add.weapon(30,'bullet');
        this.weapon.bulletKillType=Phaser.Weapon.KILL_WORLD_BOUNDS;
        this.weapon.bulletSpeed=400;
        this.weapon.fireRate=400;
        this.weapon.bulletAngleOffset=90;
        this.weapon.trackSprite(this.sprite,14,60);

        this.img=img;

        this.score=new Score(16,16); //default score position, can change with static fields?

        this.controller=controller;

        if(collision)
            this.collision=collision;
        else
            this.collision=[];
    }
    update(){
        this.sprite.body.velocity.x = 0;
        if (this.controller.LEFT.isDown)
            this.sprite.body.velocity.x = -300;
        else if (this.controller.RIGHT.isDown)
            this.sprite.body.velocity.x = 300;

        for(let i=0;i<this.collision.length;i++){ // prolazimo kroz kolizione objekte
            if(this.collision[i].type==='ground'){
                game.physics.arcade.collide(this.sprite, this.collision[i].el);
                if (this.controller.JUMP.isDown && this.sprite.body.touching.down && this.collision[i].el)
                    this.sprite.body.velocity.y = -300;
            }
            if(this.collision[i].type==='bullet'){
                game.physics.arcade.collide(this.weapon.bullets,this.collision[i].el,(bullet,enemy)=>{
                    bullet.kill();
                    audio.boom.play();
                    this.score.increment();
                    utils.explode(enemy);
                });
            }
        }

        if(this.controller.FIRE.isDown){
            this.sprite.loadTexture(this.img,1);
            this.weapon.fire();
            audio.dsh.play();
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
function create(){
    game.physics.startSystem(Phaser.Physics.ARCADE);
    game.add.sprite(0,0,'sky');

    platforms=game.add.group();
    platforms.enableBody=true;

    enemies=game.add.group();
    enemies.enableBody=true;

    let ground = platforms.create(0,game.world.height-64,'ground');
    ground.scale.setTo(2,2);
    ground.body.immovable=true;

    players.push(new Player(
        32,
        game.world.height-300,
        'djurta',
        {
            LEFT:game.input.keyboard.addKey(Phaser.KeyCode.LEFT),
            RIGHT:game.input.keyboard.addKey(Phaser.KeyCode.RIGHT),
            JUMP:game.input.keyboard.addKey(Phaser.KeyCode.UP),
            FIRE:game.input.keyboard.addKey(Phaser.KeyCode.DOWN)
        }
    ));

    players.push(new Player(
        200,
        game.world.height-300,
        'djurta',
        {
            LEFT:game.input.keyboard.addKey(Phaser.KeyCode.A),
            RIGHT:game.input.keyboard.addKey(Phaser.KeyCode.D),
            JUMP:game.input.keyboard.addKey(Phaser.KeyCode.W),
            FIRE:game.input.keyboard.addKey(Phaser.KeyCode.S)
        }
    ));

    for(let i=0;i<players.length;i++){
        players[i].addCollision(platforms,'ground');
        players[i].addCollision(enemies,'bullet');
    }

    timer=game.time.create(false);
    timer.loop(1000,function(){
        return new Enemy('baljak');
    },this);
    timer.start();

    for(let key in audio)
        audio[key]=game.add.audio(key);
}
function update(){
    for(let i=0;i<players.length;i++)
        players[i].update();
    game.physics.arcade.collide(enemies, platforms,utils.explode);
}
function render(){
    game.debug.text(game.time.fps || '--', 2, 14, "#00ff00");
}