var version ='0.0.1';
var is_playing = false; 
 
 
init();

function init()
{
	background_canvas = document.getElementById('background_canvas');
	background_ctx = background_canvas.getContext('2d');
	main_canvas = document.getElementById('main_canvas');
	main_ctx = main_canvas.getContext('2d');

	// wenn Taste gedrueckt
	document.addEventListener('keydown', key_down, false);
	document.addEventListener('keyup', key_up, false);
  
	// Spielfeld neu laden
	requestaframe = (function() {
                  return window.requestAnimationFrame   ||
                  window.webkitRequestAnimationFrame    ||
                  window.mozReuestAnimationFrame        ||
                  window.oRequestAnimationFrame         ||
                  window.msRequestAnimationFrame        ||
                  function (callback) {
                    window.setTimeout(callback, 1000 / 60) // 60 Bilder pro Sekunde
                  };
	})();
  

	
	load_media();
	buttons_drawX = new Array();
	buttons_drawY = new Array();
	buttons_width = new Array();
	buttons_height = new Array();
	buttons_status = new Array();
	
	is_menu = true;
	menu_status = 'main';
	
	//bg_sprite.addEventListener('load', start_loop, false); // wenn Background-Bild geladen oeffne start_loop
	bg_sound.addEventListener('loadeddata', start_loop, false);

}

// Klasse
function Player()
{
	// Variablen mit this.
	
	// Daten Spieler
	this.life = 100;
	this.drawX = 200;  // Startkoordinate
	this.drawY = 520;
	this.srcX = 0;	  // Koordinate in Bilderdatei
	this.srcY = 0;
	this.width = 60;  // Breite
	this.height = 67;
	
	this.speed = 20; 
	
	this.is_upkey = false;
	this.is_leftkey = false;
	this.is_rightkey = false;
	
	this.shoot_wait = 0; // warten bis spieler wieder schiessen darf, kein durchfeuern moeglich
	
	this.is_dead = false ;
	this.explode_wait = 0;
}

// Funktion der Klasse Player
Player.prototype.draw = function()
{
	if(this.is_dead == false)
	{
		this.check_keys();
		// hinteren zwei geben Verzerrung an
		main_ctx.drawImage(main_sprite, this.srcX, this.srcY, this.width, this.height, this.drawX, this.drawY, this.width, this.height);
		
		if(this.life <= 0)
		{
			this.is_dead = true; 
			this.explode_wait = 50; // gibt Zein an, die Explosion angezeigt wird 
		}
	}
	else if(this.explode_wait > 0) // explodiert gerade
	{
		main_ctx.drawImage(main_sprite, this.srcX_exploded, this.srcY_exploded, this.width_exploded, this.height_exploded, this.drawX, this.drawY, this.width_exploded, this.height_exploded);
		this.explode_wait--;
	}
	else
	{
		is_menu = true;
		menu_status = "game_over";
	}
};

Player.prototype.check_keys = function()
{
	if(this.is_upkey == true && this.shoot_wait < 0)
	{
		bullets[bullets.length] = new Bullet(this.drawX + this.width, this.drawY, true);
		this.shoot_wait = 20;
	}
	else
	{
		this.shoot_wait--;
	}
	
	if(this.is_leftkey == true)
	{
		this.drawX -= this.speed;
	}
	if(this.is_rightkey == true)
	{
		this.drawX += this.speed;
	}
};

function check_wave()
{
	if(spawned_enemies == dead_enemies) // erstellte = getoetete Gegner
	{
		if(is_timeout)
		{
			main_ctx.fillStyle = "black";
			main_ctx.globalAlpha = 0.7; // Transparenz 
			main_ctx.fillRect(800/2 - 300/2, 600/2 - 100/2, 300, 100);
			main_ctx.globalAlpha = 1;
			main_ctx.fillStyle = "white";
			main_ctx.textAlign = "center";
			main_ctx.textBaseline = "middle";
			main_ctx.font = "50px Arial";
			main_ctx.fillText("Next Level!", 800/2, 600/2);
		}
		else
		{
			is_timeout = true;
			if(spawned_enemies == 0) // Levelanzeige am Angang unterbinden
			{
				wave++;
				spawn_enemy(wave);
				is_timeout = false;
			}
			else
			{
				window.setTimeout(function() {wave++; spawn_enemy(wave); is_timeout = false;}, 2000); // Zeit in Millesekunden, davor Funktion die aufgerufnen wird
			}
		}
	}
}


