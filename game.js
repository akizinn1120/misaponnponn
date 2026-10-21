const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

let score = 0;
let isGameStart = false;  // ★タイトル画面表示中は false
let isGameOver = false;
let isGameClear = false;
let stage = 1;   //ステージ番号
let isEnding = false;      // エンディング中かどうか
let endingY = canvas.height + 50;   // スクロール開始位置（画面下）

// ★スタート画面背景画像
const startBgImg = new Image();
startBgImg.src = "startbg.png";   // ← 好きな画像に変更

// 画像
const misaImg1 = new Image();
misaImg1.src = "right1.png";

const misaImg2 = new Image();
misaImg2.src = "right2.png";

// ステージごとの敵画像（事前ロード）
const enemyImages = {
  1: new Image(),
  2: new Image(),
  3: new Image(),
  4: new Image()
};

enemyImages[1].src = "iburigakko.png";
enemyImages[2].src = "nitepon.png";
enemyImages[3].src = "ramizupon.png";
enemyImages[4].src = "darkmisapon.png";

// ステージごとのボス画像(事前ロード）
const bossImages = {
  1: new Image(),
  2: new Image(),
  3: new Image(),
  4: new Image()
};

bossImages[1].src = "iburigakko.png";
bossImages[2].src = "nitepon.png";
bossImages[3].src = "ramizupon.png";
bossImages[4].src = "darkmisapon.png";

// プレイヤー (HTML側でcanvasのheightが確定している前提)
const player = {
  x: 100,
  y: canvas.height / 2,
  w: 48,
  h: 48,
  speed: 3,
  frame: 0,
  frameTimer: 0
};

let bullets = [];
let enemies = [];
let boss = null;
let isBossActive = false;
let bossSpawnTimer = 0;
let bossShootTimer = 0;
let bossTeleportTimer = 0;
let bossTeleportEffectTimer = 0;
let bossLastX = 0;
let bossLastY = 0;
let bossMoveTimer = 0;
let bossMoveDirX = 0;
let bossMoveDirY = 0;


//ボス弾配列
let bossBullets = [];
// 雲データを追加
let clouds = [];
const cloudImg = new Image();
cloudImg.src = "cloud.png";

// オブジェクト配列と画像
let groundObjects = [];

const grassImg = new Image();
grassImg.src = "grass.png";

const treeImg = new Image();
treeImg.src = "tree.png";

const pondImg = new Image();
pondImg.src = "pond.png";

// キーボード
const keys = {};
document.addEventListener('keydown', e => {
  keys[e.code] = true;
  if (e.code === 'Space') isShooting = true;
});

document.addEventListener('keyup', e => {
  keys[e.code] = false;
  if (e.code === 'Space') isShooting = false;
}); // 重複していた2つ目のkeyupは削除しました

//エンディングテキスト
const endingLines = [
  "【ステージ1ボス】 いぶりがっこん",
  "香ばしい守護者。みさぽんの最初の試練。",
  "",
  "【ステージ2ボス】 にてぽん",
  "清水をまとい、夕暮れの道をふさぐ者。",
  "",
  "【ステージ3ボス】 らずぽん",
  "夜のしずくを操る静かな紫の支配者。",
  "",
  "【ステージ4ボス】 ダークぽん",
  "みさぽんの影から生まれた最後の強敵。",
  "",
  "----------------------------",
  "",
  "【主人公】 みさぽん",
  "町の平和を守る勇気の戦士。",
  "",
  "----------------------------",
  "",
  "【制作】 NPO法人みさぽーと",
  "地域の人と人をつなぎ、笑顔をつくるチーム",
];

// ★エンディング用ステージボス画像
const endingBossImages = [
  new Image(),
  new Image(),
  new Image(),
  new Image()
];

endingBossImages[0].src = "iburigakko.png";
endingBossImages[1].src = "nitepon.png";
endingBossImages[2].src = "ramizupon.png";
endingBossImages[3].src = "darkmisapon.png";

// ★センキュー画面用みさぽん画像
const endingMisaImg = new Image();
endingMisaImg.src = "right2.png";


// スマホ操作フラグ
let touchUp = false;
let touchDown = false;
let touchLeft = false;
let touchRight = false;

// オートショットフラグ
let isShooting = false;
let autoShootTimer = 0;

// PC：スペースキーでスタート
document.addEventListener('keydown', e => {
  if (!isGameStart && e.code === "Space") {
    isGameStart = true;
  }
});

// スマホ：画面タップでスタート
canvas.addEventListener("touchstart", () => {
  if (!isGameStart) {
    isGameStart = true;
  }
});


// スマホ操作イベント
document.getElementById("btnUp").addEventListener("touchstart", () => touchUp = true);
document.getElementById("btnUp").addEventListener("touchend", () => touchUp = false);

