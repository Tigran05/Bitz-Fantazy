/*:
 * @plugindesc v4.0 Touch-first lockpicking. One-finger control, no Enter required.
 * @author OpenAI
 *
 * @param Default Difficulty
 * @type number
 * @min 1
 * @max 10
 * @default 5
 *
 * @param Success Switch
 * @type switch
 * @default 0
 *
 * @param Failure Switch
 * @type switch
 * @default 0
 *
 * @param Result Variable
 * @type variable
 * @default 15
 *
 * @param Pick Durability
 * @type number
 * @min 1
 * @default 5
 *
 * @help
 * Plugin Command:
 *   LOCKPICK
 *   LOCKPICK 1..10
 *
 * Touch controls:
 *   Put a finger on the pick handle and drag around the lock.
 *   Slow movement near a pin = more pressure / better control.
 *   Correct alignment automatically lifts the active pin.
 *   Release your finger to relax tension.
 *
 * No Enter/Space is required.
 *
 * Keyboard fallback:
 *   Left / Right or A / D = move pick
 *   Esc = cancel
 *
 * Result:
 *   Result Variable = 1 success, 0 failure/cancel.
 *   BitzFantasy default: variable #0015 "проход".
 *
 * Important for BitzFantasy:
 *   The plugin resets #0015 to 0 before every attempt.
 *   Only a successful lockpick sets #0015 to 1.
 *   A broken pick or ESC sets #0015 back to 0.
 */

