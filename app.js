let game = new Phaser.Game(400,600,Phaser.AUTO,'',{preload:preload,create:create,update:update});
let platforms;

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
let player;
let cursors;
let firebtn;
let weapon;
let timer;
let enemies;
let lives;
let score=0;
let scoreText;

let audio={
    dsh:null,
    boom:null
};
function create(){
    lives=3;
    game.physics.startSystem(Phaser.Physics.ARCADE);
    game.add.sprite(0,0,'sky');
    platforms=game.add.group();
    platforms.enableBody=true;

    enemies=game.add.group();
    enemies.enableBody=true;

    let ground = platforms.create(0,game.world.height-64,'ground');
    ground.scale.setTo(2,2);
    ground.body.immovable=true;

    player=game.add.sprite(32,game.world.height-300,'djurta');
    game.physics.arcade.enable(player);
    player.body.bounce.y=0;
    player.body.gravity.y=600;
    player.body.collideWorldBounds=true;
    player.animations.add('fire',1,60,true);

    cursors = game.input.keyboard.createCursorKeys();
    firebtn = game.input.keyboard.addKey(Phaser.KeyCode.SPACEBAR);

    weapon=game.add.weapon(30,'bullet');
    weapon.bulletKillType=Phaser.Weapon.KILL_WORLD_BOUNDS;
    weapon.bulletSpeed=400;
    weapon.fireRate=400;
    weapon.bulletAngleOffset=90;
    weapon.trackSprite(player,14,60);

    timer=game.time.create(false);
    timer.loop(1000,updateBaljak,this);
    timer.start();

    scoreText = game.add.text(16, 16, 'score: 0', { fontSize: '20px', fill: '#000' });
    for(let key in audio)
        audio[key]=game.add.audio(key);
}
function updateBaljak(){
    let baljak=enemies.create(game.rnd.integerInRange(0, game.width),-200,'baljak');
    let rand=game.rnd.realInRange(0.5,0.8);
    baljak.scale.setTo(rand, rand);
    game.physics.arcade.enable(baljak);
    baljak.body.gravity.y=game.rnd.integerInRange(0,150);
    baljak.body.velocity.y=game.rnd.integerInRange(0,300);
    baljak.body.velocity.x=game.rnd.integerInRange(-50,50);

}
function explode(el){
    let explosion=game.add.sprite(el.body.x,el.body.y,'explosion');
    explosion.animations.add('explode');
    explosion.animations.play('explode',60,false);
    el.destroy();
}
function update(){
    let hitPlatform=game.physics.arcade.collide(player, platforms);
    game.physics.arcade.collide(enemies, platforms,explode);

    player.body.velocity.x = 0;
    if (cursors.left.isDown)
        player.body.velocity.x = -300;
    else if (cursors.right.isDown)
        player.body.velocity.x = 300;
    if (cursors.up.isDown && player.body.touching.down && hitPlatform)
        player.body.velocity.y = -300;
    if(firebtn.isDown){
        player.loadTexture('djurta',1);
        weapon.fire();
        audio.dsh.play();
    }else
        player.loadTexture('djurta',0);

    game.physics.arcade.collide(weapon.bullets,enemies,function(bullet,enemy){
        bullet.kill();
        audio.boom.play();
        score += 10;
        scoreText.text = 'Score: ' + score;
        explode(enemy);
    });
}
function render(){
    weapon.debug();
}