document.getElementById("btnDown").addEventListener("touchstart", () => touchDown = true);
document.getElementById("btnDown").addEventListener("touchend", () => touchDown = false);

document.getElementById("btnLeft").addEventListener("touchstart", () => touchLeft = true);
document.getElementById("btnLeft").addEventListener("touchend", () => touchLeft = false);

document.getElementById("btnRight").addEventListener("touchstart", () => touchRight = true);
document.getElementById("btnRight").addEventListener("touchend", () => touchRight = false);

document.getElementById("btnShoot").addEventListener("touchstart", () => { isShooting = true; });
document.getElementById("btnShoot").addEventListener("touchend", () => { isShooting = false; });

//タイトル画面描画関数
function drawStartScreen() {

  // ★背景画像
  ctx.drawImage(startBgImg, 0, 0, canvas.width, canvas.height);

  // ★スタート案内（黄色で目立たせる）
  ctx.fillStyle = "#000000";  // 黒色
  ctx.font = "36px Arial Black";
  ctx.textAlign = "center";

  // ★下段中央に配置
  ctx.fillText(
    "▶ タップまたはスペースキーでスタート",
    canvas.width / 2,
    canvas.height -250 
  );
}

// 背景
function drawBackground() {

  if (stage === 1) {
    // 昼
    ctx.fillStyle = "#87CEEB";  // 空色
    ctx.fillRect(0, 0, canvas.width, canvas.height * 0.6);

    ctx.fillStyle = "#3CB371";  // 緑の地面
    ctx.fillRect(0, canvas.height * 0.6, canvas.width, canvas.height * 0.4);
  }

  else if (stage === 2) {
    // 夕方
    ctx.fillStyle = "#FF8C00";  // オレンジ空
    ctx.fillRect(0, 0, canvas.width, canvas.height * 0.6);

    ctx.fillStyle = "#8B4513";  // 茶色の地面
    ctx.fillRect(0, canvas.height * 0.6, canvas.width, canvas.height * 0.4);
  }

  else if (stage === 3) {
    // 夜
    ctx.fillStyle = "#0B0B3B";  // 夜空
    ctx.fillRect(0, 0, canvas.width, canvas.height * 0.6);

    ctx.fillStyle = "#013220";  // 暗い地面
    ctx.fillRect(0, canvas.height * 0.6, canvas.width, canvas.height * 0.4);
  }

  else if (stage === 4) {
    // --- ブラックホール背景（中心を強調） ---
    const gradient = ctx.createRadialGradient(
      canvas.width / 2, canvas.height / 2, 30,
      canvas.width / 2, canvas.height / 2, 350
    );
    gradient.addColorStop(0, "#000000");
    gradient.addColorStop(1, "#220022");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // --- 星を散らす ---
    for (let i = 0; i < 120; i++) {
      const x = Math.random() * canvas.width;
      const y = Math.random() * canvas.height;
      const size = Math.random() * 2 + 1;

      ctx.fillStyle = "white";
      ctx.fillRect(x, y, size, size);
    }

    // --- 惑星を追加（ランダムに3つ） ---
    for (let i = 0; i < 3; i++) {
      const px = Math.random() * canvas.width;
      const py = Math.random() * canvas.height * 0.8;
      const pr = Math.random() * 40 + 20;

      const planetGrad = ctx.createRadialGradient(px, py, pr * 0.2, px, py, pr);
      planetGrad.addColorStop(0, "#88aaff");
      planetGrad.addColorStop(1, "#334477");

      ctx.fillStyle = planetGrad;
      ctx.beginPath();
      ctx.arc(px, py, pr, 0, Math.PI * 2);
      ctx.fill();
    }

    // --- ブラックホールの中心をさらに強調 ---
    ctx.beginPath();
    ctx.arc(canvas.width / 2, canvas.height / 2, 40, 0, Math.PI * 2);
    ctx.fillStyle = "#000000";
    ctx.fill();

    ctx.beginPath();
    ctx.arc(canvas.width / 2, canvas.height / 2, 60, 0, Math.PI * 2);
    ctx.strokeStyle = "#5500aa";
    ctx.lineWidth = 4;
    ctx.stroke();
  }
    // ★ここに追加（地面模様）
    drawGroundPattern();
}
 