(function() {
    "use strict";

    var NAME = "LockPuzzleMV";
    var P = PluginManager.parameters(NAME);
    var DEFAULT_DIFFICULTY = Math.max(1, Math.min(10, Number(P["Default Difficulty"] || 5)));
    var SUCCESS_SWITCH = Number(P["Success Switch"] || 0);
    var FAILURE_SWITCH = Number(P["Failure Switch"] || 0);
    var RESULT_VARIABLE = Number(P["Result Variable"] || 15);
    var PICK_DURABILITY = Math.max(1, Number(P["Pick Durability"] || 5));

    Input.keyMapper[65] = "lock_left";
    Input.keyMapper[68] = "lock_right";

    var _pc = Game_Interpreter.prototype.pluginCommand;
    Game_Interpreter.prototype.pluginCommand = function(command, args) {
        _pc.call(this, command, args);
        if (String(command).toUpperCase() === "LOCKPICK") {
            var d = DEFAULT_DIFFICULTY;
            if (args && args.length) d = Number(args[0]) || d;
            d = Math.max(1, Math.min(10, d));

            // IMPORTANT: reset the result before every new attempt.
            // This prevents a previous successful attempt from opening the door
            // after a later failed/cancelled attempt. In this project #0015
            // ("проход") is the lock result: 0 = closed, 1 = opened.
            if (RESULT_VARIABLE > 0) $gameVariables.setValue(RESULT_VARIABLE, 0);

            SceneManager.push(Scene_LockTouch);
            SceneManager.prepareNextScene(d);
        }
    };

    function Scene_LockTouch() {
        this.initialize.apply(this, arguments);
    }
    Scene_LockTouch.prototype = Object.create(Scene_Base.prototype);
    Scene_LockTouch.prototype.constructor = Scene_LockTouch;

    Scene_LockTouch.prototype.initialize = function() {
        Scene_Base.prototype.initialize.call(this);
        this._difficulty = DEFAULT_DIFFICULTY;
        this._done = false;
    };

    Scene_LockTouch.prototype.prepare = function(d) {
        this._difficulty = Math.max(1, Math.min(10, Number(d) || DEFAULT_DIFFICULTY));
    };

    Scene_LockTouch.prototype.create = function() {
        Scene_Base.prototype.create.call(this);

        this._bg = new Sprite(new Bitmap(Graphics.boxWidth, Graphics.boxHeight));
        this.addChild(this._bg);
        this.drawBackground();

        this._lock = new TouchLockUI(
            Graphics.boxWidth / 2,
            Graphics.boxHeight / 2 + 5,
            this._difficulty
        );
        this.addChild(this._lock);
    };

    Scene_LockTouch.prototype.start = function() {
        Scene_Base.prototype.start.call(this);
        this.startFadeIn(this.fadeSpeed(), false);
    };

    Scene_LockTouch.prototype.update = function() {
        Scene_Base.prototype.update.call(this);

        if (this._done) {
            if (TouchInput.isTriggered() || Input.isTriggered("ok")) SceneManager.pop();
            return;
        }

        if (Input.isTriggered("cancel")) {
            this.finish(false);
            return;
        }

        this._lock.updatePuzzle();

        if (this._lock.success) this.finish(true);
        else if (this._lock.failed) this.finish(false);
    };

    Scene_LockTouch.prototype.finish = function(ok) {
        if (this._done) return;
        this._done = true;

        // Write the final result every time the scene finishes.
        // 1 = lock opened successfully; 0 = failed or cancelled.
        // Default for BitzFantasy is variable #0015 ("проход").
        if (SUCCESS_SWITCH > 0) $gameSwitches.setValue(SUCCESS_SWITCH, ok);
        if (FAILURE_SWITCH > 0) $gameSwitches.setValue(FAILURE_SWITCH, !ok);
        if (RESULT_VARIABLE > 0) $gameVariables.setValue(RESULT_VARIABLE, ok ? 1 : 0);

        var s = new Sprite(new Bitmap(Graphics.boxWidth, Graphics.boxHeight));
        var b = s.bitmap, c = b._context, w = b.width, h = b.height;

        c.fillStyle = "rgba(0,0,0,0.78)";
        c.fillRect(0, 0, w, h);

        c.textAlign = "center";
        c.font = "bold 46px sans-serif";
        c.fillStyle = ok ? "#8cffca" : "#ff8095";
        c.shadowColor = c.fillStyle;
        c.shadowBlur = 25;
        c.fillText(ok ? "ЗАМОК ОТКРЫТ" : "ОТМЫЧКА СЛОМАЛАСЬ", w / 2, h / 2 - 25);
        c.shadowBlur = 0;

        c.font = "18px sans-serif";
        c.fillStyle = "#e7ebf5";
        c.fillText(ok ? "Последний штифт защёлкнулся." : "Слишком сильное сопротивление.", w / 2, h / 2 + 18);

        c.font = "14px sans-serif";
        c.fillStyle = "#9da8c0";
        c.fillText("Коснись экрана, чтобы продолжить", w / 2, h / 2 + 60);

        b._setDirty();
        this.addChild(s);
    };

    Scene_LockTouch.prototype.drawBackground = function() {
        var b = this._bg.bitmap, c = b._context, w = b.width, h = b.height;
        c.fillStyle = "#05070c";
        c.fillRect(0, 0, w, h);

        var g = c.createRadialGradient(w/2,h/2,40,w/2,h/2,700);
        g.addColorStop(0,"#202d47");
        g.addColorStop(0.55,"#0e1729");
        g.addColorStop(1,"#030409");
        c.fillStyle = g;
        c.fillRect(0,0,w,h);

        for (var i=0;i<110;i++) {
            var x=(i*83)%w, y=(i*47)%h;
            c.fillStyle="rgba(180,210,255,"+(0.06+(i%4)*0.035)+")";
            c.fillRect(x,y,1+(i%2),1+(i%2));
        }
        b._setDirty();
    };

    function TouchLockUI(x, y, difficulty) {
        Sprite.call(this);
        this.initialize.apply(this, arguments);
    }
    TouchLockUI.prototype = Object.create(Sprite.prototype);
    TouchLockUI.prototype.constructor = TouchLockUI;

    TouchLockUI.prototype.initialize = function(x, y, difficulty) {
        Sprite.prototype.initialize.call(this);
        this.x=x; this.y=y;
        this.anchor.x=.5; this.anchor.y=.5;
        this.W=840; this.H=550;
        this.bitmap=new Bitmap(this.W,this.H);

        this.difficulty=difficulty;
        this.time=0;
        this.pickAngle=-Math.PI*.55;
        this.lastAngle=this.pickAngle;
        this.dragging=false;
        this.dragFrames=0;
        this.releaseFrames=0;
        this.resistance=0;
        this.pressure=0;
        this.cylinder=0;
        this.currentPin=0;
        this.success=false;
        this.failed=false;
        this.health=PICK_DURABILITY+Math.floor((10-difficulty)/3);
        this.maxHealth=this.health;
        this.message="Потяни отмычку пальцем";
        this.messageTimer=0;
        this.shake=0;
        this.particles=[];

        this.pinCount=Math.min(7,3+Math.floor(difficulty*.45));
        this.pins=[];
        for(var i=0;i<this.pinCount;i++){
            var a=-1.08+i*(2.16/Math.max(1,this.pinCount-1));
            a+=((Math.random()-.5)*.22);
            this.pins.push({
                angle:a,
                tol:Math.max(.055,.115-difficulty*.005),
                progress:0,
                set:false,
                falsePin:(difficulty>=8 && i===this.pinCount-2),
                phase:Math.random()*Math.PI*2
            });
        }

        this.redraw();
    };

    TouchLockUI.prototype.dist=function(a,b){
        var d=a-b;
        while(d>Math.PI)d-=Math.PI*2;
        while(d<-Math.PI)d+=Math.PI*2;
        return Math.abs(d);
    };

    TouchLockUI.prototype.updatePuzzle=function(){
        if(this.success||this.failed){ this.redraw(); return; }
        this.time+=1/60;

        var hasTouch=TouchInput.isPressed();
        var dx=TouchInput.x-this.x;
        var dy=TouchInput.y-this.y;
        var r=Math.sqrt(dx*dx+dy*dy);

        // Only grab the pick in a generous ring around the lock.
        if(hasTouch && (this.dragging || (r>175 && r<390))){
            var a=Math.atan2(dy,dx);

            if(!this.dragging){
                this.lastAngle=a;
                this.dragging=true;
                this.dragFrames=0;
            }

            var da=a-this.lastAngle;
            while(da>Math.PI)da-=Math.PI*2;
            while(da<-Math.PI)da+=Math.PI*2;

            // One-finger motion directly controls pick rotation.
            this.pickAngle+=da;
            this.pickAngle=Math.max(-1.25,Math.min(1.25,this.pickAngle));
            this.lastAngle=a;

            this.dragFrames++;
        }else{
            this.dragging=false;
            this.releaseFrames++;
        }

        // Keyboard fallback.
        if(Input.isPressed("left")||Input.isPressed("lock_left"))this.pickAngle-=.025;
        if(Input.isPressed("right")||Input.isPressed("lock_right"))this.pickAngle+=.025;
        this.pickAngle=Math.max(-1.25,Math.min(1.25,this.pickAngle));

        var pin=this.pins[this.currentPin];
        if(!pin){this.success=true;this.redraw();return;}

        var d=this.dist(this.pickAngle,pin.angle);

        // Speed is the key: slow finger movement = higher control.
        var movement=Math.abs(this.pickAngle-this.lastAngle);
        var slowBonus=Math.max(0,1-Math.min(1,movement/.055));
        var near=Math.max(0,1-d/(pin.tol*3.8));

        this.resistance=near;
        this.pressure=hasTouch&&this.dragging ? near*(.45+.55*slowBonus) : 0;

        // When close and moving slowly, the pin lifts automatically.
        if(hasTouch&&this.dragging&&near>.58){
            pin.progress += .012*this.pressure*(1.0+this.difficulty*.03);

            if(this.pressure>.72){
                this.message="Тише... штифт поднимается";
                this.messageTimer=5;
            }else{
                this.message="Есть сопротивление";
                this.messageTimer=5;
            }

            if(pin.falsePin && this.pressure>.82){
                this.health-=.022*(1+this.difficulty*.04);
                this.shake=5;
                this.message="Ложный штифт — отпусти чуть-чуть";
            }

            if(pin.progress>=1){
                pin.progress=1;
                pin.set=true;
                this.click();
                this.currentPin++;

                if(this.currentPin>=this.pinCount){
                    this.success=true;
                    this.message="ЩЕЛЧОК! Замок открыт";
                    this.burst();
                }else{
                    this.message="ЩЕЛЧОК! Ищи следующий";
                }
                this.messageTimer=70;
            }
        }

        // Too fast while forcing a near-but-wrong position wears the pick.
        if(hasTouch&&this.dragging&&near<.20&&movement>.075){
            this.health-=.006*(1+this.difficulty*.04);
        }

        // If the finger is held almost still in the wrong place, nothing bad happens.
        // This keeps the puzzle friendly and exploratory.

        if(this.messageTimer>0)this.messageTimer--;
        if(this.shake>0)this.shake--;
        if(this.health<=0){
            this.health=0;
            this.failed=true;
        }

        this.updateParticles();
        this.redraw();
    };

    TouchLockUI.prototype.click=function(){
        for(var i=0;i<20;i++){
            var a=Math.random()*Math.PI*2;
            var sp=1.5+Math.random()*4;
            this.particles.push({
                x:0,y:-10,vx:Math.cos(a)*sp,vy:Math.sin(a)*sp,
                life:22+Math.random()*22,max:44,good:true
            });
        }
    };

    TouchLockUI.prototype.burst=function(){
        for(var i=0;i<70;i++){
            var a=Math.random()*Math.PI*2,sp=2+Math.random()*7;
            this.particles.push({
                x:0,y:0,vx:Math.cos(a)*sp,vy:Math.sin(a)*sp,
                life:30+Math.random()*45,max:75,good:true
            });
        }
    };

    TouchLockUI.prototype.updateParticles=function(){
        for(var i=this.particles.length-1;i>=0;i--){
            var p=this.particles[i];
            p.x+=p.vx;p.y+=p.vy;p.vy+=.035;p.life--;
            if(p.life<=0)this.particles.splice(i,1);
        }
    };

    TouchLockUI.prototype.round=function(c,x,y,w,h,r){
        c.beginPath();
        c.moveTo(x+r,y);
        c.arcTo(x+w,y,x+w,y+h,r);
        c.arcTo(x+w,y+h,x,y+h,r);
        c.arcTo(x,y+h,x,y,r);
        c.arcTo(x,y,x+w,y,r);
        c.closePath();
    };

    TouchLockUI.prototype.redraw=function(){
        var b=this.bitmap,c=b._context,w=b.width,h=b.height;
        c.clearRect(0,0,w,h);

        var sx=this.shake?(Math.random()-.5)*7:0;
        c.save();c.translate(sx,0);

        c.fillStyle="rgba(8,12,21,.98)";
        this.round(c,0,0,w,h,28);c.fill();
        c.strokeStyle="#596883";c.lineWidth=2;this.round(c,0,0,w,h,28);c.stroke();

        c.textAlign="center";
        c.font="bold 29px sans-serif";c.fillStyle="#f1f5ff";
        c.fillText("ВЗЛОМ ЗАМКА",w/2,43);
        c.font="15px sans-serif";c.fillStyle="#a1acc2";
        c.fillText("Управление одним пальцем — двигай отмычку медленно",w/2,69);

        // Main lock.
        c.save();c.translate(w/2,255);
        c.shadowColor="rgba(0,0,0,.9)";c.shadowBlur=35;
        var mg=c.createLinearGradient(-195,-155,195,155);
        mg.addColorStop(0,"#5b667e");mg.addColorStop(.5,"#1a2233");mg.addColorStop(1,"#3c4860");
        c.fillStyle=mg;this.round(c,-195,-155,390,310,36);c.fill();
        c.shadowBlur=0;c.strokeStyle="#7c8aa5";c.lineWidth=3;this.round(c,-195,-155,390,310,36);c.stroke();

        // Cylinder.
        c.save();
        c.rotate(this.cylinder*.38);
        c.fillStyle="#06090f";c.beginPath();c.arc(0,12,96,0,Math.PI*2);c.fill();
        c.strokeStyle=this.resistance>.7?"#ffd36e":"#8794af";c.lineWidth=5;
        c.beginPath();c.arc(0,12,103,0,Math.PI*2);c.stroke();
        c.fillStyle="#020407";this.round(c,-19,27,38,110,13);c.fill();
        c.restore();

        // Pins.
        for(var i=0;i<this.pins.length;i++){
            var p=this.pins[i];
            var px=-140+i*(280/Math.max(1,this.pins.length-1));
            var active=i===this.currentPin;
            var lift=p.set?25:(active?this.resistance*20:0);
            c.fillStyle=p.set?"#7fffc4":(active&&this.resistance>.55?"#ffd475":"#c7cfdf");
            c.shadowColor=p.set?"#72ffc2":(active&&this.resistance>.55?"#ffd475":"#000");
            c.shadowBlur=(p.set||active&&this.resistance>.55)?15:4;
            this.round(c,px-9,-104-lift,18,66,6);c.fill();c.shadowBlur=0;
            c.fillStyle="#59647a";this.round(c,px-14,-111,28,11,5);c.fill();

            if(active&&!p.set){
                c.strokeStyle="#fff0a2";c.lineWidth=2;
                c.beginPath();c.arc(px,-128,18+Math.sin(this.time*5)*2,0,Math.PI*2);c.stroke();
            }
        }

        // Pick itself.
        c.save();c.rotate(this.pickAngle);
        c.lineCap="round";c.shadowColor="#ffd36c";c.shadowBlur=18;
        c.strokeStyle="#d1a049";c.lineWidth=13;
        c.beginPath();c.moveTo(-350,20);c.lineTo(-65,20);c.stroke();
        c.shadowBlur=0;c.strokeStyle="#fff0aa";c.lineWidth=3;
        c.beginPath();c.moveTo(-350,20);c.lineTo(-65,20);c.stroke();
        c.strokeStyle="#f1bd5f";c.lineWidth=8;
        c.beginPath();c.moveTo(-65,20);c.lineTo(96,20);c.lineTo(119,9);c.moveTo(96,20);c.lineTo(119,31);c.stroke();

        // Handle.
        c.fillStyle="#a97935";this.round(c,-405,5,95,30,15);c.fill();
        c.fillStyle="#ffe29a";c.font="bold 12px sans-serif";c.fillText("ОТМЫЧКА",-357,25);
        c.restore();

        // Tension wrench visual reacts automatically.
        c.save();c.rotate(this.cylinder*.38);
        c.strokeStyle="#aeb9ce";c.lineWidth=8;c.lineCap="round";
        c.beginPath();c.moveTo(-50,125);c.lineTo(0,125);c.lineTo(0,47);c.stroke();
        c.restore();

        c.restore();

        // Status.
        var status,color;
        if(this.success){status="🔓 ЩЕЛЧОК! ЗАМОК ОТКРЫТ";color="#83ffc7";}
        else if(this.failed){status="ОТМЫЧКА СЛОМАЛАСЬ";color="#ff8095";}
        else if(this.resistance>.82){status="СИЛЬНОЕ СОПРОТИВЛЕНИЕ — МЕДЛЕННЕЕ";color="#ffd071";}
        else if(this.resistance>.52){status="ЕСТЬ СОПРОТИВЛЕНИЕ — ПРОДОЛЖАЙ МЕДЛЕННО";color="#ffdc8d";}
        else{status="ВЕДИ ПАЛЬЦЕМ ПО КРУГУ И ИЩИ ШТИФТ";color="#c3cce0";}

        c.font="bold 18px sans-serif";c.fillStyle=color;c.fillText(status,w/2,425);

        // Durability.
        c.font="13px sans-serif";c.fillStyle="#9da8c0";c.fillText("Прочность отмычки",145,455);
        var bx=235,by=443,bw=370,bh=17;
        c.fillStyle="#090c14";this.round(c,bx,by,bw,bh,8);c.fill();
        var hp=this.health/this.maxHealth;
        c.fillStyle=hp>.55?"#70e8ae":(hp>.25?"#ffd071":"#ff6d82");
        this.round(c,bx,by,bw*hp,bh,8);c.fill();

        c.font="13px sans-serif";c.fillStyle="#a9b4ca";
        c.fillText("ШТИФТ "+Math.min(this.currentPin+1,this.pinCount)+" / "+this.pinCount,w/2,488);
        c.fillText("👆 Двигай пальцем медленно. Чем ближе — тем сильнее замок сопротивляется.",w/2,515);
        c.fillText("ПК: мышь | Клавиатура: ← → / A D | ESC — выход",w/2,536);

        // Touch ring / finger hint.
        if(!this.dragging&&!this.success&&!this.failed){
            c.strokeStyle="rgba(255,220,140,.35)";c.lineWidth=2;
            c.setLineDash([7,8]);
            c.beginPath();c.arc(w/2,255,215,0,Math.PI*2);c.stroke();
            c.setLineDash([]);
        }

        for(var j=0;j<this.particles.length;j++){
            var q=this.particles[j],alpha=Math.max(0,q.life/q.max);
            c.globalAlpha=alpha;c.fillStyle="#ffe08b";c.shadowColor="#ffe08b";c.shadowBlur=10;
            c.beginPath();c.arc(q.x+w/2,q.y+255,2.7,0,Math.PI*2);c.fill();
        }
        c.globalAlpha=1;c.shadowBlur=0;

        c.restore();b._setDirty();
    };

    window.Scene_LockTouch=Scene_LockTouch;
})();
