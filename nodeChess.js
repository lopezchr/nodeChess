//set main namespace
goog.provide('nodeChess');


//get requirements
goog.require('lime.Director');
goog.require('lime.Scene');
goog.require('lime.Layer');
goog.require('lime.Circle');
goog.require('lime.Label');
goog.require('lime.animation.Spawn');
goog.require('lime.animation.FadeTo');
goog.require('lime.animation.ScaleTo');
goog.require('lime.animation.MoveTo');


var connection;
// entrypoint
nodeChess.start = function(){


	var director = new lime.Director(document.body,1200,800),
	    scene = new lime.Scene();

    //drawing the table
    var imgtable = new lime.Sprite().setFill('assets/table.png');
    var wbtable = new lime.Layer().setPosition(600,400);
    wbtable.appendChild(imgtable);

    scene.appendChild(wbtable);


    //positioning the figures
    var corx = 50;
    var cory = 50;

    for (var i = 0; i < 32; i++) {
        if(i === 8){
            cory = 150;
            corx = 50
        }else if(i === 16){
            cory = 650;
            corx = 50
        }else if(i === 24){
            cory = 750;
            corx = 50
        }

        //adding figures to the table
        var url;

        if(i===0 || i === 7){url = 'assets/btowel.png';}
        else if(i===1 || i === 6){url = 'assets/bhorse.png';}
        else if(i===2 || i === 5){url = 'assets/bbishop.png';}
        else if(i===3){url = 'assets/bking.png';}
        else if(i===4){url = 'assets/bqueen.png';}
        else if(i >7 && i < 16){url = 'assets/bpeon.png';}
        else if(i > 15 && i < 24){url = 'assets/wpeon.png';}
        else if(i===24 || i === 31){url = 'assets/wtowel.png';}
        else if(i===25 || i === 30){url = 'assets/whorse.png';}
        else if(i===26 || i === 29){url = 'assets/wbishop.png';}
        else if(i===27){url = 'assets/wking.png';}
        else if(i===28){url = 'assets/wqueen.png';}

        var img = new lime.Sprite().setFill(url);
        var fig = new lime.Layer().setPosition(corx+200,cory);
        fig.appendChild(img);
        
        scene.appendChild(fig)

        //adding the listener to the figure
        goog.events.listen(fig,['mousedown','touchstart'],function(e){

                setNewPosition(e);
            
        });

        corx = corx + 100;
    };


	director.makeMobileWebAppCapable();

	// set current scene active
	director.replaceScene(scene);

    /*
    *   CONECTION TO THE WEBSOCKET SERVER
    *
    */
    window.WebSocket = window.WebSocket || window.MozWebSocket;

    // if browser doesn't support WebSocket, just show some notification and exit
    if (!window.WebSocket) {
        content.html($('<p>', { text: 'Disculpe. Su navegador no es compatible con WebSockets'} ));
        input.hide();
        $('span').hide();
        return;
    }

    connection = new WebSocket('ws://192.168.10.55:1338');

    connection.onopen = function () {
        // first we want users to enter their names
        console.log("Conexion Aceptada");
    };

    connection.onerror = function (error) {
        // just in there were some problems with conenction...
        console.log('Conenxion rechazada');
        alert("Conexion No realizada. Intentelo mas tarde");
    };

    connection.onmessage = function (message) {
        try {
            var json = JSON.parse(message.data);
        } catch (e) {
            console.log('This doesn\'t look like a valid JSON: ', message.data);
            return;
        }

        var ary = (json.data).split('@#');

        var target = scene.getChildAt(ary[0]);

        target.runAction(new lime.animation.Spawn(
            new lime.animation.FadeTo(1),
            new lime.animation.ScaleTo(1),
            new lime.animation.MoveTo(ary[1],ary[2])
        ).setDuration(.5));

        validateEat(ary[1],ary[2],scene);

    };

    /*
    *
    *
    */

}

var prvXpos;
var prvYpos;

function setNewPosition(e){

    prvXpos = e.target.getPosition().x;
    prvYpos = e.target.getPosition().y;

    e.startDrag();

    e.swallow(['mouseup','touchend'],function(){

        var xpos = Math.round((e.target.getPosition().x - 50)/100)*100 +50;
        var ypos = Math.round((e.target.getPosition().y - 50)/100)*100 +50;

        e.target.runAction(new lime.animation.Spawn(
            new lime.animation.FadeTo(1),
            new lime.animation.ScaleTo(1),
            new lime.animation.MoveTo(xpos,ypos)
        ).setDuration(.5));

        var index = e.target.getParent().getChildIndex(e.target);
        connection.send(index+"@#"+xpos+'@#'+ypos);

        validateEat(xpos,ypos,e.target.getParent());

    });
}

function validateEat(xpos,ypos,parent){

    for (var i = 0; i < parent.getNumberOfChildren(); i++) {

        var fig = parent.getChildAt(i);

        var xfigpos = fig.getPosition().x;
        var yfigpos = fig.getPosition().y;

        if(xfigpos == xpos && yfigpos == ypos){
            putIntoGrav(i,parent);
        }
    };
}

function putIntoGrav(index,parent){
    
    var figure = parent.getChildAt(index);
    var xgrav = 50;
    var ygrav = 50;

    var incr = 0;


    //validating color of the figure to incriment de x position of the grav
    if(index > 16){
        incr = 1000;
    }

    for (var j = 0; j < 16; j++) {

        //move the cursor t
        if(j==8){
            ygrav = 50;
            xgrav = 150;
        }

        var token = false;
        //serch for a figure in the grav position
        for (var i = 0; i < parent.getNumberOfChildren(); i++) {

            var fig = parent.getChildAt(i);

            var xfigpos = fig.getPosition().x;
            var yfigpos = fig.getPosition().y;

            if(xfigpos == xgrav+incr && yfigpos == ygrav ){
                token = true;
                break;
            }
        };

        if(token === false){

            figure.runAction(new lime.animation.Spawn(
                new lime.animation.FadeTo(1),
                new lime.animation.ScaleTo(1),
                new lime.animation.MoveTo(xgrav + incr ,ygrav)
            ).setDuration(.5));
            break;

        }else{
            ygrav = ygrav + 100;
        }
    };
    
}

//this is required for outside access after code is compiled in ADVANCED_COMPILATIONS mode
goog.exportSymbol('nodeChess.start', nodeChess.start);