function drawGroundPattern() {

  const groundTop = canvas.height * 0.6;
  const groundBottom = canvas.height;

  ctx.save();

  // ============================
  // ステージ1（昼）→ 模様なし（横棒の原因を完全排除）
  // ============================
  if (stage === 1) {
    // 何も描かない
  }

  // ============================
  // ステージ2（夕方）ひび割れ
  // ============================
  else if (stage === 2) {
    ctx.strokeStyle = "rgba(120,60,0,0.25)";
    ctx.lineWidth = 2;
    for (let i = 0; i < 25; i++) {
      const x = Math.random() * canvas.width;
      const y = groundTop + Math.random() * (groundBottom - groundTop);
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + 20, y + 3);
      ctx.stroke();
    }
  }

  // ============================
  // ステージ3（夜）暗い草
  // ============================
  else if (stage === 3) {
    ctx.fillStyle = "rgba(0,40,80,0.25)";
    for (let i = 0; i < 35; i++) {
      const x = Math.random() * canvas.width;
      const y = groundTop + Math.random() * (groundBottom - groundTop);
      ctx.fillRect(x, y, 4, 14);
    }
  }

  // ============================
  // ステージ4（宇宙）→ 模様なし
  // ============================
  else if (stage === 4) {
    // 何も描かない
  }

  ctx.restore();
}

// 雲を生成する関数
function spawnCloud() {
  if (stage >= 4) return;  // ★ ステージ4は雲なし
  if (Math.random() < 0.008) {
    clouds.push({
      x: canvas.width + 50,
      y: Math.random() * (canvas.height * 0.4),
      w: 120,
      h: 60,
      speed: 2 + Math.random() * 1.5
    });
  }
}

// 雲を描画
function drawClouds() {

// ★ステージ4は雲なし（宇宙空間）
  if (stage === 4) return;
  clouds.forEach(c => {

    ctx.save();

    // ============================
    // ステージごとの雲の色味
    // ============================
    if (stage === 1) {
      // 昼：そのまま
      ctx.globalAlpha = 1.0;
    }
    else if (stage === 2) {
      // 夕方：オレンジを少し足す
      ctx.globalAlpha = 0.9;
      ctx.filter = "brightness(0.9) sepia(0.3) saturate(1.4)";
    }
    else if (stage === 3) {
      // 夜：青み＋暗さ
      ctx.globalAlpha = 0.75;
      ctx.filter = "brightness(0.7) hue-rotate(200deg)";
    }
    
    // 雲本体
    ctx.drawImage(cloudImg, c.x, c.y, c.w, c.h);

    ctx.restore();
  });
}

// ★直前のオブジェの位置を記録
let lastGroundObjX = -9999;

function spawnGroundObject() {
  if (stage >= 4) return;  // ステージ4はなし
  if (Math.random() < 0.02) {

    const types = ["grass", "tree", "pond"];
    const type = types[Math.floor(Math.random() * types.length)];

    let img, w, h;

  // ★種類ごとのサイズ
    if (type === "tree") {
      img = treeImg; w = 100; h = 120;
    }
    else if (type === "grass") {
      img = grassImg; w = 80; h = 40;
    }
    else { // pond
      img = pondImg; w = 140; h = 80;
    }

// ★緑の地面の範囲（画面下部40%）
    const groundTop = canvas.height * 0.6;
    const groundBottom = canvas.height;
    const groundHeight = canvas.height * 0.4;

// ★修正：陸地の範囲内でY座標をランダムに決定する
    // オブジェクトの下端（足元）が、groundTop から groundBottom の間に収まるように計算
    const minY = groundTop;
    const maxY = groundBottom - h;
    const y = minY + Math.random() * (maxY - minY);

       // ★出現位置（右端外）
    const spawnX = canvas.width + 50;
    const enterX = canvas.width - 50;   

   
// ★修正：配列の最後のオブジェクト（最新のもの）の現在位置と比較する
    if (groundObjects.length > 0) {
      const lastObj = groundObjects[groundObjects.length - 1];
      if (spawnX - lastObj.x < 200) {
        return; // 直前の小物がまだ右端から200px以上離れていなければ生成しない
      }
    }
    // ★出現OK
    groundObjects.push({
      x: spawnX,
      y: y,
      w,
      h,
      speed: 2,
      img
    });
  }
} 
// 小物更新
function updateGroundObjects() { 
  groundObjects.forEach(o => o.x -= o.speed);
  groundObjects = groundObjects.filter(o => o.x > -200);
}

// 小物描写
function drawGroundObjects() {

  // ★奥→手前の順に描画（足元の高さでソート）
  groundObjects.sort((a, b) => (a.y + a.h) - (b.y + b.h));

  groundObjects.forEach(o => {

    ctx.save();

    // ① ステージごとの明るさ調整
    if (stage === 1) ctx.globalAlpha = 1.0;     // 昼
    else if (stage === 2) ctx.globalAlpha = 0.85; // 夕方
    else if (stage === 3) ctx.globalAlpha = 0.65; // 夜
    else if (stage === 4) ctx.globalAlpha = 0.55; // ブラックホール

    let swayX = 0;
    ctx.drawImage(o.img, o.x + swayX, o.y, o.w, o.h);
    ctx.restore();
  });
}

// プレイヤーアニメ
function updatePlayerAnimation() {
  player.frameTimer++;
  if (player.frameTimer > 25) {
    player.frame = (player.frame + 1) % 2;
    player.frameTimer = 0;
  }
}