function Enemy()
{
	this.life = 30;
	this.drawX = -400 + Math.round(Math.random()*300); // Startwert fuer Gegner ist links vom Spielfeld
	this.drawY = Math.round(Math.random()*400);
	this.srcX = 60;
	this.srcY = 0;
	this.width = 61;
	this.height = 67;
	this.speed = 2 + Math.random() * 2; 
	this.is_dead = false;
	this.exploade_wait = 0;
	this.srcX_exploded = 0;
	this.srcY_exploded = 0;
	this.width_exploded = 121;
	this.height_exploded = 67;
}

Enemy.prototype.draw = function()
{
	if(this.is_dead == false)
	{
		this.ai();
		main_ctx.drawImage(main_sprite, this.srcX, this.srcY, this.width, this.height, this.drawX, this.drawY, this.width, this.height);
	
		
		// leben grafisch darstellen
		main_ctx.fillStyle = "yellow";
		main_ctx.fillRect(this.drawX, this.drawY, 60, 10);
		
		main_ctx.fillStyle = "red";
		main_ctx.fillRect(this.drawX, this.drawY +1 , this.life/30*60, 8);
		
		// wenn gegner getoetet
		if(this.life <= 0)
		{
			dead_enemies++;
			this.is_dead = true;
			this.explode_wait = 50;
			score += 10;
		}
	}
	else if(this.explode_wait > 0) // explodiert gerade
	{
		main_ctx.drawImage(main_sprite, this.srcX_exploded, this.srcY_exploded, this.width_exploded, this.height_exploded, this.drawX, this.drawY, this.width_exploded, this.height_exploded);
		this.explode_wait--;
	}
};

// Kuenstliche Intelligenz 
Enemy.prototype.ai = function()
{
	this.drawX += this.speed;
	if(this.drawX > 800)
	{
		this.drawX = -this.width;
	}
	
	// Schiessen
	if(Math.round(Math.random()*200) == 50)
	{
		bullets[bullets.length] = new Bullet(this.drawX, this.drawY);
	}
	
};

// Gegner erstellen
function spawn_enemy(n)
{
	spawned_enemies += n;
	for(var i = 0; i < n; i++)
	{
		enemies[enemies.length] = new Enemy();
	}
}

function Bullet(x, y, is_player)
{
	if(is_player == true)
	{
		this.is_player = true;
	}
	else
	{
		this.is_player = false;
	}


	this.drawX = x;
	this.drawY = y;
	this.srcX = 0;
	this.srcY = 0;
	this.width = 10;
	this.height = 10;
	this.speed = 4; 
	
	this.exploded = false;
	this.srcX_exploded = 0;
	this.srcY_exploded = 50;
	this.width_exploded = 10;
	this.height_exploded = 10;
	
	this.wait = 0; // wie lange ist Explosion sichtbar
	

}