// プレイヤー描画
function drawPlayer() {
  const img = player.frame === 0 ? misaImg1 : misaImg2;
  ctx.drawImage(img, player.x, player.y, player.w, player.h);
}

// ショット
function shoot() {
  if (isGameOver || isGameClear) return;
  bullets.push({
    x: player.x + player.w,
    y: player.y + player.h / 2 - 3,
    w: 12,
    h: 6,
    speed: 4,
    color: '#ffff33'
  });
}

// 敵生成
function spawnEnemy() {
  if (Math.random() < 0.03 && !isBossActive) {

    let size = 32;

    if (stage === 2) size = 64;     // ★ ステージ2は大きめ
    if (stage === 3) size = 64;     // ★ ステージ3
    if (stage === 4) size = 64;    // ★ ステージ4は

    enemies.push({
      x: canvas.width + 20,
      y: Math.random() * (canvas.height - size) + 20,
      w: size,
      h: size,
      speed: 2 + stage,
      spawnTime: Date.now(),
      img: enemyImages[stage]
    });
  }
}

// プレイヤー移動
function updatePlayer() {
  if (keys['ArrowUp'] || touchUp) player.y -= player.speed;
  if (keys['ArrowDown'] || touchDown) player.y += player.speed;
  if (keys['ArrowLeft'] || touchLeft) player.x -= player.speed;
  if (keys['ArrowRight'] || touchRight) player.x += player.speed;

  player.x = Math.max(0, Math.min(canvas.width - player.w, player.x));
  player.y = Math.max(0, Math.min(canvas.height - player.h, player.y));
}

// 弾更新
function updateBullets() {
  bullets.forEach(b => b.x += b.speed);
  bullets = bullets.filter(b => b.x < canvas.width + 50);
}

// 敵更新
function updateEnemies() {
  enemies.forEach(e => e.x -= e.speed);
  enemies = enemies.filter(e => e.x > -50);
}

// 当たり判定
function isEnemyHit(a, enemy) {
  if (!enemy) return false;

  let shrink;

  // ★ステージ1は縮小量を小さくする（すり抜け防止）
  if (stage === 1) {
    shrink = 2;   // ← ここが重要
  } else {
    shrink = enemy.w * 0.2;  // ステージ2〜4は従来通り
  }

  return (
    a.x < enemy.x + enemy.w - shrink &&
    a.x + a.w > enemy.x + shrink &&
    a.y < enemy.y + enemy.h - shrink &&
    a.y + a.h > enemy.y + shrink
  );
}

// ボス生成
function spawnBoss() {
  boss = {
    x: canvas.width + 100,
    y: canvas.height / 2 - 80,
    w: 120,
    h: 120,
    speed: 2 + stage,
    hp: 50 + stage * 20,
    img: bossImages[stage],
    startX: canvas.width - 200,   // ★ 初期位置（画面内）
    startY: canvas.height / 2 - 80
  };

  bossSpawnTimer = 0;
}

//ボス弾を撃つ関数（ステージ4専用）
function bossShoot4() {
  if (!boss) return;

  // ★ 上左方向（角度違いで2発）
  bossBullets.push({ x: boss.x, y: boss.y + boss.h / 2, w: 12, h: 12, speedX: -4.5, speedY: -4, color: "#AA88FF" });
  bossBullets.push({ x: boss.x, y: boss.y + boss.h / 2, w: 12, h: 12, speedX: -5,   speedY: -3, color: "#AA88FF" });

  // ★ 下左方向（角度違いで2発）
  bossBullets.push({ x: boss.x, y: boss.y + boss.h / 2, w: 12, h: 12, speedX: -4.5, speedY: 4,  color: "#AA88FF" });
  bossBullets.push({ x: boss.x, y: boss.y + boss.h / 2, w: 12, h: 12, speedX: -5,   speedY: 3,  color: "#AA88FF" });

  // ★ 新規追加：直線弾（紫色）
  bossBullets.push({
    x: boss.x,
    y: boss.y + boss.h / 2,
    w: 12,
    h: 12,
    speedX: -5,   // ← 左へ直線
    speedY: 0,
    color: "#AA88FF"
  });
}
//ボス弾を撃つ関数（ステージ2専用）
function bossShoot2() {
  if (!boss) return;

  bossBullets.push({
    x: boss.x,
    y: boss.y + boss.h / 2,
    w: 12,
    h: 12,
    speedX: -3,   // ← 左へ直線
    speedY: 0,
    color: "#66CCFF"
  });
}

//ボス弾を撃つ関数（ステージ3専用）
function bossShoot() {
  if (!boss) return;

  bossBullets.push({
    x: boss.x,
    y: boss.y + boss.h / 2,
    w: 12,
    h: 12,
    speedX: -3,          // ★ 避けられる速度
    speedY: 0,
    color: "#66CCFF"     // ★ 水色
  });

 // ★ 左上方向
  bossBullets.push({
    x: boss.x,
    y: boss.y + boss.h / 2,
    w: 12,
    h: 12,
    speedX: -2.5,
    speedY: -2,
    color: "#FFDD55"
  });

  // ★ 左下方向
  bossBullets.push({
    x: boss.x,
    y: boss.y + boss.h / 2,
    w: 12,
    h: 12,
    speedX: -2.5,
    speedY: 2,
    color: "#FFDD55"
  });
}

//ボス弾の更新処理
function updateBossBullets() {
  bossBullets.forEach(b => {
    b.x += b.speedX;
    b.y += b.speedY;
  });

  // 画面外で削除
  bossBullets = bossBullets.filter(b => b.x > -50 && b.y > -50 && b.y < canvas.height + 50);
}

//ボス弾の描画
function drawBossBullets() {
  bossBullets.forEach(b => {
    ctx.fillStyle = b.color;
    ctx.fillRect(b.x, b.y, b.w, b.h);
  });
}

//ボス用当たり判定
function isBossHit(a, boss) {
  if (!boss) return false;   // ★ 追加：nullなら当たり判定しない
  return (
    a.x < boss.x + boss.w &&
    a.x + a.w > boss.x &&
    a.y < boss.y + boss.h &&
    a.y + a.h > boss.y
  );
}

// ボスから敵排出
function spawnBossEnemy() {
  enemies.push({
    x: boss.x - 20,
    y: boss.y + boss.h / 2,
    w: 32,
    h: 32,
    speed: 3,
    spawnTime: Date.now(),
    img: enemyImages[stage]   // ★ そのステージの敵画像を使う
  });
}

// ボス更新
function updateBoss() {
  if (!boss) return;

  // ★ ステージ2専用AI
  if (stage === 2) {

  // ★ 弾発射タイマー（どの状態でも動く）
      bossShootTimer++;
      if (bossShootTimer > 90) {
        bossShoot2();
        bossShootTimer = 0;
      }
    const hpMax = 50 + stage * 20;
    const hpRatio = boss.hp / hpMax;

    // 初期位置
    const sx = boss.startX;
    const sy = boss.startY;

    // ① まだ画面内に入っていない → ゆっくり左へ移動
    if (boss.x > sx) {
      boss.x -= boss.speed;
      return;
    }

    // ★ フェーズ1：ゆらゆら（HP 2/3以上）
    if (hpRatio > 0.66) {
      boss.state = "idle";
      boss.y += Math.sin(Date.now() / 500) * 2;
      return;
    }

    // ★ フェーズ2・3：突進 → 戻る → ゆらゆら → 突進
    // 状態ごとに動きを分ける

    // -------------------------
    // 状態：突進
    // -------------------------
    if (boss.state === "dash") {

      const dashSpeed = hpRatio > 0.33 ? 4.5 : 7; // HPで速度変化
      boss.x -= dashSpeed;

      // 左端まで突進したら戻りフェーズへ
      if (boss.x < 50) {
        boss.state = "return";
      }
      return;
    }

    // -------------------------
    // 状態：戻り（初期位置へゆっくり戻る）
    // -------------------------
    if (boss.state === "return") {

      // ゆっくり戻る
      boss.x += 2;
      boss.y += (sy - boss.y) * 0.05; // なめらかに戻る

      // 初期位置に戻ったらゆらゆらへ
      if (Math.abs(boss.x - sx) < 5) {
        boss.x = sx;
        boss.y = sy;
        boss.state = "idle";
      }
      return;
    }

    // -------------------------
    // 状態：ゆらゆら（次の突進まで待機）
    // -------------------------
    if (boss.state === "idle") {

      boss.y += Math.sin(Date.now() / 500) * 2;

      // HPが減っているなら突進開始
      if (hpRatio <= 0.66) {
        boss.state = "dash";
      }
      return;
    }
  }

// ★ ステージ3専用AI（縦横無尽ランダム移動＋左側安全ゾーン）
if (stage === 3) {

  // ★ 弾発射タイマー
    bossShootTimer++;
    if (bossShootTimer > 70) {   // 約1.1秒ごと
      bossShoot();
      bossShootTimer = 0;
    }

  // ★ ランダム移動AI
  bossMoveTimer++;

  // ★ 約1秒ごとに移動方向をランダム変更
  if (bossMoveTimer > 60) {

    // ランダム方向（上下は大きく、左右は中くらい）
    bossMoveDirX = (Math.random() * 2 - 1) * 3;  // -3〜+3
    bossMoveDirY = (Math.random() * 2 - 1) * 5;  // -5〜+5

    bossMoveTimer = 0;
  }

  // ★ ランダム方向へ移動
  boss.x += bossMoveDirX;
  boss.y += bossMoveDirY;

  // ★ 左側の安全ゾーン（みさぽんが被弾しない範囲）
  const safeLeft = 180;   // ← ここより左には絶対来ない

  if (boss.x < safeLeft) boss.x = safeLeft;

  // ★ 右側の最大位置（画面内）
  if (boss.x > canvas.width - boss.w - 20) {
    boss.x = canvas.width - boss.w - 20;
  }

  // ★ 上下の範囲制限
  if (boss.y < 20) boss.y = 20;
  if (boss.y > canvas.height - boss.h - 20) {
    boss.y = canvas.height - boss.h - 20;
  }

  // ★ ゆらゆら演出（自然な動き）
  boss.y += Math.sin(Date.now() / 300) * 1.5;

  return;
}

// ★ ステージ4専用AI（右側テレポート＋演出）
if (stage === 4) {

  bossTeleportTimer++;

  // ★ ゆっくり弾発射（約1.5秒）
    bossShootTimer++;
    if (bossShootTimer > 90) {
      bossShoot4();   // ← ステージ4専用弾
      bossShootTimer = 0;
    }

  // ★ テレポート演出の残像タイマー
  if (bossTeleportEffectTimer > 0) {
    bossTeleportEffectTimer--;
  }

  // ★ 約2秒ごとに瞬間移動
  if (bossTeleportTimer > 120) {

    // テレポート前の位置を保存（残像用）
    bossLastX = boss.x;
    bossLastY = boss.y;

    // ★ 右側の範囲に瞬間移動
    boss.x = Math.random() * 300 + (canvas.width - 350);  
    boss.y = Math.random() * (canvas.height - boss.h - 40) + 20;

    // ★ テレポート演出開始
    bossTeleportEffectTimer = 20;

    bossTeleportTimer = 0;
  }

  // ★ テレポート後のゆらゆら演出
  boss.y += Math.sin(Date.now() / 300) * 1.5;

  return;
}

  // ★ ステージ1は従来の動き
  if (boss.x > canvas.width - boss.w - 50) {
    boss.x -= boss.speed;
  } else {
    boss.y += Math.sin(Date.now() / 500) * 2;

    bossSpawnTimer++;
    if (bossSpawnTimer > 120) {
      spawnBossEnemy();
      bossSpawnTimer = 0;
    }
  }
}