Bullet.prototype.draw = function()
{
	if(this.exploded == false) // explodiert gerade
	{
		main_ctx.drawImage(main_sprite, this.srcX, this.srcY, this.width, this.height, this.drawX, this.drawY, this.width, this.height);
	}
	
	if(this.exploded == false)
	{
		if(this.is_player)
		{
			this.drawY -= this.speed;
		}
		else
		{
			this.drawY += this.speed;
		}
		
	}
	
	// falls player getroffen
	if (this.is_player == false && this.drawX <= player.drawX + player.width && this.drawX + this.width >= player.drawX && this.drawY <= player.drawY + player.height && this.drawY + this.height >= player.drawY && this.exploded == false)
    {
    	player.life -= 10;
    	this.exploded = true;
    	this.wait = 50;
    }
    
    //falls player geschossen hat
    if(this.is_player == true)
    {
    	for(var i = 0; i < enemies.length; i++)
    	{
			if(this.drawX <= enemies[i].drawX + enemies[i].width && this.drawX + this.width >= enemies[i].drawX && this.drawY <= enemies[i].drawY + enemies[i].height && this.drawY + this.height >= enemies[i].drawY && this.exploded == false && enemies[i].is_dead == false)
    		{
    			this.exploded = true;
    			this.wait = 50;
    			enemies[i].life -= 10;
				score += 1;
    		}
    	}
    }
    
    if (this.exploded == true && this.wait > 0)
    {
		main_ctx.drawImage(main_sprite, this.srcX_exploded, this.srcY_exploded, this.width_exploded, this.height_exploded, this.drawX, this.drawY, this.width_exploded*5, this.height_exploded*5);
		this.wait--;
   	}

}


function load_media()
{
	bg_sprite = new Image();
	bg_sprite.src = 'images/bg_sprite.png';
	main_sprite = new Image();
	main_sprite.src = 'images/main_sprite.png';
	

	bg_sound = new Audio();
	bg_sound.autobuffer = true;
	if (bg_sound.canPlayType('audio/mpeg;')) 
	{
		bg_sound.type= 'audio/mpeg';
		bg_sound.src= 'sounds/background.mp3';
	}
	else 
	{
		bg_sound.type= 'audio/x-wav';
		bg_sound.src= 'sounds/background.wav';
	}
	
	


	


}

function menu()
{
	main_menu_buttons = new Array("New Game", "Options", "Credits");
	pause_menu_buttons = new Array("Return", "New Game", "Options");
	game_over_buttons = main_menu_buttons;
	
	if(menu_status == "main")
	{
		var menu_buttons = main_menu_buttons;
	}
	else if(menu_status == "pause")
	{
		var menu_buttons = pause_menu_buttons;
	}
	else if(menu_status == "game_over")
	{
		var menu_buttons = game_over_buttons;
	}
	
	if(menu_status == "game_over")
	{
		main_ctx.textBaseline = "middle";
		main_ctx.textAlign = "center";
		main_ctx.font = "50px Arial";
		main_ctx.fillStyle = "red";
		main_ctx.fillText("Game over!", 800/2, 50);
		
		main_ctx.textBaseline = "middle";
		main_ctx.textAlign = "center";
		main_ctx.font = "30px Arial";
		main_ctx.fillStyle = "blue";
		main_ctx.fillText("Level: " + wave + " Score: " + score, 800/2, 400);
	}
	
	for(var i = 0; i < menu_buttons.length; i++)
	{
		var drawX = 350;
		var drawY = 100 + i*100;
		var height = 50;
		var width = 100;
		var srcY = 0;
		
		if(buttons_status[i] == undefined) // falls Array leer
		{
			buttons_status[i] = "normal";
			buttons_drawX[i] = drawX;
			buttons_drawY[i] = drawY;
			buttons_height[i] = height;
			buttons_width[i] = width;
		}
		
		if(buttons_status[i] == "click")
		{
			if(i == 0 && menu_status == "main" || i == 1 && menu_status == "pause" || i == 0 && menu_status == "game_over")
			{
				new_game();
			}
			if(i == 0 && menu_status == "pause")
			{
				is_menu = false;
			}
			buttons_status[i] = "hover";
		}
		
		if(buttons_status[i] == "hover")
		{
			srcY += 10;
		}
		
		main_ctx.drawImage(main_sprite, 0,srcY ,100 ,50 , drawX, drawY, width, height);
		main_ctx.fillStyle = 'red';
		main_ctx.font = '18px Arial';
		main_ctx.textAlign = 'center'; // Text horizontal zentrieren
		main_ctx.textBaseline = 'middle'; // Text vertikal zentrieren
		main_ctx.fillText(menu_buttons[i], drawX + width/2 , drawY + height/2);
	}
	background_ctx.drawImage(bg_sprite, 0, 0, 800, 600, 0, 0, 800, 600); 
}