// 衝突処理
function checkCollisions() {

  // 弾 vs 敵
  for (let bi = bullets.length - 1; bi >= 0; bi--) {
    const b = bullets[bi];

    for (let ei = enemies.length - 1; ei >= 0; ei--) {
      const e = enemies[ei];

      if (Date.now() - e.spawnTime < 500) continue;

      if (isEnemyHit(b, e)) {

        bullets.splice(bi, 1);
        enemies.splice(ei, 1);

        score += 10;
        document.getElementById('score').innerText = score;

        if (!isBossActive) {
          if (stage === 1 && score >= 750) { enemies = []; spawnBoss(); isBossActive = true; }
          if (stage === 2 && score >= 1500) { enemies = []; spawnBoss(); isBossActive = true; }
          if (stage === 3 && score >= 2300) { enemies = []; spawnBoss(); isBossActive = true; }
          if (stage === 4 && score >= 3000) { enemies = []; spawnBoss(); isBossActive = true; }
        }

        break;
      }
    }
  }

  // 弾 vs ボス
if (isBossActive && boss) {
    for (let bi = bullets.length - 1; bi >= 0; bi--) {
        const b = bullets[bi];

        if (!boss) break;

        if (isBossHit(b, boss)) {
            bullets.splice(bi, 1);
            boss.hp--;

            // ★HPが0以下になったら確実に処理する
            if (boss.hp <= 0) {

                // ★ボスを確実に消す
                isBossActive = false;
                boss = null;

                // ★ステージを確実に進める
                stage = stage + 1;

                // ★ステージ4突入時の初期化
                if (stage === 4) {
                    enemies = [];
                    bullets = [];
                    bossBullets = [];
                    clouds = [];
                    groundObjects = [];
                }

                // ★ステージ5（クリア）ならエンディングへ
                if (stage > 4) {

                    isGameClear = true;

                    enemies = [];
                    bullets = [];
                    bossBullets = [];
                    clouds = [];
                    groundObjects = [];

                    setTimeout(() => {
                        isGameClear = false;
                        isEnding = true;
                        endingY = canvas.height + 50;
                    }, 1500);
                }
            }
        }
    }
}

  // 自機 vs 敵
  enemies.forEach(e => {
    if (isEnemyHit(player, e)) isGameOver = true;
  });

  // 自機 vs ボス
  if (isBossActive && boss && isEnemyHit(player, boss)) {
    isGameOver = true;
  }

  // 自機 vs ボス弾
  bossBullets.forEach(b => {
    if (
      player.x < b.x + b.w &&
      player.x + player.w > b.x &&
      player.y < b.y + b.h &&
      player.y + player.h > b.y
    ) {
      isGameOver = true;
    }
  });
}