function mouse(type, e)
{
	var x = e.pageX - document.getElementById('game_object').offsetLeft;
	var y = e.pageY - document.getElementById('game_object').offsetTop;
	
	for(var i = 0; i < buttons_status.length; i++)
	{
		if (x <= buttons_drawX[i] + buttons_width[i] && x >= buttons_drawX[i] && y <= buttons_drawY[i] + buttons_height[i] && y >= buttons_drawY[i])
		{
			if(type == "move")
			{
				buttons_status[i] = "hover";
			}
			else
			{
				buttons_status[i] = "click";
			}
		}
		else
		{
			buttons_status[i] = "normal";
		}
	}
	
}


function loop()
{	
	main_ctx.clearRect(0, 0, 800, 600);
	
	if(bg_sound.currentTime == 0);
	{
		bg_sound.volume = 1;
		bg_sound.play();
	}
	
	if(is_menu == false)
	{
		background_ctx.drawImage(bg_sprite, 0, 0);
		player.draw();
		for(var i = 0; i < enemies.length; i++)
		{
			enemies[i].draw();
		}
		for(var i = 0; i < bullets.length; i++)
		{
			bullets[i].draw();
		}
		
		// Lebensausgabe
		main_ctx.fillStyle = 'grey';
		main_ctx.font = '40px Arial';
		main_ctx.textAlign = 'left';
		main_ctx.textBaseline = 'top';
		main_ctx.fillText("Life: " + player.life, 0,0);
		
		main_ctx.fillStyle = 'grey';
		main_ctx.font = '40px Arial';
		main_ctx.textAlign = 'right';
		main_ctx.textBaseline = 'top';
		main_ctx.fillText("Level: " + wave, 800,0);
		
		main_ctx.fillStyle = 'grey';
		main_ctx.font = '30px Arial';
		main_ctx.textAlign = 'left';
		main_ctx.textBaseline = 'bottom';
		main_ctx.fillText("Score: " + score, 0,600);
		
		check_wave();
	}
	else
	{
		menu();
	}
  
	if(is_playing)
	{
		requestaframe(loop);
	}
}

function new_game()
{
	player = new Player();
	enemies = new Array(); 
	bullets = new Array();
	
	dead_enemies = 0;
	spawned_enemies = 0;
	wave = 0; // gibt Level an
	is_timeout = false;
	score = 0;
	
	is_menu = false;
}


function start_loop()
{
	is_playing = true;
	loop();

}

function stop_loop()
{
	is_playing = false;
}

function key_down(e)
{
	var key_id = e.keyCode || e.which;

	if (key_id == 38) // up key
	{
		player.is_upkey = true;
		e.preventDefault(); // Scrollen verhindern
	}
	if (key_id == 37) // left key
	{
		player.is_leftkey = true;
		e.preventDefault(); // Scrollen verhindern
	}
	if (key_id == 39) // right key
	{
		player.is_rightkey = true;
		e.preventDefault(); // Scrollen verhindern
	}
	if(key_id == 27 || key_id == 80) // esc key oder p key
	{
		is_menu = true;
		menu_status = 'pause';
		e.preventDefault(); // Scrollen verhindern
	}
}

function key_up(e)
{
	var key_id = e.keyCode || e.which;
	if (key_id == 38) // up key
	{
		player.is_upkey = false;
		e.preventDefault(); // Scrollen verhindern
	}
	if (key_id == 37) // left key
	{
		player.is_leftkey = false;
		e.preventDefault(); // Scrollen verhindern
	}
	if (key_id == 39) // right key
	{
		player.is_rightkey = false;
		e.preventDefault(); // Scrollen verhindern
	}
}