// 描画
function drawBullets() {
  bullets.forEach(b => {
    ctx.fillStyle = b.color;
    ctx.fillRect(b.x, b.y, b.w, b.h);
  });
}
//敵描画もステージ対応にする
function drawEnemies() {
  enemies.forEach(e => {
    ctx.save();

    if (stage === 3) ctx.shadowColor = "yellow";
    else if (stage === 4) ctx.shadowColor = "#66CCFF";
    else ctx.shadowColor = "white";

    ctx.shadowBlur = 14;
    ctx.drawImage(e.img, e.x, e.y, e.w, e.h);

    ctx.restore();
  });
}
function drawBoss() {
  if (!boss) return;

ctx.save();

// ★ テレポート残像（薄く表示）
if (bossTeleportEffectTimer > 0) {
    ctx.save();  // ← 必須！

    const alpha = bossTeleportEffectTimer / 20;
    ctx.globalAlpha = alpha;
    ctx.shadowColor = "#AA00FF";
    ctx.shadowBlur = 25;

    ctx.drawImage(boss.img, bossLastX, bossLastY, boss.w, boss.h);

    ctx.restore();  // ← 影設定を元に戻す
}
  // 白い縁取り
  ctx.save();
  ctx.shadowColor = "white";
  ctx.shadowBlur = 15;   // ぼかし量（調整可能）
  ctx.drawImage(boss.img, boss.x, boss.y, boss.w, boss.h);
  ctx.restore();
}


// 雲を更新（★これを追加）
function updateClouds() {
  clouds.forEach(c => c.x -= c.speed);
  clouds = clouds.filter(c => c.x > -200);
}

// ゲームオーバー
function drawGameOver() {
  ctx.fillStyle = 'rgba(0,0,0,0.7)';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = '#fff';
  ctx.font = '32px Arial';
  ctx.textAlign = 'center';
  ctx.fillText('GAME OVER', canvas.width / 2, canvas.height / 2);

  restartButton.style.display = "block";
}

//クリア後ステージ1背景を描く専用関数
function drawClearBackground() {
  ctx.fillStyle = "#87CEEB";  // 空色
  ctx.fillRect(0, 0, canvas.width, canvas.height * 0.6);

  ctx.fillStyle = "#3CB371";  // 緑の地面
  ctx.fillRect(0, canvas.height * 0.6, canvas.width, canvas.height * 0.4);
}

//エンディング描画関数
function drawEnding() {

// ★影を完全リセット（紫ぼやけ防止）
  ctx.shadowColor = "transparent";
  ctx.shadowBlur = 0;

  // ★ステージ1背景をずっと描く
  drawClearBackground();

  // ★ステージごとのボス画像を順番に表示
  const index = Math.floor((canvas.height - endingY) / 200);
  const bossIndex = Math.min(index, endingBossImages.length - 1);

if (bossIndex >= 0 && bossIndex < endingBossImages.length) {
    ctx.drawImage(
        endingBossImages[bossIndex],
        canvas.width / 2 - 80,
        canvas.height / 2 - 200,
        160,
        160
    );
}
  // ★テキスト描画
  ctx.fillStyle = "#fff";
  ctx.font = "28px Arial";
  ctx.textAlign = "center";

  let y = endingY;

  endingLines.forEach(line => {
    ctx.fillText(line, canvas.width / 2, y);
    y += 40;
  });

  // ★スクロール速度（ゆっくり）
  endingY -= 0.5;

  // ★最後まで行ったらセンキュー画面
  if (endingY < -endingLines.length * 40) {

    drawClearBackground();  // ステージ1背景

    // ★みさぽん画像（黄色ぼかし）
    ctx.save();
    ctx.shadowColor = "yellow";   // ← 黄色の影
    ctx.shadowBlur = 25;  
    ctx.drawImage(
      endingMisaImg,
      canvas.width / 2 - 80,
      canvas.height / 2 - 140,
      160,
      160
    );
    ctx.restore();

    // メッセージ
    ctx.fillStyle = "#fff";
    ctx.font = "40px Arial";
    ctx.textAlign = "center";
    ctx.fillText("Thank you for playing!", canvas.width / 2, canvas.height / 2 + 80);
  }
}
function checkOrientation() {
  const warning = document.getElementById("rotateWarning");
  const game = document.getElementById("gameCanvas");
  const controls = document.getElementById("controls");

  // ★スマホ判定：画面幅で確実に判定（UAは使わない）
  const isMobile = window.innerHeight > window.innerWidth; // 縦長＝スマホ

  const isPortrait = window.matchMedia("(orientation: portrait)").matches;

  // ★スマホだけ縦向き専用
  if (isMobile) {
    if (isPortrait) {
      warning.style.display = "none";
      game.style.display = "block";
      if (controls) controls.style.display = "flex";
    } else {
      warning.style.display = "flex";
      game.style.display = "none";
      if (controls) controls.style.display = "none";
    }
  }

  // ★PCは常にプレイ可能
  else {
    warning.style.display = "none";
    game.style.display = "block";
    if (controls) controls.style.display = "none";
  }
}

window.addEventListener("orientationchange", checkOrientation);
window.addEventListener("resize", checkOrientation);
window.onload = checkOrientation;

// ゲームクリア
function drawGameClear() {
  ctx.fillStyle = 'rgba(0,0,0,0.6)';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = '#fff';
  ctx.font = '36px Arial';
  ctx.textAlign = 'center';
  ctx.fillText(' 平和は守られました。ありがとう✧みさぽん✧', canvas.width / 2, canvas.height / 2);
}

//「ステージごとの初期スコア」
function getStageStartScore(stage) {
  if (stage === 1) return 0;
  if (stage === 2) return 1300;  // 1500 - 200
  if (stage === 3) return 2100;  // 2300 - 200
  if (stage === 4) return 2800;  // 3000 - 200
  return 0;
}


// リスタート
restartButton.addEventListener('click', () => {

  // ★ スコアをステージごとの初期値にする
  score = getStageStartScore(stage);
  document.getElementById('score').innerText = score;

  // ★ 状態リセット
  isGameOver = false;
  isGameClear = false;

  // ★ 配列リセット
  bullets = [];
  enemies = [];
  bossBullets = [];
  clouds = [];
  groundObjects = [];

  // ★ ボス状態リセット
  boss = null;
  isBossActive = false;
  bossSpawnTimer = 0;
  bossShootTimer = 0;

  // ★ プレイヤー初期位置
  player.x = 100;
  player.y = canvas.height / 2;

  // ★ ボタン非表示
  restartButton.style.display = "none";
});

// --- [メインループ] ---
function gameLoop() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // ★タイトル画面
  if (!isGameStart) {
    drawStartScreen();
    requestAnimationFrame(gameLoop);
    return;
  }

  // ★★★ エンディングが最優先（スクロール中は他の処理をしない）★★★
  if (isEnding) {
    drawEnding();
    requestAnimationFrame(gameLoop);
    return;
  }

  // ★★★ ゲームクリア画面（エンディング前の1.5秒だけ）★★★
  if (isGameClear) {
    drawClearBackground();  // ステージ1背景
    drawGameClear();        // 「平和は守られました」
    drawPlayer();

    requestAnimationFrame(gameLoop);
    return;
  }

  // ★通常時だけ背景を描く
  drawBackground();

  // 背景オブジェクト
  // ==========================================
  // 【1. すべての移動・更新処理 (Update)】
  // ==========================================
  updateClouds();
  spawnCloud();
  
  updateGroundObjects(); // ★小物の移動（前回お伝えした lastGroundObjX -= 2; を含む）
  spawnGroundObject();  // ★小物の生成判定

  // ★ゲームオーバーでなければ、ゲームのメイン処理を更新
  if (!isGameOver) {
    updatePlayer();
    updatePlayerAnimation();
    updateBullets();
    
    // オートショット
    if (isShooting) {
      autoShootTimer++;
      if (autoShootTimer > 10) { shoot(); autoShootTimer = 0; }
    } else { autoShootTimer = 0; }

    if (!isBossActive) {
      updateEnemies();
      spawnEnemy();
    } else {
      updateBoss();
      updateEnemies();
    }
    checkCollisions();
    updateBossBullets();
  }

  // ==========================================
  // 【2. すべての描画処理 (Draw) ※重ね順が重要！】
  // ==========================================
  
  // ① 一番奥：背景（空やベースの地面）
  drawBackground();

  // ② 背景のすぐ前：雲や木・池（小物）
  drawClouds();
  drawGroundObjects(); // ★必ず背景(drawBackground)の後に描く！

  // ③ 手前：キャラクター・敵・弾
  drawPlayer();
  drawBullets();
  drawEnemies();
  drawBossBullets();

  if (isBossActive && boss) {
      drawBoss();
  }

  // ④ 一番手前：ゲームオーバー画面
  if (isGameOver) {
    drawGameOver();
  }

  requestAnimationFrame(gameLoop);
}

// すべてのウィンドウリソース（画像やHTML）が読み込み完了したらスタート
window.addEventListener('load', () => {
   
  // 初期位置を確定（canvasのサイズが確定した後にセット）
  player.y = canvas.height / 2; 
  gameLoop();
});
